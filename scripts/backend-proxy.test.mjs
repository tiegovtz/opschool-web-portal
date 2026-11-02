import test from 'node:test';
import assert from 'node:assert/strict';
import { backendProxyBaseUrl, backendProxyTarget, backendRequestHeaders, backendResponseHeaders } from '../shared/backend/proxy.ts';

test('proxy ignores empty deployment overrides and uses the server API URL', () => {
  assert.equal(backendProxyBaseUrl('', 'https://backend.example/api/v1', 'https://build.example/v1'), 'https://backend.example/api/v1');
  assert.equal(backendProxyBaseUrl('https://deploy.example/v1', 'https://backend.example/v1', undefined), 'https://deploy.example/v1');
  assert.throws(() => backendProxyBaseUrl('not-a-url', 'https://backend.example/v1', undefined));
  assert.throws(() => backendProxyBaseUrl('', '', ''));
});

test('proxy resolves only against the configured API and preserves query parameters', () => {
  const target = backendProxyTarget('https://backend.example/custom/v2', 'v1/auth/login', '?lang=sw&term=a%20b');
  assert.equal(target.href, 'https://backend.example/custom/v2/auth/login?lang=sw&term=a%20b');
  assert.equal(backendProxyTarget('https://backend.example/v1/', 'v1/schools/Dar%20es%20Salaam', '').pathname, '/v1/schools/Dar%20es%20Salaam');
  for (const path of ['https://evil.example', 'v1/../auth', 'v1/%2e%2e/auth', 'v1/%252e%252e/auth', 'v1/%2F%2Fevil.example', 'v1/evil%3fhost', 'v1/evil%5cpath', 'v1/%00']) assert.throws(() => backendProxyTarget('https://backend.example/v1', path, ''));
});
test('proxy forwards user authentication and multipart/range headers without browser origin or cookies', () => {
  const headers = backendRequestHeaders(new Headers({ authorization: 'Bearer user-token', 'content-type': 'multipart/form-data; boundary=test', range: 'bytes=0-99', cookie: 'private=secret', origin: 'http://localhost:3000', host: 'evil.example', 'x-api-key': 'not-forwarded' }));
  assert.equal(headers.get('authorization'), 'Bearer user-token');
  assert.equal(headers.get('content-type'), 'multipart/form-data; boundary=test');
  assert.equal(headers.get('range'), 'bytes=0-99');
  for (const key of ['cookie', 'origin', 'host', 'x-api-key']) assert.equal(headers.has(key), false);
});
test('proxy disables caching and strips compression, length and upstream cookie headers', () => {
  const headers = backendResponseHeaders(new Headers({ 'cache-control': 'public, max-age=3600', 'content-type': 'application/json', 'content-length': '50', 'content-encoding': 'gzip', 'set-cookie': 'server=secret', 'content-range': 'bytes 0-99/500' }));
  assert.equal(headers.get('cache-control'), 'private, no-store');
  assert.equal(headers.get('content-range'), 'bytes 0-99/500');
  assert.equal(headers.get('content-type'), 'application/json');
  for (const key of ['content-length', 'content-encoding', 'set-cookie']) assert.equal(headers.has(key), false);
});
