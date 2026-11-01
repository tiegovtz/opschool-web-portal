import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEntry, readInbox, updateEntry, listTickets, localInboxEnabled } from '../server/utils/localInboxStore.ts';
import { supportTicketSchema } from '../shared/support/contracts.ts';

test('local submissions reach the shared admin inbox and retain reviews, replies and ownership', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'opschool-inbox-test-'));
  const previous = { enabled: process.env.INBOX_DEMO_ENABLED, file: process.env.INBOX_DEMO_FILE, mode: process.env.NODE_ENV };
  process.env.INBOX_DEMO_ENABLED = 'true'; process.env.INBOX_DEMO_FILE = join(dir, 'inbox.json'); process.env.NODE_ENV = 'test';
  try {
    const learner = { id: 'user-one', name: 'Test learner', role: 'Student', educationLevel: 'primary' };
    const other = { id: 'user-two', name: 'Other learner', role: 'Student', educationLevel: 'secondary' };
    const input = { category: 'technical', educationLevel: 'secondary', language: 'en', subject: 'Test issue', body: 'Please investigate.' };
    const ticket = await createEntry(learner, input);
    assert.equal(ticket.educationLevel, 'primary');
    const feedback = await createEntry(learner, { ...input, category: 'feedback', answers: [{ question: 'Satisfaction', answer: '4' }] });
    await Promise.all(Array.from({ length: 5 }, () => createEntry(other, input)));
    assert.equal((await readInbox()).length, 7);
    assert.equal(listTickets(await readInbox(), { userId: learner.id }).total, 1);
    assert.equal(listTickets(await readInbox(), { educationLevel: 'primary' }).counts.technical.total, 1);
    await assert.rejects(() => updateEntry(ticket.id, other, { message: 'Not mine' }), /not found/);
    await updateEntry(ticket.id, 'admin', { status: 'in_review', internalNote: 'Staff only' });
    await updateEntry(ticket.id, 'admin', { message: 'We are investigating.' });
    const result = await updateEntry(ticket.id, learner, { message: 'Thank you.', status: 'resolved', internalNote: 'Cannot overwrite' });
    assert.equal(result.status, 'in_review'); assert.equal(result.internalNote, 'Staff only'); assert.equal(result.messages.length, 2);
    assert.equal('internalNote' in supportTicketSchema.parse(result), false);
    await updateEntry(feedback.id, 'admin', { status: 'reviewed', internalNote: 'Read' });
    assert.equal((await readInbox()).find(item => item.id === feedback.id).status, 'reviewed');
    assert.equal(JSON.parse(await readFile(process.env.INBOX_DEMO_FILE, 'utf8')).version, 1);
    process.env.NODE_ENV = 'production'; assert.equal(localInboxEnabled(), false);
  } finally {
    for (const [name, value] of Object.entries({ INBOX_DEMO_ENABLED: previous.enabled, INBOX_DEMO_FILE: previous.file, NODE_ENV: previous.mode })) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
    await rm(dir, { recursive: true, force: true });
  }
});
