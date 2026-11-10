import { randomUUID } from 'node:crypto';
import { authenticateDemoUser } from './localInboxStore';
import type { H3Event } from 'h3';
export async function submissionActor(event: H3Event) {
  const token = getCookie(event, 'signInAccessToken')?.trim();
  if (token) {
    const actor = await authenticateDemoUser(token, String(useRuntimeConfig(event).backendApiBaseUrl));
    if (actor) return actor;
  }
  return { id: `guest-${randomUUID()}`, name: 'Guest', role: 'Guest' };
}
export function protectSubmission(event: H3Event) {
  const origin = getHeader(event, 'origin');
  if (origin && origin !== getRequestURL(event).origin) throw createError({ statusCode: 403, statusMessage: 'Invalid origin.' });
  const size = Number(getHeader(event, 'content-length') || 0);
  if (size > 8500000) throw createError({ statusCode: 413, statusMessage: 'Attachments are too large.' });
}
