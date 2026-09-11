import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { adtPreviewCatalogue } from '../server/utils/adtPreview.ts';

test('production ADT proxy contract with a mock upstream', async t => {
  const dummyKey = 'adt_test_not_a_real_secret';
  let mode = 'success';
  const requests = [];
  const blurDataUrl = 'data:image/png;base64,aGVsbG8=';
  const books = adtPreviewCatalogue.books.map(book => ({
    ...book, status: 'Ready', approvalStatusValue: 'final_approved',
    coverThumbnail: { url: 'https://do-not-fetch.example/cover', mimeType: 'image/png' },
    coverPreview: { url: 'https://do-not-fetch.example/preview?variant=thumbnail&v=v2', mimeType: 'image/webp',
      blurDataUrl, width: 480, height: 640, version: 'v2' },
    currentApprovalTarget: 'Internal reviewer', checksum: 'internal-checksum',
  }));
  books.push({ ...books[0], id: 'draft', approvalStatusValue: 'draft' });
  books.push({ ...books[0], id: 'failed', status: 'Failed' });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=', 'base64');
  const upstream = createServer((req, res) => {
    requests.push({ path: req.url, auth: req.headers.authorization, etag: req.headers['if-none-match'] });
    const requestUrl = new URL(req.url, 'http://test');
    if (req.url.startsWith('/api/library/')) {
      assert.equal(req.headers.authorization, undefined);
      assert.equal(req.headers.cookie, undefined);
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html',
        'Content-Security-Policy': `default-src 'none'; style-src http://content-only.example:9000${req.url.replace(/index\.html.*$/, '')}; frame-ancestors http://127.0.0.1`,
      });
      return res.end('<!doctype html><title>Signed ADT reader</title>');
    }
    if (mode === 'forbidden' || req.headers.authorization !== `Bearer ${dummyKey}`) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `Forbidden ${dummyKey}` }));
    }
    if (mode === 'redirect') {
      res.writeHead(302, { Location: '/should-not-follow' });
      return res.end();
    }
    if (requestUrl.pathname.endsWith('/cover')) {
      if (mode === 'cover-forbidden') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Forbidden ${dummyKey}` }));
      }
      if (req.headers['if-none-match'] === '"cover-v2"') {
        res.writeHead(304, { ETag: '"cover-v2"' });
        return res.end();
      }
      const thumbnail = requestUrl.searchParams.get('variant') === 'thumbnail';
      res.writeHead(200, { 'Content-Type': mode === 'cover-invalid' ? 'text/html' : thumbnail && mode !== 'preview-pending' ? 'image/webp' : 'image/png', ETag: '"cover-v2"' });
      return res.end(png);
    }
    if (req.url.includes('/reader?')) {
      if (mode === 'reader-forbidden') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Forbidden ${dummyKey}` }));
      }
      const readerId = req.url.match(/^\/api\/v1\/books\/([^/]+)\/reader\?/)?.[1];
      const embedOrigin = new URL(req.url, 'http://test').searchParams.get('embedOrigin');
      assert.ok(embedOrigin?.startsWith('http://127.0.0.1:'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ data: {
        url: mode === 'reader-invalid' ? 'javascript:alert(1)' : `https://content.example/api/library/${readerId}/preview/reader.1999999999.aHR0cDovLzEyNy4wLjAuMQ.signature/index.html`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      } }));
    }
    const bookId = requestUrl.pathname.match(/^\/api\/v1\/books\/([^/]+)$/)?.[1];
    const resource = requestUrl.pathname.match(/^\/api\/v1\/data\/(\w+)$/)?.[1];
    const data = bookId ? books.find(book => book.id === bookId) : resource ? adtPreviewCatalogue[resource].map(item => ({ ...item, swName: item.id === 'science' ? 'Sayansi' : '' })) : books;
    if (bookId && !data) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Book not found.' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mode === 'malformed' ? { data: 'invalid' } : { data }));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  t.after(() => upstream.close());

  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const app = spawn(process.execPath, ['.output/server/index.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NODE_ENV: 'production', NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port),
      NUXT_ADT_STORE_BASE_URL: `http://127.0.0.1:${upstream.address().port}`, NUXT_ADT_STORE_API_KEY: dummyKey },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Always terminate only the exact test-owned child process.
  t.after(() => { app.kill('SIGTERM'); });
  let output = '';
  app.stdout.on('data', chunk => { output += chunk; });
  app.stderr.on('data', chunk => { output += chunk; });
  const base = `http://127.0.0.1:${port}`;
  const readerFetch = (path) => fetch(`${base}${path}`, { headers: { Cookie: 'signInAccessToken=test-access-token' } });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { await fetch(`${base}/api/adt/catalogue`); ready = true; break; } catch { await delay(100); }
  }
  assert.ok(ready, `Production server did not start: ${output}`);

  await t.test('returns only published books in the requested hub, even with production preview flag', async () => {
    const response = await fetch(`${base}/api/adt/catalogue?educationLevel=primary&preview=1`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const data = await response.json();
    assert.equal(data.preview, false);
    assert.equal(data.configured, true);
    assert.deepEqual(data.books.map(book => book.id), books.slice(0, 4).map(book => book.id));
    assert.ok(!JSON.stringify(data).includes(dummyKey));
    assert.ok(!JSON.stringify(data).includes('Internal reviewer'));
    assert.ok(!JSON.stringify(data).includes('internal-checksum'));
    assert.ok(!JSON.stringify(data).includes('do-not-fetch'));
    assert.ok(requests.every(request => request.auth === `Bearer ${dummyKey}`));
    assert.ok(requests.some(request => request.path === '/api/v1/data/curricula'));
    assert.ok(requests.some(request => request.path === '/api/v1/books?include=coverPreview'));
    assert.equal(data.subjects.find(item => item.id === 'science').swName, 'Sayansi');
    assert.equal(data.books[0].coverPreview.url, '/api/adt/books/p-science/cover?variant=thumbnail&v=v2');
    assert.equal(data.books[0].coverPreview.blurDataUrl, blurDataUrl);
  });
  await t.test('rejects unknown hubs before querying upstream', async () => {
    const count = requests.length;
    assert.equal((await fetch(`${base}/api/adt/catalogue?educationLevel=invalid`)).status, 400);
    assert.equal(requests.length, count);
  });
  await t.test('proxies approved covers and refuses draft covers', async () => {
    const response = await fetch(`${base}/api/adt/books/p-science/cover`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    assert.equal((await fetch(`${base}/api/adt/books/draft/cover`)).status, 404);
    assert.ok(!requests.some(request => request.path === '/api/v1/books/draft/cover'));
  });
  await t.test('proxies versioned thumbnails and authenticates private ETag revalidation', async () => {
    const path = '/api/adt/books/p-science/cover?variant=thumbnail&v=v2';
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    assert.equal(response.headers.get('cache-control'), 'private, no-cache');
    assert.equal(response.headers.get('etag'), '"cover-v2"');
    const start = requests.length;
    const revalidated = await fetch(`${base}${path}`, { headers: { 'If-None-Match': response.headers.get('etag') } });
    assert.equal(revalidated.status, 304);
    assert.equal((await revalidated.arrayBuffer()).byteLength, 0);
    assert.equal(revalidated.headers.get('cache-control'), 'private, no-cache');
    assert.deepEqual(requests.slice(start).map(item => item.path), ['/api/v1/books/p-science', '/api/v1/books/p-science/cover?variant=thumbnail&v=v2']);
    assert.ok(requests.slice(start).every(item => item.auth === `Bearer ${dummyKey}`));
    assert.equal(requests.at(-1).etag, '"cover-v2"');
    mode = 'cover-forbidden';
    const denied = await fetch(`${base}${path}`, { headers: { 'If-None-Match': '"cover-v2"' } });
    assert.equal(denied.status, 502);
    assert.equal(denied.headers.get('cache-control'), 'private, no-store');
    assert.ok(!(await denied.text()).includes(dummyKey));
    mode = 'success';
    assert.equal((await fetch(`${base}/api/adt/books/draft/cover?variant=thumbnail&v=v2`, { headers: { 'If-None-Match': '"cover-v2"' } })).status, 404);
  });
  await t.test('accepts original images while previews are pending and rejects non-image responses and invalid variants', async () => {
    mode = 'preview-pending';
    const response = await fetch(`${base}/api/adt/books/p-science/cover?variant=thumbnail&v=old`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    mode = 'cover-invalid';
    assert.equal((await fetch(`${base}/api/adt/books/p-science/cover?variant=thumbnail`)).status, 502);
    mode = 'success';
    const count = requests.length;
    assert.equal((await fetch(`${base}/api/adt/books/p-science/cover?variant=unsafe`)).status, 400);
    assert.equal((await fetch(`${base}/api/adt/books/p-science/cover?v=..%2Funsafe`)).status, 400);
    assert.equal(requests.length, count);
  });
  await t.test('reader detail only exposes eligible books in the correct category', async () => {
    const unauthenticatedRequestCount = requests.length;
    assert.equal((await fetch(`${base}/api/adt/books/p-science?educationLevel=primary`)).status, 401);
    assert.equal(requests.length, unauthenticatedRequestCount);
    const response = await readerFetch('/api/adt/books/p-science?educationLevel=primary&preview=1');
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.book.id, 'p-science');
    assert.equal(data.preview, false);
    assert.equal(data.readerAvailable, true);
    assert.ok(data.reader.url.startsWith(`${base}/api/library/p-science/preview/reader.`));
    assert.ok(!JSON.stringify(data).includes(dummyKey));
    assert.ok(!JSON.stringify(data).includes('Internal reviewer'));
    const publication = await fetch(data.reader.url);
    assert.equal(publication.status, 200);
    assert.equal(publication.headers.get('content-type'), 'text/html');
    assert.equal(publication.headers.get('access-control-allow-origin'), '*');
    assert.match(publication.headers.get('content-security-policy'), new RegExp(`style-src ${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/api/library/`));
    assert.ok(!publication.headers.get('content-security-policy').includes('content-only.example'));
    assert.match(await publication.text(), /Signed ADT reader/);
    assert.equal((await fetch(`${base}/api/library/not-a-reader/file.txt`)).status, 404);
    assert.equal((await readerFetch('/api/adt/books/p-science?educationLevel=secondary')).status, 404);
    assert.equal((await readerFetch('/api/adt/books/draft?educationLevel=primary')).status, 404);
    assert.equal((await readerFetch('/api/adt/books/failed?educationLevel=primary')).status, 404);
    assert.equal((await readerFetch('/api/adt/books/missing?educationLevel=primary')).status, 404);
    assert.equal((await readerFetch('/api/adt/books/p-science?educationLevel=invalid')).status, 400);
    assert.ok(!requests.some(request => /books\/(draft|failed)\/reader/.test(request.path)));
  });
  await t.test('masks upstream authorization failures', async () => {
    mode = 'forbidden';
    const response = await fetch(`${base}/api/adt/catalogue?educationLevel=secondary`);
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes(dummyKey));
  });
  await t.test('reader rejects unsafe URLs and reports missing grants without leaking the key', async () => {
    mode = 'reader-invalid';
    assert.equal((await readerFetch('/api/adt/books/p-science?educationLevel=primary')).status, 502);
    mode = 'reader-forbidden';
    const response = await readerFetch('/api/adt/books/p-science?educationLevel=primary');
    assert.equal(response.status, 403);
    assert.ok(!(await response.text()).includes(dummyKey));
    mode = 'success';
  });
  await t.test('refuses malformed upstream responses and redirects', async () => {
    mode = 'malformed';
    assert.equal((await fetch(`${base}/api/adt/catalogue?educationLevel=secondary`)).status, 502);
    mode = 'redirect';
    assert.equal((await fetch(`${base}/api/adt/catalogue?educationLevel=secondary`)).status, 502);
    assert.ok(!requests.some(request => request.path === '/should-not-follow'));
  });
});
