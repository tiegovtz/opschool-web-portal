import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '~~/server/utils/backendApiDocs' || specifier === '~/utilities/apiDocs') {
    return {url: 'data:text/javascript,export default {baseURL:"http://catalog.test"}', shortCircuit:true};
  }
  try { return nextResolve(specifier,context); }
  catch(error) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) return nextResolve(specifier + '.ts',context);
    throw error;
  }
}});
const {createTextbookSearchTool, createStudentTools, resolveTextbookSearchScope} = await import('../server/api/utils/tools.ts');
hooks.deregister();
const catalog = {
  subjects:[{_id:'100000000000000000000001',name:'Biology',educationLevel:'lower'},{_id:'100000000000000000000005',name:'Biology',educationLevel:'upper'}],
  levels:[{_id:'200000000000000000000001',name:'Form 1',educationLevel:'lower'},{_id:'200000000000000000000005',name:'Form 5',educationLevel:'upper'}],
};

test('student tool sends canonical scope, keeps long-chapter evidence, and isolates concurrent lessons', async t => {
  const requests=[];
  globalThis.useRuntimeConfig=() => ({ragApiBaseUrl:'http://rag.test',insightsApiKey:'test-only'});
  t.mock.method(globalThis,'fetch',async (url,init) => {
    if (url.endsWith('/subjects')) return Response.json(catalog.subjects);
    if (url.endsWith('/levels')) return Response.json(catalog.levels);
    assert.equal(url,'http://rag.test/rag/query');
    const body=JSON.parse(init.body);requests.push(body);
    return Response.json({results:[{content:`Evidence for ${body.classLevel}`,parentContent:'Chapter '.repeat(3000),source:'Book'}]});
  });
  const results=await Promise.all(['Form 1','Form 5'].map(level => createTextbookSearchTool({subject:'Biology',level},'test-token').execute({query:'photosynthesis',subject:'wrong'}, {})));
  assert.deepEqual(requests.map(r=>[r.subject,r.classLevel]).sort(),[['100000000000000000000001','200000000000000000000001'],['100000000000000000000005','200000000000000000000005']]);
  assert.ok(results.every(result=>result.found));
  assert.match(results[0].context,/Evidence for 200000000000000000000001/);
  assert.match(results[1].context,/Evidence for 200000000000000000000005/);
});

test('missing scope and upstream errors never fall back to an unfiltered corpus', async t => {
  let searches=0;
  globalThis.useRuntimeConfig=() => ({ragApiBaseUrl:'http://rag.test',insightsApiKey:'test-only'});
  t.mock.method(globalThis,'fetch',async (url) => {
    if (url.endsWith('/subjects')) return Response.json(catalog.subjects);
    if (url.endsWith('/levels')) return Response.json(catalog.levels);
    assert.equal(url,'http://rag.test/rag/query');searches++;
    return new Response('Unavailable',{status:503});
  });
  assert.equal((await createTextbookSearchTool().execute({query:'photosynthesis',subject:'Biology'},{})).found,false);
  assert.equal(searches,0);
  assert.equal((await createTextbookSearchTool({subject:'Biology',level:'Form 1'}).execute({query:'photosynthesis'},{})).found,false);
  assert.equal(searches,1);
});


test('merged request tools retain selected scope and publish source citations', async t => {
  const citations=[];
  globalThis.useRuntimeConfig=() => ({ragApiBaseUrl:'http://rag.test',insightsApiKey:'test-only'});
  t.mock.method(globalThis,'fetch',async (url,init) => {
    if (url.endsWith('/subjects') || url.endsWith('/levels')) {
      assert.equal(init.headers.Authorization,'Bearer lesson-token');
      return Response.json(url.endsWith('/subjects') ? catalog.subjects : catalog.levels);
    }
    const body=JSON.parse(init.body);
    assert.equal(body.subject,catalog.subjects[0]._id);
    assert.equal(body.classLevel,catalog.levels[0]._id);
    return Response.json({results:[{content:'Plants use light.',source:'Biology Form 1',citation:'Biology Form 1 - Photosynthesis'}]});
  });
  const tools=createStudentTools('lesson-token', {
    textbookScope:{subject:'Biology',level:'Form 1'}, onCitations:items => citations.push(...items),
  });
  const result=await tools.searchTextbooks.execute({query:'photosynthesis',subject:'Biology',level:'Form 5'},{});
  assert.equal(result.found,true);
  assert.deepEqual(citations,[{book:'Biology Form 1',chapter:'Photosynthesis'}]);
});

test('pre-retrieval scope resolver rejects noncanonical catalog IDs', async t => {
  t.mock.method(globalThis,'fetch',async url => Response.json(url.endsWith('/subjects')
    ? [{_id:'legacy-subject',name:'Biology',educationLevel:'lower'}]
    : catalog.levels));
  await assert.rejects(resolveTextbookSearchScope({}, {subject:'Biology',level:'Form 1'}));
});
