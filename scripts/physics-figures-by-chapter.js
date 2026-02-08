/**
 * Fetch all physics figures and report how many figures are in each chapter.
 *
 * Usage:
 *   AUTH_TOKEN=your_jwt node scripts/physics-figures-by-chapter.js
 */

const BASE_URL = process.env.FIGURES_API_BASE_URL || 'https://opschool.tie.go.tz:5001/v1';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

const url = `${BASE_URL}/figures?category=physics`;

async function main() {
  const headers = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;

  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    console.error('Request failed:', response.status, response.statusText);
    const text = await response.text();
    if (text) console.error(text);
    process.exit(1);
  }

  const data = await response.json();
  const figures = Array.isArray(data) ? data : data?.data ?? data?.figures ?? data?.results ?? [];
  const total = figures.length;

  // Group by chapterName (or chapter)
  const byChapter = new Map();
  let noChapter = 0;

  for (const fig of figures) {
    const chapter = fig.chapterName ?? fig.chapter ?? '(no chapter)';
    if (!fig.chapterName && !fig.chapter) noChapter++;
    byChapter.set(chapter, (byChapter.get(chapter) ?? 0) + 1);
  }

  // Sort chapters by name for consistent output
  const chapters = [...byChapter.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  console.log('Physics figures by chapter');
  console.log('='.repeat(72));
  console.log(`Total physics figures: ${total}\n`);

  for (const [chapterName, count] of chapters) {
    console.log(`  ${count.toString().padStart(4)}  ${chapterName}`);
  }

  console.log('='.repeat(72));
  console.log(`  ${total.toString().padStart(4)}  TOTAL`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
