import { localInboxEnabled, readInbox } from '../../utils/localInboxStore';
// Read-only fictional examples for presentation. The feedback form stays in Google Forms.
export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'private, no-store');
  if (getMethod(event) !== 'GET') throw createError({ statusCode: 405, statusMessage: 'Method not allowed.' });
  if (!localInboxEnabled()) return { demo: false, examples: [] };
  const examples = (await readInbox()).filter(item => item.userId === 'demo-sample' && item.category === 'feedback').map(item => ({ id: item.id, subject: item.subject, educationLevel: item.educationLevel, language: item.language, status: item.status, body: item.body }));
  return { demo: true, examples };
});
