import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
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
  const upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push({ url: req.url, method: req.method, headers: req.headers, body: Buffer.concat(chunks) });
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
});
