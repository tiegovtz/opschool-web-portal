/**
 * Diagnostic script to identify why GET /figures returns empty
 * while GET /figures/shortcode/:shortcode works
 */

const API_BASE_URL = 'https://opschool.tie.go.tz:5001/v1';
const USERNAME = 'eric.john';
const PASSWORD = 'Ejb201313!';

// Known shortcodes that exist in the database
const KNOWN_SHORTCODES = [
  'biology_form1_figure_1_1',
  'biology_form1_figure_1_2',
  'biology_form1_figure_1_3',
  'biology_form1_figure_1_4',
  'biology_form1_figure_1_5',
  'test_figure_1769083179669', // Created in previous test
];

async function login() {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const data = await response.json();
  return data.access_token;
}

async function testEndpoint(token, path, description) {
  const url = `${API_BASE_URL}${path}`;
  console.log(`\n📍 ${description}`);
  console.log(`   GET ${path}`);
  
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    console.log(`   Status: ${response.status}`);
    
    if (Array.isArray(data)) {
      console.log(`   Result: Array with ${data.length} items`);
      if (data.length > 0) {
        console.log(`   Sample keys: ${Object.keys(data[0]).join(', ')}`);
      }
      return { count: data.length, data };
    } else if (typeof data === 'object' && data !== null) {
      // Check for nested arrays
      for (const key of ['data', 'figures', 'results', 'items']) {
        if (Array.isArray(data[key])) {
          console.log(`   Result: ${data[key].length} items in "${key}" property`);
          return { count: data[key].length, data: data[key] };
        }
      }
      console.log(`   Result: Object with keys: ${Object.keys(data).join(', ')}`);
      if (data.message) console.log(`   Message: ${data.message}`);
      if (data.total !== undefined) console.log(`   Total: ${data.total}`);
      return { count: 0, data };
    } else {
      console.log(`   Result: ${String(data).substring(0, 100)}`);
      return { count: 0, data };
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    return { count: 0, error: error.message };
  }
}

async function main() {
  console.log('🔐 Logging in...');
  const token = await login();
  console.log('✅ Logged in\n');
  
  console.log('='.repeat(60));
  console.log('DIAGNOSIS: Why does GET /figures return empty?');
  console.log('='.repeat(60));

  // Test 1: Basic list endpoints
  console.log('\n\n📋 TEST 1: Basic List Endpoints');
  console.log('-'.repeat(40));
  await testEndpoint(token, '/figures', 'Default figures endpoint');
  await testEndpoint(token, '/figures/', 'With trailing slash');
  await testEndpoint(token, '/figure', 'Singular /figure');
  await testEndpoint(token, '/figures/all', 'Explicit /all');
  await testEndpoint(token, '/figures/list', 'Explicit /list');

  // Test 2: With different pagination
  console.log('\n\n📋 TEST 2: Pagination Parameters');
  console.log('-'.repeat(40));
  await testEndpoint(token, '/figures?limit=1000', 'High limit');
  await testEndpoint(token, '/figures?limit=10&offset=0', 'Explicit offset=0');
  await testEndpoint(token, '/figures?page=1&limit=100', 'Page-based pagination');
  await testEndpoint(token, '/figures?skip=0&take=100', 'Skip/take pagination');

  // Test 3: With category filters
  console.log('\n\n📋 TEST 3: Category Filters');
  console.log('-'.repeat(40));
  await testEndpoint(token, '/figures?category=biology', 'Filter by biology');
  await testEndpoint(token, '/figures?category=Biology', 'Filter by Biology (capitalized)');
  await testEndpoint(token, '/figures?subjectName=Biology', 'Filter by subjectName');

  // Test 4: With status/published filters
  console.log('\n\n📋 TEST 4: Status/Published Filters');
  console.log('-'.repeat(40));
  await testEndpoint(token, '/figures?isPublished=true', 'Published true');
  await testEndpoint(token, '/figures?isPublished=false', 'Published false');
  await testEndpoint(token, '/figures?status=active', 'Status active');
  await testEndpoint(token, '/figures?status=draft', 'Status draft');
  await testEndpoint(token, '/figures?deleted=false', 'Not deleted');
  await testEndpoint(token, '/figures?includeDeleted=true', 'Include deleted');

  // Test 5: Different endpoints that might list figures
  console.log('\n\n📋 TEST 5: Alternative Endpoints');
  console.log('-'.repeat(40));
  await testEndpoint(token, '/simulations', 'Simulations endpoint');
  await testEndpoint(token, '/simulations?limit=10', 'Simulations with limit');
  await testEndpoint(token, '/images', 'Images endpoint');
  await testEndpoint(token, '/media', 'Media endpoint');
  await testEndpoint(token, '/assets', 'Assets endpoint');

  // Test 6: Shortcodes endpoint
  console.log('\n\n📋 TEST 6: Shortcodes Endpoint');
  console.log('-'.repeat(40));
  await testEndpoint(token, '/figures/shortcodes', 'List all shortcodes');
  await testEndpoint(token, '/shortcodes', 'Direct shortcodes endpoint');

  // Test 7: Verify individual figures still work
  console.log('\n\n📋 TEST 7: Individual Figure Retrieval (Control Group)');
  console.log('-'.repeat(40));
  for (const shortcode of KNOWN_SHORTCODES.slice(0, 3)) {
    await testEndpoint(token, `/figures/shortcode/${shortcode}`, `Shortcode: ${shortcode}`);
  }

  // Test 8: Search endpoints
  console.log('\n\n📋 TEST 8: Search Endpoints');
  console.log('-'.repeat(40));
  await testEndpoint(token, '/figures/search?q=biology', 'Search for biology');
  await testEndpoint(token, '/figures?search=biology', 'Query param search');
  await testEndpoint(token, '/figures?q=biology', 'Query param q');

  // Test 9: Check if form/subject filtering works
  console.log('\n\n📋 TEST 9: Form/Subject Filters');
  console.log('-'.repeat(40));
  await testEndpoint(token, '/figures?form=Form%201', 'Form 1');
  await testEndpoint(token, '/figures?form=1', 'Form as number');
  await testEndpoint(token, '/figures?subject=biology', 'Subject biology');
  await testEndpoint(token, '/figures?subject=Biology', 'Subject Biology');

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`
Observations:
- GET /figures/shortcode/:shortcode WORKS (returns figure data)
- GET /figures returns EMPTY array

Likely causes based on results:
1. If /simulations has data but /figures doesn't:
   → Figures are stored in 'simulations' collection, not 'figures'
   
2. If filters like ?category=biology work:
   → Default query has a restrictive filter
   
3. If ?includeDeleted=true works:
   → Figures are soft-deleted by default
   
4. If nothing works:
   → The list endpoint queries a different table/collection
   → OR there's a permission issue for list operations

Recommendation: Check the backend code for:
- FiguresController.findAll() vs FiguresController.findByShortcode()
- What Mongoose/SQL query each method uses
- Any middleware that modifies the query
`);
}

main().catch(console.error);

