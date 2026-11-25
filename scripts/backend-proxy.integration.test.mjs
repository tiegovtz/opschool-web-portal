import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { createApiDocs } from '../app/utilities/apiDocs.ts';
const apiDocs = createApiDocs('/api/backend/v1', 'https://upstream.example/api/v1');

test('browser API URLs use the proxy while media URLs retain their upstream base', () => {
  assert.equal(apiDocs.subjects.getPublicSubjects, '/api/backend/v1/public-subjects');
  assert.equal(apiDocs.visitors.postVisitors, '/api/backend/v1/visitors');
  assert.equal(apiDocs.auth.secondaryStudentInfo('a/b'), '/api/backend/v1/auth/secondary-student/info/a%2Fb');
  assert.equal(apiDocs.requestBaseURL, '/api/backend/v1');
  assert.match(apiDocs.baseURL, /^https?:\/\//);
});

test('production backend proxy contract', async t => {
  const requests = [];
  let slowStreamsClosed = 0;
  const upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push({ url: req.url, method: req.method, headers: req.headers, body: Buffer.concat(chunks) });
    if (req.url === '/api/v1/topics/reload-topic') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        _id: 'reload-topic',
        chapters: [{ _id: 'reload-chapter', name: 'Reload competence', chapterNo: 1 }],
        languageData: [{ name: 'English', _id: 'english' }],
      }));
    }
    const resourceUrl = new URL(req.url, 'http://backend.test');
    if (resourceUrl.pathname === '/api/v1/education-levels' || resourceUrl.pathname === '/api/v1/levels') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify([]));
    }
    if (resourceUrl.pathname === '/api/v1/public-subjects' && resourceUrl.searchParams.getAll('level').length < 2) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify([]));
    }
    const collection = /^\/api\/v1\/(public-topics|public-videos|public-audios|public-experiments)(?:\/by-subject\/([^/]+))?$/.exec(resourceUrl.pathname);
    if (collection) {
      if (collection[2] === 'invalid-resource') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end('<html>Wrong API endpoint</html>');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify([{
        _id: `reload-${collection[1]}`, name: 'Reload resource',
        subject: { _id: 'reload-subject', name: 'Physics' },
        level: { _id: 'form-one', name: 'Form One' },
        language: { _id: 'english', name: 'English' },
        thumbnail: '/images/default.webp', description: 'Reload resource description',
        isDeleted: false, videoType: resourceUrl.searchParams.get('videoType') || 'Conceptual',
        audioType: 'LESSON', videoFileUrl: '/uploads/test.mp4', audioFileUrl: '/uploads/test.mp3',
      }]));
    }
    if (/^\/api\/v1\/conversations\/(engage|constant)\/test-chapter$/.test(req.url)) {
      const type = req.url.includes('/constant/') ? 'constant' : 'engage';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify([
        { text: 'Second', order: 2, identifier: 'test-dialogue', type, audioFile: '/uploads/second.wav' },
        { text: 'First', order: 1, identifier: 'test-dialogue', type, audioFile: '/uploads/first.wav' },
      ]));
    }
    const media = /^\/api\/v1\/(video|audio)-stream\/([^/?]+)$/.exec(req.url);
    if (media) {
      const kind = media[1];
      const id = media[2];
      const contentType = kind === 'video' ? 'video/mp4' : 'audio/mpeg';
      if (id === 'slow') {
        res.writeHead(200, { 'Content-Type': contentType });
        res.flushHeaders();
        res.write(Buffer.alloc(32768, 1));
        const timer = setInterval(() => res.write(Buffer.alloc(32768, 2)), 20);
        timer.unref();
        res.on('close', () => { clearInterval(timer); slowStreamsClosed++; });
        return;
      }
      if (id === 'broken') {
        res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': '1000' });
        res.flushHeaders();
        res.write(Buffer.alloc(10, 1));
        setTimeout(() => res.destroy(), 80).unref();
        return;
      }
      if (id === 'compressed') {
        const encoded = gzipSync(Buffer.from('decompressed media bytes'));
        res.writeHead(200, { 'Content-Type': contentType, 'Content-Encoding': 'gzip', 'Content-Length': String(encoded.length) });
        return res.end(encoded);
      }
      const video = Buffer.from(`${kind}-stream-range-test`);
      const range = req.headers['if-range'] && req.headers['if-range'] !== '"media-v1"'
        ? null : /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      const start = range ? (range[1] ? Number(range[1]) : Math.max(0, video.length - Number(range[2]))) : 0;
      const end = range && range[1] && range[2] ? Math.min(Number(range[2]), video.length - 1) : video.length - 1;
      if (start >= video.length || end < start) {
        res.writeHead(416, { 'Content-Range': `bytes */${video.length}`, 'Accept-Ranges': 'bytes' });
        return res.end();
      }
      res.writeHead(range ? 206 : 200, {
        'Content-Type': contentType, 'Accept-Ranges': 'bytes', ETag: '"media-v1"',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': end - start + 1,
        ...(range ? { 'Content-Range': `bytes ${start}-${end}/${video.length}` } : {}),
      });
      return res.end(req.method === 'HEAD' ? undefined : video.subarray(start, end + 1));
    }
    if (req.url === '/api/v1/unavailable') return req.socket.destroy();
    if (req.url === '/api/v1/redirect') {
      res.writeHead(302, { Location: '/outside-the-api' });
      return res.end();
    }
    if (req.url === '/api/v1/protected') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Token expired' }));
    }
    if (req.url === '/api/v1/media') {
      res.writeHead(206, { 'Content-Type': 'application/octet-stream', 'Content-Range': 'bytes 1-3/5' });
      return res.end(Buffer.from([1, 2, 3]));
    }
    res.writeHead(req.method === 'POST' ? 201 : 200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Set-Cookie': 'XSRF-TOKEN=test; Domain=upstream.example; Path=/api/v1; SameSite=Lax',
    });
    res.end(JSON.stringify({ ok: true }));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  t.after(() => upstream.close());

  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const app = spawn(process.execPath, ['.output/server/index.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NODE_ENV: 'production', NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port),
      NUXT_CSRF_ENABLED: 'false', NUXT_BACKEND_API_BASE_URL: `http://127.0.0.1:${upstream.address().port}/api/v1/` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => app.kill('SIGTERM'));
  let output = '';
  app.stdout.on('data', chunk => { output += chunk; });
  app.stderr.on('data', chunk => { output += chunk; });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { await fetch(`${base}/api/backend/v1/ready`); ready = true; break; } catch { await delay(100); }
  }
  assert.ok(ready, `Production server did not start: ${output.slice(-2000)}`);

  const checkChapterReload = async (pageBase) => {
    const token = `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.signature`;
    const count = requests.length;
    const response = await fetch(`${pageBase}/interactive/Form%20One/Physics/Reload%20topic/reload-topic`, {
      headers: { Cookie: `signInAccessToken=${token}` },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    const topicRequest = requests.slice(count).find(request => request.url === '/api/v1/topics/reload-topic');
    assert.ok(topicRequest, `SSR did not use the runtime backend: ${output.slice(-2000)}`);
    assert.equal(topicRequest.headers.authorization, `Bearer ${token}`);
    assert.equal(topicRequest.headers.cookie, undefined);
    assert.ok(html.includes('reload-chapter'), 'SSR must serialize the loaded topic for hydration');
    assert.ok(!html.includes('Error while loading chapter'));
  };

  await t.test('a chapter page reload fetches its topic through the runtime backend with user authentication', () => checkChapterReload(base));

  const checkResourceReloads = async (pageBase) => {
    const user = encodeURIComponent(JSON.stringify({ _id: 'learner', name: 'Learner' }));
    const routes = [
      ['/video/physics/reload-subject?type=conc&level=form-one', 'public-videos'],
      ['/video/physics/reload-subject?type=oth&level=form-one', 'public-videos'],
      ['/interactive/physics/reload-subject', 'public-topics'],
      ['/experiments/physics/reload-subject?level=form-one', 'public-experiments'],
      ['/audio/physics/reload-subject?level=form-one', 'public-audios'],
      ['/video?type=conc', 'public-videos'],
      ['/interactive', 'public-topics'],
      ['/experiments', 'public-experiments'],
      ['/audio', 'public-audios'],
      ['/secondary?section=interactive-content', 'public-topics'],
    ];
    for (const [path, collection] of routes) {
      const count = requests.length;
      const response = await fetch(`${pageBase}${path}`, {
        headers: { Cookie: `signInUserToken=${user}; signInAccessToken=resource-token` },
        signal: AbortSignal.timeout(15_000),
      });
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.ok(requests.slice(count).some(request => request.url.startsWith(`/api/v1/${collection}`)),
        `${path} must fetch from the runtime backend`);
      assert.ok(html.includes(`reload-${collection}`), `${path} must serialize its resource list for hydration`);
      assert.ok(!html.includes('This content will be updated soon'), `${path} must not show an empty list`);
      if (path.includes('level=form-one')) {
        const resourceRequest = requests.slice(count).find(request => request.url.startsWith(`/api/v1/${collection}`));
        const params = new URL(resourceRequest.url, 'http://backend.test').searchParams;
        assert.equal(params.get('level'), 'form-one', path);
        if (path.includes('type=')) assert.equal(params.get('videoType'), path.includes('type=oth') ? 'Others' : 'Conceptual');
      }
    }
    const response = await fetch(`${pageBase}/video/physics/invalid-resource?type=conc`, { signal: AbortSignal.timeout(15_000) });
    const html = await response.text();
    assert.ok(html.includes('Oops! Something went wrong.'), 'Malformed API data must show an error');
    assert.ok(!html.includes('This content will be updated soon'), 'Malformed API data must not appear empty');
  };

  await t.test('subject resources and resource tabs survive a production reload', () => checkResourceReloads(base));

  await t.test('a chapter page reload also works when deployed under /portal/', async t => {
    const reservation = createServer();
    reservation.listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    const portalBase = `http://127.0.0.1:${port}/portal`;
    const portal = spawn(process.execPath, ['.output/server/index.mjs'], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, NODE_ENV: 'production', NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port),
        NUXT_APP_BASE_URL: '/portal/', NUXT_CSRF_ENABLED: 'false',
        NUXT_BACKEND_API_BASE_URL: `http://127.0.0.1:${upstream.address().port}/api/v1/` },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    t.after(() => portal.kill('SIGTERM'));
    let logs = '';
    portal.stdout.on('data', chunk => { logs += chunk; });
    portal.stderr.on('data', chunk => { logs += chunk; });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if ((await fetch(`${portalBase}/api/backend/v1/ready`)).ok) { ready = true; break; }
      } catch { /* Wait for the test server to start. */ }
      await delay(100);
    }
    assert.ok(ready, `Production /portal/ server did not start: ${logs.slice(-2000)}`);
    await checkChapterReload(portalBase);
    await checkResourceReloads(portalBase);
  });

  await t.test('preserves query strings and removes browser origin headers', async () => {
    const query = '?educationLevel=lower+secondary&level=1&level=2';
    const response = await fetch(`${base}/api/backend/v1/public-subjects${query}`, {
      headers: { Origin: base, Referer: `${base}/secondary`, Authorization: 'Bearer test-token' },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(requests.at(-1).url, `/api/v1/public-subjects${query}`);
    assert.equal(requests.at(-1).headers.origin, undefined);
    assert.equal(requests.at(-1).headers.referer, undefined);
    assert.equal(requests.at(-1).headers.authorization, 'Bearer test-token');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('set-cookie'), null);
  });

  await t.test('preserves JSON and multipart upload bytes without forwarding portal cookies', async () => {
    for (const [contentType, body] of [
      ['application/json', Buffer.from('{"browser":"Test","os":"Test"}')],
      ['multipart/form-data; boundary=proxy-test', Buffer.from('--proxy-test\r\nContent-Disposition: form-data; name="file"; filename="test.bin"\r\n\r\n\u0000\u0001\u00ff\r\n--proxy-test--\r\n')],
    ]) {
      const response = await fetch(`${base}/api/backend/v1/visitors`, {
        method: 'POST', headers: { Origin: base, 'Content-Type': contentType, Cookie: 'XSRF-TOKEN=test' }, body,
      });
      assert.equal(response.status, 201);
      assert.equal(requests.at(-1).method, 'POST');
      assert.equal(requests.at(-1).headers['content-type'], contentType);
      assert.equal(requests.at(-1).headers.cookie, undefined);
      assert.deepEqual(requests.at(-1).body, body);
    }
  });

  await t.test('preserves upstream authentication errors and binary range responses', async () => {
    const denied = await fetch(`${base}/api/backend/v1/protected`);
    assert.equal(denied.status, 401);
    assert.deepEqual(await denied.json(), { message: 'Token expired' });
    const media = await fetch(`${base}/api/backend/v1/media`, { headers: { Range: 'bytes=1-3' } });
    assert.equal(media.status, 206);
    assert.equal(media.headers.get('content-range'), 'bytes 1-3/5');
    assert.equal(requests.at(-1).headers.range, 'bytes=1-3');
    assert.deepEqual(Buffer.from(await media.arrayBuffer()), Buffer.from([1, 2, 3]));
  });

  await t.test('rejects foreign browser origins before forwarding requests', async () => {
    const count = requests.length;
    const response = await fetch(`${base}/api/backend/v1/visitors`, { method: 'POST', headers: { Origin: 'https://foreign.example' }, body: '{}' });
    assert.equal(response.status, 403);
    assert.equal(requests.length, count);
  });

  await t.test('rejects encoded traversal and keeps URL-like paths on the configured target', async () => {
    const count = requests.length;
    assert.equal((await fetch(`${base}/api/backend/v1/%2e%2e%2foutside`)).status, 400);
    assert.equal(requests.length, count);
    assert.equal((await fetch(`${base}/api/backend/v1/https://foreign.example/resource`)).status, 200);
    assert.equal(requests.at(-1).url, '/api/v1/https%3A//foreign.example/resource');
  });

  await t.test('returns sanitized gateway errors and does not follow upstream redirects', async () => {
    for (const path of ['unavailable', 'redirect']) {
      const response = await fetch(`${base}/api/backend/v1/${path}`);
      assert.equal(response.status, 502);
      assert.ok(!(await response.text()).includes('test-token'));
    }
    assert.ok(!requests.some(request => request.url === '/outside-the-api'));
  });

  await t.test('existing server routes use the runtime upstream directly', async () => {
    const response = await fetch(`${base}/api/topics`, { headers: { Cookie: 'signInAccessToken=test-token' } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(requests.at(-1).url, '/api/v1/topics');
    assert.equal(requests.at(-1).headers.authorization, 'Bearer test-token');
  });

  await t.test('video streaming preserves complete and partial bytes and requires a session', async () => {
    const count = requests.length;
    assert.equal((await fetch(`${base}/api/video/test-video`)).status, 401);
    assert.equal(requests.length, count);
    for (const range of [undefined, 'bytes=0-0', 'bytes=6-11']) {
      const response = await fetch(`${base}/api/video/test-video`, {
        headers: { Cookie: 'signInAccessToken=test-token', ...(range ? { Range: range } : {}) },
      });
      assert.equal(response.status, range ? 206 : 200);
      assert.equal(response.headers.get('content-type'), 'video/mp4');
      assert.equal(response.headers.get('accept-ranges'), 'bytes');
      const expected = range === 'bytes=0-0' ? 'v' : range ? 'stream' : 'video-stream-range-test';
      assert.equal(response.headers.get('content-length'), String(expected.length));
      assert.equal(response.headers.get('content-range'), range === 'bytes=0-0' ? 'bytes 0-0/23' : range ? 'bytes 6-11/23' : null);
      assert.equal(await response.text(), expected);
      assert.equal(requests.at(-1).headers.range, range);
      assert.equal(requests.at(-1).headers.authorization, 'Bearer test-token');
    }
  });

  await t.test('conversation routes share the runtime backend and accept cookie or Bearer sessions', async () => {
    for (const [endpoint, type, headers] of [
      ['engage', 'engage', { Cookie: 'signInAccessToken=test-token' }],
      ['constant-audio', 'constant', { Authorization: 'Bearer test-token' }],
    ]) {
      const response = await fetch(`${base}/api/conversation/${endpoint}?chapterId=test-chapter&identifier=test-dialogue`, { headers });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.deepEqual(endpoint === 'engage' ? data.pieces : data.items.map(item => item.text), ['First', 'Second']);
      assert.equal(requests.at(-1).url, `/api/v1/conversations/${type}/test-chapter`);
      assert.equal(requests.at(-1).headers.authorization, 'Bearer test-token');
      assert.equal((await fetch(`${base}/api/conversation/${endpoint}`, { headers })).status, 400);
    }
  });

  await t.test('video and audio preserve seeks, HEAD metadata, validators and 416 responses', async () => {
    const auth = { Authorization: 'Bearer test-token' };
    for (const kind of ['video', 'audio']) {
      const url = `${base}/api/${kind}/test-${kind}`;
      for (const [range, expected] of [['bytes=6-', 'stream-range-test'], ['bytes=-4', 'test']]) {
        const response = await fetch(url, { headers: { ...auth, Range: range, 'If-Range': '"media-v1"' } });
        assert.equal(response.status, 206);
        assert.equal(await response.text(), expected);
        assert.equal(requests.at(-1).headers['if-range'], '"media-v1"');
        assert.match(requests.at(-1).headers['accept-encoding'], /^identity(?:,\s*identity)*$/);
        assert.equal(response.headers.get('cache-control'), 'private, no-store');
      }
      const changed = await fetch(url, { headers: { ...auth, Range: 'bytes=6-', 'If-Range': '"outdated"' } });
      assert.equal(changed.status, 200);
      assert.equal(await changed.text(), `${kind}-stream-range-test`);
      const invalid = await fetch(url, { headers: { ...auth, Range: 'bytes=999-' } });
      assert.equal(invalid.status, 416);
      assert.equal(invalid.headers.get('content-range'), 'bytes */23');
      await invalid.arrayBuffer();
      const head = await fetch(url, { method: 'HEAD', headers: auth });
      assert.equal(head.status, 200);
      assert.equal(head.headers.get('content-length'), '23');
      assert.equal((await head.arrayBuffer()).byteLength, 0);
      assert.equal(requests.at(-1).method, 'HEAD');
    }
  });

  await t.test('playback streams incrementally and cancelling it closes the upstream connection', async () => {
    const response = await fetch(`${base}/api/video/slow`, { headers: { Authorization: 'Bearer test-token' } });
    assert.equal(response.status, 200);
    const reader = response.body.getReader();
    assert.ok((await reader.read()).value.length > 0);
    assert.equal(slowStreamsClosed, 0);
    await delay(40);
    assert.ok((await reader.read()).value.length > 0);
    await reader.cancel();
    for (let attempt = 0; attempt < 100 && !slowStreamsClosed; attempt++) await delay(10);
    assert.equal(slowStreamsClosed, 1);
  });

  await t.test('an upstream interruption ends the broken stream and permits a fresh request', async () => {
    const response = await fetch(`${base}/api/video/broken`, { headers: { Authorization: 'Bearer test-token' } });
    assert.equal(response.status, 200);
    await assert.rejects(response.arrayBuffer());
    const retry = await fetch(`${base}/api/video/test-video`, { headers: { Authorization: 'Bearer test-token', Range: 'bytes=0-0' } });
    assert.equal(retry.status, 206);
    assert.equal(await retry.text(), 'v');
    assert.ok(!output.includes('unhandledRejection'));
  });

  await t.test('compressed upstream media does not produce mismatched response lengths', async () => {
    const response = await fetch(`${base}/api/audio/compressed`, { headers: { Authorization: 'Bearer test-token' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-length'), null);
    assert.equal(response.headers.get('content-encoding'), null);
    assert.equal(await response.text(), 'decompressed media bytes');
  });
});
