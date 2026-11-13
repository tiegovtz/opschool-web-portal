import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTextbookContext } from '../server/utils/textbookContext.ts';

test('long parent chapters do not discard matching child passages or later results', () => {
  const context = buildTextbookContext([
    { content: 'Plants use sunlight for photosynthesis.', parentContent: 'Chapter introduction. '.repeat(1000), source: 'Biology', score: .9 },
    { content: 'Chlorophyll absorbs light.', source: 'Reference book', score: .8 },
  ]);
  assert.match(context, /Plants use sunlight/);
  assert.match(context, /Chlorophyll absorbs light/);
  assert.doesNotMatch(context, /Chapter introduction/);
});

test('oversized matches share a bounded budget including headers and separators', () => {
  const context = buildTextbookContext(Array.from({length: 5}, (_, i) => ({
    source: `Book ${i}`, content: `${i} ` + 'Introduction. '.repeat(1000) + 'Photosynthesis uses sunlight. ' + 'Further detail. '.repeat(1000),
  })), 'photosynthesis');
  assert.ok(context.length <= 5000);
  for (let i = 0; i < 5; i++) assert.ok(context.includes(`Book ${i}`));
  assert.equal(context.match(/Photosynthesis uses sunlight/g)?.length, 5);
});

test('deduplicates passages while retaining distinct passages from the same chapter', () => {
  const a = {content: 'First passage.', source: 'Book', parentContent: 'Shared chapter'};
  const context = buildTextbookContext([a, a, {...a, content: 'Second passage.'}]);
  assert.equal(context.match(/First passage/g)?.length, 1);
  assert.match(context, /Second passage/);
});

test('supports parent-only legacy results, empty results, and long source labels', () => {
  assert.match(buildTextbookContext([{parentContent: 'Legacy evidence.'}]), /Legacy evidence/);
  assert.equal(buildTextbookContext([{}, {content: ' '}]), '');
  const context = buildTextbookContext([{content: 'Evidence. '.repeat(1000), source: 's'.repeat(6000)}]);
  assert.ok(context.length <= 5000);
  assert.match(context, /Evidence/);
});
