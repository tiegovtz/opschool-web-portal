import type { H3Event } from 'h3';
import { fetchBackendWithCsrf } from './fetchBackendWithCsrf';

export function inboxBackendBase(event: H3Event) {
  const config = useRuntimeConfig(event);
  return String(config.supportApiBaseUrl || config.backendApiBaseUrl || '').trim().replace(/\/+$/, '');
}

export async function inboxBackendRequest(event: H3Event, path: string, method = 'GET', body?: unknown) {
  const base = inboxBackendBase(event);
  if (!base) throw createError({ statusCode: 503, statusMessage: 'The service is temporarily unavailable.' });
  const token = getCookie(event, 'signInAccessToken')?.trim();
  const headers = new Headers({ accept: 'application/json' });
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (body !== undefined) headers.set('content-type', 'application/json');
  let response: Response;
  try {
    response = await fetchBackendWithCsrf(base, `${base}${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Unable to reach the service. Please try again.' });
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('[Inbox API]', { method, path, upstreamStatus: response.status });
    const status = [400,401,403,404,409,413,422,429,503].includes(response.status) ? response.status : 502;
    // Do not return backend internals, contact information or CSRF cookies.
    const message = status === 401 ? token ? 'Your session has expired. Please sign in again.' : 'The service currently requires sign-in to submit. Please sign in and try again.'
      : status === 403 ? 'You do not have permission to access this request.'
      : status === 404 ? 'Request not found.'
      : status === 400 || status === 422 ? 'Check the required fields and education level.'
      : status === 413 ? 'The screenshots are too large.'
      : status === 429 ? 'Too many requests. Please try again shortly.'
      : 'The service could not confirm your request. Please try again.';
    throw createError({ statusCode: status, statusMessage: message, data: { message, upstreamStatus: response.status } });
  }
  if (!result || typeof result !== 'object') throw createError({ statusCode: 502, statusMessage: 'The service returned an unexpected response.' });
  return result;
}
