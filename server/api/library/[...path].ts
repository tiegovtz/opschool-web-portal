import { adtStoreBaseUrl } from '../../utils/adtStore';

const readerPath = /^([A-Za-z0-9_-]{1,128})\/preview\/(reader\.\d+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\/(.+)$/;
const forwardedResponseHeaders = [
  'accept-ranges', 'cache-control', 'content-disposition', 'content-language',
  'content-range', 'content-security-policy', 'content-type',
  'cross-origin-resource-policy', 'etag', 'last-modified', 'x-content-type-options',
];

export default defineEventHandler(async (event) => {
  if (!['GET', 'HEAD'].includes(event.method)) {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed.' });
  }

  const path = getRouterParam(event, 'path') ?? '';
  const match = readerPath.exec(path);
  if (!match || path.includes('\\') || path.split('/').some(segment => segment === '.' || segment === '..')) {
    throw createError({ statusCode: 404, statusMessage: 'Publication asset not found.' });
  }

  const base = adtStoreBaseUrl();
  const target = new URL(`/api/library/${path.split('/').map(encodeURIComponent).join('/')}`, base);
  target.search = getRequestURL(event).search;
  const requestHeaders = getRequestHeaders(event);
  const headers = new Headers();
  for (const name of ['accept', 'if-modified-since', 'if-none-match', 'range']) {
    const value = requestHeaders[name];
    if (value) headers.set(name, value);
  }

  let response: Response;
  try {
    response = await fetch(target, { method: event.method, headers, redirect: 'manual' });
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'ADT publication content is unavailable.' });
  }

  setResponseStatus(event, response.status, response.statusText);
  for (const name of forwardedResponseHeaders) {
    const value = response.headers.get(name);
    if (value) setHeader(event, name, value);
  }
  // fetch() decodes compressed upstream bodies, so forwarding an upstream
  // content-encoding or its compressed content-length would corrupt the asset.
  if (!response.headers.has('content-encoding')) {
    const contentLength = response.headers.get('content-length');
    if (contentLength) setHeader(event, 'content-length', contentLength);
  }
  if (event.method === 'HEAD' || !response.body) return null;
  return sendStream(event, response.body);
});
