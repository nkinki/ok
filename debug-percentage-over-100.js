// Debug script to identify why percentages exceed 100%
// The issue is likely inconsistent question counting between endpoints

const testPercentageCalculation = async () => {
  console.log('🔍 Testing percentage calculation consistency...');
  
  // Test with a real session code that shows over 100%
  const sessionCode = 'FT1FED'; // From the user's example
  
  try {
    // 1. Test the participants endpoint (what teacher sees)
    console.log('\n📊 Testing participants endpoint...');
    const participantsResponse = await fetch(`http://localhost:3002/api/simple-api/sessions/${sessionCode}/participants`);
    
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      console.log('✅ Participants endpoint data:');
      console.log('- Total questions (exercises field):', participantsData.totalQuestions);
      console.log('- Max possible score:', participantsData.maxPossibleScore);
      console.log('- Exercise count:', participantsData.exerciseCount);
      
      // Show first few participants with over 100%
      const over100 = participantsData.participants.filter(p => p.percentage > 100);
      if (over100.length > 0) {
        console.log('\n❌ Participants with over 100%:');
        over100.slice(0, 3).forEach(p => {
          console.log(`- ${p.student_name}: ${p.total_score} points = ${p.percentage}%`);
          console.log(`  Formula: (${p.total_score} / ${participantsData.maxPossibleScore}) * 100 = ${Math.round((p.total_score / participantsData.maxPossibleScore) * 100)}%`);
        });
      }
    } else {
      console.error('❌ Participants endpoint failed:', participantsResponse.status);
    }
    
    // 2. Test the debug percentage endpoint (uses full_session_json)
    console.log('\n📊 Testing debug percentage endpoint...');
    const debugResponse = await fetch('http://localhost:3002/api/simple-api/debug/percentage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: sessionCode,
        studentId: 'test',
        score: 50 // Example score
      })
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug endpoint data:');
      console.log('- Data source:', debugData.dataSource);
      console.log('- Total questions (full_session_json):', debugData.calculation.totalQuestions);
      console.log('- Max possible score:', debugData.calculation.maxPossibleScore);
      console.log('- Exercise analysis:', debugData.exerciseAnalysis.length, 'exercises');
      
      // Show exercise breakdown
      debugData.exerciseAnalysis.forEach((ex, i) => {
        console.log(`  Exercise ${i + 1}: ${ex.type} - ${ex.questionCount} questions`);
      });
    } else {
      console.error('❌ Debug endpoint failed:', debugResponse.status);
    }
    
    // 3. Get session data directly to compare
    console.log('\n📊 Testing session status endpoint...');
    const statusResponse = await fetch(`http://localhost:3002/api/simple-api/sessions/${sessionCode}/status`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Session status data:');
      console.log('- Exercise count:', statusData.session.exerciseCount);
      console.log('- Total questions (if available):', statusData.session.totalQuestions);
      
      // Count questions manually from exercises
      let manualQuestionCount = 0;
      if (statusData.session.exercises) {
        statusData.session.exercises.forEach((exercise, i) => {
          let exerciseQuestions = 0;
          if (exercise.type === 'QUIZ') {
            exerciseQuestions = exercise.content?.questions?.length || 0;
          } else if (exercise.type === 'MATCHING') {
            exerciseQuestions = exercise.content?.pairs?.length || 0;
          } else if (exercise.type === 'CATEGORIZATION') {
            exerciseQuestions = exercise.content?.items?.length || 0;
          }
          console.log(`  Exercise ${i + 1}: ${exercise.type} - ${exerciseQuestions} questions`);
          manualQuestionCount += exerciseQuestions;
        });
        console.log('- Manual question count:', manualQuestionCount);
      }
    } else {
      console.error('❌ Status endpoint failed:', statusResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testPercentageCalculation();