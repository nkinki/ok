// Debug the current issue - no participants showing up

const API_BASE = 'https://nyirad.vercel.app';

async function debugCurrentIssue() {
  console.log('🔍 Debugging current issue: No participants showing up');
  console.log('=======================================================\n');
  
  try {
    // Check if there are any active sessions
    console.log('📋 Step 1: Check active sessions');
    const sessionsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/list`);
    
    if (sessionsResponse.ok) {
      const sessionsData = await sessionsResponse.json();
      console.log('✅ Sessions found:', sessionsData.sessions?.length || 0);
      
      if (sessionsData.sessions && sessionsData.sessions.length > 0) {
        console.log('\n📊 Active Sessions:');
        sessionsData.sessions.slice(0, 5).forEach((session, index) => {
          console.log(`${index + 1}. Code: ${session.code}, Active: ${session.isActive}, Participants: ${session.participantCount}`);
        });
        
        // Test with the first active session
        const activeSession = sessionsData.sessions.find(s => s.isActive);
        if (activeSession) {
          console.log(`\n🎯 Testing with active session: ${activeSession.code}`);
          await testSessionFlow(activeSession.code);
        } else {
          console.log('\n⚠️ No active sessions found. Creating test session...');
          await createAndTestSession();
        }
      } else {
        console.log('\n⚠️ No sessions found. Creating test session...');
        await createAndTestSession();
      }
    } else {
      console.log('❌ Failed to get sessions list');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

async function createAndTestSession() {
  console.log('\n🏗️ Creating test session...');
  
  const sessionCode = 'DEBUG_' + Math.random().toString(36).substr(2, 5).toUpperCase();
  
  const createResponse = await fetch(`${API_BASE}/api/simple-api/sessions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: sessionCode,
      subject: 'info',
      className: 'Debug Test',
      exercises: [
        {
          type: 'QUIZ',
          title: 'Debug Quiz',
          content: {
            questions: [
              { question: 'Test Q1', options: ['A', 'B'], correctAnswer: 0 },
              { question: 'Test Q2', options: ['A', 'B'], correctAnswer: 1 }
            ]
          }
        }
      ]
    })
  });
  
  if (createResponse.ok) {
    console.log('✅ Test session created:', sessionCode);
    await testSessionFlow(sessionCode);
  } else {
    const error = await createResponse.json().catch(() => ({}));
    console.log('❌ Session creation failed:', error.error || 'Unknown error');
  }
}

async function testSessionFlow(sessionCode) {
  console.log(`\n👤 Testing session flow with: ${sessionCode}`);
  
  // Step 1: Check session exists
  console.log('🔍 Step 1: Check session exists');
  const checkResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/check`);
  
  if (!checkResponse.ok) {
    console.log('❌ Session check failed');
    return;
  }
  
  console.log('✅ Session exists and is active');
  
  // Step 2: Try to join session
  console.log('\n🚪 Step 2: Join session');
  const joinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionCode: sessionCode,
      name: 'Debug Test Student',
      className: '8.a'
    })
  });
  
  if (!joinResponse.ok) {
    const joinError = await joinResponse.json().catch(() => ({}));
    console.log('❌ Join failed:', joinError.error || 'Unknown error');
    console.log('📊 Response status:', joinResponse.status);
    return;
  }
  
  const joinData = await joinResponse.json();
  const studentId = joinData.student?.id;
  console.log('✅ Student joined successfully');
  console.log('🆔 Student ID:', studentId);
  
  // Step 3: Submit a result
  console.log('\n📊 Step 3: Submit result');
  const resultResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: studentId,
      results: [{
        exerciseIndex: 0,
        isCorrect: true,
        score: 10,
        timeSpent: 5,
        answer: { correctAnswers: 1, totalQuestions: 2 },
        completedAt: new Date().toISOString()
      }],
      summary: {
        studentName: 'Debug Test Student',
        studentClass: '8.a',
        sessionCode: sessionCode,
        totalExercises: 1,
        completedExercises: 1,
        totalScore: 10,
        completedAt: new Date().toISOString()
      }
    })
  });
  
  if (!resultResponse.ok) {
    const resultError = await resultResponse.json().catch(() => ({}));
    console.log('❌ Result submission failed:', resultError.error || 'Unknown error');
    console.log('📊 Response status:', resultResponse.status);
    return;
  }
  
  console.log('✅ Result submitted successfully');
  
  // Step 4: Check participants
  console.log('\n👥 Step 4: Check participants');
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB update
  
  const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/participants`);
  
  if (participantsResponse.ok) {
    const participantsData = await participantsResponse.json();
    console.log('✅ Participants retrieved');
    console.log('📊 Participant count:', participantsData.participants?.length || 0);
    
    if (participantsData.participants && participantsData.participants.length > 0) {
      console.log('\n👤 Participant Details:');
      participantsData.participants.forEach((p, index) => {
        console.log(`${index + 1}. Name: ${p.student_name}`);
        console.log(`   Class: ${p.student_class}`);
        console.log(`   Score: ${p.total_score} points`);
        console.log(`   Percentage: ${p.percentage}%`);
        console.log(`   Category: ${p.performance_category}`);
        console.log(`   Joined: ${p.joined_at}`);
        console.log('');
      });
      
      console.log('🎉 SUCCESS: Participants are showing up correctly!');
    } else {
      console.log('❌ PROBLEM: No participants found in database');
    }
  } else {
    console.log('❌ Failed to get participants');
  }
  
  // Step 5: Check session list again
  console.log('\n📋 Step 5: Check updated session list');
  const updatedSessionsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/list`);
  
  if (updatedSessionsResponse.ok) {
    const updatedSessionsData = await updatedSessionsResponse.json();
    const ourSession = updatedSessionsData.sessions?.find(s => s.code === sessionCode);
    
    if (ourSession) {
      console.log('✅ Session found in list');
      console.log('📊 Participant count in list:', ourSession.participantCount);
      console.log('📊 Average percentage:', ourSession.averagePercentage + '%');
      
      if (ourSession.participantCount > 0) {
        console.log('🎉 SUCCESS: Session shows participants in the list!');
      } else {
        console.log('❌ PROBLEM: Session list shows 0 participants');
      }
    } else {
      console.log('❌ Session not found in updated list');
    }
  }
}

// Run the debug
debugCurrentIssue();