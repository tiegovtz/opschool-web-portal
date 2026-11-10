import * as apiDocs from '../app/utilities/apiDocs.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { backendCsrfCookie } from '../shared/backend/proxy.ts';
import * as contracts from '../shared/support/contracts.ts';
import * as feedback from '../shared/feedback/contracts.ts';
import { feedbackQuestions } from '../shared/feedback/questions.ts';
import * as owned from '../server/utils/ownedSupportTickets.ts';
const require = createRequire(import.meta.url), ts = require('typescript');
function load(file, modules = {}, globals = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: name => modules[name] ?? require(name), Headers, Response, URL, AbortSignal, process, ...globals });
  return module.exports;
}
const globals = {
  defineEventHandler: fn => fn, setHeader() {}, setResponseStatus: (event,status) => { event.status = status; },
  getCookie: event => event.token, getMethod: event => event.method, readBody: async event => event.body,
  getRouterParam: event => event.path, getQuery: event => event.query || {},
  useRuntimeConfig: () => ({ backendApiBaseUrl: 'https://backend.test/api/v1', supportApiBaseUrl: '' }),
  createError: value => Object.assign(new Error(value.statusMessage),value),
};
const ticket = (id,status = 'new') => ({ id: String(id).padStart(24,'0'), category:'technical', educationLevel:'primary', language:'en', subject:`Lesson ${id}`, body:'Cannot open lesson', status, createdAt:'2026-11-08T06:00:00.000Z', messages:[], contact:{ name:'Person',email:'private@example.test',phone:'' }, sender:{ id:'user-1', name:'Person' }, internalNote:'Admin only', attachments:[{name:'screen.png',type:'image/png'}] });
const counts = { technical:{total:0,new:0}, feature:{total:0,new:0}, support:{total:0,new:0} };

test('live writes send matching CSRF cookie/token and bearer identity, and preserve failed statuses', async () => {
  const calls = [];
  let status = 201;
  const backendFetch = async (url,init) => {
    calls.push({url,init});
    if (url.endsWith('/auth/csrf-token')) return new Response(JSON.stringify({csrfToken:'fresh-token'}), {status:200, headers:{'set-cookie':'csrf_token=fresh-cookie; HttpOnly; Path=/'}});
    return new Response(JSON.stringify(status === 201 ? { id:'saved-id' } : {message:'Unauthorized'}), {status});
  };
  const csrf = load('server/utils/fetchBackendWithCsrf.ts', {'../../shared/backend/proxy.ts':{backendCsrfCookie}}, {...globals, fetch:backendFetch});
  const backend = load('server/utils/inboxBackend.ts', {'./fetchBackendWithCsrf':csrf, '../../app/utilities/apiDocs':apiDocs}, globals);
  const saved = await backend.inboxBackendRequest({token:'member-token'},'/feedback','POST',{answers:[]});
  assert.equal(saved.id,'saved-id'); assert.equal(calls.length,2);
  assert.equal(calls[0].init.headers.get('authorization'),'Bearer member-token');
  assert.equal(calls[1].init.headers.get('cookie'),'csrf_token=fresh-cookie');
  assert.equal(calls[1].init.headers.get('x-csrf-token'),'fresh-token');
  assert.equal(calls[1].init.headers.get('authorization'),'Bearer member-token');
  assert.equal(calls[1].url,'https://backend.test/api/v1/feedback');
  assert.equal(calls[1].init.redirect,'error');
  status = 401;
  await assert.rejects(backend.inboxBackendRequest({},'/feedback','POST',{}), error => error.statusCode === 401 && /requires sign-in/.test(error.message));
  assert.equal(calls[2].init.headers.get('authorization'),null);
});

