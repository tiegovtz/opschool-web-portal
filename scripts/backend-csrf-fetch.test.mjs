import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchBackendWithCsrf } from '../server/utils/fetchBackendWithCsrf.ts';

test('server-side backend writes send the matching CSRF token and cookie', async () => {
  const originalFetch = globalThis.fetch;
  const originalSetting = process.env.NUXT_CSRF_ENABLED;
  const requests = [];
  delete process.env.NUXT_CSRF_ENABLED;
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    if (requests.length === 1) {
      const headers = new Headers();
      headers.append('set-cookie', 'session=private; Path=/');
      headers.append('set-cookie', 'csrf_token=signed; Path=/; HttpOnly');
      return new Response(JSON.stringify({ csrfToken: 'token' }), { status: 200, headers });
    }
    return new Response('{}', { status: 201 });
  };
  try {
    const response = await fetchBackendWithCsrf(
      'https://backend.example/v1',
      'https://backend.example/v1/machine-learning/books',
      { method: 'POST', body: new FormData(), headers: { Authorization: 'Bearer user' } },
    );
    assert.equal(response.status, 201);
    assert.equal(requests[0].url, 'https://backend.example/v1/auth/csrf-token');
    assert.equal(requests[1].init.headers.get('x-csrf-token'), 'token');
    assert.equal(requests[1].init.headers.get('cookie'), 'csrf_token=signed');
    assert.equal(requests[1].init.headers.get('authorization'), 'Bearer user');
    assert.ok(requests[1].init.body instanceof FormData);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSetting === undefined) delete process.env.NUXT_CSRF_ENABLED;
    else process.env.NUXT_CSRF_ENABLED = originalSetting;
  }
});
