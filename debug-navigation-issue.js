// Debug the navigation issue for session YAE92F
const debugNavigation = async () => {
  const baseUrl = 'https://nyirad.vercel.app';
  const sessionCode = 'YAE92F';
  
  console.log('🔍 Debugging navigation issue for session:', sessionCode);
  
  try {
    // Get session data
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/download-json`);
    
    if (response.ok) {
      const sessionData = await response.json();
      console.log('📊 Session data retrieved');
      console.log('📊 Exercise count:', sessionData.exercises?.length || 0);
      
      if (sessionData.exercises) {
        console.log('\n🔍 Exercise details:');
        sessionData.exercises.forEach((exercise, index) => {
          console.log(`  Exercise ${index}:`);
          console.log(`    - ID: ${exercise.id}`);
          console.log(`    - Title: ${exercise.title?.substring(0, 50) || 'No title'}...`);
          console.log(`    - Type: ${exercise.type}`);
          console.log(`    - Has image: ${exercise.imageUrl ? 'Yes (' + Math.round(exercise.imageUrl.length / 1024) + 'KB)' : 'No'}`);
          console.log(`    - Has content: ${exercise.content ? 'Yes' : 'No'}`);
          
          if (exercise.content) {
            if (exercise.type === 'QUIZ') {
              console.log(`    - Questions: ${exercise.content.questions?.length || 0}`);
            } else if (exercise.type === 'MATCHING') {
              console.log(`    - Pairs: ${exercise.content.pairs?.length || 0}`);
            } else if (exercise.type === 'CATEGORIZATION') {
              console.log(`    - Items: ${exercise.content.items?.length || 0}`);
            }
          }
        });
        
        console.log('\n🔍 Navigation analysis:');
        console.log('- Total exercises:', sessionData.exercises.length);
        console.log('- Valid indices: 0 to', sessionData.exercises.length - 1);
        console.log('- After completing exercise 0, should navigate to index 1');
        console.log('- Index 1 should be valid since we have', sessionData.exercises.length, 'exercises');
        
        if (sessionData.exercises.length >= 2) {
          console.log('✅ Second exercise should be accessible');
          console.log('🔍 Second exercise details:');
          const secondEx = sessionData.exercises[1];
          console.log(`  - ID: ${secondEx.id}`);
          console.log(`  - Has all required fields: ${!!(secondEx.type && secondEx.title && secondEx.content)}`);
        } else {
          console.log('❌ Not enough exercises for navigation issue');
        }
        
        // Simulate the navigation logic
        console.log('\n🔍 Simulating navigation logic:');
        const currentIndex = 0; // After completing first exercise
        const nextIndex = currentIndex + 1;
        console.log(`- Current index: ${currentIndex}`);
        console.log(`- Next index: ${nextIndex}`);
        console.log(`- Playlist length: ${sessionData.exercises.length}`);
        console.log(`- Is next index valid? ${nextIndex < sessionData.exercises.length}`);
        console.log(`- Bounds check (nextIndex >= length): ${nextIndex >= sessionData.exercises.length}`);
        
        if (nextIndex >= sessionData.exercises.length) {
          console.log('❌ PROBLEM: Next index would trigger bounds check!');
        } else {
          console.log('✅ Next index should be valid');
        }
      }
    } else {
      console.log('❌ Failed to get session data');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🏁 Navigation debug completed');
};

// Run the debug
debugNavigation();