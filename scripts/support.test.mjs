import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupportSchema, supportReplySchema, supportTicketSchema, supportListSchema, supportQuerySchema } from '../shared/support/contracts.ts';

test('support creation validates categories, levels, message limits and strips client identity', () => {
  const body = { category: 'technical', educationLevel: 'primary', language: 'sw', subject: ' Video issue ', body: ' Please help. ', userId: 'someone-else', status: 'resolved', internalNote: 'not allowed' };
  const result = createSupportSchema.parse(body);
  assert.equal(result.subject, 'Video issue'); assert.equal(result.body, 'Please help.');
  for (const key of ['userId', 'status', 'internalNote']) assert.equal(key in result, false);
  for (const change of [{ category: 'feedback' }, { educationLevel: 'unknown' }, { subject: ' ' }, { body: 'x'.repeat(5001) }]) assert.equal(createSupportSchema.safeParse({ ...body, ...change }).success, false);
});
test('learner ticket output excludes private notes and staff identity', () => {
  const ticket = supportTicketSchema.parse({ id: '1', category: 'support', educationLevel: 'secondary', language: 'en', subject: 'Help', body: 'Please help', status: 'new', createdAt: '2026-10-31T10:00:00Z', internalNote: 'Private', sender: { email: 'private@example.com' }, messages: [{ id: '2', body: 'Reply', sender: 'admin', createdAt: '2026-10-31T10:05:00Z', internalNote: 'Private too', staffEmail: 'admin@example.com' }] });
  assert.equal('internalNote' in ticket, false); assert.equal('sender' in ticket, false);
  assert.deepEqual(Object.keys(ticket.messages[0]).sort(), ['id', 'body', 'sender', 'createdAt'].sort());
});
test('list counts, pagination and replies are bounded and validated', () => {
  assert.equal(supportListSchema.safeParse({ items: [], total: -1, counts: {} }).success, false);
  assert.equal(supportQuerySchema.safeParse({ page: 0 }).success, false);
  assert.equal(supportQuerySchema.safeParse({ limit: 1000 }).success, false);
  assert.equal(supportReplySchema.safeParse({ body: ' ' }).success, false);
  assert.deepEqual(supportReplySchema.parse({ body: ' Thanks ', sender: 'admin' }), { body: 'Thanks' });
});
