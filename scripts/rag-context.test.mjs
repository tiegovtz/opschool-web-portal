import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRagContext,
  collectRagCitations,
  truncateAtBoundary,
  DEFAULT_RAG_CONTEXT_MAX_CHARS,
} from '../server/utils/ragContext.ts';

const longParagraphs = (count, label) =>
  Array.from({ length: count }, (_, i) => `${label} paragraph ${i + 1}. ` + 'Cells are the basic unit of life. '.repeat(8)).join('\n\n');

test('a first chunk longer than 5000 characters still yields context', () => {
  const huge = longParagraphs(40, 'Chapter');
  assert.ok(huge.length > 5000);
  const { context, passagesUsed, citations } = buildRagContext([
    { content: huge, parentContent: huge, citation: 'Biology Form 1 - Chapter 2: Cells', source: 'Biology Form 1', score: 0.9, chunkType: 'content' },
  ]);
  assert.ok(context.length > 0, 'context must not be empty');
  assert.ok(context.length <= DEFAULT_RAG_CONTEXT_MAX_CHARS);
  assert.equal(passagesUsed, 1);
  assert.match(context, /Cells are the basic unit of life/);
  assert.deepEqual(citations, [{ book: 'Biology Form 1', chapter: 'Chapter 2: Cells' }]);
});

test('an oversized first chunk does not stop later chunks from being used', () => {
  const huge = longParagraphs(60, 'Huge');
  const { context, passagesUsed } = buildRagContext(
    [
      { content: huge, citation: 'A - Chapter 1: One', source: 'A', score: 0.95, chunkType: 'content' },
      { content: 'Short fact about osmosis.', citation: 'B - Chapter 3: Osmosis', source: 'B', score: 0.5, chunkType: 'content' },
    ],
    { maxChars: 6000 },
  );
  assert.ok(context.length <= 6000);
  assert.equal(passagesUsed, 2);
  assert.match(context, /Short fact about osmosis/);
});

test('prefers the child content when the parent passage is huge', () => {
  const parent = 'P'.repeat(20000);
  const { context } = buildRagContext([
    { content: 'Photosynthesis makes glucose.', parentContent: parent, citation: 'Bio - Chapter 4: Plants', source: 'Bio', score: 0.8, chunkType: 'content' },
  ]);
  assert.match(context, /Photosynthesis makes glucose/);
  assert.ok(!context.includes('PPPP'));
});

test('skips duplicate parent passages and sorts content before exercises', () => {
  const parent = 'Shared parent passage about force.';
  const { context, passagesUsed } = buildRagContext([
    { content: 'Exercise 1', citation: 'Phy - Chapter 2: Force', source: 'Phy', score: 0.99, chunkType: 'exercise' },
    { content: 'child a', parentContent: parent, citation: 'Phy - Chapter 2: Force', source: 'Phy', score: 0.7, chunkType: 'content' },
    { content: 'child b', parentContent: parent, citation: 'Phy - Chapter 2: Force', source: 'Phy', score: 0.6, chunkType: 'content' },
  ]);
  assert.equal(passagesUsed, 2);
  assert.ok(context.indexOf('Shared parent') < context.indexOf('Exercise 1'));
});

test('empty or malformed results give an empty context', () => {
  assert.equal(buildRagContext([]).context, '');
  assert.equal(buildRagContext([{ content: '   ' }, null]).context, '');
});

test('truncateAtBoundary cuts at a paragraph break when possible', () => {
  const text = 'First paragraph is here.\n\nSecond paragraph is a bit longer than the first one.';
  const cut = truncateAtBoundary(text, 40);
  assert.ok(cut.length <= 40);
  assert.ok(cut.endsWith('…'));
});

test('collectRagCitations strips page suffixes and dedupes', () => {
  const citations = collectRagCitations([
    { source: 'Geo F1', citation: 'Geo F1 - Chapter 1, Maps (page 3)' },
    { source: 'Geo F1', citation: 'Geo F1 - Chapter 1, Maps (page 4)' },
  ]);
  assert.deepEqual(citations, [{ book: 'Geo F1', chapter: 'Chapter 1, Maps' }]);
});

test('retrieval query: curriculum questions yes, greetings and math no, follow-ups combined', async () => {
  const { buildRetrievalQuery, isLikelyCurriculumQuestion } = await import('../server/utils/chatRetrieval.ts');
  assert.equal(isLikelyCurriculumQuestion('What is osmosis?'), true);
  assert.equal(isLikelyCurriculumQuestion('Usanisinuru ni nini?'), true);
  assert.equal(isLikelyCurriculumQuestion('hello'), false);
  assert.equal(isLikelyCurriculumQuestion('asante sana'), false);
  assert.equal(isLikelyCurriculumQuestion('plot y = x^2'), false);
  assert.equal(isLikelyCurriculumQuestion('solve 2x + 3 = 7'), false);
  const user = (text) => ({ role: 'user', parts: [{ type: 'text', text }] });
  assert.equal(
    buildRetrievalQuery([user('What is photosynthesis?'), { role: 'assistant', content: '...' }, user('explain more')]),
    'What is photosynthesis? explain more',
  );
  assert.equal(buildRetrievalQuery([user('hi')]), null);
});
