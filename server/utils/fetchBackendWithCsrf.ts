import { backendCsrfCookie } from '../../shared/backend/proxy.ts';

/** Send server-side writes with the token and cookie issued by the same API. */
export async function fetchBackendWithCsrf(
  baseUrl: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  if (
    process.env.NUXT_CSRF_ENABLED?.trim().toLowerCase() === 'false' ||
    !['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  ) {
    return fetch(url, init);
  }

  const base = new URL(baseUrl);
  const target = new URL(url);
  const basePath = base.pathname.replace(/\/+$/, '');
  if (target.origin !== base.origin || !target.pathname.startsWith(`${basePath}/`)) {
    throw new Error('Backend request is outside the configured API root.');
  }

  const csrfHeaders = new Headers({ accept: 'application/json' });
  const authorization = new Headers(init.headers).get('authorization');
  if (authorization) csrfHeaders.set('authorization', authorization);
  const csrfResponse = await fetch(`${base.origin}${basePath}/auth/csrf-token`, {
    headers: csrfHeaders,
    redirect: 'manual',
    signal: init.signal,
  });
  if (!csrfResponse.ok) {
    throw new Error(`Backend CSRF token request failed: HTTP ${csrfResponse.status}`);
  }

  const data: unknown = await csrfResponse.json();
  const csrfToken = typeof data === 'object' && data !== null && 'csrfToken' in data
    ? data.csrfToken
    : undefined;
  if (typeof csrfToken !== 'string' || !csrfToken || /[\r\n;]/.test(csrfToken)) {
    throw new Error('Backend returned an invalid CSRF token.');
  }

  const headers = new Headers(init.headers);
  headers.set('x-csrf-token', csrfToken);
  headers.set('cookie', backendCsrfCookie(csrfResponse.headers));
  return fetch(url, { ...init, headers });
}
