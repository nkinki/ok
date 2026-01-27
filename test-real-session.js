// Test with the real HYM7L0 session to see if percentage calculation works

const API_BASE = 'https://nyirad.vercel.app';

async function testRealSession() {
  console.log('🔍 Testing with real session HYM7L0...');
  
  try {
    // Join the real session
    const joinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: 'HYM7L0',
        name: 'Percentage Test Student',
        className: '8.a'
      })
    });
    
    if (!joinResponse.ok) {
      const error = await joinResponse.json();
      console.error('❌ Join failed:', error);
      return;
    }
    
    const joinData = await joinResponse.json();
    const studentId = joinData.student?.id;
    
    console.log('✅ Joined real session successfully');
    console.log('🆔 Student ID:', studentId);
    
    // Submit a test result with 10 points (1 correct answer out of 4 total questions)
    // Expected percentage: (10 / 40) * 100 = 25%
    const resultPayload = {
      studentId: studentId,
      results: [{
        exerciseIndex: 0,
        isCorrect: true,
        score: 10,
        timeSpent: 8,
        answer: {
          totalQuestions: 3,
          correctAnswers: 1,
          questions: [{
            question: "A kod 1. számjegye:",
            selectedAnswer: 0,
            correctAnswer: 0,
            isCorrect: true
          }]
        },
        completedAt: new Date().toISOString()
      }],
      summary: {
        studentName: 'Percentage Test Student',
        studentClass: '8.a',
        sessionCode: 'HYM7L0',
        totalExercises: 2,
        completedExercises: 1,
        totalScore: 10,
        completedAt: new Date().toISOString()
      }
    };
    
    console.log('📊 Submitting result with 10 points...');
    console.log('📊 Expected percentage: (10 / 40) * 100 = 25%');
    
    console.log('📊 Submitting test result to:', `${API_BASE}/api/simple-api/sessions/HYM7L0/results`);
    
    const resultResponse = await fetch(`${API_BASE}/api/simple-api/sessions/HYM7L0/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultPayload)
    });
    
    console.log('📡 Result response status:', resultResponse.status);
    
    if (!resultResponse.ok) {
      const error = await resultResponse.json();
      console.error('❌ Result submission failed:', error);
      return;
    }
    
    console.log('✅ Result submitted successfully');
    
    const resultData = await resultResponse.json();
    console.log('📊 Full API response:', JSON.stringify(resultData, null, 2));
    
    if (resultData.debug) {
      console.log('\n🔍 Debug Information from API:');
      console.log('- Step:', resultData.debug.step);
      console.log('- Total questions:', resultData.debug.totalQuestions);
      console.log('- Max possible score:', resultData.debug.maxPossibleScore);
      console.log('- New total score:', resultData.debug.newTotalScore);
      console.log('- Calculated percentage:', resultData.debug.calculatedPercentage);
      console.log('- Performance category:', resultData.debug.performanceCategory);
      console.log('- Data source:', resultData.debug.dataSource);
      
      if (resultData.debug.totalQuestions === 0) {
        console.log('❌ PROBLEM: No questions found in session data!');
      } else {
        console.log('✅ Questions found, percentage should be:', resultData.debug.calculatedPercentage + '%');
      }
    } else {
      console.log('❌ No debug information in API response');
    }
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check participants to see the calculated percentage
    const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/HYM7L0/participants`);
    
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      
      // Find our test student
      const testStudent = participantsData.participants?.find(p => p.student_name === 'Percentage Test Student');
      
      if (testStudent) {
        console.log('\n📊 Test Student Results:');
        console.log('- Name:', testStudent.student_name);
        console.log('- Total score:', testStudent.total_score);
        console.log('- Completed exercises:', testStudent.completed_exercises);
        console.log('- Percentage:', testStudent.percentage);
        console.log('- Performance category:', testStudent.performance_category);
        
        if (testStudent.percentage === 25) {
          console.log('✅ Percentage calculation is CORRECT! (25%)');
        } else if (testStudent.percentage > 0) {
          console.log(`⚠️ Percentage calculated but unexpected value: ${testStudent.percentage}%`);
        } else {
          console.log('❌ Percentage is still 0 - calculation failed');
        }
      } else {
        console.log('❌ Test student not found in participants');
      }
      
      // Show all participants for comparison
      console.log('\n👥 All Participants:');
      participantsData.participants?.forEach((p, index) => {
        console.log(`${index + 1}. ${p.student_name}: ${p.total_score} points, ${p.percentage}%, ${p.performance_category}`);
      });
      
    } else {
      console.log('❌ Failed to get participants');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testRealSession();