import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as store from '../server/utils/localInboxStore.ts';
import * as supportContracts from '../shared/support/contracts.ts';
import { feedbackQuestions } from '../shared/feedback/questions.ts';
import * as feedbackContracts from '../shared/feedback/contracts.ts';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(file, modules, globals) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: name => modules[name] ?? require(name), process, ...globals });
  return module.exports.default;
}
test('public submissions save contact and screenshots, while requests remain private to their owner', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'portal-submissions-'));
  const before = { ...process.env };
  process.env.INBOX_DEMO_ENABLED = 'true'; process.env.NODE_ENV = 'test'; process.env.INBOX_DEMO_FILE = join(dir,'inbox.json');
  const guest = { id: 'guest-one', name: 'Guest', role: 'Guest' };
  const member = { id: 'member-one', name: 'Member', role: 'Student' };
  const globals = { defineEventHandler: fn => fn, setHeader() {}, setResponseStatus() {}, getMethod: event => event.method, getCookie: event => event.token, getRouterParam: event => event.path, getQuery: event => event.query || {}, readBody: async event => event.body, useRuntimeConfig: () => ({ backendApiBaseUrl: 'https://auth.example/v1' }), createError: value => Object.assign(new Error(value.statusMessage),value) };
  const modules = { '../../utils/localInboxStore': { ...store, authenticateDemoUser: async token => token === 'member' ? member : null }, '../../utils/inboxSubmission': { protectSubmission() {}, submissionActor: async event => event.token === 'member' ? member : guest }, '../../../shared/support/contracts': supportContracts, '../../../shared/feedback/contracts': feedbackContracts };
  try {
    const feedback = load('server/api/feedback/index.ts', modules, globals);
    const support = load('server/api/support/[...path].ts', modules, globals);
    const contact = { name: 'Example', email: 'example@example.com', phone: '+255 700 000 000' };
    await feedback({ method: 'POST', body: { language: 'en', educationLevel: 'primary', contact, answers: feedbackQuestions.en.slice(0,9).map(question => ({ question: question.label, answer: question.options[0] || 'Answer' })) } });
    const screenshot = { name: 'screen.png', type: 'image/png', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' };
    const body = { category: 'technical', educationLevel: 'secondary', language: 'en', subject: 'Cannot login', body: 'Please help', contact, attachments: [screenshot] };
    const ticket = await support({ method: 'POST', path: 'tickets', body });
    assert.equal(ticket.attachments.length,1);
    assert.equal('contact' in ticket,false);
    await assert.rejects(support({ method: 'GET', path: 'tickets' }), { statusCode: 401 });
    await assert.rejects(support({ method: 'GET', path: `tickets/${ticket.id}`, token: 'member' }), { statusCode: 404 });
    const owned = await support({ method: 'POST', path: 'tickets', token: 'member', body });
    const list = await support({ method: 'GET', path: 'tickets', token: 'member' });
    assert.deepEqual(Array.from(list.items, item => item.id), [owned.id]);
    const saved = await store.readInbox();
    assert.equal(saved.length,3); assert.deepEqual(saved[0].contact,contact); assert.deepEqual(saved[1].attachments,[screenshot]);
    assert.equal(saved[2].category,'feedback'); assert.equal(saved[2].answers.length,10);
    assert.equal(saved.every(item => item.status === 'new'),true);
  } finally { for (const key of ['INBOX_DEMO_ENABLED','NODE_ENV','INBOX_DEMO_FILE']) before[key] === undefined ? delete process.env[key] : process.env[key] = before[key]; await rm(dir,{recursive:true,force:true}); }
});
test('screenshots and optional contact fields reject invalid input', () => {
  assert.equal(feedbackContracts.contactSchema.safeParse({email:'invalid'}).success,false);
  assert.equal(feedbackContracts.attachmentSchema.safeParse({name:'x.svg',type:'image/svg+xml',data:'<svg/>'}).success,false);
  assert.equal(feedbackContracts.attachmentSchema.safeParse({name:'x.png',type:'image/png',data:'data:image/png;base64,SGVsbG8='}).success,false);
});
