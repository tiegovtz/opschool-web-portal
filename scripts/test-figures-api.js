/**
 * Script to test the /v1/figures API endpoint
 * 
 * Usage:
 *   node scripts/test-figures-api.js
 * 
 * Or with custom credentials:
 *   EMAIL=your@email.com PASSWORD=yourpassword node scripts/test-figures-api.js
 */

const BASE_URL = process.env.VITE_API_BASE_URL || 'https://apitie.ekima.africa/v1';
const USERNAME = process.env.USERNAME || process.env.EMAIL || '';
const PASSWORD = process.env.PASSWORD || '';

/**
 * Login to get authentication token
 */
async function login(username, password) {
  try {
    console.log(`[Login] Attempting to login with username: ${username}`);
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Login] ❌ Failed: ${data.message || 'Unknown error'}`);
      console.error(`[Login] Status: ${response.status}`);
      return null;
    }

    // Try different possible token field names (check underscore version first)
    const token = data.access_token || data.accessToken || data.token || data.data?.access_token || data.data?.accessToken || data.data?.token;
    
    if (token) {
      console.log(`[Login] ✅ Success! Token obtained (length: ${token.length})`);
      return token;
    } else {
      console.error(`[Login] ❌ No token found in response:`, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error(`[Login] ❌ Error:`, error.message);
    return null;
  }
}

/**
 * Test the /v1/figures endpoint
 */
async function testFiguresEndpoint(token, options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.subject) params.append('subject', options.subject);
    if (options.category) params.append('category', options.category);

    const url = `${BASE_URL}/figures${params.toString() ? `?${params.toString()}` : ''}`;
    console.log(`\n[Figures API] Testing endpoint: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Figures API] ❌ Failed: ${data.message || data.error || 'Unknown error'}`);
      console.error(`[Figures API] Status: ${response.status}`);
      console.error(`[Figures API] Response:`, JSON.stringify(data, null, 2));
      return;
    }

    console.log(`[Figures API] ✅ Success!`);
    console.log(`[Figures API] Status: ${response.status}`);
    
    // Handle different possible response structures
    const figures = data.data || data.figures || data.results || [];
    const total = data.total || figures.length;
    const limit = data.limit;
    const offset = data.offset;

    console.log(`\n[Figures API] Response Summary:`);
    console.log(`  Total: ${total}`);
    if (limit !== undefined) console.log(`  Limit: ${limit}`);
    if (offset !== undefined) console.log(`  Offset: ${offset}`);
    console.log(`  Figures returned: ${figures.length}`);

    if (figures.length > 0) {
      console.log(`\n[Figures API] First figure sample:`);
      console.log(JSON.stringify(figures[0], null, 2));
      
      if (figures.length > 1) {
        console.log(`\n[Figures API] Second figure sample:`);
        console.log(JSON.stringify(figures[1], null, 2));
      }
    } else {
      console.log(`\n[Figures API] ⚠️ No figures returned`);
    }

    // Show structure of first figure if available
    if (figures.length > 0) {
      const firstFigure = figures[0];
      console.log(`\n[Figures API] Figure structure keys:`, Object.keys(firstFigure));
    }

  } catch (error) {
    console.error(`[Figures API] ❌ Error:`, error.message);
    console.error(error.stack);
  }
}

/**
 * Test with different query parameters
 */
async function runTests(token) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing /v1/figures endpoint with different parameters`);
  console.log(`${'='.repeat(60)}\n`);

  // Test 1: Basic request (no params)
  console.log(`\n📋 Test 1: Basic request (no parameters)`);
  await testFiguresEndpoint(token);

  // Test 2: With limit
  console.log(`\n📋 Test 2: With limit=5`);
  await testFiguresEndpoint(token, { limit: 5 });

  // Test 3: With limit and offset
  console.log(`\n📋 Test 3: With limit=3, offset=0`);
  await testFiguresEndpoint(token, { limit: 3, offset: 0 });

  // Test 4: With subject filter (if supported)
  console.log(`\n📋 Test 4: With subject=biology`);
  await testFiguresEndpoint(token, { subject: 'biology', limit: 5 });

  // Test 5: With category filter (if supported)
  console.log(`\n📋 Test 5: With category=diagram`);
  await testFiguresEndpoint(token, { category: 'diagram', limit: 5 });
}

/**
 * Main function
 */
async function main() {
  console.log(`${'='.repeat(60)}`);
  console.log(`Figures API Test Script`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Username: ${USERNAME || '(not provided)'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Check if credentials are provided
  if (!USERNAME || !PASSWORD) {
    console.error('❌ Username and password are required!');
    console.error('\nUsage:');
    console.error('  USERNAME=eric.john PASSWORD=yourpassword node scripts/test-figures-api.js');
    console.error('  (or use EMAIL= instead of USERNAME=)');
    console.error('\nOr set them in a .env file:');
    console.error('  USERNAME=eric.john');
    console.error('  PASSWORD=yourpassword');
    process.exit(1);
  }

  // Step 1: Login
  const token = await login(USERNAME, PASSWORD);
  
  if (!token) {
    console.error('\n❌ Failed to obtain authentication token. Cannot proceed.');
    process.exit(1);
  }

  // Step 2: Test figures endpoint
  await runTests(token);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ All tests completed!`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

