// Debug the specific gtrrr session issue

const API_BASE = 'https://nyirad.vercel.app';

async function debugGtrrrSession() {
  console.log('🔍 Debugging gtrrr session issue');
  console.log('==================================\n');
  
  try {
    // Find the session with gtrrr
    console.log('📋 Looking for sessions with gtrrr...');
    const sessionsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/list`);
    
    if (!sessionsResponse.ok) {
      console.log('❌ Failed to get sessions list');
      return;
    }
    
    const sessionsData = await sessionsResponse.json();
    console.log('✅ Found', sessionsData.sessions?.length || 0, 'sessions');
    
    // Look for sessions with participants
    let gtrrrSession = null;
    
    for (const session of sessionsData.sessions || []) {
      console.log(`\n🔍 Checking session ${session.code}...`);
      
      const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${session.code}/participants`);
      
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        const gtrrrParticipant = participantsData.participants?.find(p => 
          p.student_name?.toLowerCase().includes('gtrrr') || 
          p.student_name?.toLowerCase().includes('gtr')
        );
        
        if (gtrrrParticipant) {
          console.log('✅ Found gtrrr in session:', session.code);
          gtrrrSession = session;
          
          console.log('\n👤 gtrrr Details:');
          console.log('- Name:', gtrrrParticipant.student_name);
          console.log('- Class:', gtrrrParticipant.student_class);
          console.log('- Total Score:', gtrrrParticipant.total_score);
          console.log('- Percentage:', gtrrrParticipant.percentage + '%');
          console.log('- Performance Category:', gtrrrParticipant.performance_category);
          console.log('- Completed Exercises:', gtrrrParticipant.completed_exercises);
          console.log('- Joined At:', gtrrrParticipant.joined_at);
          console.log('- Last Seen:', gtrrrParticipant.last_seen);
          console.log('- Is Online:', gtrrrParticipant.is_online);
          console.log('- Results Count:', gtrrrParticipant.results?.length || 0);
          
          if (gtrrrParticipant.results && gtrrrParticipant.results.length > 0) {
            console.log('\n📊 Individual Results:');
            gtrrrParticipant.results.forEach((result, index) => {
              console.log(`${index + 1}. Exercise ${result.exerciseIndex || 'unknown'}: ${result.score || 0} points, ${result.isCorrect ? 'Correct' : 'Incorrect'}`);
            });
          } else {
            console.log('\n❌ No individual results found in database');
          }
          
          break;
        }
      }
    }
    
    if (!gtrrrSession) {
      console.log('\n❌ Could not find gtrrr in any session');
      
      // Let's check all participants in all sessions
      console.log('\n🔍 All participants in all sessions:');
      for (const session of sessionsData.sessions?.slice(0, 5) || []) {
        const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${session.code}/participants`);
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          console.log(`\nSession ${session.code}:`);
          participantsData.participants?.forEach((p, index) => {
            console.log(`  ${index + 1}. ${p.student_name} (${p.student_class}) - ${p.total_score} points`);
          });
        }
      }
      return;
    }
    
    // Deep dive into the session
    console.log(`\n🔬 Deep analysis of session ${gtrrrSession.code}:`);
    
    // Check session status
    const statusResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${gtrrrSession.code}/status`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Session Status:');
      console.log('- Exercise Count:', statusData.session.exerciseCount);
      console.log('- Total Questions:', statusData.session.totalQuestions);
      console.log('- Max Possible Score:', statusData.session.totalQuestions * 10);
      console.log('- Is Active:', statusData.session.isActive);
      console.log('- Participant Count:', statusData.session.participantCount);
    }
    
    // Check if we can simulate a result submission for gtrrr
    console.log('\n🧪 Testing result submission for gtrrr...');
    
    // First, let's see if gtrrr can join the session again (to get student ID)
    const testJoinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: gtrrrSession.code,
        name: 'gtrrr test',
        className: '7.b'
      })
    });
    
    if (testJoinResponse.ok) {
      const testJoinData = await testJoinResponse.json();
      console.log('✅ Test join successful, student ID:', testJoinData.student.id);
      
      // Try to submit a test result
      const testResultResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${gtrrrSession.code}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: testJoinData.student.id,
          results: [{
            exerciseIndex: 0,
            isCorrect: true,
            score: 10,
            timeSpent: 5,
            answer: { correctAnswers: 1, totalQuestions: 1 },
            completedAt: new Date().toISOString()
          }],
          summary: {
            studentName: 'gtrrr test',
            studentClass: '7.b',
            sessionCode: gtrrrSession.code,
            totalExercises: 1,
            completedExercises: 1,
            totalScore: 10,
            completedAt: new Date().toISOString()
          }
        })
      });
      
      if (testResultResponse.ok) {
        const testResultData = await testResultResponse.json();
        console.log('✅ Test result submission successful');
        console.log('📊 Debug info:', testResultData.debug);
      } else {
        const testResultError = await testResultResponse.json().catch(() => ({}));
        console.log('❌ Test result submission failed:', testResultError.error || 'Unknown error');
        console.log('📊 Response status:', testResultResponse.status);
      }
    } else {
      const testJoinError = await testJoinResponse.json().catch(() => ({}));
      console.log('❌ Test join failed:', testJoinError.error || 'Unknown error');
    }
    
    // Check what the session list API returns for this session
    console.log('\n📋 Session in list API:');
    const sessionInList = sessionsData.sessions?.find(s => s.code === gtrrrSession.code);
    if (sessionInList) {
      console.log('- Code:', sessionInList.code);
      console.log('- Participant Count:', sessionInList.participantCount);
      console.log('- Average Percentage:', sessionInList.averagePercentage);
      console.log('- Is Active:', sessionInList.isActive);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugGtrrrSession();