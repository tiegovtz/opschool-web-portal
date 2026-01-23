/**
 * Detailed script to test the /v1/figures API endpoint with various parameters
 * 
 * Usage:
 *   node scripts/test-figures-api-detailed.js eric.john 'Ejb201313!'
 */

const BASE_URL = 'https://apitie.ekima.africa/v1';
const USERNAME = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

if (!USERNAME || !PASSWORD) {
  console.error('Usage: node scripts/test-figures-api-detailed.js <username> <password>');
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

async function testEndpoint(token, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/figures${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`  ❌ Failed: ${data.message || data.error}`);
      return null;
    }

    const figures = data.data || data.figures || data.results || data || [];
    const total = data.total !== undefined ? data.total : (Array.isArray(data) ? data.length : figures.length);
    
    console.log(`  ✅ Status: ${response.status}, Total: ${total}, Returned: ${figures.length}`);
    
    if (figures.length > 0 && figures.length <= 3) {
      console.log(`  Sample:`, JSON.stringify(figures[0], null, 2).substring(0, 200) + '...');
    }
    
    return { data, figures, total };
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    return null;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('Figures API Detailed Test');
  console.log('='.repeat(70));
  
  const token = await login();
  if (!token) {
    process.exit(1);
  }
  
  console.log('\n📋 Testing different query parameters:\n');
  
  // Test 1: No parameters
  console.log('1. No parameters:');
  await testEndpoint(token);
  
  // Test 2: With limit
  console.log('\n2. With limit=10:');
  await testEndpoint(token, { limit: 10 });
  
  // Test 3: With limit and offset
  console.log('\n3. With limit=5, offset=0:');
  await testEndpoint(token, { limit: 5, offset: 0 });
  
  // Test 4: With subject
  console.log('\n4. With subject=biology:');
  await testEndpoint(token, { subject: 'biology', limit: 10 });
  
  // Test 5: With category
  console.log('\n5. With category=diagram:');
  await testEndpoint(token, { category: 'diagram', limit: 10 });
  
  // Test 6: Check response structure
  console.log('\n6. Full response structure:');
  const result = await testEndpoint(token, { limit: 1 });
  if (result && result.data) {
    console.log('  Response keys:', Object.keys(result.data));
    if (result.figures.length > 0) {
      console.log('  Figure keys:', Object.keys(result.figures[0]));
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ All tests completed!');
  console.log('='.repeat(70));
}

main().catch(console.error);

