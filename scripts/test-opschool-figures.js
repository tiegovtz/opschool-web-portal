/**
 * Test script for opschool.tie.go.tz:5001 figures endpoints
 * 
 * Usage:
 *   node scripts/test-opschool-figures.js eric.john 'Ejb201313!'
 */

const OPSCHOOL_BASE = 'https://opschool.tie.go.tz:5001/v1';
const API_BASE = 'https://apitie.ekima.africa/v1';
const USERNAME = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

if (!USERNAME || !PASSWORD) {
  console.error('Usage: node scripts/test-opschool-figures.js <username> <password>');
  process.exit(1);
}

async function login() {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
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

    const data = await response.json();
    
    if (!response.ok) {
      console.log(`  ❌ Status: ${response.status}`);
      console.log(`  Response:`, JSON.stringify(data, null, 2));
      return null;
    }

    console.log(`  ✅ Status: ${response.status}`);
    
    if (Array.isArray(data)) {
      console.log(`  Response: Array with ${data.length} items`);
      if (data.length > 0) {
        console.log(`  First item keys:`, Object.keys(data[0]));
        console.log(`  Sample (first 500 chars):`, JSON.stringify(data[0], null, 2).substring(0, 500));
      } else {
        console.log(`  ⚠️ Empty array`);
      }
    } else if (typeof data === 'object') {
      console.log(`  Response keys:`, Object.keys(data));
      const items = data.data || data.figures || data.results || data.shortcodes || data;
      if (Array.isArray(items)) {
        console.log(`  Items count: ${items.length}`);
        if (items.length > 0) {
          console.log(`  First item:`, JSON.stringify(items[0], null, 2).substring(0, 500));
        }
      } else if (typeof items === 'object' && !Array.isArray(items)) {
        const keys = Object.keys(items);
        console.log(`  Shortcodes count: ${keys.length}`);
        if (keys.length > 0) {
          const firstKey = keys[0];
          console.log(`  First shortcode (${firstKey}):`, JSON.stringify(items[firstKey], null, 2).substring(0, 500));
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
  console.log('OPSchool Figures API Test');
  console.log('='.repeat(70));
  console.log(`Testing: ${OPSCHOOL_BASE}`);
  
  const token = await login();
  if (!token) {
    process.exit(1);
  }
  
  const endpoints = [
    {
      url: `${OPSCHOOL_BASE}/figures`,
      desc: '📋 Test 1: /v1/figures (base endpoint)'
    },
    {
      url: `${OPSCHOOL_BASE}/figures?limit=10`,
      desc: '📋 Test 2: /v1/figures?limit=10'
    },
    {
      url: `${OPSCHOOL_BASE}/figures/shortcodes`,
      desc: '📋 Test 3: /v1/figures/shortcodes'
    },
    {
      url: `${OPSCHOOL_BASE}/shortcodes`,
      desc: '📋 Test 4: /v1/shortcodes'
    },
    {
      url: `${OPSCHOOL_BASE}/figures?shortcode=biology_form1_figure_1_1`,
      desc: '📋 Test 5: /v1/figures?shortcode=biology_form1_figure_1_1'
    },
    {
      url: `${OPSCHOOL_BASE}/figures/shortcodes/biology_form1_figure_1_1`,
      desc: '📋 Test 6: /v1/figures/shortcodes/:shortcode'
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

