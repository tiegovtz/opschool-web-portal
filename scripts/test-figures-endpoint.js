/**
 * Test script to check if the /v1/figures endpoint has data
 */

const BASE_URL = process.env.FIGURES_API_BASE_URL || 'https://opschool.tie.go.tz:5001/v1';
const USERNAME = 'eric.john';
const PASSWORD = 'Ejb201313!';

async function testFiguresEndpoint() {
  try {
    console.log('🔐 Step 1: Logging in...');
    
    // Login to get token
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Login failed:', loginResponse.status, errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token || loginData.accessToken;
    
    if (!token) {
      console.error('❌ No token in login response:', loginData);
      return;
    }

    console.log('✅ Login successful, token received');
    console.log('');

    console.log('📊 Step 2: Fetching figures from API...');
    
    // Fetch figures
    const figuresResponse = await fetch(`${BASE_URL}/figures?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!figuresResponse.ok) {
      const errorText = await figuresResponse.text();
      console.error('❌ API request failed:', figuresResponse.status, errorText);
      return;
    }

    const contentType = figuresResponse.headers.get('content-type');
    const contentLength = figuresResponse.headers.get('content-length');
    
    console.log('Response headers:');
    console.log('  Content-Type:', contentType);
    console.log('  Content-Length:', contentLength);
    console.log('  Status:', figuresResponse.status, figuresResponse.statusText);
    console.log('');

    const text = await figuresResponse.text();
    console.log('Raw response (first 1000 chars):');
    console.log(text.substring(0, 1000));
    console.log('');

    if (!text || text.trim().length === 0) {
      console.log('⚠️  Empty response body');
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
      return;
    }

    console.log('📦 Parsed response structure:');
    console.log('  Type:', typeof data);
    console.log('  Is Array:', Array.isArray(data));
    if (typeof data === 'object' && !Array.isArray(data)) {
      console.log('  Keys:', Object.keys(data).join(', '));
    }
    console.log('');

    // Handle different response formats
    let figures = [];
    
    if (Array.isArray(data)) {
      figures = data;
      console.log('✅ Response is a direct array');
    } else if (data.data && Array.isArray(data.data)) {
      figures = data.data;
      console.log('✅ Response has data property');
    } else if (data.figures && Array.isArray(data.figures)) {
      figures = data.figures;
      console.log('✅ Response has figures property');
    } else if (data.results && Array.isArray(data.results)) {
      figures = data.results;
      console.log('✅ Response has results property');
    } else {
      console.log('⚠️  Unexpected response format');
      console.log('Full response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('');
    console.log(`📊 Found ${figures.length} figures`);
    console.log('');

    if (figures.length === 0) {
      console.log('⚠️  No figures found in API database');
      return;
    }

    console.log('📋 First figure structure:');
    const firstFigure = figures[0];
    console.log('  Keys:', Object.keys(firstFigure).join(', '));
    console.log('');
    console.log('📋 First figure data:');
    console.log(JSON.stringify(firstFigure, null, 2));
    console.log('');

    // Check for image paths
    const figuresWithPaths = figures.filter(fig => {
      return fig.path || 
             (fig.paths && Array.isArray(fig.paths) && fig.paths.length > 0) ||
             (fig.images && Array.isArray(fig.images) && fig.images.length > 0);
    });

    console.log(`📸 Figures with image paths: ${figuresWithPaths.length} / ${figures.length}`);
    
    if (figuresWithPaths.length > 0) {
      console.log('');
      console.log('✅ Sample figure with paths:');
      const sample = figuresWithPaths[0];
      console.log('  Shortcode:', sample.shortcode);
      console.log('  Has path:', !!sample.path);
      console.log('  Has paths array:', !!(sample.paths && Array.isArray(sample.paths)));
      console.log('  Has images array:', !!(sample.images && Array.isArray(sample.images)));
      if (sample.path) {
        console.log('  Path:', sample.path);
      }
      if (sample.paths && Array.isArray(sample.paths)) {
        console.log('  Paths count:', sample.paths.length);
        console.log('  First path:', sample.paths[0]);
      }
      if (sample.images && Array.isArray(sample.images)) {
        console.log('  Images count:', sample.images.length);
        console.log('  First image:', JSON.stringify(sample.images[0], null, 2));
      }
    } else {
      console.log('⚠️  No figures have image paths!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testFiguresEndpoint();

