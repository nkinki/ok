// Test API endpoints to check for 500 errors
const testEndpoints = async () => {
  const baseUrl = 'https://nyirad.vercel.app';
  
  console.log('🧪 Testing API endpoints...');
  
  // Test health check
  try {
    console.log('\n1. Testing health check...');
    const response = await fetch(`${baseUrl}/api/simple-api`);
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed:', data.message);
    } else {
      console.log('❌ Health check failed');
      const text = await response.text();
      console.log('Error:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }
  
  // Test session stats
  try {
    console.log('\n2. Testing session stats...');
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/stats?subject=info`);
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Session stats passed:', data.overview);
    } else {
      console.log('❌ Session stats failed');
      const text = await response.text();
      console.log('Error:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Session stats error:', error.message);
  }
  
  // Test session list
  try {
    console.log('\n3. Testing session list...');
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/list?subject=info`);
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Session list passed:', data.total, 'sessions found');
    } else {
      console.log('❌ Session list failed');
      const text = await response.text();
      console.log('Error:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Session list error:', error.message);
  }
  
  // Test session creation
  try {
    console.log('\n4. Testing session creation...');
    const testSession = {
      code: 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      exercises: [
        {
          id: 'test-1',
          type: 'QUIZ',
          title: 'Test Exercise',
          content: {
            questions: [
              {
                question: 'Test question?',
                options: ['A', 'B', 'C'],
                correctAnswer: 0
              }
            ]
          }
        }
      ],
      subject: 'info',
      className: '8.a',
      maxScore: 10
    };
    
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testSession)
    });
    
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Session creation passed:', data.session.code);
    } else {
      console.log('❌ Session creation failed');
      const text = await response.text();
      console.log('Error:', text.substring(0, 500));
    }
  } catch (error) {
    console.log('❌ Session creation error:', error.message);
  }
  
  console.log('\n🏁 API endpoint testing completed');
};

// Run the test
testEndpoints();