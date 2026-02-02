/**
 * Test script for /v1/figures/shortcode/{shortcode} endpoint
 * 
 * Usage:
 *   node scripts/test-shortcode-endpoint.js eric.john 'Ejb201313!'
 */

const OPSCHOOL_BASE = 'https://opschool.tie.go.tz:5001/v1';
const USERNAME = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

if (!USERNAME || !PASSWORD) {
  console.error('Usage: node scripts/test-shortcode-endpoint.js <username> <password>');
  process.exit(1);
}

async function login() {
  try {
    const response = await fetch(`${OPSCHOOL_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[Login] ❌ Failed: ${data.message}`);
      return null;
    }

    const token = data.access_token || data.accessToken || data.token;
    if (token) {
      console.log(`[Login] ✅ Success!`);
      return token;
    }
    return null;
  } catch (error) {
    console.error(`[Login] ❌ Error:`, error.message);
    return null;
  }
}

async function testEndpoint(token, url, description) {
  try {
    console.log(`\n${description}`);
    console.log(`  GET ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Check if response is empty
    const contentLength = response.headers.get('content-length');
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`  ❌ Status: ${response.status}`);
      if (text) {
        try {
          const data = JSON.parse(text);
          console.log(`  Response:`, JSON.stringify(data, null, 2));
        } catch {
          console.log(`  Response (text):`, text);
        }
      } else {
        console.log(`  Response: Empty`);
      }
      return null;
    }

    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  Content-Length: ${contentLength || 'not specified'}`);
    
    if (!text || text.trim().length === 0) {
      console.log(`  ⚠️ Empty response body`);
      return null;
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.log(`  ⚠️ Response is not JSON:`, text.substring(0, 200));
      return text;
    }
    
    if (Array.isArray(data)) {
      console.log(`  Response: Array with ${data.length} items`);
      if (data.length > 0) {
        console.log(`  First item keys:`, Object.keys(data[0]));
        console.log(`  Full first item:`, JSON.stringify(data[0], null, 2));
      }
    } else if (typeof data === 'object') {
      console.log(`  Response keys:`, Object.keys(data));
      console.log(`  Full response:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`  Response:`, data);
    }
    
    return data;
  } catch (error) {
    console.log(`  ❌ Error:`, error.message);
    return null;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('Shortcode Endpoint Test');
  console.log('='.repeat(70));
  console.log(`Base URL: ${OPSCHOOL_BASE}`);
  
  const token = await login();
  if (!token) {
    process.exit(1);
  }
  
  // Test various shortcode patterns
  const testShortcodes = [
    'biology_form1_figure_1_1',
    'biology_form1_figure_1_2',
    'physics_figure_1_1',
  ];
  
  const endpoints = [
    {
      url: `${OPSCHOOL_BASE}/figures/shortcode/${testShortcodes[0]}`,
      desc: `📋 Test 1: /v1/figures/shortcode/${testShortcodes[0]}`
    },
    {
      url: `${OPSCHOOL_BASE}/figures/shortcode/${testShortcodes[1]}`,
      desc: `📋 Test 2: /v1/figures/shortcode/${testShortcodes[1]}`
    },
    {
      url: `${OPSCHOOL_BASE}/figures/shortcode/${testShortcodes[2]}`,
      desc: `📋 Test 3: /v1/figures/shortcode/${testShortcodes[2]}`
    },
    {
      url: `${OPSCHOOL_BASE}/figures/shortcodes/${testShortcodes[0]}`,
      desc: `📋 Test 4: /v1/figures/shortcodes/${testShortcodes[0]} (plural)`
    },
    {
      url: `${OPSCHOOL_BASE}/figures`,
      desc: '📋 Test 5: /v1/figures (baseline)'
    },
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(token, endpoint.url, endpoint.desc);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ All tests completed!');
  console.log('='.repeat(70));
}

main().catch(console.error);

