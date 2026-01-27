// Test the debug percentage endpoint to see what's happening

const API_BASE = 'https://nyirad.vercel.app';

async function testDebugPercentage() {
  console.log('🔍 Testing debug percentage endpoint...');
  
  try {
    const debugResponse = await fetch(`${API_BASE}/api/simple-api/debug/percentage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: 'HYM7L0',
        studentId: 'test-student-id',
        score: 10
      })
    });
    
    if (!debugResponse.ok) {
      console.error('❌ Debug request failed:', debugResponse.status);
      const error = await debugResponse.json();
      console.error('Error:', error);
      return;
    }
    
    const debugData = await debugResponse.json();
    
    console.log('📊 Debug Information:');
    console.log('- Session found:', debugData.debug.sessionFound);
    console.log('- Session error:', debugData.debug.sessionError);
    console.log('- Has exercises:', debugData.debug.hasExercises);
    console.log('- Has full JSON:', debugData.debug.hasFullJson);
    console.log('- Exercise count:', debugData.debug.exerciseCount);
    console.log('- Full JSON exercise count:', debugData.debug.fullJsonExerciseCount);
    console.log('- Data source:', debugData.dataSource);
    
    console.log('\n📋 Exercise Analysis:');
    debugData.exerciseAnalysis.forEach(exercise => {
      console.log(`${exercise.index}. ${exercise.title}`);
      console.log(`   Type: ${exercise.type}`);
      console.log(`   Has content: ${exercise.hasContent}`);
      console.log(`   Content keys: [${exercise.contentKeys.join(', ')}]`);
      console.log(`   Question count: ${exercise.questionCount}`);
    });
    
    console.log('\n🧮 Calculation:');
    console.log('- Total questions:', debugData.calculation.totalQuestions);
    console.log('- Max possible score:', debugData.calculation.maxPossibleScore);
    console.log('- Current score:', debugData.calculation.currentScore);
    console.log('- Percentage:', debugData.calculation.percentage + '%');
    console.log('- Formula:', debugData.calculation.formula);
    
    if (debugData.calculation.totalQuestions === 0) {
      console.log('\n❌ PROBLEM IDENTIFIED: No questions found!');
      console.log('💡 This explains why percentage is always 0');
      
      if (debugData.dataSource === 'none') {
        console.log('🔧 No exercise data available at all');
      } else if (debugData.dataSource === 'exercises') {
        console.log('🔧 Using exercises field but content is missing');
      } else if (debugData.dataSource === 'full_session_json') {
        console.log('🔧 Using full_session_json but content is missing');
      }
    } else {
      console.log('\n✅ Question counting works - percentage should be calculated correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testDebugPercentage();