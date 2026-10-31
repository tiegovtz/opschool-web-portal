import { createSupportSchema, supportReplySchema, supportListSchema, supportTicketSchema, supportQuerySchema } from '../../../shared/support/contracts';

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'private, no-store');
  const accessToken = getCookie(event, 'signInAccessToken')?.trim();
  if (!accessToken) throw createError({ statusCode: 401, statusMessage: 'Sign in to access support.' });
  const path = (getRouterParam(event, 'path') || '').split('/');
  const [resource, id, action] = path;
  const method = getMethod(event);
  if (id && !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid request ID.' });
  if (resource !== 'tickets' || path.length > 3 || !(method === 'GET' && path.length <= 2 || method === 'POST' && (path.length === 1 || path.length === 3 && action === 'messages'))) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown support operation.' });
  }
  const base = String(useRuntimeConfig(event).supportApiBaseUrl || '').replace(/\/+$/, '');
  if (!base) throw createError({ statusCode: 503, statusMessage: 'Support is not connected yet. Please try again later.', data: { setupRequired: true } });
  let body;
  const query = supportQuerySchema.safeParse(getQuery(event));
  if (method === 'GET' && !id && !query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid support filters.' });
  if (method === 'POST') {
    const input = (id ? supportReplySchema : createSupportSchema).safeParse(await readBody(event));
    if (!input.success) throw createError({ statusCode: 400, statusMessage: 'Check your subject, message and education level.' });
    body = input.data;
  }
  try {
    const suffix = id ? `/${encodeURIComponent(id)}${action ? '/messages' : ''}` : '';
    // This upstream endpoint MUST enforce account ownership using the access token.
    // Never pass a user ID or admin-controlled status from the browser.
    const response = await $fetch(`${base}/support/tickets${suffix}`, {
      method: method as 'GET' | 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body,
      query: method === 'GET' && !id && query.success ? query.data : undefined, timeout: 20000, redirect: 'error',
    });
    const parsed = (method === 'GET' && !id ? supportListSchema : supportTicketSchema).safeParse(response);
    if (!parsed.success) throw createError({ statusCode: 502, statusMessage: 'The support service returned an unexpected response.' });
    if (method === 'POST') setResponseStatus(event, id ? 200 : 201);
    return parsed.data;
  } catch (error: any) {
    const status = error?.statusCode || error?.response?.status;
    throw createError({ statusCode: [400, 401, 403, 404, 409, 422, 429, 502, 503].includes(status) ? status : 502, statusMessage: status === 401 ? 'Your session has expired. Please sign in again.' : status === 403 || status === 404 ? 'This request is not available to your account.' : status === 422 ? 'Check the education level and required fields.' : 'Unable to reach support. Your message has not been confirmed; please try again.' });
  }
});
