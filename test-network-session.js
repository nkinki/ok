// Test script for network session functionality
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000'; // Change to your server URL

async function testNetworkSession() {
  console.log('🧪 Testing Network Session Functionality...\n');

  try {
    // 1. Test API health
    console.log('1. Testing API health...');
    const healthResponse = await fetch(`${API_BASE}/api/simple-api`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData);

    // 2. Create a test session
    console.log('\n2. Creating test session...');
    const testSession = {
      code: 'TEST123',
      exercises: [
        {
          id: 'test-exercise-1',
          imageUrl: 'https://example.com/test.jpg',
          data: {
            title: 'Test Exercise',
            instruction: 'This is a test exercise',
            type: 'quiz',
            content: {
              question: 'What is 2+2?',
              options: ['3', '4', '5', '6'],
              correctAnswer: 1
            }
          },
          fileName: 'test.jpg'
        }
      ]
    };

    const createResponse = await fetch(`${API_BASE}/api/simple-api/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testSession)
    });

    if (!createResponse.ok) {
      throw new Error(`Session creation failed: ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    console.log('✅ Session created:', createData);

    // 3. Check session exists
    console.log('\n3. Checking session exists...');
    const checkResponse = await fetch(`${API_BASE}/api/simple-api/sessions/TEST123/check`);
    const checkData = await checkResponse.json();
    console.log('✅ Session check:', checkData);

    // 4. Get session exercises
    console.log('\n4. Getting session exercises...');
    const exercisesResponse = await fetch(`${API_BASE}/api/simple-api/sessions/TEST123/exercises`);
    
    if (!exercisesResponse.ok) {
      throw new Error(`Exercises fetch failed: ${exercisesResponse.status}`);
    }

    const exercisesData = await exercisesResponse.json();
    console.log('✅ Session exercises:', exercisesData);

    // 5. Stop session
    console.log('\n5. Stopping session...');
    const stopResponse = await fetch(`${API_BASE}/api/simple-api/sessions/TEST123/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!stopResponse.ok) {
      throw new Error(`Session stop failed: ${stopResponse.status}`);
    }

    const stopData = await stopResponse.json();
    console.log('✅ Session stopped:', stopData);

    // 6. Verify session is stopped
    console.log('\n6. Verifying session is stopped...');
    const verifyResponse = await fetch(`${API_BASE}/api/simple-api/sessions/TEST123/check`);
    const verifyData = await verifyResponse.json();
    console.log('✅ Session verification:', verifyData);

    console.log('\n🎉 All tests passed! Network session functionality is working.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testNetworkSession();