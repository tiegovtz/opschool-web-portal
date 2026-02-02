/**
 * Test script to find the correct delete endpoint format
 */

const API_BASE_URL = 'https://opschool.tie.go.tz:5001/v1';
const USERNAME = 'eric.john';
const PASSWORD = 'Ejb201313!';

// Test figure shortcode
const TEST_SHORTCODE = 'test_figure_1769083179669';

async function login() {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const data = await response.json();
  return data.access_token;
}

async function getFigureByShortcode(token, shortcode) {
  console.log(`\n🔍 Getting figure by shortcode: ${shortcode}`);
  const response = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (!response.ok) {
    console.log(`   Status: ${response.status} - Figure not found`);
    return null;
  }
  
  const data = await response.json();
  console.log(`   Found figure with _id: ${data._id}`);
  return data;
}

async function testDeleteEndpoint(token, method, path, description) {
  console.log(`\n📍 ${description}`);
  console.log(`   ${method} ${path}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const text = await response.text();
    console.log(`   Status: ${response.status}`);
    
    if (text) {
      try {
        const json = JSON.parse(text);
        console.log(`   Response:`, JSON.stringify(json, null, 2));
      } catch {
        console.log(`   Response: ${text.substring(0, 200)}`);
      }
    }
    
    return response.status;
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🔐 Logging in...');
  const token = await login();
  console.log('✅ Logged in');

  // First, get the figure to find its _id
  const figure = await getFigureByShortcode(token, TEST_SHORTCODE);
  
  if (!figure) {
    console.log('\n❌ Test figure not found. Trying with biology_form1_figure_1_1...');
    const bioFigure = await getFigureByShortcode(token, 'biology_form1_figure_1_1');
    if (bioFigure) {
      console.log(`\nFound biology figure with _id: ${bioFigure._id}`);
    }
    return;
  }

  const figureId = figure._id;
  
  console.log('\n===== Testing DELETE endpoints =====');
  
  // Try different delete endpoint formats
  await testDeleteEndpoint(token, 'DELETE', `/figures/${figureId}`, 'DELETE by MongoDB _id');
  await testDeleteEndpoint(token, 'DELETE', `/figures/shortcode/${TEST_SHORTCODE}`, 'DELETE by shortcode path');
  await testDeleteEndpoint(token, 'DELETE', `/figures/${TEST_SHORTCODE}`, 'DELETE by shortcode as id');
  await testDeleteEndpoint(token, 'DELETE', `/figure/${figureId}`, 'DELETE singular /figure by _id');
  
  // Check if figure still exists
  console.log('\n===== Checking if figure was deleted =====');
  await getFigureByShortcode(token, TEST_SHORTCODE);
}

main().catch(console.error);

