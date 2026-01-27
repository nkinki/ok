// Test complete student flow: join session, complete exercises, verify results are saved

const API_BASE = 'https://nyirad.vercel.app';

async function testCompleteStudentFlow() {
  console.log('🎯 Testing complete student flow...');
  
  try {
    // Step 1: Join a session
    console.log('\n📝 Step 1: Joining session...');
    const joinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: '8N717X',
        name: 'Complete Flow Test Student',
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
    
    console.log('✅ Joined session successfully');
    console.log('🆔 Student ID:', studentId);
    
    // Step 2: Submit multiple exercise results (simulating student completing exercises)
    console.log('\n📝 Step 2: Completing exercises...');
    
    // Exercise 1: 2 correct answers out of 3 questions = 20 points
    const result1 = await fetch(`${API_BASE}/api/simple-api/sessions/8N717X/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentId,
        results: [{
          exerciseIndex: 0,
          isCorrect: true,
          score: 20, // 2 correct * 10 points each
          timeSpent: 15,
          answer: {
            totalQuestions: 3,
            correctAnswers: 2,
            questions: [
              { question: "Question 1", selectedAnswer: 0, correctAnswer: 0, isCorrect: true },
              { question: "Question 2", selectedAnswer: 1, correctAnswer: 1, isCorrect: true },
              { question: "Question 3", selectedAnswer: 0, correctAnswer: 2, isCorrect: false }
            ]
          },
          completedAt: new Date().toISOString()
        }],
        summary: {
          studentName: 'Complete Flow Test Student',
          studentClass: '8.a',
          sessionCode: '8N717X',
          totalExercises: 2,
          completedExercises: 1,
          totalScore: 20,
          completedAt: new Date().toISOString()
        }
      })
    });
    
    if (result1.ok) {
      const result1Data = await result1.json();
      console.log('✅ Exercise 1 completed - Score: 20 points');
      console.log('📊 Current percentage:', result1Data.debug?.calculatedPercentage + '%');
    } else {
      console.error('❌ Exercise 1 failed');
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Exercise 2: 3 correct answers out of 3 questions = 30 points
    const result2 = await fetch(`${API_BASE}/api/simple-api/sessions/8N717X/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentId,
        results: [{
          exerciseIndex: 1,
          isCorrect: true,
          score: 30, // 3 correct * 10 points each
          timeSpent: 12,
          answer: {
            totalQuestions: 3,
            correctAnswers: 3,
            questions: [
              { question: "Question 1", selectedAnswer: 0, correctAnswer: 0, isCorrect: true },
              { question: "Question 2", selectedAnswer: 1, correctAnswer: 1, isCorrect: true },
              { question: "Question 3", selectedAnswer: 2, correctAnswer: 2, isCorrect: true }
            ]
          },
          completedAt: new Date().toISOString()
        }],
        summary: {
          studentName: 'Complete Flow Test Student',
          studentClass: '8.a',
          sessionCode: '8N717X',
          totalExercises: 2,
          completedExercises: 2,
          totalScore: 30, // Only current exercise score, API will accumulate
          completedAt: new Date().toISOString()
        }
      })
    });
    
    if (result2.ok) {
      const result2Data = await result2.json();
      console.log('✅ Exercise 2 completed - Score: 30 points');
      console.log('📊 Current percentage:', result2Data.debug?.calculatedPercentage + '%');
    } else {
      console.error('❌ Exercise 2 failed');
    }
    
    // Step 3: Check final results
    console.log('\n📝 Step 3: Checking final results...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/8N717X/participants`);
    
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      
      // Find our test student
      const testStudent = participantsData.participants?.find(p => p.student_name === 'Complete Flow Test Student');
      
      if (testStudent) {
        console.log('\n🎯 FINAL RESULTS:');
        console.log('- Student Name:', testStudent.student_name);
        console.log('- Total Score:', testStudent.total_score, 'points');
        console.log('- Completed Exercises:', testStudent.completed_exercises);
        console.log('- Final Percentage:', testStudent.percentage + '%');
        console.log('- Performance Category:', testStudent.performance_category);
        console.log('- Results Count:', testStudent.results?.length || 0);
        
        // Expected: 50 points total (20 + 30), out of 60 possible = 83%
        const expectedScore = 50;
        const expectedPercentage = Math.round((50 / 60) * 100); // 83%
        
        console.log('\n📊 VERIFICATION:');
        console.log('- Expected Score:', expectedScore, 'points');
        console.log('- Actual Score:', testStudent.total_score, 'points');
        console.log('- Expected Percentage:', expectedPercentage + '%');
        console.log('- Actual Percentage:', testStudent.percentage + '%');
        
        if (testStudent.total_score === expectedScore && testStudent.percentage === expectedPercentage) {
          console.log('✅ PERFECT! Results are correctly saved and calculated!');
        } else {
          console.log('⚠️ Results don\'t match expectations');
        }
        
        if (testStudent.performance_category === 'good') {
          console.log('✅ Performance category is correct (83% = good)');
        } else {
          console.log('⚠️ Performance category unexpected:', testStudent.performance_category);
        }
        
      } else {
        console.log('❌ Test student not found in participants');
      }
      
    } else {
      console.log('❌ Failed to get participants');
    }
    
    console.log('\n🎯 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCompleteStudentFlow();