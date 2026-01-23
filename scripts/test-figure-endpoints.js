/**
 * Test different figure endpoint paths to find the correct ones
 */

const API_BASE_URL = 'https://opschool.tie.go.tz:5001/v1';
const USERNAME = 'eric.john';
const PASSWORD = 'Ejb201313!';

async function login() {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const data = await response.json();
  return data.access_token || data.accessToken || data.token;
}

async function testEndpoint(token, method, path, body = null) {
  const url = `${API_BASE_URL}${path}`;
  console.log(`\n${method} ${url}`);
  
  const options = {
    method,
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    console.log(`  Status: ${response.status}`);
    
    if (text) {
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          console.log(`  Response: Array with ${json.length} items`);
          if (json.length > 0) {
            console.log(`  First item keys: ${Object.keys(json[0]).join(', ')}`);
          }
        } else if (typeof json === 'object') {
          console.log(`  Response keys: ${Object.keys(json).join(', ')}`);
          if (json.data && Array.isArray(json.data)) {
            console.log(`  data: Array with ${json.data.length} items`);
          }
          if (json.message) {
            console.log(`  message: ${json.message}`);
          }
        }
      } catch (e) {
        console.log(`  Response: ${text.substring(0, 200)}`);
      }
    } else {
      console.log('  Response: (empty)');
    }
    
    return response.status;
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🔐 Logging in...');
  const token = await login();
  console.log('✅ Logged in');

  const testFigure = {
    shortcode: 'test_api_figure_' + Date.now(),
    subject: 'Biology',
    form: 'Form 1',
    chapter: 'Test Chapter',
    topic: 'Test Topic',
    figure_number: 'Figure 99.1',
    page_number: '999',
    category: 'biology',
    description: 'Test figure',
    caption: 'Test Caption',
    images: [{ url: 'https://example.com/test.png', alt: 'Test' }]
  };

  console.log('\n===== Testing GET endpoints =====');
  
  // Test various GET endpoints
  await testEndpoint(token, 'GET', '/figures');
  await testEndpoint(token, 'GET', '/figures?limit=10');
  await testEndpoint(token, 'GET', '/figures/all');
  await testEndpoint(token, 'GET', '/figures/list');
  await testEndpoint(token, 'GET', '/figure');
  await testEndpoint(token, 'GET', '/figure/all');
  
  console.log('\n===== Testing POST endpoints for creating =====');
  
  // Test various POST endpoints
  await testEndpoint(token, 'POST', '/figures', testFigure);
  await testEndpoint(token, 'POST', '/figures/create', testFigure);
  await testEndpoint(token, 'POST', '/figures/add', testFigure);
  await testEndpoint(token, 'POST', '/figure', testFigure);
  await testEndpoint(token, 'POST', '/figure/create', testFigure);

  console.log('\n===== Testing if figure was created =====');
  await testEndpoint(token, 'GET', `/figures/shortcode/${testFigure.shortcode}`);
  
  console.log('\n===== Testing existing figure =====');
  await testEndpoint(token, 'GET', '/figures/shortcode/biology_form1_figure_1_1');

  console.log('\n===== Testing /simulations for comparison =====');
  await testEndpoint(token, 'GET', '/simulations');
  await testEndpoint(token, 'GET', '/simulations?limit=5');
}

main();

