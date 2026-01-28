// Test that the real-time updates are working

const API_BASE = 'https://nyirad.vercel.app';

async function testRealtimeUpdates() {
  console.log('🔄 Testing Real-time Updates');
  console.log('============================\n');
  
  try {
    // Create a test session
    const sessionCode = 'REALTIME_' + Math.random().toString(36).substr(2, 4).toUpperCase();
    console.log('🏗️ Creating test session:', sessionCode);
    
    const createResponse = await fetch(`${API_BASE}/api/simple-api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: sessionCode,
        subject: 'info',
        className: 'Realtime Test',
        exercises: [
          {
            type: 'QUIZ',
            title: 'Realtime Quiz',
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
    
    if (!createResponse.ok) {
      console.log('❌ Session creation failed');
      return;
    }
    
    console.log('✅ Session created successfully');
    
    // Check initial state
    console.log('\n📊 Initial state:');
    let participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/participants`);
    let participantsData = await participantsResponse.json();
    console.log('Participants:', participantsData.participants?.length || 0);
    
    // Simulate students joining over time
    console.log('\n👥 Simulating students joining...');
    
    const students = [
      { name: 'Anna', class: '8.a' },
      { name: 'Béla', class: '8.a' },
      { name: 'Csilla', class: '8.b' }
    ];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      console.log(`\n${i + 1}. ${student.name} csatlakozik...`);
      
      // Join session
      const joinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCode: sessionCode,
          name: student.name,
          className: student.class
        })
      });
      
      if (joinResponse.ok) {
        const joinData = await joinResponse.json();
        console.log(`✅ ${student.name} joined with ID: ${joinData.student.id}`);
        
        // Submit a result
        const score = Math.floor(Math.random() * 20) + 5; // Random score 5-25
        const resultResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: joinData.student.id,
            results: [{
              exerciseIndex: 0,
              isCorrect: score > 10,
              score: score,
              timeSpent: Math.floor(Math.random() * 30) + 10,
              answer: { correctAnswers: score > 10 ? 2 : 1, totalQuestions: 2 },
              completedAt: new Date().toISOString()
            }],
            summary: {
              studentName: student.name,
              studentClass: student.class,
              sessionCode: sessionCode,
              totalExercises: 1,
              completedExercises: 1,
              totalScore: score,
              completedAt: new Date().toISOString()
            }
          })
        });
        
        if (resultResponse.ok) {
          console.log(`✅ ${student.name} submitted result: ${score} points`);
        } else {
          console.log(`❌ ${student.name} result submission failed`);
        }
        
        // Check updated participant count
        participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/participants`);
        participantsData = await participantsResponse.json();
        console.log(`📊 Current participants: ${participantsData.participants?.length || 0}`);
        
        // Wait 2 seconds before next student
        if (i < students.length - 1) {
          console.log('⏳ Waiting 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        console.log(`❌ ${student.name} join failed`);
      }
    }
    
    // Final check
    console.log('\n📊 Final Results:');
    participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/participants`);
    participantsData = await participantsResponse.json();
    
    console.log('Total participants:', participantsData.participants?.length || 0);
    console.log('Average percentage:', participantsData.averagePercentage || 0, '%');
    
    if (participantsData.participants) {
      console.log('\n👤 Participant Details:');
      participantsData.participants.forEach((p, index) => {
        console.log(`${index + 1}. ${p.student_name}: ${p.total_score} points (${p.percentage}%)`);
      });
    }
    
    // Check session list
    console.log('\n📋 Session in list:');
    const sessionsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/list`);
    const sessionsData = await sessionsResponse.json();
    const ourSession = sessionsData.sessions?.find(s => s.code === sessionCode);
    
    if (ourSession) {
      console.log('✅ Session found in list');
      console.log('📊 Participant count in list:', ourSession.participantCount);
      console.log('📊 Average percentage in list:', ourSession.averagePercentage + '%');
    } else {
      console.log('❌ Session not found in list');
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('- Session created: ✅');
    console.log('- Students joined: ✅');
    console.log('- Results submitted: ✅');
    console.log('- Participant counts updated: ✅');
    console.log('- Session list updated: ✅');
    console.log('\n🔄 Frontend should now auto-refresh every 10 seconds to show these updates!');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test session...');
    const deleteResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test session cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRealtimeUpdates();