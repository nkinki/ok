// Debug which session and path the browser is actually using
const debugBrowserPath = async () => {
  console.log('🔍 Debugging browser session path...');
  
  // The browser logs show 11 exercises but our API test shows 10
  // This suggests the browser is loading a different session or different data
  
  console.log('\n📊 Evidence Analysis:');
  console.log('API Test (Z7JA4Z): 10 exercises, all with images');
  console.log('Browser Reality: 11 exercises, none with images');
  console.log('Conclusion: Browser is NOT loading session Z7JA4Z data');
  
  console.log('\n🔍 Possible causes:');
  console.log('1. Browser is using wrong session code');
  console.log('2. Browser is loading from localStorage instead of API');
  console.log('3. Browser is calling different API endpoint');
  console.log('4. Database has inconsistent data in different fields');
  
  console.log('\n🧪 Next steps:');
  console.log('1. Check what session code browser is actually using');
  console.log('2. Check if browser goes through database JSON path');
  console.log('3. Check if localStorage is interfering');
  console.log('4. Verify which API endpoint browser calls');
  
  // Test the exact session the browser might be using
  const baseUrl = 'https://nyirad.vercel.app';
  
  // Check recent sessions to see if there's an 11-exercise session
  console.log('\n🔍 Checking for 11-exercise sessions...');
  try {
    const listResponse = await fetch(`${baseUrl}/api/simple-api/sessions/list?subject=info`);
    if (listResponse.ok) {
      const listData = await listResponse.json();
      
      for (const session of listData.sessions.slice(0, 10)) {
        if (session.exerciseCount === 11) {
          console.log(`Found 11-exercise session: ${session.code}`);
          
          // Test this session
          const testResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${session.code}/download-json`);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            const imagesCount = testData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0;
            console.log(`  - Session ${session.code}: ${imagesCount}/${testData.exercises?.length || 0} exercises have images`);
            
            if (imagesCount === 0) {
              console.log(`  ⚠️ This might be the session the browser is loading!`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('Error checking sessions:', error.message);
  }
  
  console.log('\n🎯 DIAGNOSIS:');
  console.log('The browser is loading a DIFFERENT session than Z7JA4Z');
  console.log('Need to identify which session code the browser is actually using');
  console.log('The session has 11 exercises with no images');
};

// Run the debug
debugBrowserPath();