// Final test for image fix - check if images are properly stored and retrieved

const API_BASE = 'https://nyirad.vercel.app';

async function testImageFix() {
  console.log('🧪 Testing final image fix...');
  
  try {
    // 1. Create a test session with images
    const testSessionCode = 'IMG_TEST_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('📝 Creating test session with images:', testSessionCode);
    
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
    console.log('🖼️ Exercises with images:', fullSessionJson.exercises.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length);
    
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
    
    // 3. Download and verify images
    console.log('📥 Downloading session JSON...');
    
    const downloadResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}/download-json`);
    
    if (!downloadResponse.ok) {
      const error = await downloadResponse.json();
      console.error('❌ Download failed:', error);
      return;
    }
    
    const downloadedData = await downloadResponse.json();
    
    console.log('📊 Downloaded session data:');
    console.log('- Exercise count:', downloadedData.exercises?.length || 0);
    console.log('- Exercises with images:', downloadedData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0);
    
    if (downloadedData.exercises) {
      downloadedData.exercises.forEach((ex, index) => {
        console.log(`- Exercise ${index + 1}: ${ex.title}, imageUrl length: ${ex.imageUrl?.length || 0}`);
      });
    }
    
    // 4. Verify images are present
    const hasImages = downloadedData.exercises?.some(ex => ex.imageUrl && ex.imageUrl.length > 0);
    
    if (hasImages) {
      console.log('✅ SUCCESS: Images are properly stored and retrieved!');
    } else {
      console.log('❌ FAILED: Images are missing from downloaded data');
    }
    
    // 5. Cleanup - delete test session
    console.log('🧹 Cleaning up test session...');
    
    const deleteResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${testSessionCode}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test session cleaned up');
    } else {
      console.log('⚠️ Could not clean up test session (manual cleanup needed)');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testImageFix();