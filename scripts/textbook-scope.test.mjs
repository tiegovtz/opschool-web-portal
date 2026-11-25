import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTextbookScope, resolveConversationTextbookScope, TextbookScopeError } from '../server/utils/textbookScope.ts';

const catalog = {
  levels: [{_id:'f1',name:'Form 1',educationLevel:{_id:'lower'}},{_id:'f5',name:'Form 5',educationLevel:'upper'}],
  subjects: [{_id:'bio1',name:'Biology',educationLevel:'lower'},{_id:'bio5',name:'Biology',educationLevel:{_id:'upper'}}],
};
test('resolves repeated subject names using class education area', () => {
  assert.deepEqual(resolveTextbookScope({subject:' biology ',level:'FORM 5'}, {}, catalog), {subject:'bio5',classLevel:'f5'});
});

const historyCatalog = {
  levels: [
    {_id:'f1',name:'Form 1',educationLevel:'lower'},
    {_id:'f3',name:'Form 3',educationLevel:'lower'},
    {_id:'p3',name:'Darasa la Tatu',educationLevel:'primary'},
  ],
  subjects: [
    {_id:'hist',name:'Historia ya Tanzania na Maadili',educationLevel:'lower'},
    {_id:'hist-primary',name:'Historia ya Tanzania na Maadili',educationLevel:'primary'},
    {_id:'bio',name:'Biology',educationLevel:'lower'},
    {_id:'sw',name:'Kiswahili',educationLevel:'lower'},
    {_id:'en',name:'English',educationLevel:'lower'},
  ],
};

test('equivalent English, Roman and Kiswahili class names use the same secondary ID', () => {
  for (const level of ['Form 3', 'Form Three', 'FORM III', 'Kidato cha Tatu', 'Kidato 3']) {
    assert.deepEqual(resolveTextbookScope({subject:'Historia Tanzania na Maadili',level}, {}, historyCatalog), {subject:'hist',classLevel:'f3'});
  }
  for (const level of ['Standard 3','Grade Three','Darasa la Tatu']) {
    assert.deepEqual(resolveTextbookScope({subject:'Historia ya Tanzania na Maadili',level}, {}, historyCatalog), {subject:'hist-primary',classLevel:'p3'});
  }
});

test('Historia conversation preserves the explicit class for the topic and availability follow-ups', () => {
  const turns = ['historia ya tanzania na maadili form 3', 'Chimbuko la Muungano wa Tanganyika na Zanzibar', 'ok what do you have?'];
  for (let count=1;count<=turns.length;count++) {
    const scope = resolveConversationTextbookScope(turns.slice(0,count), {}, historyCatalog);
    assert.deepEqual(resolveTextbookScope({},scope,historyCatalog), {subject:'hist',classLevel:'f3'});
  }
});

test('explicit later class changes work, while selected chapter scope stays fixed', () => {
  const turns = ['Biology Form 1','Now Historia ya Tanzania na Maadili, Kidato cha Tatu'];
  assert.deepEqual(resolveTextbookScope({},resolveConversationTextbookScope(turns,{},historyCatalog),historyCatalog),{subject:'hist',classLevel:'f3'});
  assert.deepEqual(resolveConversationTextbookScope(turns,{subject:'bio',level:'f1'},historyCatalog),{subject:'bio',level:'f1'});
});

test('translation requests do not silently change the selected subject', () => {
  for (const translation of ['explain in Kiswahili','translate to English','eleza kwa Kiswahili']) {
    const scope = resolveConversationTextbookScope(['Biology Form Three',translation],{},historyCatalog);
    assert.deepEqual(resolveTextbookScope({},scope,historyCatalog),{subject:'bio',classLevel:'f3'});
  }
});

test('ambiguous and unsupported classes do not reuse the previous class', () => {
  assert.throws(() => resolveConversationTextbookScope(['Biology Form 1','Form 1 or Form 3'],{},historyCatalog),error=>error.code==='ambiguous_scope');
  const scope = resolveConversationTextbookScope(['Biology Form 1','Form 9'],{},historyCatalog);
  assert.throws(()=>resolveTextbookScope({},scope,historyCatalog),error=>error.code==='invalid_level');
  assert.deepEqual(resolveTextbookScope({},resolveConversationTextbookScope(['Biology Form 1 or Form 3','Form Three'],{},historyCatalog),historyCatalog),{subject:'bio',classLevel:'f3'});
  assert.throws(()=>resolveTextbookScope({subject:'Biology'}, {},historyCatalog),error=>error instanceof TextbookScopeError && error.code==='missing_scope');
});
test('selected lesson scope wins over model arguments and accepts canonical IDs', () => {
  assert.deepEqual(resolveTextbookScope({subject:'bio5',level:'f5'}, {subject:'bio1',level:'f1'}, catalog), {subject:'bio1',classLevel:'f1'});
});
test('missing, unknown, mismatched, and ambiguous scopes cannot broaden retrieval', () => {
  for (const input of [{subject:'Biology'}, {subject:'Biology',level:'Unknown'}, {subject:'bio5',level:'f1'}]) {
    assert.throws(() => resolveTextbookScope(input, {}, catalog));
  }
  assert.throws(() => resolveTextbookScope({subject:'Biology',level:'f1'}, {}, {...catalog,subjects:[...catalog.subjects,{_id:'duplicate',name:'Biology',educationLevel:'lower'}]}));
});
