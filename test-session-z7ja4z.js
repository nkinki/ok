// Test session Z7JA4Z to see if images are accessible to students
const testSessionZ7JA4Z = async () => {
  const baseUrl = 'https://nyirad.vercel.app';
  const sessionCode = 'Z7JA4Z';
  
  console.log('🔍 Testing session Z7JA4Z after successful compression...');
  
  try {
    // Test 1: Check if session exists
    console.log('\n1. Testing session existence...');
    const checkResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/check`);
    console.log('Session check status:', checkResponse.status);
    
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('✅ Session exists:', checkData.exists);
      console.log('📊 Exercise count:', checkData.session?.exerciseCount || 0);
    } else {
      console.log('❌ Session check failed');
      return;
    }
    
    // Test 2: Try to download session JSON (same as student would)
    console.log('\n2. Testing JSON download (student perspective)...');
    const jsonResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/download-json`);
    console.log('JSON download status:', jsonResponse.status);
    
    if (jsonResponse.ok) {
      const sessionData = await jsonResponse.json();
      console.log('✅ JSON download successful');
      console.log('📊 Exercise count:', sessionData.exercises?.length || 0);
      
      if (sessionData.exercises) {
        console.log('\n🔍 Image analysis:');
        sessionData.exercises.forEach((exercise, index) => {
          const hasImage = exercise.imageUrl && exercise.imageUrl.length > 0;
          const imageSize = hasImage ? Math.round(exercise.imageUrl.length / 1024) : 0;
          
          console.log(`  Exercise ${index + 1}: ${exercise.id}`);
          console.log(`    - Title: ${exercise.title?.substring(0, 50) || 'No title'}...`);
          console.log(`    - Has image: ${hasImage ? '✅' : '❌'}`);
          if (hasImage) {
            console.log(`    - Image size: ${imageSize}KB`);
            console.log(`    - Image format: ${exercise.imageUrl.substring(0, 30)}...`);
          }
        });
        
        const exercisesWithImages = sessionData.exercises.filter(ex => ex.imageUrl && ex.imageUrl.length > 0);
        console.log(`\n📊 Summary: ${exercisesWithImages.length}/${sessionData.exercises.length} exercises have images`);
        
        if (exercisesWithImages.length === sessionData.exercises.length) {
          console.log('✅ All exercises have images - upload was successful!');
          console.log('🔍 The issue might be in the browser processing or caching');
        } else {
          console.log('❌ Some exercises missing images - upload may have failed partially');
        }
      }
    } else {
      console.log('❌ JSON download failed');
      const errorText = await jsonResponse.text();
      console.log('Error:', errorText.substring(0, 200));
    }
    
    // Test 3: Check participants endpoint
    console.log('\n3. Testing participants endpoint...');
    const participantsResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/participants`);
    console.log('Participants status:', participantsResponse.status);
    
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      console.log('✅ Participants endpoint working');
      console.log('📊 Current participants:', participantsData.participantCount || 0);
    }
    
    // Test 4: Compare with a known working session
    console.log('\n4. Comparing with known working session (YAE92F)...');
    try {
      const workingResponse = await fetch(`${baseUrl}/api/simple-api/sessions/YAE92F/download-json`);
      if (workingResponse.ok) {
        const workingData = await workingResponse.json();
        const workingImages = workingData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0;
        console.log(`Working session YAE92F: ${workingImages}/${workingData.exercises?.length || 0} exercises have images`);
        
        if (workingImages > 0) {
          console.log('✅ Other sessions have images - API is working');
          console.log('🔍 Issue is specific to session Z7JA4Z or browser caching');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not test working session:', error.message);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('- Check if session Z7JA4Z actually uploaded successfully');
    console.log('- Verify if images are in the database');
    console.log('- Test if browser caching is causing issues');
    console.log('- Compare with working sessions');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🏁 Session Z7JA4Z test completed');
};

// Run the test
testSessionZ7JA4Z();