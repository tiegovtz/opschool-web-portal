/**
 * Simple script to test the /v1/figures API endpoint
 * 
 * Usage:
 *   node scripts/test-figures-api-simple.js eric.john 'Ejb201313!'
 */

const BASE_URL = 'https://apitie.ekima.africa/v1';
const USERNAME = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

if (!USERNAME || !PASSWORD) {
  console.error('Usage: node scripts/test-figures-api-simple.js <username> <password>');
  process.exit(1);
}

async function login() {
  try {
    console.log(`[Login] Attempting to login with username: ${USERNAME}`);
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Login] ❌ Failed: ${data.message || 'Unknown error'}`);
      return null;
    }

    // Try different possible token field names
    const token = data.access_token || data.accessToken || data.token || data.data?.access_token || data.data?.accessToken || data.data?.token;
    
    if (token) {
      console.log(`[Login] ✅ Success! Token obtained`);
      return token;
    } else {
      console.error(`[Login] ❌ No token found in response`);
      return null;
    }
  } catch (error) {
    console.error(`[Login] ❌ Error:`, error.message);
    return null;
  }
}

async function testFigures(token) {
  try {
    console.log(`\n[Figures API] Testing: ${BASE_URL}/figures`);
    
    const response = await fetch(`${BASE_URL}/figures`, {
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
      return;
    }

    console.log(`[Figures API] ✅ Success!`);
    console.log(`[Figures API] Status: ${response.status}`);
    
    const figures = data.data || data.figures || data.results || [];
    const total = data.total || figures.length;

    console.log(`\n[Figures API] Response Summary:`);
    console.log(`  Total: ${total}`);
    console.log(`  Figures returned: ${figures.length}`);

    if (figures.length > 0) {
      console.log(`\n[Figures API] First figure:`);
      console.log(JSON.stringify(figures[0], null, 2));
    }

    console.log(`\n[Figures API] Full response structure:`, Object.keys(data));
  } catch (error) {
    console.error(`[Figures API] ❌ Error:`, error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Figures API Test');
  console.log('='.repeat(60));
  
  const token = await login();
  if (!token) {
    process.exit(1);
  }
  
  await testFigures(token);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed!');
  console.log('='.repeat(60));
}

main().catch(console.error);

