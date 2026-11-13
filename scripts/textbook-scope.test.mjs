import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTextbookScope } from '../server/utils/textbookScope.ts';

const catalog = {
  levels: [{_id:'f1',name:'Form 1',educationLevel:{_id:'lower'}},{_id:'f5',name:'Form 5',educationLevel:'upper'}],
  subjects: [{_id:'bio1',name:'Biology',educationLevel:'lower'},{_id:'bio5',name:'Biology',educationLevel:{_id:'upper'}}],
};
test('resolves repeated subject names using class education area', () => {
  assert.deepEqual(resolveTextbookScope({subject:' biology ',level:'FORM 5'}, {}, catalog), {subject:'bio5',classLevel:'f5'});
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
