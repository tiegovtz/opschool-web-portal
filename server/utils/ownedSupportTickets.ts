import { supportListSchema, type SupportTicket } from '../../shared/support/contracts.ts';

// Swagger exposes only page and limit on the user's list endpoint. Apply the
// portal's search/status filters over that authenticated account's full list.
export async function ownedSupportTickets(requestPage: (page: number) => Promise<unknown>) {
  const items: SupportTicket[] = [];
  const ids = new Set<string>();
  let total = 0;
  for (let page = 1; page <= 200; page++) {
    const parsed = supportListSchema.safeParse(await requestPage(page));
    if (!parsed.success) throw new Error('The support service returned an unexpected response.');
    total = parsed.data.total;
    const previousSize = items.length;
    for (const item of parsed.data.items) if (!ids.has(item.id)) { ids.add(item.id); items.push(item); }
    if (items.length >= total) return items;
    if (items.length === previousSize) throw new Error('The support service returned an incomplete list.');
  }
  throw new Error('Your request list is too large to load. Please contact support.');
}
export function filterOwnedSupportTickets(items: SupportTicket[], filters: { category?: string; status?: string; search?: string; page: number; limit: number }) {
  const counts = Object.fromEntries(['technical','feature','support'].map(category => [category, { total: items.filter(item => item.category === category).length, new: items.filter(item => item.category === category && item.status === 'new').length }]));
  const search = filters.search?.toLowerCase();
  const matches = [...items].sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).filter(item => (!filters.category || item.category === filters.category) && (!filters.status || item.status === filters.status) && (!search || `${item.subject} ${item.body}`.toLowerCase().includes(search)));
  const summary = { submitted: items.length, pending: items.filter(item => item.status !== 'resolved').length, solved: items.filter(item => item.status === 'resolved').length };
  return { summary, items: matches.slice((filters.page - 1) * filters.limit, filters.page * filters.limit), total: matches.length, counts };
}
