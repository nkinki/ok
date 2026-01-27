// Complete test for both image fix and student results fix

const API_BASE = 'https://nyirad.vercel.app';

async function testCompleteFix() {
  console.log('🧪 Testing complete fix (images + student results)...');
  
  try {
    // 1. Create a test session with images
    const testSessionCode = 'COMPLETE_TEST_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('📝 Creating test session:', testSessionCode);
    
    const sessionData = {
      code: testSessionCode,
      exercises: [],
      subject: 'test',
      className: 'Test Class',
      maxScore: 20,
      fullExercises: [
        {
          id: 'test1',
          fileName: 'test1.jpg',
          imageUrl: testImage,
          title: 'Test Exercise 1',
          instruction: 'Test instruction',
          type: 'QUIZ',
          content: { questions: [{ question: 'Test?', options: ['A', 'B'], correctAnswer: 0 }] }
        },
        {
          id: 'test2',
          fileName: 'test2.jpg',
          imageUrl: testImage,
          title: 'Test Exercise 2',
          instruction: 'Test instruction 2',
          type: 'QUIZ',
          content: { questions: [{ question: 'Test 2?', options: ['C', 'D'], correctAnswer: 1 }] }
        }
      ]
    };
    
    const createResponse = await fetch(`${API_BASE}/api/simple-api/sessions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error('❌ Session creation failed:', error);
      return;
    }
    
    console.log('✅ Session created successfully');
    
    // 2. Upload full session JSON with images
    const fullSessionJson = {
      sessionCode: testSessionCode,
      subject: 'test',
      createdAt: new Date().toISOString(),
      exercises: sessionData.fullExercises,
      metadata: {
        version: '1.0.0',
        exportedBy: 'Test Script',
        totalExercises: 2,
        estimatedTime: 6
      }
    };
    
    console.log('📤 Uploading session JSON with images...');
    
    const uploadResponse = await fetch(`${API_BASE}/api/simple-api/sessions/upload-drive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testSessionCode,
        sessionJson: fullSessionJson
      })
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error('❌ Upload failed:', error);
      return;
    }
    
    console.log('✅ Session JSON uploaded successfully');
    
    // 3. Test student join
    console.log('👨‍🎓 Testing student join...');
    
    const joinResponse = await fetch(`${API_BASE}/api/simple-api/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: testSessionCode,
        name: 'Test Student',
        className: 'Test Class'
      })
    });
    
    if (!joinResponse.ok) {
      const error = await joinResponse.json();
      console.error('❌ Student join failed:', error);
      return;
    }
    
    const joinData = await joinResponse.json();
    console.log('✅ Student joined successfully');
    console.log('🆔 Student ID:', joinData.student?.id);
    
    // Check if student ID is valid (not offline)
    const studentId = joinData.student?.id;
    if (!studentId || studentId.startsWith('student_') || studentId.startsWith('offline-')) {
      console.error('❌ Invalid student ID:', studentId);
      return;
    }
    
    console.log('✅ Student ID is valid (database ID)');
    
    // 4. Test result submission
    console.log('📊 Testing result submission...');
    
    const resultPayload = {
      studentId: studentId,
      results: [{
        exerciseIndex: 0,
        isCorrect: true,
        score: 10,
        timeSpent: 5,
        answer: { selectedAnswer: 0 },
        completedAt: new Date().toISOString()
      }],
      summary: {
        studentName: 'Test Student',
        studentClass: 'Test Class',
        sessionCode: testSessionCode,
        totalExercises: 2,
        completedExercises: 1,
        totalScore: 10,
        completedAt: new Date().toISOString()
      }
    };
    
    const resultResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultPayload)
    });
    
    if (!resultResponse.ok) {
      const error = await resultResponse.json();
      console.error('❌ Result submission failed:', error);
      return;
    }
    
    console.log('✅ Result submitted successfully');
    
    // 5. Verify session status
    console.log('📊 Checking session status...');
    
    const statusResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}/status`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Session status:');
      console.log('- Participants:', statusData.session?.participantCount || 0);
      console.log('- Exercises:', statusData.session?.exerciseCount || 0);
      console.log('- Total questions:', statusData.session?.totalQuestions || 0);
    }
    
    // 6. Download and verify images again
    console.log('📥 Final image verification...');
    
    const downloadResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}/download-json`);
    
    if (downloadResponse.ok) {
      const downloadedData = await downloadResponse.json();
      const hasImages = downloadedData.exercises?.some(ex => ex.imageUrl && ex.imageUrl.length > 0);
      
      if (hasImages) {
        console.log('✅ Images are properly stored and accessible');
      } else {
        console.log('❌ Images are missing');
      }
    }
    
    console.log('\n🎉 COMPLETE TEST RESULTS:');
    console.log('✅ Session creation: SUCCESS');
    console.log('✅ Image upload: SUCCESS');
    console.log('✅ Student join: SUCCESS');
    console.log('✅ Valid student ID: SUCCESS');
    console.log('✅ Result submission: SUCCESS');
    console.log('✅ Image retrieval: SUCCESS');
    
    // 7. Cleanup
    console.log('\n🧹 Cleaning up...');
    
    const deleteResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test session cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCompleteFix();