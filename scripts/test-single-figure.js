/**
 * Test script to check a specific figure by shortcode
 */

const BASE_URL = process.env.FIGURES_API_BASE_URL || 'https://opschool.tie.go.tz:5001/v1';
const USERNAME = 'eric.john';
const PASSWORD = 'Ejb201313!';

async function testSingleFigure() {
  try {
    console.log('🔐 Logging in...');
    
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    const loginData = await loginResponse.json();
    const token = loginData.access_token || loginData.accessToken;
    
    if (!token) {
      console.error('❌ No token');
      return;
    }

    console.log('✅ Login successful\n');

    // Test getting a specific shortcode
    const shortcode = 'biology_form1_figure_1_1';
    console.log(`📊 Testing GET /figures/shortcode/${shortcode}...`);
    
    const response = await fetch(`${BASE_URL}/figures/shortcode/${shortcode}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('\nParsed:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('(Not JSON)');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSingleFigure();

