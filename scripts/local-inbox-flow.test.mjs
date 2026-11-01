import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as portalStore from '../server/utils/localInboxStore.ts';
import * as adminStore from '../../opschool-web-admin/lib/inbox-demo/store.ts';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const contracts = await import('../shared/support/contracts.ts');
function load(file, modules, globals) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: name => name in modules ? modules[name] : require(name), process, fetch: (...args) => globalThis.fetch(...args), AbortSignal, URLSearchParams, ...globals });
  return module.exports;
}
test('demo feedback review and portal/admin support conversations use the same saved data', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'opschool-flow-test-'));
  const old = { ...process.env }; const fetchBefore = globalThis.fetch;
  process.env.INBOX_DEMO_ENABLED = 'true'; process.env.INBOX_DEMO_FILE = join(dir, 'inbox.json'); process.env.NODE_ENV = 'test'; process.env.NEXT_PUBLIC_API_ENDPOINT = 'https://auth.test/v1';
  const student = { id: 'student-one', name: 'Test Student', type: 'Student', roles: ['Student'], educationLevel: 'primary' };
  globalThis.fetch = async (_url, init) => ({ ok: true, json: async () => init.headers.Authorization === 'Bearer admin-test' ? { id: 'admin-one', name: 'Test Admin', roles: ['SuperAdmin'] } : student });
  const globals = { defineEventHandler: fn => fn, setHeader: () => {}, setResponseStatus: () => {}, getCookie: event => event.token, getMethod: event => event.method, getRouterParam: event => event.path, readBody: async event => event.body, getQuery: event => event.query || {}, useRuntimeConfig: () => ({ backendApiBaseUrl: 'https://auth.test/v1' }), createError: ({ statusCode, statusMessage }) => Object.assign(new Error(statusMessage), { statusCode }) };
  const jsonResponse = { NextResponse: { json: (data, options = {}) => ({ data, status: options.status || 200 }) } };
  const adminReq = (method, body, form = 'primary') => ({ method, headers: { get: () => 'Bearer admin-test' }, cookies: { get: () => undefined }, nextUrl: { searchParams: new URLSearchParams({ form, educationLevel: form }) }, json: async () => body });
  try {
    const feedback = load('server/api/feedback/index.ts', { '../../utils/localInboxStore': portalStore }, globals).default;
    const support = load('server/api/support/[...path].ts', { '../../utils/localInboxStore': portalStore, '../../../shared/support/contracts': contracts }, globals).default;
    const adminFeedback = load('../opschool-web-admin/app/api/feedback/route.ts', { 'next/server': jsonResponse, '@/lib/inbox-demo/store': adminStore, '@/lib/feedback/types': { feedbackStatuses: ['New', 'Reviewed'] }, '@/lib/feedback/sheets': { FeedbackSetupError: class extends Error {} } }, {});
    const adminSupport = load('../opschool-web-admin/app/api/support/[...path]/route.ts', { 'next/server': jsonResponse, '@/lib/inbox-demo/store': adminStore }, {});
    const sent = await adminStore.createEntry({ id: 'demo-sample', name: 'Demo Learner', role: 'Student' }, { category: 'feedback', subject: 'Test feedback', body: 'Helpful learning materials.', educationLevel: 'primary', language: 'en', answers: [{ question: 'Satisfaction', answer: '5' }] });
    assert.equal((await feedback({ method: 'GET' })).examples[0].id, sent.id);
    await assert.rejects(() => feedback({ method: 'POST' }), error => error.statusCode === 405);
    const inbox = await adminFeedback.GET(adminReq('GET'));
    assert.equal(inbox.data.responses[0].id, sent.id); assert.equal(inbox.data.responses[0].status, 'New');
    assert.equal((await adminFeedback.PATCH(adminReq('PATCH', { id: sent.id, status: 'Reviewed', note: 'Private review' }))).status, 200);
    assert.equal((await adminFeedback.GET(adminReq('GET'))).data.responses[0].status, 'Reviewed');
    const ticket = await support({ method: 'POST', path: 'tickets', token: 'student-test', body: { category: 'technical', educationLevel: 'secondary', language: 'en', subject: 'Test video', body: 'Video does not load.' } });
    assert.equal(ticket.educationLevel, 'primary');
    const context = action => ({ params: Promise.resolve({ path: ['tickets', ticket.id, action] }) });
    await adminSupport.PATCH(adminReq('PATCH', { status: 'in_review', internalNote: 'Staff context' }), context('review'));
    await adminSupport.POST(adminReq('POST', { body: 'Please try again.' }), context('messages'));
    const thread = await support({ method: 'GET', path: `tickets/${ticket.id}`, token: 'student-test' });
    assert.equal(thread.status, 'in_review'); assert.equal(thread.messages[0].body, 'Please try again.'); assert.equal('internalNote' in thread, false);
    await support({ method: 'POST', path: `tickets/${ticket.id}/messages`, token: 'student-test', body: { body: 'It works now.' } });
    const adminDetail = await adminSupport.GET(adminReq('GET'), { params: Promise.resolve({ path: ['tickets', ticket.id] }) });
    assert.equal(adminDetail.data.messages[1].body, 'It works now.');
    await assert.rejects(() => support({ method: 'GET', path: 'tickets', token: undefined }), error => error.statusCode === 401);
  } finally {
    globalThis.fetch = fetchBefore;
    for (const key of ['INBOX_DEMO_ENABLED', 'INBOX_DEMO_FILE', 'NODE_ENV', 'NEXT_PUBLIC_API_ENDPOINT']) { if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; }
    await rm(dir, { recursive: true, force: true });
  }
});
