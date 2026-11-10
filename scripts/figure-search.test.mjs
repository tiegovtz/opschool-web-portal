import assert from 'node:assert/strict';
import test from 'node:test';
import { expandQuery, lexicalScore, searchFigures } from '../server/utils/figureSearch.ts';

const figures = [
  { shortcode: 'figure_6_1_physics', description: 'A simple microscope', alt: 'A simple microscope', topicName: 'Optical instruments', chapterName: 'chapter_6', category: 'physics' },
  { shortcode: 'figure_6_3_physics', description: 'A compound microscope', alt: 'A compound microscope', topicName: 'Optical instruments', chapterName: 'chapter_6', category: 'physics' },
  { shortcode: 'biology_form1_figure_1_1', description: 'Four living organisms illustrating the variety of life', topicName: 'Introduction to biology', chapterName: 'chapter_1', category: 'biology' },
  { shortcode: 'figure_3_2_physics', description: 'A circuit with a battery and bulb', topicName: 'Electricity', chapterName: 'chapter_3', category: 'physics' },
];

test('"hand lens" finds the simple microscope even though no words overlap', async () => {
  const hits = await searchFigures('show me a hand lens', figures);
  assert.equal(hits[0]?.figure.shortcode, 'figure_6_1_physics');
});

test('synonym expansion adds the book wording', () => {
  assert.match(expandQuery('hand lens'), /simple microscope/);
});

test('matches on description even when topic names do not', async () => {
  const hits = await searchFigures('variety of living organisms', figures);
  assert.equal(hits[0]?.figure.shortcode, 'biology_form1_figure_1_1');
});

test('unrelated question returns no figures', async () => {
  const hits = await searchFigures('how do volcanoes erupt', figures);
  assert.equal(hits.length, 0);
});

test('embeddings are used when available and failures fall back to words', async () => {
  const embed = async (texts) =>
    texts.map((t) => {
      const v = new Array(8).fill(0);
      for (const w of t.toLowerCase().split(/\W+/)) v[w.length % 8] += 1;
      return v;
    });
  const withEmbed = await searchFigures('electric circuit', figures, { embed });
  assert.ok(withEmbed.length >= 1);
  const broken = async () => {
    throw new Error('offline');
  };
  const fallback = await searchFigures('electric circuit', figures, { embed: broken });
  assert.equal(fallback[0]?.figure.shortcode, 'figure_3_2_physics');
});

test('lexical score is zero for empty or stop-word-only queries', () => {
  assert.equal(lexicalScore('show me the picture', figures[0]), 0);
});
