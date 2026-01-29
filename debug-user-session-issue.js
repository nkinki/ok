// Debug the specific session issue the user is experiencing
const debugUserSessionIssue = async () => {
  console.log('🔍 Debugging the user\'s "nincs" (no images) issue...');
  
  const baseUrl = 'https://nyirad.vercel.app';
  
  console.log('\n📊 From the user\'s browser logs, we know:');
  console.log('- User sees session with 2 exercises');
  console.log('- Both exercises have images (376267 and 576943 chars)');
  console.log('- Session code appears to be YAE92F');
  console.log('- Images are loading successfully in browser');
  console.log('- But user reports "nincs" (no images)');
  
  console.log('\n🤔 This is confusing because the logs show images ARE loading...');
  console.log('Let\'s check if YAE92F exists and what it contains:');
  
  try {
    // Test YAE92F
    console.log('\n🧪 Testing YAE92F...');
    const yaeResponse = await fetch(`${baseUrl}/api/simple-api/sessions/YAE92F/download-json`);
    console.log('YAE92F status:', yaeResponse.status);
    
    if (yaeResponse.ok) {
      const yaeData = await yaeResponse.json();
      console.log('YAE92F data:', {
        exerciseCount: yaeData.exercises?.length || 0,
        imagesCount: yaeData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0,
        firstExerciseImageLength: yaeData.exercises?.[0]?.imageUrl?.length || 0,
        secondExerciseImageLength: yaeData.exercises?.[1]?.imageUrl?.length || 0
      });
      
      // Check if the image lengths match the browser logs
      const firstImageLength = yaeData.exercises?.[0]?.imageUrl?.length || 0;
      const secondImageLength = yaeData.exercises?.[1]?.imageUrl?.length || 0;
      
      if (firstImageLength === 376267 && secondImageLength === 576943) {
        console.log('✅ PERFECT MATCH! YAE92F has the exact same image sizes as browser logs');
        console.log('This means the browser IS loading the correct session');
        console.log('The issue might be in the UI display, not the data loading');
      } else {
        console.log('❌ Image sizes don\'t match browser logs');
        console.log(`Expected: 376267, 576943`);
        console.log(`Got: ${firstImageLength}, ${secondImageLength}`);
      }
    } else if (yaeResponse.status === 404) {
      console.log('❌ YAE92F not found - session may have expired or been deleted');
    } else {
      console.log('❌ YAE92F error:', yaeResponse.status);
    }
  } catch (error) {
    console.log('❌ Error testing YAE92F:', error.message);
  }
  
  console.log('\n🔍 Let\'s also check recent sessions to see if there\'s a pattern...');
  try {
    const listResponse = await fetch(`${baseUrl}/api/simple-api/sessions/list?subject=info`);
    if (listResponse.ok) {
      const listData = await listResponse.json();
      
      console.log('\nRecent sessions with 2 exercises:');
      const twoExerciseSessions = listData.sessions.filter(s => s.exerciseCount === 2);
      
      for (const session of twoExerciseSessions.slice(0, 5)) {
        console.log(`\n📋 Session ${session.code}:`);
        console.log(`   Created: ${session.createdAt}`);
        console.log(`   Class: ${session.className || 'Unknown'}`);
        
        try {
          const testResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${session.code}/download-json`);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            const imagesCount = testData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0;
            const firstImageLength = testData.exercises?.[0]?.imageUrl?.length || 0;
            const secondImageLength = testData.exercises?.[1]?.imageUrl?.length || 0;
            
            console.log(`   Images: ${imagesCount}/2 exercises have images`);
            console.log(`   Image sizes: ${firstImageLength}, ${secondImageLength}`);
            
            if (firstImageLength === 376267 && secondImageLength === 576943) {
              console.log(`   ✅ MATCH! This could be the session the user is using`);
            }
          }
        } catch (testError) {
          console.log(`   ❌ Error testing ${session.code}`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Error listing sessions:', error.message);
  }
  
  console.log('\n🎯 HYPOTHESIS:');
  console.log('The browser logs show images ARE loading correctly.');
  console.log('The user saying "nincs" might mean:');
  console.log('1. Images are not DISPLAYING in the UI (CSS/rendering issue)');
  console.log('2. User is looking at a different part of the app');
  console.log('3. There\'s a timing issue where images load but then disappear');
  console.log('4. The ImageViewer component has a display bug');
  
  console.log('\n🔧 SOLUTION:');
  console.log('Add more detailed logging to the ImageViewer component');
  console.log('Check if images are being passed to the component correctly');
  console.log('Verify the getImageUrl function is working in all cases');
};

// Run the debug
debugUserSessionIssue().catch(console.error);