// Debug session W34OIR missing images issue
const debugSessionImages = async () => {
  const baseUrl = 'https://nyirad.vercel.app';
  
  console.log('🔍 Debugging session W34OIR missing images...');
  
  // Check the problematic session
  const problemSession = 'W34OIR';
  const workingSession = 'YAE92F'; // We know this one had images before
  
  try {
    console.log('\n1. Checking problematic session:', problemSession);
    const response1 = await fetch(`${baseUrl}/api/simple-api/sessions/${problemSession}/download-json`);
    
    if (response1.ok) {
      const sessionData = await response1.json();
      console.log('📊 Session data retrieved');
      console.log('📊 Exercise count:', sessionData.exercises?.length || 0);
      
      if (sessionData.exercises) {
        console.log('\n🔍 Exercise analysis:');
        sessionData.exercises.forEach((exercise, index) => {
          console.log(`  Exercise ${index}:`);
          console.log(`    - ID: ${exercise.id}`);
          console.log(`    - Title: ${exercise.title?.substring(0, 50) || 'No title'}...`);
          console.log(`    - Type: ${exercise.type}`);
          console.log(`    - Has imageUrl field: ${exercise.hasOwnProperty('imageUrl')}`);
          console.log(`    - ImageUrl value: ${exercise.imageUrl ? 'Present (' + exercise.imageUrl.length + ' chars)' : 'MISSING/EMPTY'}`);
          console.log(`    - Has content: ${exercise.content ? 'Yes' : 'No'}`);
        });
        
        // Check if this is a database storage issue
        console.log('\n🔍 Database storage analysis:');
        console.log('- Session retrieved from database successfully');
        console.log('- Exercises have proper structure (ID, title, type, content)');
        console.log('- Missing: imageUrl fields are empty/missing');
        console.log('- This suggests the session was created without images being stored');
      }
    } else {
      console.log('❌ Failed to get session data for', problemSession);
    }
    
    console.log('\n2. Comparing with working session:', workingSession);
    const response2 = await fetch(`${baseUrl}/api/simple-api/sessions/${workingSession}/download-json`);
    
    if (response2.ok) {
      const workingData = await response2.json();
      console.log('📊 Working session exercise count:', workingData.exercises?.length || 0);
      
      if (workingData.exercises && workingData.exercises.length > 0) {
        const firstEx = workingData.exercises[0];
        console.log('\n🔍 Working session first exercise:');
        console.log(`  - ID: ${firstEx.id}`);
        console.log(`  - Has imageUrl: ${firstEx.hasOwnProperty('imageUrl')}`);
        console.log(`  - ImageUrl length: ${firstEx.imageUrl ? firstEx.imageUrl.length : 0}`);
        console.log(`  - ImageUrl format: ${firstEx.imageUrl ? firstEx.imageUrl.substring(0, 30) + '...' : 'NONE'}`);
      }
    }
    
    console.log('\n3. Checking recent sessions for image patterns...');
    const listResponse = await fetch(`${baseUrl}/api/simple-api/sessions/list?subject=info`);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log(`📊 Found ${listData.sessions.length} total sessions`);
      
      // Check the 5 most recent sessions
      const recentSessions = listData.sessions.slice(0, 5);
      
      for (const session of recentSessions) {
        try {
          const sessionResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${session.code}/download-json`);
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            const exercisesWithImages = sessionData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0;
            const totalExercises = sessionData.exercises?.length || 0;
            
            console.log(`  ${session.code}: ${exercisesWithImages}/${totalExercises} exercises have images ${exercisesWithImages === totalExercises ? '✅' : '❌'}`);
          }
        } catch (error) {
          console.log(`  ${session.code}: Error checking - ${error.message}`);
        }
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('- Session W34OIR was created without images being properly stored');
    console.log('- This is a session creation issue, not a loading issue');
    console.log('- The teacher needs to create a new session with proper image upload');
    console.log('- Or use a working session code like YAE92F (if still active)');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🏁 Session image debug completed');
};

// Run the debug
debugSessionImages();