test('Swagger user pagination is aggregated before filtering and counts; private fields never reach portal', async () => {
  const calls = [];
  const records = Array.from({length:53},(_,i) => ticket(i+1,i === 52 ? 'resolved' : 'new'));
  const items = await owned.ownedSupportTickets(async page => { calls.push(page); return {items:records.slice((page-1)*50,page*50),total:53,counts,page,limit:50}; });
  assert.deepEqual(calls,[1,2]); assert.equal(items.length,53);
  assert.equal('internalNote' in items[0],false); assert.equal('sender' in items[0],false); assert.equal('contact' in items[0],false);
  assert.equal(items[0].attachments[0].data,undefined);
  const result = owned.filterOwnedSupportTickets(items,{status:'resolved',search:'Lesson 53',page:1,limit:10});
  assert.equal(result.total,1); assert.equal(result.items[0].id,records[52].id);
  assert.deepEqual(result.summary,{submitted:53,pending:52,solved:1});
  await assert.rejects(owned.ownedSupportTickets(async () => ({items:[],total:1,counts})),/incomplete/);
});

test('live feedback and support handlers forward forms, sanitize outputs, and keep read access authenticated', async () => {
  const calls = [];
  const api = { inboxBackendBase: () => 'https://backend.test/api/v1', inboxBackendRequest: async (event,path,method,body) => { calls.push({event,path,method,body}); return path === '/feedback' ? {id:'feedback-id',note:'Private'} : ticket(1); } };
  const modules = { '../../../app/utilities/apiDocs': apiDocs, '../../utils/localInboxStore': {localInboxEnabled:() => false}, '../../utils/inboxSubmission': {protectSubmission() {}}, '../../utils/inboxBackend':api, '../../utils/ownedSupportTickets':owned, '../../../shared/support/contracts':contracts, '../../../shared/feedback/contracts':feedback };
  const submitFeedback = load('server/api/feedback/index.ts',modules,globals).default;
  const answers = feedbackQuestions.en.slice(0,9).map(question => ({question:question.label,answer:question.options[0] || 'More practice'}));
  answers[4].answer = ''; // The conditional technical description is optional.
  const event = {method:'POST',token:'member-token',body:{educationLevel:'primary',language:'en',answers,contact:{name:'',email:'',phone:''}}};
  const result = await submitFeedback(event);
  assert.equal(event.status,201); assert.deepEqual(Object.keys(result),['id']); assert.equal(calls[0].path,'/feedback'); assert.equal(calls[0].body.answers.length,8); assert.equal(calls[0].body.answers.some(answer => !answer.answer.trim()),false);
  const support = load('server/api/support/[...path].ts',modules,globals).default;
  const input = {category:'technical',educationLevel:'primary',language:'en',subject:'Help',body:'Cannot login',contact:{name:'',email:'',phone:''},attachments:[]};
  const saved = await support({method:'POST',path:'tickets',token:'member-token',body:input});
  assert.equal(calls[1].path,'/support/tickets'); assert.equal(calls[1].body.subject,'Help'); assert.equal('internalNote' in saved,false);
  await assert.rejects(support({method:'GET',path:'tickets'}),error => error.statusCode === 401);
  await support({method:'POST',path:`tickets/${ticket(1).id}/messages`,token:'member-token',body:{body:'Thanks',sender:'admin'}});
  assert.equal(calls[2].path,`/support/tickets/${ticket(1).id}/messages`); assert.deepEqual(Object.keys(calls[2].body),['body']);
});

test('central portal definitions include v1 exactly once for all inbox endpoints', () => {
  for (const base of ['https://api.test/api','https://api.test/api/','https://api.test/api/v1','https://api.test/api/v1/']) {
    const urls = apiDocs.feedbackSupportApiURLs(base);
    assert.equal(urls.feedback.submit,'https://api.test/api/v1/feedback');
    assert.equal(urls.support.tickets,'https://api.test/api/v1/support/tickets');
    assert.equal(urls.support.ticket('one/two'),'https://api.test/api/v1/support/tickets/one%2Ftwo');
    assert.equal(urls.support.messages('id'),'https://api.test/api/v1/support/tickets/id/messages');
    const backend = load('server/utils/inboxBackend.ts', {'./fetchBackendWithCsrf':{}, '../../app/utilities/apiDocs':apiDocs}, {...globals, useRuntimeConfig: () => ({backendApiBaseUrl:base})});
    assert.equal(backend.inboxBackendBase({}),'https://api.test/api/v1');
  }
});
