import { inboxBackendBase, inboxBackendRequest } from '../../utils/inboxBackend';
import { ownedSupportTickets, filterOwnedSupportTickets } from '../../utils/ownedSupportTickets';
import { protectSubmission, submissionActor } from '../../utils/inboxSubmission';
import { localInboxEnabled, authenticateDemoUser, createEntry, readInbox, listTickets, updateEntry } from '../../utils/localInboxStore';
import { createSupportSchema, supportReplySchema, supportListSchema, supportTicketSchema, supportQuerySchema } from '../../../shared/support/contracts';

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'private, no-store');
  const accessToken = getCookie(event, 'signInAccessToken')?.trim();

  const path = (getRouterParam(event, 'path') || '').split('/');
  const [resource, id, action] = path;
  const method = getMethod(event);
  const publicCreate = method === 'POST' && path.length === 1 && resource === 'tickets';
  if (!publicCreate && !accessToken) throw createError({ statusCode: 401, statusMessage: 'Sign in to access your requests.' });
  if (method === 'POST') protectSubmission(event);
  if (id && !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid request ID.' });
  if (resource !== 'tickets' || path.length > 3 || !(method === 'GET' && path.length <= 2 || method === 'POST' && (path.length === 1 || path.length === 3 && action === 'messages'))) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown support operation.' });
  }
  const base = inboxBackendBase(event);
  if (!base && !localInboxEnabled()) throw createError({ statusCode: 503, statusMessage: 'Support is not connected yet. Please try again later.', data: { setupRequired: true } });
  let body;
  const query = supportQuerySchema.safeParse(getQuery(event));
  if (method === 'GET' && !id && !query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid support filters.' });
  if (method === 'POST') {
    const input = (id ? supportReplySchema : createSupportSchema).safeParse(await readBody(event));
    if (!input.success) throw createError({ statusCode: 400, statusMessage: 'Check your subject, message and education level.' });
    body = input.data;
  }
  if (localInboxEnabled()) {
    const actor = publicCreate ? await submissionActor(event) : await authenticateDemoUser(accessToken!, String(useRuntimeConfig(event).backendApiBaseUrl));
    if (!actor) throw createError({ statusCode: 401, statusMessage: 'Please sign in again.' });
    if (method === 'GET' && !id && query.success) return supportListSchema.parse(listTickets((await readInbox()).filter(item => item.userId === actor.id), { ...query.data, userId: actor.id }));
    const entry = id ? (await readInbox()).find(item => item.id === id && item.userId === actor.id && item.category !== 'feedback') : undefined;
    if (id && !entry) throw createError({ statusCode: 404, statusMessage: 'Request not found.' });
    const result = method === 'GET' ? entry : id ? await updateEntry(id, actor, { message: (body as { body: string }).body }) : await createEntry({ ...actor, educationLevel: undefined }, body as Parameters<typeof createEntry>[1]);
    if (method === 'POST') setResponseStatus(event, id ? 200 : 201);
    return supportTicketSchema.parse(result);
  }
  try {
    if (method === 'GET' && !id && query.success) {
      const items = await ownedSupportTickets(page => inboxBackendRequest(event, `/support/tickets?page=${page}&limit=50`));
      return supportListSchema.parse(filterOwnedSupportTickets(items, query.data));
    }
    const suffix = id ? `/${encodeURIComponent(id)}${action ? '/messages' : ''}` : '';
    const response = await inboxBackendRequest(event, `/support/tickets${suffix}`, method, body);
    const parsed = supportTicketSchema.safeParse(response);
    if (!parsed.success) throw createError({ statusCode: 502, statusMessage: 'The support service returned an unexpected response.' });
    if (method === 'POST') setResponseStatus(event, id ? 200 : 201);
    return parsed.data;
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 502, statusMessage: 'Unable to load your requests. Please try again.' });
  }
});
