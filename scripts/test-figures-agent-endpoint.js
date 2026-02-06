/**
 * Thorough test script for the /v1/figures/agent endpoint
 * Base URL: https://opschool.tie.go.tz:5001/v1
 *
 * Usage:
 *   node scripts/test-figures-agent-endpoint.js
 *
 * With auth token (if endpoint requires it):
 *   AUTH_TOKEN=your_jwt node scripts/test-figures-agent-endpoint.js
 *
 * With login (uses apitie for auth, then tests opschool agent):
 *   node scripts/test-figures-agent-endpoint.js <username> <password>
 */

const BASE_URL = process.env.FIGURES_API_BASE_URL || 'https://opschool.tie.go.tz:5001/v1';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const LOGIN_BASE = process.env.VITE_API_BASE_URL || 'https://apitie.ekima.africa/v1';
const USERNAME = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

function buildAgentUrl(params) {
  const searchParams = new URLSearchParams();
  if (params.shortcode != null && params.shortcode !== '') searchParams.set('shortcode', params.shortcode);
  if (params.subjectName != null && params.subjectName !== '') searchParams.set('subjectName', params.subjectName);
  if (params.category != null && params.category !== '') searchParams.set('category', params.category);
  if (params.topicName != null && params.topicName !== '') searchParams.set('topicName', params.topicName);
  if (params.chapterName != null && params.chapterName !== '') searchParams.set('chapterName', params.chapterName);
  const qs = searchParams.toString();
  return `${BASE_URL}/figures/agent${qs ? `?${qs}` : ''}`;
}

function buildFiguresUrl(params) {
  const searchParams = new URLSearchParams();
  if (params.category != null && params.category !== '') searchParams.set('category', params.category);
  if (params.chapter != null && params.chapter !== '') searchParams.set('chapter', params.chapter);
  if (params.topic != null && params.topic !== '') searchParams.set('topic', params.topic);
  const qs = searchParams.toString();
  return `${BASE_URL}/figures${qs ? `?${qs}` : ''}`;
}

async function login() {
  if (!USERNAME || !PASSWORD) return AUTH_TOKEN || null;
  try {
    const response = await fetch(`${LOGIN_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[Login] Failed:', data.message || response.statusText);
      return null;
    }
    const token = data.access_token || data.accessToken || data.token;
    if (token) {
      console.log('[Login] Token obtained\n');
      return token;
    }
    return null;
  } catch (e) {
    console.error('[Login] Error:', e.message);
    return null;
  }
}

async function testRequest(token, url, description) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(url, { method: 'GET', headers });
    const contentType = response.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    const isArray = Array.isArray(body);
    const count = isArray ? body.length : (body?.data?.length ?? body?.figures?.length ?? body?.results?.length ?? '-');
    const status = response.ok ? '✅' : '❌';

    console.log(`${status} ${description}`);
    console.log(`   URL: ${url}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (isArray) {
      console.log(`   Response: array with ${body.length} item(s)`);
      if (body.length > 0) {
        const first = body[0];
        console.log(`   First item keys: ${Object.keys(first).join(', ')}`);
        const sample = JSON.stringify(first).slice(0, 300);
        console.log(`   First item sample: ${sample}${sample.length >= 300 ? '...' : ''}`);
      } else {
        console.log(`   (empty array)`);
      }
    } else if (typeof body === 'object' && body !== null) {
      console.log(`   Response keys: ${Object.keys(body).join(', ')}`);
      const arr = body.data ?? body.figures ?? body.results;
      if (Array.isArray(arr)) console.log(`   Nested array length: ${arr.length}`);
      console.log(`   Body sample: ${JSON.stringify(body).slice(0, 250)}...`);
    } else {
      console.log(`   Body: ${String(body).slice(0, 200)}`);
    }
    console.log('');
    return { ok: response.ok, status: response.status, body };
  } catch (e) {
    console.log(`❌ ${description}`);
    console.log(`   URL: ${url}`);
    console.log(`   Error: ${e.message}\n`);
    return { ok: false, error: e.message };
  }
}

const TEST_CASES = [
  {
    desc: 'Example from docs (all params)',
    params: {
      shortcode: 'figure-1-biology',
      subjectName: 'Biology',
      topicName: 'Introduction to Biology',
      chapterName: 'Living Organisms',
    },
  },
  {
    desc: 'Same example, different shortcode format (biology_form1 style)',
    params: {
      shortcode: 'biology_form1_figure_1_1',
      subjectName: 'Biology',
      topicName: 'Introduction to Biology',
      chapterName: 'Living Organisms',
    },
  },
  {
    desc: 'category only (biology) – /figures/agent?category=biology',
    params: { category: 'biology' },
  },
  {
    desc: 'category only (physics) – /figures/agent?category=physics',
    params: { category: 'physics' },
  },
  {
    desc: 'category only (chemistry) – /figures/agent?category=chemistry',
    params: { category: 'chemistry' },
  },
  {
    desc: 'topicName only',
    params: { topicName: 'Introduction to Biology' },
  },
  {
    desc: 'chapterName only',
    params: { chapterName: 'Living Organisms' },
  },
  {
    desc: 'subjectName + topicName',
    params: { subjectName: 'Biology', topicName: 'Introduction to Biology' },
  },
  {
    desc: 'subjectName + chapterName',
    params: { subjectName: 'Biology', chapterName: 'Living Organisms' },
  },
  {
    desc: 'subjectName + topicName + chapterName (no shortcode)',
    params: {
      subjectName: 'Biology',
      topicName: 'Introduction to Biology',
      chapterName: 'Living Organisms',
    },
  },
  {
    desc: 'Physics + chapter/topic',
    params: {
      subjectName: 'Physics',
      topicName: 'Introduction to Physics',
      chapterName: 'Chapter One',
    },
  },
  {
    desc: 'No params (full list if supported)',
    params: {},
  },
  {
    desc: 'Empty string shortcode',
    params: { shortcode: '', category: 'biology' },
  },
  {
    desc: 'Unknown shortcode',
    params: { shortcode: 'nonexistent-figure-xyz', category: 'biology' },
  },
  {
    desc: 'category=biology + chapterName',
    params: { category: 'biology', chapterName: 'Living Organisms' },
  },
];

const FIGURES_CATEGORY_TESTS = [
  { desc: '/figures?category=biology', params: { category: 'biology' } },
  { desc: '/figures?category=physics', params: { category: 'physics' } },
  { desc: '/figures?category=chemistry', params: { category: 'chemistry' } },
];

// Agent endpoint: get figures for a specific topic (physics). Use exact topicName/chapterName from API.
const AGENT_SPECIFIC_TOPIC_TESTS = [
  { desc: 'specific topic: physics + topicName=Concept of Physics', params: { category: 'physics', topicName: 'Concept of Physics' } },
  { desc: 'specific topic: physics + chapterName=Chapter One: Introduction to Physics', params: { category: 'physics', chapterName: 'Chapter One: Introduction to Physics' } },
  { desc: 'specific topic: physics + topicName + chapterName', params: { category: 'physics', topicName: 'Concept of Physics', chapterName: 'Chapter One: Introduction to Physics' } },
];

async function main() {
  console.log('='.repeat(72));
  console.log('  /figures/agent endpoint – thorough test');
  console.log('='.repeat(72));
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Endpoint: GET ${BASE_URL}/figures/agent?shortcode=...&category=...&topicName=...&chapterName=...`);
  console.log('='.repeat(72));

  const token = AUTH_TOKEN ? AUTH_TOKEN : await login();
  if (!token && (USERNAME || PASSWORD)) {
    console.error('Login failed. Proceeding without auth (may get 401).\n');
  }
  if (token) {
    console.log('Using Authorization: Bearer <token>\n');
  } else {
    console.log('No token set. Using unauthenticated request(s).\n');
  }

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const { desc, params } = TEST_CASES[i];
    const url = buildAgentUrl(params);
    const result = await testRequest(token, url, `Test ${i + 1}/${TEST_CASES.length}: ${desc}`);
    if (result.ok) passed++; else failed++;
  }

  console.log('='.repeat(72));
  console.log('  /figures?category=... (regular endpoint, for comparison)');
  console.log('='.repeat(72));

  for (let i = 0; i < FIGURES_CATEGORY_TESTS.length; i++) {
    const { desc, params } = FIGURES_CATEGORY_TESTS[i];
    const url = buildFiguresUrl(params);
    const result = await testRequest(token, url, `Figures ${i + 1}/${FIGURES_CATEGORY_TESTS.length}: ${desc}`);
    if (result.ok) passed++; else failed++;
  }

  console.log('='.repeat(72));
  console.log('  Agent: get figures for specific topic (physics)');
  console.log('='.repeat(72));

  for (let i = 0; i < AGENT_SPECIFIC_TOPIC_TESTS.length; i++) {
    const { desc, params } = AGENT_SPECIFIC_TOPIC_TESTS[i];
    const url = buildAgentUrl(params);
    const result = await testRequest(token, url, `Specific topic ${i + 1}/${AGENT_SPECIFIC_TOPIC_TESTS.length}: ${desc}`);
    if (result.ok) passed++; else failed++;
  }

  console.log('='.repeat(72));
  console.log(`  Done: ${passed} request(s) OK, ${failed} failed (status/error).`);
  console.log('='.repeat(72));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
