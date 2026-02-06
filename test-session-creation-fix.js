// Test: Verify sessions are now saved to Supabase (no more mock data)

const API_BASE = 'https://nyirad.vercel.app';

async function testSessionCreationFix() {
  console.log('🧪 Testing Session Creation Fix...\n');
  
  // Generate test session code
  const sessionCode = 'TEST_' + Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log('📝 Test session code:', sessionCode);
  
  // Step 1: Create a test session via API
  console.log('\n📤 Step 1: Creating session via API...');
  
  const createPayload = {
    code: sessionCode,
    exercises: [
      {
        id: 'test_ex_1',
        title: 'Test Exercise 1',
        type: 'QUIZ'
      },
      {
        id: 'test_ex_2',
        title: 'Test Exercise 2',
        type: 'MATCHING'
      }
    ],
    fullExercises: [
      {
        id: 'test_ex_1',
        fileName: 'test1.jpg',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        title: 'Test Exercise 1',
        instruction: 'This is a test exercise',
        type: 'QUIZ',
        content: {
          questions: [
            {
              question: 'Test question?',
              options: ['A', 'B', 'C', 'D'],
              correct: 0
            }
          ]
        }
      },
      {
        id: 'test_ex_2',
        fileName: 'test2.jpg',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        title: 'Test Exercise 2',
        instruction: 'This is another test exercise',
        type: 'MATCHING',
        content: {
          pairs: [
            { left: 'A', right: '1' },
            { left: 'B', right: '2' }
          ]
        }
      }
    ],
    subject: 'info',
    className: '8.a',
    maxScore: 20
  };
  
  try {
    const createResponse = await fetch(`${API_BASE}/api/simple-api/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });
    
    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('❌ Session creation failed:', errorData);
      return;
    }
    
    const createData = await createResponse.json();
    console.log('✅ Session created successfully!');
    console.log('📊 Session data:', {
      code: createData.session.code,
      exerciseCount: createData.session.exerciseCount,
      subject: createData.session.subject,
      className: createData.session.className
    });
    
  } catch (error) {
    console.error('❌ Error creating session:', error.message);
    return;
  }
  
  // Step 2: Verify session exists in Supabase
  console.log('\n🔍 Step 2: Checking if session exists in Supabase...');
  
  try {
    const checkResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/check`);
    
    if (!checkResponse.ok) {
      console.error('❌ Session check failed');
      return;
    }
    
    const checkData = await checkResponse.json();
    
    if (checkData.exists) {
      console.log('✅ Session found in Supabase!');
      console.log('📊 Session info:', {
        code: checkData.session.code,
        exerciseCount: checkData.session.exerciseCount,
        isActive: checkData.session.isActive
      });
    } else {
      console.error('❌ Session NOT found in Supabase!');
      return;
    }
    
  } catch (error) {
    console.error('❌ Error checking session:', error.message);
    return;
  }
  
  // Step 3: Download session JSON (student perspective)
  console.log('\n📥 Step 3: Downloading session JSON (student perspective)...');
  
  try {
    const downloadResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/download-drive`);
    
    if (!downloadResponse.ok) {
      console.error('❌ Session download failed');
      return;
    }
    
    const sessionData = await downloadResponse.json();
    
    // Check if it's mock data or real data
    const isMockData = sessionData.exercises.some(ex => 
      ex.id === 'drive_only_ex1' || ex.id === 'drive_only_ex2'
    );
    
    if (isMockData) {
      console.error('❌ MOCK DATA DETECTED! Fix did not work!');
      console.error('📊 Exercise IDs:', sessionData.exercises.map(ex => ex.id));
      return;
    }
    
    console.log('✅ REAL DATA LOADED! No mock data!');
    console.log('📊 Exercise IDs:', sessionData.exercises.map(ex => ex.id));
    console.log('📊 Exercise count:', sessionData.exercises.length);
    console.log('📊 Has images:', sessionData.exercises.every(ex => ex.imageUrl && ex.imageUrl.length > 100));
    
  } catch (error) {
    console.error('❌ Error downloading session:', error.message);
    return;
  }
  
  // Step 4: Test student join
  console.log('\n👨‍🎓 Step 4: Testing student join...');
  
  try {
    const joinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionCode: sessionCode,
        name: 'Test Student',
        className: '8.a'
      })
    });
    
    if (!joinResponse.ok) {
      const errorData = await joinResponse.json();
      console.error('❌ Student join failed:', errorData);
      return;
    }
    
    const joinData = await joinResponse.json();
    console.log('✅ Student joined successfully!');
    console.log('📊 Student info:', {
      id: joinData.student.id,
      name: joinData.student.studentName,
      sessionCode: joinData.student.sessionCode
    });
    
  } catch (error) {
    console.error('❌ Error joining session:', error.message);
    return;
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL TESTS PASSED!');
  console.log('='.repeat(60));
  console.log('✅ Session created in Supabase');
  console.log('✅ Session found in database');
  console.log('✅ Real data loaded (no mock data)');
  console.log('✅ Student can join session');
  console.log('\n🚀 Fix is working correctly!');
  console.log('📝 Test session code:', sessionCode);
  console.log('\n💡 You can now test with the UI:');
  console.log('   1. Teacher creates a session');
  console.log('   2. Student enters session code');
  console.log('   3. Student should see REAL exercises (not mock data)');
}

// Run the test
testSessionCreationFix().catch(error => {
  console.error('❌ Test failed with error:', error);
});
