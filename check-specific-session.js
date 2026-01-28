// Check the specific session from the screenshot: 2ZPNJY

const API_BASE = 'https://nyirad.vercel.app';

async function checkSpecificSession() {
  const sessionCode = '2ZPNJY';
  console.log(`🔍 Checking specific session: ${sessionCode}`);
  console.log('==========================================\n');
  
  try {
    // Get session details
    console.log('📊 Session Status:');
    const statusResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/status`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Session exists and is active');
      console.log('📊 Exercise count:', statusData.session.exerciseCount);
      console.log('📊 Total questions:', statusData.session.totalQuestions);
      console.log('📊 Participant count:', statusData.session.participantCount);
      console.log('📊 Created at:', statusData.session.createdAt);
      console.log('📊 Expires at:', statusData.session.expiresAt);
    } else {
      console.log('❌ Session status check failed');
      return;
    }
    
    // Get participants
    console.log('\n👥 Participants:');
    const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/participants`);
    
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      console.log('📊 Total participants:', participantsData.participants?.length || 0);
      
      if (participantsData.participants && participantsData.participants.length > 0) {
        console.log('\n👤 Participant Details:');
        participantsData.participants.forEach((p, index) => {
          console.log(`${index + 1}. ${p.student_name} (${p.student_class})`);
          console.log(`   Score: ${p.total_score} points`);
          console.log(`   Percentage: ${p.percentage}%`);
          console.log(`   Category: ${p.performance_category}`);
          console.log(`   Completed exercises: ${p.completed_exercises}`);
          console.log(`   Joined: ${new Date(p.joined_at).toLocaleString('hu-HU')}`);
          console.log(`   Last seen: ${p.last_seen ? new Date(p.last_seen).toLocaleString('hu-HU') : 'Never'}`);
          console.log(`   Online: ${p.is_online ? 'Yes' : 'No'}`);
          console.log('');
        });
        
        // Calculate statistics
        const totalScore = participantsData.participants.reduce((sum, p) => sum + (p.total_score || 0), 0);
        const avgScore = participantsData.participants.length > 0 ? Math.round(totalScore / participantsData.participants.length) : 0;
        const avgPercentage = participantsData.participants.length > 0 
          ? Math.round(participantsData.participants.reduce((sum, p) => sum + (p.percentage || 0), 0) / participantsData.participants.length)
          : 0;
          
        console.log('📊 Statistics:');
        console.log(`   Average score: ${avgScore} points`);
        console.log(`   Average percentage: ${avgPercentage}%`);
        
        // Performance distribution
        const categories = {
          excellent: participantsData.participants.filter(p => p.performance_category === 'excellent').length,
          good: participantsData.participants.filter(p => p.performance_category === 'good').length,
          average: participantsData.participants.filter(p => p.performance_category === 'average').length,
          poor: participantsData.participants.filter(p => p.performance_category === 'poor').length
        };
        
        console.log('📊 Performance distribution:');
        console.log(`   Excellent: ${categories.excellent}`);
        console.log(`   Good: ${categories.good}`);
        console.log(`   Average: ${categories.average}`);
        console.log(`   Poor: ${categories.poor}`);
        
      } else {
        console.log('❌ No participants found');
      }
    } else {
      console.log('❌ Failed to get participants');
    }
    
    // Check if session can be joined
    console.log('\n🚪 Testing session join:');
    const testJoinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: sessionCode,
        name: 'Test Join Student',
        className: 'Test Class'
      })
    });
    
    if (testJoinResponse.ok) {
      console.log('✅ Session can be joined successfully');
      const joinData = await testJoinResponse.json();
      console.log('🆔 New student ID:', joinData.student.id);
    } else {
      const joinError = await testJoinResponse.json().catch(() => ({}));
      console.log('❌ Cannot join session:', joinError.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkSpecificSession();