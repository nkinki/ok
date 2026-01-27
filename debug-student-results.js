// Debug script to test student results submission with the current session

const API_BASE = 'https://nyirad.vercel.app';

async function debugStudentResults() {
  console.log('🔍 Debugging student results for session HYM7L0...');
  
  try {
    // 1. Check if session exists and is active
    console.log('📊 Checking session status...');
    
    const statusResponse = await fetch(`${API_BASE}/api/simple-api/sessions/HYM7L0/status`);
    
    if (!statusResponse.ok) {
      console.error('❌ Session status check failed:', statusResponse.status);
      return;
    }
    
    const statusData = await statusResponse.json();
    console.log('📊 Session status:', statusData);
    
    // 2. Try to join as a test student
    console.log('👨‍🎓 Attempting to join session as test student...');
    
    const joinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: 'HYM7L0',
        name: 'Debug Student',
        className: '8.a'
      })
    });
    
    if (!joinResponse.ok) {
      const joinError = await joinResponse.json();
      console.error('❌ Join failed:', joinError);
      return;
    }
    
    const joinData = await joinResponse.json();
    console.log('✅ Joined successfully:', joinData);
    
    const studentId = joinData.student?.id;
    console.log('🆔 Student ID:', studentId);
    
    // Check if student ID is valid
    if (!studentId || studentId.startsWith('student_') || studentId.startsWith('offline-')) {
      console.error('❌ Invalid student ID detected:', studentId);
      return;
    }
    
    console.log('✅ Student ID is valid (database ID)');
    
    // 3. Submit a test result
    console.log('📊 Submitting test result...');
    
    const resultPayload = {
      studentId: studentId,
      results: [{
        exerciseIndex: 0,
        isCorrect: true,
        score: 10,
        timeSpent: 8,
        answer: {
          totalQuestions: 1,
          correctAnswers: 1,
          questions: [{
            question: "Test question",
            selectedAnswer: 0,
            correctAnswer: 0,
            isCorrect: true
          }]
        },
        completedAt: new Date().toISOString()
      }],
      summary: {
        studentName: 'Debug Student',
        studentClass: '8.a',
        sessionCode: 'HYM7L0',
        totalExercises: 4,
        completedExercises: 1,
        totalScore: 10,
        completedAt: new Date().toISOString()
      }
    };
    
    console.log('📤 Payload:', JSON.stringify(resultPayload, null, 2));
    
    const resultResponse = await fetch(`${API_BASE}/api/simple-api/sessions/HYM7L0/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultPayload)
    });
    
    console.log('📡 Result response status:', resultResponse.status);
    
    if (!resultResponse.ok) {
      const resultError = await resultResponse.json();
      console.error('❌ Result submission failed:', resultError);
      
      // Try to get more details about the error
      if (resultError.details) {
        console.error('🔍 Error details:', resultError.details);
      }
      
      return;
    }
    
    const resultData = await resultResponse.json();
    console.log('✅ Result submitted successfully:', resultData);
    
    // 4. Check session status again to see if participant was updated
    console.log('📊 Checking session status after result submission...');
    
    const statusResponse2 = await fetch(`${API_BASE}/api/simple-api/sessions/HYM7L0/status`);
    
    if (statusResponse2.ok) {
      const statusData2 = await statusResponse2.json();
      console.log('📊 Updated session status:', statusData2);
      console.log('📊 Participant count:', statusData2.session?.participantCount || 0);
    }
    
    // 5. Try to get session participants directly (if endpoint exists)
    console.log('👥 Checking participants...');
    
    // This might not exist, but let's try
    const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/HYM7L0/participants`);
    
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      console.log('👥 Participants:', participantsData);
    } else {
      console.log('ℹ️ Participants endpoint not available or failed');
    }
    
    console.log('\n🎯 DEBUG SUMMARY:');
    console.log('- Session exists:', statusData.exists);
    console.log('- Join successful:', !!joinData.success);
    console.log('- Student ID valid:', !!(studentId && !studentId.startsWith('student_')));
    console.log('- Result submission:', resultResponse.ok ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  }
}

// Run the debug
debugStudentResults();