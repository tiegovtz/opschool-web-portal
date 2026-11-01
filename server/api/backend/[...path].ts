import { backendProxyBaseUrl, backendProxyTarget, backendRequestHeaders, backendResponseHeaders } from '../../../shared/backend/proxy';

export default defineEventHandler(async event => {
  const method = getMethod(event);
  if (!['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(method)) throw createError({ statusCode: 405, statusMessage: 'Method not allowed.' });
  const url = getRequestURL(event);
  const origin = getHeader(event, 'origin');
  if (origin && origin !== url.origin) throw createError({ statusCode: 403, statusMessage: 'Use the portal origin for API requests.' });
  const configuredUrl = useRuntimeConfig(event).backendApiBaseUrl;
  let baseUrl: string;
  try {
    baseUrl = backendProxyBaseUrl(
      process.env.NUXT_BACKEND_API_BASE_URL,
      process.env.VITE_API_BASE_URL,
      typeof configuredUrl === 'string' ? configuredUrl : undefined,
    );
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Backend API URL is missing or invalid. Check NUXT_BACKEND_API_BASE_URL and VITE_API_BASE_URL.' });
  }
  let target: URL;
  try {
    target = backendProxyTarget(baseUrl, getRouterParam(event, 'path') || '', url.search);
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid backend request path.' });
  }
  const headers = backendRequestHeaders(new Headers(getRequestHeaders(event) as Record<string, string>));
  const rawBody = !['GET', 'HEAD'].includes(method) ? await readRawBody(event, false) : undefined;
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    response = await fetch(target, { method, headers, body: rawBody ? new Uint8Array(rawBody) : undefined, redirect: 'manual', signal: controller.signal });
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'The backend could not be reached. Please try again.' });
  } finally {
    // Time out connection/header acquisition, not a long audio/video response.
    clearTimeout(timeout);
  }
  // Never follow a redirect with the user's Authorization header to another host.
  if (response.status >= 300 && response.status < 400 && response.status !== 304) {
    await response.body?.cancel();
    throw createError({ statusCode: 502, statusMessage: 'The backend returned an unexpected redirect.' });
  }
  setResponseStatus(event, response.status);
  backendResponseHeaders(response.headers).forEach((value, name) => setHeader(event, name, value));
  if (method === 'HEAD' || !response.body) return null;
  return sendStream(event, response.body);
});
