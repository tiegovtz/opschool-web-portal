/**
 * Test script to:
 * 1. List figures from the API
 * 2. Add a new test figure (POST /figures)
 * 3. Retrieve it by shortcode
 */

const API_BASE_URL = 'https://opschool.tie.go.tz:5001/v1';
const USERNAME = 'eric.john';
const PASSWORD = 'Ejb201313!';

async function login() {
  console.log('\n🔐 Logging in...');
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const token = data.access_token || data.accessToken || data.token;
  
  if (!token) {
    console.log('Login response:', JSON.stringify(data, null, 2));
    throw new Error('No token in login response');
  }

  console.log('✅ Login successful');
  return token;
}

async function listFigures(token) {
  console.log('\n📋 Listing all figures...');
  const response = await fetch(`${API_BASE_URL}/figures?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  console.log(`Response status: ${response.status}`);
  
  if (!response.ok) {
    const text = await response.text();
    console.log('Error response:', text);
    return [];
  }

  const data = await response.json();
  
  // Handle different response formats
  let figures = [];
  if (Array.isArray(data)) {
    figures = data;
  } else if (data.data && Array.isArray(data.data)) {
    figures = data.data;
  } else if (data.figures && Array.isArray(data.figures)) {
    figures = data.figures;
  } else if (data.results && Array.isArray(data.results)) {
    figures = data.results;
  }

  console.log(`Found ${figures.length} figures`);
  if (figures.length > 0) {
    console.log('First figure:', JSON.stringify(figures[0], null, 2));
  }
  
  return figures;
}

async function createFigure(token) {
  console.log('\n➕ Creating a new test figure via POST /figures...');
  
  const testFigure = {
    shortcode: 'test_figure_' + Date.now(),
    subjectName: 'Biology',
    form: 'Form 1',
    chapterName: 'Test Chapter',
    topicName: 'Test Topic',
    figureNumber: 'Figure 99.1',
    pageNumber: '999',
    category: 'biology',
    description: 'This is a test figure created via API',
    caption: 'Test Figure Caption',
    images: [
      {
        url: 'https://example.com/test-image.png',
        alt: 'Test image alt text'
      }
    ]
  };

  console.log('Creating figure with data:', JSON.stringify(testFigure, null, 2));

  // Correct endpoint: POST /figures (not /figures/create)
  const response = await fetch(`${API_BASE_URL}/figures`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(testFigure),
  });

  console.log(`Response status: ${response.status}`);
  
  const text = await response.text();
  console.log('Response body:', text || '(empty)');

  if (!response.ok) {
    console.log('❌ Failed to create figure');
    return null;
  }

  try {
    const data = JSON.parse(text);
    console.log('✅ Figure created:', JSON.stringify(data, null, 2));
    return testFigure.shortcode;
  } catch (e) {
    console.log('✅ Figure created (response parsed, shortcode:', testFigure.shortcode, ')');
    return testFigure.shortcode;
  }
}

async function getFigureByShortcode(token, shortcode) {
  console.log(`\n🔍 Retrieving figure by shortcode: ${shortcode}`);
  
  const response = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  console.log(`Response status: ${response.status}`);
  
  if (!response.ok) {
    const text = await response.text();
    console.log('Error response:', text);
    return null;
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    console.log('⚠️ Empty response body');
    return null;
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    console.log('⚠️ Empty response body');
    return null;
  }

  try {
    const data = JSON.parse(text);
    console.log('✅ Figure retrieved:', JSON.stringify(data, null, 2));
    return data;
  } catch (e) {
    console.log('Response text:', text);
    return null;
  }
}

async function main() {
  try {
    // 1. Login
    const token = await login();

    // 2. List existing figures
    const existingFigures = await listFigures(token);
    
    // 3. Create a new test figure
    const newShortcode = await createFigure(token);
    
    if (newShortcode) {
      // 4. Wait a moment for the database to update
      console.log('\n⏳ Waiting 2 seconds for database sync...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 5. Retrieve the newly created figure
      await getFigureByShortcode(token, newShortcode);
      
      // 6. List figures again to see if count increased
      console.log('\n📋 Listing figures again after creation...');
      const updatedFigures = await listFigures(token);
      console.log(`\nFigure count: Before=${existingFigures.length}, After=${updatedFigures.length}`);
    }

    // Also test retrieving an existing figure
    console.log('\n--- Testing existing figure retrieval ---');
    await getFigureByShortcode(token, 'biology_form1_figure_1_1');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
