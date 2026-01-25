// Test if database has the JSON columns for image storage

async function testDatabaseColumns() {
  try {
    console.log('🔍 Testing database JSON columns...');
    
    const response = await fetch('/api/simple-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'test_connection'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Database connection test:', result);

    // Test if we can create a session with JSON data
    console.log('🧪 Testing session creation with JSON data...');
    
    const testSessionResponse = await fetch('/api/simple-api/sessions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'TEST_JSON_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        exercises: [],
        subject: 'test',
        className: 'Test Class',
        maxScore: 100,
        fullExercises: [{
          id: 'test-1',
          title: 'Test Exercise',
          type: 'quiz',
          content: { question: 'Test question?' },
          imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }]
      })
    });

    if (testSessionResponse.ok) {
      const sessionResult = await testSessionResponse.json();
      console.log('✅ Session creation test passed:', sessionResult.session.code);
      
      // Test JSON upload
      console.log('🧪 Testing JSON upload to database...');
      const uploadResponse = await fetch('/api/simple-api/sessions/upload-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: sessionResult.session.code,
          sessionJson: {
            sessionCode: sessionResult.session.code,
            exercises: [{
              id: 'test-1',
              title: 'Test Exercise with Image',
              imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            }]
          }
        })
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        console.log('✅ JSON upload test passed:', uploadResult.downloadUrl);
        
        // Test JSON download
        console.log('🧪 Testing JSON download from database...');
        const downloadResponse = await fetch(`/api/simple-api/sessions/${sessionResult.session.code}/download-json`);
        
        if (downloadResponse.ok) {
          const downloadResult = await downloadResponse.json();
          console.log('✅ JSON download test passed');
          console.log('🖼️ Image data preserved:', downloadResult.exercises[0]?.imageUrl?.length > 0 ? 'YES' : 'NO');
          console.log('📊 Downloaded exercise count:', downloadResult.exercises?.length || 0);
        } else {
          console.error('❌ JSON download test failed:', downloadResponse.status);
        }
      } else {
        const uploadError = await uploadResponse.json().catch(() => ({}));
        console.error('❌ JSON upload test failed:', uploadError);
      }
    } else {
      const sessionError = await testSessionResponse.json().catch(() => ({}));
      console.error('❌ Session creation test failed:', sessionError);
      
      if (sessionError.error && sessionError.error.includes('column')) {
        console.log('💡 SOLUTION: Run the database migration in Supabase:');
        console.log('   1. Go to Supabase SQL Editor');
        console.log('   2. Run the contents of RUN_THIS_IN_SUPABASE.sql');
        console.log('   3. This will add the missing JSON columns');
      }
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run the test
testDatabaseColumns();