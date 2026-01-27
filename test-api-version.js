// Test if the API has been updated with our debug code

const API_BASE = 'https://nyirad.vercel.app';

async function testApiVersion() {
  console.log('🔍 Testing API version and debug capabilities...');
  
  try {
    // Test 1: Check if health endpoint works
    const healthResponse = await fetch(`${API_BASE}/api/simple-api`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API is responding');
      console.log('📊 Health data:', healthData);
    } else {
      console.error('❌ API health check failed');
      return;
    }
    
    // Test 2: Try to submit a result with invalid data to see if we get our debug info
    console.log('\n🧪 Testing results endpoint with invalid data...');
    
    const invalidResponse = await fetch(`${API_BASE}/api/simple-api/sessions/INVALID/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'invalid-id',
        results: [],
        summary: { totalScore: 0 }
      })
    });
    
    console.log('📡 Invalid request response status:', invalidResponse.status);
    
    const invalidData = await invalidResponse.json();
    console.log('📊 Invalid request response:', JSON.stringify(invalidData, null, 2));
    
    // Check if we get our debug info in error responses
    if (invalidData.debug) {
      console.log('✅ Debug information is available in API responses');
      console.log('🔍 Debug step:', invalidData.debug.step);
    } else {
      console.log('❌ No debug information - API may not be updated');
    }
    
    // Test 3: Check available endpoints
    console.log('\n📋 Available endpoints:');
    if (invalidData.availableEndpoints) {
      invalidData.availableEndpoints.forEach(endpoint => {
        console.log('  -', endpoint);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testApiVersion();