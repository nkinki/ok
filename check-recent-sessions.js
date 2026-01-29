// Check recent sessions for image data
const checkRecentSessions = async () => {
  const baseUrl = 'https://nyirad.vercel.app';
  
  console.log('🔍 Checking recent sessions for image data...');
  
  try {
    // Get session list
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/list?subject=info`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Found ${data.sessions.length} sessions`);
      
      // Check the 5 most recent sessions
      const recentSessions = data.sessions.slice(0, 5);
      
      for (const session of recentSessions) {
        console.log(`\n🔍 Checking session: ${session.code}`);
        console.log(`  - Created: ${new Date(session.createdAt).toLocaleString()}`);
        console.log(`  - Active: ${session.isActive}`);
        console.log(`  - Exercises: ${session.exerciseCount}`);
        console.log(`  - Participants: ${session.participantCount}`);
        
        // Try to get the session JSON
        try {
          const jsonResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${session.code}/download-json`);
          
          if (jsonResponse.ok) {
            const sessionData = await jsonResponse.json();
            
            if (sessionData.exercises) {
              const exercisesWithImages = sessionData.exercises.filter(ex => ex.imageUrl && ex.imageUrl.length > 0);
              console.log(`  - Images: ${exercisesWithImages.length}/${sessionData.exercises.length} exercises have images`);
              
              if (exercisesWithImages.length > 0) {
                console.log(`  ✅ This session has images! Code: ${session.code}`);
                
                // Show first exercise with image as example
                const firstWithImage = exercisesWithImages[0];
                console.log(`    - Example: "${firstWithImage.title}" (${Math.round(firstWithImage.imageUrl.length / 1024)}KB)`);
              } else {
                console.log(`  ❌ No images in this session`);
              }
            }
          } else {
            console.log(`  ⚠️ Could not fetch JSON for ${session.code}`);
          }
        } catch (error) {
          console.log(`  ❌ Error checking ${session.code}:`, error.message);
        }
      }
    } else {
      console.log('❌ Failed to get session list');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🏁 Recent sessions check completed');
};

// Run the test
checkRecentSessions();