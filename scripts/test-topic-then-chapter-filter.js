/**
 * Test: syllabus chapter → figures topic (Option 1).
 * Filter by topic only: use syllabus chapter name to match figures topicName.
 *
 * Usage:
 *   AUTH_TOKEN=your_jwt node scripts/test-topic-then-chapter-filter.js
 */

const BASE_URL = process.env.FIGURES_API_BASE_URL || 'https://opschool.tie.go.tz:5001/v1';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

const url = `${BASE_URL}/figures?category=physics`;

const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Match syllabus chapter name against figures topic.
 * Syllabus chapters map to figures topics (Option 1).
 */
const matchesFiguresTopic = (fig, syllabusChapterName) => {
  if (!syllabusChapterName) return true;
  const q = normalize(syllabusChapterName);
  const figTopic = normalize(fig.topicName ?? fig.topic ?? '');
  return (
    figTopic === q ||
    figTopic.includes(q) ||
    q.includes(figTopic)
  );
};

async function main() {
  const headers = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;

  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    console.error('Request failed:', response.status, response.statusText);
    process.exit(1);
  }

  const data = await response.json();
  const figures = Array.isArray(data) ? data : data?.data ?? data?.figures ?? data?.results ?? [];
  const total = figures.length;

  console.log('Physics figures: topic + chapter structure');
  console.log('='.repeat(72));

  const byTopicChapter = new Map();
  for (const fig of figures) {
    const ch = fig.chapterName ?? fig.chapter ?? '(no chapter)';
    const t = fig.topicName ?? fig.topic ?? '(no topic)';
    const key = `${t} | ${ch}`;
    byTopicChapter.set(key, (byTopicChapter.get(key) ?? 0) + 1);
  }
  const entries = [...byTopicChapter.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [key, count] of entries) {
    console.log(`  ${count.toString().padStart(4)}  ${key}`);
  }

  console.log('\n' + '='.repeat(72));
  console.log('Filter: syllabus chapter → figures topic (topic only)\n');

  const testCases = [
    { syllabusChapter: 'Concept of Physics' },
    { syllabusChapter: 'Relative density of a substance' },
    { syllabusChapter: 'Concept of density' },
    { syllabusChapter: 'Refraction and dispersion of light' },
    { syllabusChapter: 'Magnetism' },
    { syllabusChapter: 'Nature and reflection of light' },
    { syllabusChapter: 'Optical instruments' },
    { syllabusChapter: 'Current electricity' },
    { syllabusChapter: 'Static electricity' },
  ];

  for (const tc of testCases) {
    console.log(`Syllabus chapter: "${tc.syllabusChapter}"`);
    const matches = figures.filter((f) => matchesFiguresTopic(f, tc.syllabusChapter));
    console.log(`  Matches: ${matches.length}`);
    if (matches.length > 0) {
      const samples = matches.slice(0, 3);
      console.log('  Sample shortcodes:', samples.map((f) => f.shortcode).join(', '));
    }
    console.log('');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
