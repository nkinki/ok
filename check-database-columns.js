// Check if percentage and performance_category columns exist in session_participants table

const API_BASE = 'https://nyirad.vercel.app';

async function checkDatabaseColumns() {
  console.log('🔍 Checking database columns...');
  
  try {
    // Test connection first
    const testResponse = await fetch(`${API_BASE}/api/simple-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test_connection' })
    });
    
    if (!testResponse.ok) {
      console.error('❌ API connection failed');
      return;
    }
    
    const testData = await testResponse.json();
    console.log('✅ API connection successful');
    console.log('📊 Supabase connection:', testData.supabase?.canConnect ? 'SUCCESS' : 'FAILED');
    
    if (!testData.supabase?.canConnect) {
      console.error('❌ Supabase connection failed:', testData.supabase?.error);
      return;
    }
    
    // Try to create a test session to check if columns exist
    const testSessionCode = 'COL_TEST_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    console.log('📝 Creating test session to check columns:', testSessionCode);
    
    const sessionData = {
      code: testSessionCode,
      exercises: [],
      subject: 'test',
      className: 'Test Class',
      maxScore: 10,
      fullExercises: [{
        id: 'test1',
        fileName: 'test1.jpg',
        imageUrl: '',
        title: 'Test Exercise',
        instruction: 'Test',
        type: 'QUIZ',
        content: { questions: [{ question: 'Test?', options: ['A', 'B'], correctAnswer: 0 }] }
      }]
    };
    
    const createResponse = await fetch(`${API_BASE}/api/simple-api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('❌ Session creation failed:', error);
      
      // Check if it's a column-related error
      if (error.details && (error.details.includes('percentage') || error.details.includes('performance_category'))) {
        console.error('🚨 COLUMN MISSING ERROR DETECTED!');
        console.error('📋 You need to add the missing columns to session_participants table');
        console.error('💡 Run this SQL in Supabase:');
        console.error('');
        console.error('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS percentage INTEGER DEFAULT 0;');
        console.error('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS performance_category TEXT DEFAULT \'poor\';');
        console.error('');
      }
      
      return;
    }
    
    console.log('✅ Session created successfully');
    
    // Try to join and submit result to test column updates
    const joinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: testSessionCode,
        name: 'Column Test Student',
        className: 'Test Class'
      })
    });
    
    if (!joinResponse.ok) {
      const error = await joinResponse.json();
      console.error('❌ Join failed:', error);
      return;
    }
    
    const joinData = await joinResponse.json();
    const studentId = joinData.student?.id;
    
    console.log('✅ Student joined successfully');
    
    // Submit test result to check column updates
    const resultPayload = {
      studentId: studentId,
      results: [{
        exerciseIndex: 0,
        isCorrect: true,
        score: 10,
        timeSpent: 5,
        answer: { selectedAnswer: 0 },
        completedAt: new Date().toISOString()
      }],
      summary: {
        studentName: 'Column Test Student',
        studentClass: 'Test Class',
        sessionCode: testSessionCode,
        totalExercises: 1,
        completedExercises: 1,
        totalScore: 10,
        completedAt: new Date().toISOString()
      }
    };
    
    console.log('📊 Submitting test result to check column updates...');
    
    const resultResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultPayload)
    });
    
    console.log('📡 Result response status:', resultResponse.status);
    
    if (!resultResponse.ok) {
      const error = await resultResponse.json();
      console.error('❌ Result submission failed:', error);
      
      // Check for column-related errors
      if (error.details && (error.details.includes('percentage') || error.details.includes('performance_category'))) {
        console.error('🚨 COLUMN UPDATE ERROR DETECTED!');
        console.error('📋 The percentage/performance_category columns are missing');
        console.error('💡 Run this SQL in Supabase:');
        console.error('');
        console.error('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS percentage INTEGER DEFAULT 0;');
        console.error('ALTER TABLE session_participants ADD COLUMN IF NOT EXISTS performance_category TEXT DEFAULT \'poor\';');
        console.error('');
      }
      
      return;
    }
    
    console.log('✅ Result submitted successfully - columns exist and work!');
    
    // Check participants to see if percentage was calculated
    const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}/participants`);
    
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      const participant = participantsData.participants?.[0];
      
      if (participant) {
        console.log('📊 Participant data:');
        console.log('- Total score:', participant.total_score);
        console.log('- Percentage:', participant.percentage);
        console.log('- Performance category:', participant.performance_category);
        
        if (participant.percentage > 0) {
          console.log('✅ Percentage calculation is working!');
        } else {
          console.log('❌ Percentage is still 0 - calculation may be broken');
        }
      }
    }
    
    // Cleanup
    console.log('🧹 Cleaning up test session...');
    
    const deleteResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test session cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
checkDatabaseColumns();