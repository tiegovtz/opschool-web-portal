const requestHeaders = ['accept', 'authorization', 'content-type', 'range', 'if-range', 'if-none-match', 'if-modified-since', 'x-requested-with'];
const responseHeaders = ['content-type', 'content-disposition', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'retry-after', 'www-authenticate'];

/** Prefer deployment settings, then the current server environment, then the build default. */
export function backendProxyBaseUrl(deploymentUrl: string | undefined, serverUrl: string | undefined, buildUrl: string | undefined) {
  const baseUrl = deploymentUrl?.trim() || serverUrl?.trim() || buildUrl?.trim();
  if (!baseUrl) throw new Error('Backend API URL is missing.');
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error('Backend API URL must be an absolute HTTP(S) API root without credentials, query, or fragment.');
  }
  return baseUrl;
}

/** The caller supplies a path, never a destination host or URL. */
export function backendProxyTarget(baseUrl: string, path: string, search: string) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Invalid backend configuration.');
  const segments = path.split('/');
  if (segments.shift() !== 'v1') throw new Error('Invalid backend path.');
  const safe = segments.map(segment => {
    let decoded = segment;
    // Reject nested encodings as well as ordinary path traversal.
    for (let round = 0; round < 4; round++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (decoded === '.' || decoded === '..' || /[\\/\x00-\x1f\x7f%?#]/.test(decoded)) throw new Error('Invalid backend path.');
    return encodeURIComponent(decoded);
  });
  const target = new URL(base.href);
  target.pathname = `${base.pathname.replace(/\/+$/, '')}/${safe.join('/')}`;
  target.search = search;
  return target;
}
export function backendRequestHeaders(source: Headers, accessToken?: string) {
  const target = new Headers();
  for (const key of requestHeaders) { const value = source.get(key); if (value) target.set(key, value); }
  const authorization = target.get('authorization')?.trim();
  // Some callers interpolate an absent cookie into the header. Use the actual
  // access-token cookie in that case, without replacing a real bearer token.
  const unusableBearer = /^Bearer\s+(?:undefined|null)$/i.test(authorization || '') || /^Bearer\s*$/i.test(authorization || '');
  if ((!authorization || unusableBearer) && accessToken?.trim()) {
    target.set('authorization', `Bearer ${accessToken.trim()}`);
  }
  return target;
}

/** Forward only the CSRF cookie issued with this token, never portal cookies. */
export function backendCsrfCookie(headers: Headers) {
  const csrfCookie = headers.getSetCookie().find(cookie => /^csrf_token=/i.test(cookie));
  const pair = csrfCookie?.split(';', 1)[0];
  if (!pair || /[\r\n]/.test(pair)) throw new Error('Backend did not issue a valid CSRF cookie.');
  return pair;
}
export function backendResponseHeaders(source: Headers) {
  const target = new Headers({ 'cache-control': 'private, no-store' });
  for (const key of responseHeaders) { const value = source.get(key); if (value) target.set(key, value); }
  // fetch decodes compressed bodies; do not copy content-length or content-encoding.
  return target;
}
