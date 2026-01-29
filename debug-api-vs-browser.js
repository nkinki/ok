// Debug API vs Browser data inconsistency for session W34OIR
const debugDataInconsistency = async () => {
  const baseUrl = 'https://nyirad.vercel.app';
  const sessionCode = 'W34OIR';
  
  console.log('🔍 Debugging API vs Browser data inconsistency...');
  console.log('Session:', sessionCode);
  
  try {
    // Test the exact same endpoint the browser is calling
    console.log('\n1. Testing download-json endpoint (same as browser)...');
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/download-json`);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const sessionData = await response.json();
      
      console.log('\n📊 API Response Analysis:');
      console.log('- Exercise count:', sessionData.exercises?.length || 0);
      console.log('- Session structure keys:', Object.keys(sessionData));
      
      if (sessionData.exercises) {
        console.log('\n🔍 Detailed exercise analysis:');
        sessionData.exercises.forEach((exercise, index) => {
          console.log(`\nExercise ${index}:`);
          console.log(`  - ID: ${exercise.id}`);
          console.log(`  - Keys: ${Object.keys(exercise).join(', ')}`);
          console.log(`  - Has imageUrl property: ${exercise.hasOwnProperty('imageUrl')}`);
          console.log(`  - ImageUrl type: ${typeof exercise.imageUrl}`);
          console.log(`  - ImageUrl truthy: ${!!exercise.imageUrl}`);
          console.log(`  - ImageUrl length: ${exercise.imageUrl ? exercise.imageUrl.length : 'N/A'}`);
          
          if (exercise.imageUrl) {
            console.log(`  - ImageUrl starts with: ${exercise.imageUrl.substring(0, 50)}...`);
            console.log(`  - Is base64 data URL: ${exercise.imageUrl.startsWith('data:image/')}`);
          } else {
            console.log(`  - ImageUrl value: ${JSON.stringify(exercise.imageUrl)}`);
          }
        });
        
        // Check if this matches what browser should receive
        console.log('\n🔍 Browser compatibility check:');
        const firstExercise = sessionData.exercises[0];
        console.log('- First exercise imageUrl exists:', !!firstExercise.imageUrl);
        console.log('- First exercise imageUrl length:', firstExercise.imageUrl?.length || 0);
        
        // Simulate the browser's image check logic
        const exercisesWithImages = sessionData.exercises.filter(ex => ex.imageUrl && ex.imageUrl.length > 0);
        console.log('- Exercises with images (simulated browser logic):', exercisesWithImages.length);
        console.log('- Total exercises:', sessionData.exercises.length);
        
        if (exercisesWithImages.length !== sessionData.exercises.length) {
          console.log('❌ MISMATCH: Some exercises missing images');
          sessionData.exercises.forEach((ex, i) => {
            if (!ex.imageUrl || ex.imageUrl.length === 0) {
              console.log(`  - Exercise ${i} (${ex.id}): MISSING IMAGE`);
            }
          });
        } else {
          console.log('✅ All exercises have images according to API');
        }
      }
      
      // Check if there are any null/undefined values that might cause issues
      console.log('\n🔍 Data integrity check:');
      const jsonString = JSON.stringify(sessionData);
      console.log('- JSON serialization successful:', jsonString.length > 0);
      console.log('- Contains null values:', jsonString.includes('null'));
      console.log('- Contains undefined values:', jsonString.includes('undefined'));
      
    } else {
      console.log('❌ API request failed');
      const errorText = await response.text();
      console.log('Error response:', errorText.substring(0, 200));
    }
    
    // Also test the session check endpoint
    console.log('\n2. Testing session check endpoint...');
    const checkResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/check`);
    
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('✅ Session check passed');
      console.log('- Session exists:', checkData.exists);
      console.log('- Exercise count:', checkData.session?.exerciseCount || 0);
    } else {
      console.log('❌ Session check failed');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\n🏁 API vs Browser debug completed');
};

// Run the debug
debugDataInconsistency();