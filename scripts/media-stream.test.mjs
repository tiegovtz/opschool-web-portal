import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Writable } from 'node:stream';
import { setImmediate as immediate } from 'node:timers/promises';
import test from 'node:test';
import { loadMediaModule } from './media-test-helpers.mjs';

class ResponseSink extends Writable {
  headers = new Map();
  headersSent = false;
  chunks = [];
  constructor(write) { super({ highWaterMark: 1 }); this.writeChunk = write; }
  _write(chunk, encoding, callback) {
    this.headersSent = true;
    this.chunks.push(chunk);
    if (this.writeChunk) this.writeChunk(chunk, callback);
    else callback();
  }
}

function setup(fetch, res = new ResponseSink(), request = {}) {
  const { streamMedia } = loadMediaModule('../server/utils/streamMedia.ts', {
    process: { env: {} }, fetch,
    getMethod: event => event.method,
    getRouterParam: (event, name) => event.params[name],
    getHeader: (event, name) => event.headers.get(name),
    useRuntimeConfig: () => ({ backendApiBaseUrl: 'https://configured.example/api/v1' }),
    setResponseStatus: (event, status) => { event.node.res.statusCode = status; },
    setHeader: (event, name, value) => event.node.res.headers.set(name.toLowerCase(), String(value)),
    createError: data => Object.assign(new Error(data.message), data),
  }, { './sessionAuth': { readSessionToken: event => event.token } });
  const event = { method: 'GET', token: 'student-token', params: { videoId: 'lesson', audioId: 'lesson' }, headers: new Headers(), node: { res }, ...request };
  return { run: kind => streamMedia(event, kind || 'video'), res };
}

test('a slow player applies backpressure instead of buffering the whole video', async () => {
  let pulls = 0;
  let release;
  let blocked = true;
  const chunk = new Uint8Array(65536);
  const source = new ReadableStream({ pull(controller) {
    if (pulls === 128) return controller.close();
    pulls++;
    controller.enqueue(chunk);
  } });
  const res = new ResponseSink((chunk, callback) => {
    if (blocked) { release = callback; res.emit('blocked'); }
    else callback();
  });
  const waiting = once(res, 'blocked');
  const { run } = setup(async () => new Response(source), res);
  const streaming = run();
  await waiting;
  await immediate();
  assert.ok(pulls < 8, `Read ${pulls} chunks while the player was paused`);
  blocked = false;
  release();
  await streaming;
  assert.equal(Buffer.concat(res.chunks).length, 128 * 65536);
});

test('a disconnected player cancels the upstream reader and fetch', async () => {
  let cancelled = false;
  let signal;
  const source = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(65536)); }, cancel() { cancelled = true; } });
  const res = new ResponseSink(() => { res.emit('blocked'); });
  const waiting = once(res, 'blocked');
  const { run } = setup(async (url, options) => { signal = options.signal; return new Response(source); }, res);
  const streaming = run();
  await waiting;
  res.destroy();
  await streaming;
  assert.equal(signal.aborted, true);
  assert.equal(cancelled, true);
});

test('range validation, conditional requests and unsatisfied ranges retain their headers', async () => {
  let request;
  const { run, res } = setup(async (url, options) => {
    request = { url: String(url), options };
    return new Response('Out of range', { status: 416, headers: { 'Content-Range': 'bytes */23', 'Accept-Ranges': 'bytes' } });
  }, undefined, { headers: new Headers({ Range: 'bytes=999-', 'If-Range': '"lesson-v1"' }) });
  await run('audio');
  assert.equal(request.url, 'https://configured.example/api/v1/audio-stream/lesson');
  assert.equal(request.options.headers.range, 'bytes=999-');
  assert.equal(request.options.headers['if-range'], '"lesson-v1"');
  assert.equal(request.options.headers['Accept-Encoding'], 'identity');
  assert.equal(res.statusCode, 416);
  assert.equal(res.headers.get('content-range'), 'bytes */23');
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
});

test('decompressed bodies do not retain a compressed content-length', async () => {
  const { run, res } = setup(async () => new Response('decoded audio', { headers: { 'Content-Encoding': 'gzip', 'Content-Length': '99' } }));
  await run('audio');
  assert.equal(res.headers.has('content-length'), false);
  assert.equal(res.headers.has('content-encoding'), false);
  assert.equal(Buffer.concat(res.chunks).toString(), 'decoded audio');
});

test('HEAD requests forward metadata and do not stream a body', async () => {
  let method;
  const { run, res } = setup(async (url, options) => {
    method = options.method;
    return new Response(null, { headers: { 'Content-Length': '23', 'Content-Type': 'video/mp4' } });
  }, undefined, { method: 'HEAD' });
  await run();
  assert.equal(method, 'HEAD');
  assert.equal(res.headers.get('content-length'), '23');
  assert.equal(res.chunks.length, 0);
});

test('upstream stream failures terminate the response without an unhandled rejection', async () => {
  const source = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(1)); controller.error(new Error('upstream disconnected')); } });
  const { run, res } = setup(async () => new Response(source));
  await assert.doesNotReject(run());
  assert.equal(res.destroyed, true);
});
