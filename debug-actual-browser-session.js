// Debug script to identify which session the browser is actually loading
const debugActualBrowserSession = async () => {
  console.log('🔍 Identifying the actual session the browser is loading...');
  
  const baseUrl = 'https://nyirad.vercel.app';
  
  console.log('\n📊 Evidence from browser logs:');
  console.log('- Session shows 11 exercises');
  console.log('- All exercises have hasImageUrl: false');
  console.log('- Session code appears to be YAE92F (from logs)');
  console.log('- But YAE92F should have 2 exercises with images');
  
  console.log('\n🧪 Testing YAE92F session (from browser logs)...');
  try {
    const yae92fResponse = await fetch(`${baseUrl}/api/simple-api/sessions/YAE92F/download-json`);
    if (yae92fResponse.ok) {
      const yae92fData = await yae92fResponse.json();
      const exerciseCount = yae92fData.exercises?.length || 0;
      const imagesCount = yae92fData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0;
      
      console.log(`YAE92F API data: ${exerciseCount} exercises, ${imagesCount} with images`);
      
      if (exerciseCount === 11 && imagesCount === 0) {
        console.log('✅ FOUND THE ISSUE: YAE92F has been overwritten with 11 exercises and no images!');
      } else if (exerciseCount === 2 && imagesCount === 2) {
        console.log('⚠️ YAE92F API data is correct, but browser is loading something else');
      } else {
        console.log(`⚠️ YAE92F has unexpected data: ${exerciseCount} exercises, ${imagesCount} images`);
      }
      
      // Show first few exercises for debugging
      console.log('\nFirst 3 exercises in YAE92F:');
      yae92fData.exercises?.slice(0, 3).forEach((ex, i) => {
        console.log(`  ${i + 1}. ${ex.id} - ${ex.title?.substring(0, 30) || 'No title'} - Image: ${ex.imageUrl ? ex.imageUrl.length + ' chars' : 'NONE'}`);
      });
    } else {
      console.log('❌ YAE92F not found or error:', yae92fResponse.status);
    }
  } catch (error) {
    console.log('❌ Error testing YAE92F:', error.message);
  }
  
  console.log('\n🔍 Searching for sessions with exactly 11 exercises...');
  try {
    const listResponse = await fetch(`${baseUrl}/api/simple-api/sessions/list?subject=info`);
    if (listResponse.ok) {
      const listData = await listResponse.json();
      
      const elevenExerciseSessions = [];
      
      for (const session of listData.sessions.slice(0, 20)) {
        if (session.exerciseCount === 11) {
          elevenExerciseSessions.push(session);
          
          console.log(`\n📋 Found 11-exercise session: ${session.code}`);
          console.log(`   Created: ${session.createdAt}`);
          console.log(`   Class: ${session.className || 'Unknown'}`);
          
          // Test this session's images
          try {
            const testResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${session.code}/download-json`);
            if (testResponse.ok) {
              const testData = await testResponse.json();
              const imagesCount = testData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0;
              console.log(`   Images: ${imagesCount}/${testData.exercises?.length || 0} exercises have images`);
              
              if (imagesCount === 0) {
                console.log(`   ⚠️ This session has NO images - could be the one browser is loading!`);
              }
            }
          } catch (testError) {
            console.log(`   ❌ Error testing ${session.code}:`, testError.message);
          }
        }
      }
      
      console.log(`\n📊 Found ${elevenExerciseSessions.length} sessions with 11 exercises`);
      
      if (elevenExerciseSessions.length === 0) {
        console.log('🤔 No 11-exercise sessions found. Browser might be using localStorage or cached data.');
      }
      
    } else {
      console.log('❌ Could not list sessions:', listResponse.status);
    }
  } catch (error) {
    console.log('❌ Error listing sessions:', error.message);
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check if YAE92F has been overwritten with wrong data');
  console.log('2. Check if browser is using localStorage instead of API');
  console.log('3. Add session code logging to browser to confirm which code it\'s using');
  console.log('4. Check database consistency between different fields');
};

// Run the debug
debugActualBrowserSession().catch(console.error);