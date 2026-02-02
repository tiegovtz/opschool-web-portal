/**
 * Test script for shortcodes-related endpoints
 * 
 * Usage:
 *   node scripts/test-shortcodes-endpoint.js eric.john 'Ejb201313!'
 */

const BASE_URL = 'https://apitie.ekima.africa/v1';
const USERNAME = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

if (!USERNAME || !PASSWORD) {
  console.error('Usage: node scripts/test-shortcodes-endpoint.js <username> <password>');
  process.exit(1);
}

async function login() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
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

async function testEndpoint(token, method, url, description) {
  try {
    console.log(`\n${description}`);
    console.log(`  ${method} ${url}`);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log(`  ❌ Status: ${response.status}`);
      console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 200));
      return null;
    }

    console.log(`  ✅ Status: ${response.status}`);
    
    // Handle different response formats
    if (Array.isArray(data)) {
      console.log(`  Response: Array with ${data.length} items`);
      if (data.length > 0) {
        console.log(`  First item keys:`, Object.keys(data[0]));
        console.log(`  Sample:`, JSON.stringify(data[0], null, 2).substring(0, 300));
      }
    } else if (typeof data === 'object') {
      console.log(`  Response keys:`, Object.keys(data));
      if (data.data || data.figures || data.results || data.shortcodes) {
        const items = data.data || data.figures || data.results || data.shortcodes || [];
        console.log(`  Items count: ${Array.isArray(items) ? items.length : Object.keys(items).length}`);
        if (Array.isArray(items) && items.length > 0) {
          console.log(`  First item:`, JSON.stringify(items[0], null, 2).substring(0, 300));
        } else if (!Array.isArray(items) && Object.keys(items).length > 0) {
          const firstKey = Object.keys(items)[0];
          console.log(`  First shortcode (${firstKey}):`, JSON.stringify(items[firstKey], null, 2).substring(0, 300));
        }
      } else {
        console.log(`  Full response:`, JSON.stringify(data, null, 2).substring(0, 500));
      }
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
  console.log('Shortcodes Endpoint Test');
  console.log('='.repeat(70));
  
  const token = await login();
  if (!token) {
    process.exit(1);
  }
  
  // Test various endpoint variations
  const endpoints = [
    {
      method: 'GET',
      url: `${BASE_URL}/figures/shortcodes`,
      desc: '📋 Test 1: /v1/figures/shortcodes'
    },
    {
      method: 'GET',
      url: `${BASE_URL}/shortcodes`,
      desc: '📋 Test 2: /v1/shortcodes'
    },
    {
      method: 'GET',
      url: `${BASE_URL}/figures?shortcode=biology_form1_figure_1_1`,
      desc: '📋 Test 3: /v1/figures?shortcode=biology_form1_figure_1_1'
    },
    {
      method: 'GET',
      url: `${BASE_URL}/figures?limit=5`,
      desc: '📋 Test 4: /v1/figures?limit=5 (baseline)'
    },
    {
      method: 'GET',
      url: `${BASE_URL}/figures/shortcodes/biology_form1_figure_1_1`,
      desc: '📋 Test 5: /v1/figures/shortcodes/:shortcode'
    },
    {
      method: 'GET',
      url: `${BASE_URL}/shortcodes/biology_form1_figure_1_1`,
      desc: '📋 Test 6: /v1/shortcodes/:shortcode'
    },
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(token, endpoint.method, endpoint.url, endpoint.desc);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ All tests completed!');
  console.log('='.repeat(70));
}

main().catch(console.error);

