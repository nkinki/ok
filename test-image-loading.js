// Test image loading for sessions
const testImageLoading = async () => {
  const baseUrl = 'https://nyirad.vercel.app';
  
  console.log('🖼️ Testing image loading...');
  
  // Test session with code UGRRCF (from the logs)
  const sessionCode = 'UGRRCF';
  
  try {
    console.log(`\n1. Testing session ${sessionCode} JSON download...`);
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/download-json`);
    console.log('Status:', response.status);
    
    if (response.ok) {
      const sessionData = await response.json();
      console.log('✅ Session JSON downloaded successfully');
      console.log('📊 Exercise count:', sessionData.exercises?.length || 0);
      
      // Check images in exercises
      if (sessionData.exercises) {
        console.log('\n🔍 Checking images in exercises:');
        sessionData.exercises.forEach((exercise, index) => {
          const hasImage = exercise.imageUrl && exercise.imageUrl.length > 0;
          const imageSize = hasImage ? Math.round(exercise.imageUrl.length / 1024) : 0;
          
          console.log(`  Exercise ${index + 1}: ${exercise.title || 'No title'}`);
          console.log(`    - Type: ${exercise.type}`);
          console.log(`    - Has image: ${hasImage ? '✅' : '❌'}`);
          if (hasImage) {
            console.log(`    - Image size: ${imageSize}KB`);
            console.log(`    - Image format: ${exercise.imageUrl.substring(0, 30)}...`);
          }
        });
        
        const exercisesWithImages = sessionData.exercises.filter(ex => ex.imageUrl && ex.imageUrl.length > 0);
        console.log(`\n📊 Summary: ${exercisesWithImages.length}/${sessionData.exercises.length} exercises have images`);
        
        if (exercisesWithImages.length < sessionData.exercises.length) {
          console.log('⚠️ Some exercises are missing images - this could cause "nincsen kep" errors');
        } else {
          console.log('✅ All exercises have images');
        }
      }
    } else {
      console.log('❌ Session JSON download failed');
      const text = await response.text();
      console.log('Error:', text.substring(0, 300));
    }
  } catch (error) {
    console.log('❌ Session JSON download error:', error.message);
  }
  
  // Test participants endpoint
  try {
    console.log(`\n2. Testing session ${sessionCode} participants...`);
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/participants`);
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Participants data retrieved');
      console.log('📊 Participant count:', data.participantCount || 0);
      console.log('📊 Total questions:', data.totalQuestions || 0);
      console.log('📊 Max possible score:', data.maxPossibleScore || 0);
      
      if (data.participants && data.participants.length > 0) {
        console.log('\n👥 Recent participants:');
        data.participants.slice(0, 3).forEach(p => {
          console.log(`  - ${p.student_name} (${p.student_class}): ${p.percentage || 0}% - ${p.total_score || 0} points`);
        });
      }
    } else {
      console.log('❌ Participants data failed');
      const text = await response.text();
      console.log('Error:', text.substring(0, 300));
    }
  } catch (error) {
    console.log('❌ Participants error:', error.message);
  }
  
  console.log('\n🏁 Image loading test completed');
};

// Run the test
testImageLoading();