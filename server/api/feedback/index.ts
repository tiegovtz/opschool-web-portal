import { inboxBackendRequest } from '../../utils/inboxBackend';
import { feedbackSchema } from '../../../shared/feedback/contracts';
import { localInboxEnabled, createEntry } from '../../utils/localInboxStore';
import { protectSubmission, submissionActor } from '../../utils/inboxSubmission';
export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'private, no-store');
  if (getMethod(event) !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed.' });
  protectSubmission(event);
  const result = feedbackSchema.safeParse(await readBody(event));
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Check your answers and contact details.' });
  const input = result.data;
  if (localInboxEnabled()) {
    const actor = await submissionActor(event);
    const entry = await createEntry({ ...actor, educationLevel: undefined }, { ...input, category: 'feedback', subject: input.language === 'sw' ? 'Maoni kuhusu jukwaa' : 'Platform feedback', body: input.answers.map(answer => `${answer.question}\n${answer.answer}`).join('\n\n'), answers: [...input.answers, { question: 'Contact', answer: [input.contact.name, input.contact.email, input.contact.phone].filter(Boolean).join(' · ') }] });
    setResponseStatus(event, 201); return { id: entry.id };
  }
  // Omit unanswered optional questions; keep all required-answer validation above.
  const response = await inboxBackendRequest(event, '/feedback', 'POST', { ...input, answers: input.answers.filter(item => item.answer.trim()) });
  if (typeof response.id !== 'string' || !response.id) throw createError({ statusCode: 502, statusMessage: 'The feedback service returned an unexpected response.' });
  setResponseStatus(event, 201); return { id: response.id };
});
