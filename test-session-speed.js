// Test session creation speed after optimization

const testSessionSpeed = async () => {
  console.log('🚀 Testing Session Creation Speed...\n');

  const baseUrl = 'https://nyirad.vercel.app';
  
  try {
    // Test session creation speed
    console.log('⏱️ Testing session creation performance...');
    
    const testExercises = [
      {
        id: 'speed-test-1',
        fileName: 'test1.jpg',
        title: 'Speed Test Exercise 1',
        instruction: 'This is a speed test',
        type: 'QUIZ',
        content: {
          questions: [
            {
              question: 'Test question 1?',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0
            }
          ]
        }
      },
      {
        id: 'speed-test-2',
        fileName: 'test2.jpg',
        title: 'Speed Test Exercise 2',
        instruction: 'This is another speed test',
        type: 'MATCHING',
        content: {
          pairs: [
            { left: 'Item 1', right: 'Match 1' },
            { left: 'Item 2', right: 'Match 2' }
          ]
        }
      }
    ];

    const sessionCode = 'SPEED' + Math.random().toString(36).substr(2, 3).toUpperCase();
    
    console.log(`Creating session: ${sessionCode}`);
    console.log(`Exercise count: ${testExercises.length}`);
    console.log(`Payload size: ~${JSON.stringify(testExercises).length} characters`);
    
    const startTime = Date.now();
    
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: sessionCode,
        exercises: testExercises,
        subject: 'test'
      })
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n📊 Performance Results:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Duration: ${duration}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Session created successfully: ${data.session.code}`);
      console.log(`   Exercise count: ${data.session.exerciseCount}`);
      
      // Performance assessment
      if (duration < 1000) {
        console.log(`   🚀 EXCELLENT: Very fast (${duration}ms)`);
      } else if (duration < 3000) {
        console.log(`   ✅ GOOD: Acceptable speed (${duration}ms)`);
      } else if (duration < 5000) {
        console.log(`   ⚠️ SLOW: Could be improved (${duration}ms)`);
      } else {
        console.log(`   ❌ VERY SLOW: Needs optimization (${duration}ms)`);
      }
      
      // Test exercise loading for students
      console.log(`\n🎓 Testing student exercise loading...`);
      const exerciseStartTime = Date.now();
      
      const exerciseResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/exercises`);
      const exerciseEndTime = Date.now();
      const exerciseDuration = exerciseEndTime - exerciseStartTime;
      
      console.log(`   Exercise loading: ${exerciseDuration}ms`);
      
      if (exerciseResponse.ok) {
        const exerciseData = await exerciseResponse.json();
        console.log(`   ✅ Exercises loaded: ${exerciseData.exercises.length} items`);
        
        // Check if images are missing (expected after optimization)
        const firstExercise = exerciseData.exercises[0];
        console.log(`   Image URL present: ${!!firstExercise.imageUrl}`);
        console.log(`   📝 Note: Images now loaded separately for better performance`);
      }
      
    } else {
      const errorData = await response.json();
      console.log(`   ❌ Session creation failed: ${errorData.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testSessionSpeed();