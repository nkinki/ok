// Find a session that actually has images in the database
const findSessionWithImages = async () => {
  console.log('🔍 Looking for sessions with actual images in database...');
  
  const baseUrl = 'https://nyirad.vercel.app';
  
  try {
    // Get recent sessions
    const listResponse = await fetch(`${baseUrl}/api/simple-api/sessions/list?subject=info`);
    if (!listResponse.ok) {
      console.log('❌ Could not list sessions');
      return;
    }
    
    const listData = await listResponse.json();
    console.log(`📋 Found ${listData.sessions.length} sessions to check`);
    
    const sessionsWithImages = [];
    
    // Check first 10 sessions for images
    for (const session of listData.sessions.slice(0, 10)) {
      console.log(`\n🧪 Testing session ${session.code}:`);
      console.log(`   Created: ${session.createdAt}`);
      console.log(`   Exercises: ${session.exerciseCount}`);
      console.log(`   Class: ${session.className || 'Unknown'}`);
      
      try {
        const testResponse = await fetch(`${baseUrl}/api/simple-api/sessions/${session.code}/download-json`);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          const exercises = testData.exercises || [];
          const imagesCount = exercises.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length;
          
          console.log(`   📊 Images: ${imagesCount}/${exercises.length} exercises have images`);
          
          if (imagesCount > 0) {
            sessionsWithImages.push({
              code: session.code,
              exerciseCount: exercises.length,
              imagesCount: imagesCount,
              createdAt: session.createdAt,
              className: session.className
            });
            
            console.log(`   ✅ FOUND SESSION WITH IMAGES: ${session.code}`);
            
            // Show first exercise image info
            const firstWithImage = exercises.find(ex => ex.imageUrl && ex.imageUrl.length > 0);
            if (firstWithImage) {
              console.log(`   🖼️ First image: ${firstWithImage.imageUrl.length} chars, starts with: ${firstWithImage.imageUrl.substring(0, 30)}...`);
            }
          } else {
            console.log(`   ❌ No images in this session`);
          }
        } else {
          console.log(`   ❌ Could not download session data: ${testResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error testing session: ${error.message}`);
      }
    }
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`Found ${sessionsWithImages.length} sessions with images:`);
    
    if (sessionsWithImages.length > 0) {
      console.log('\n📋 Sessions with images:');
      sessionsWithImages.forEach(session => {
        console.log(`   ${session.code}: ${session.imagesCount}/${session.exerciseCount} images (${session.className || 'Unknown class'})`);
      });
      
      const bestSession = sessionsWithImages[0];
      console.log(`\n🎯 RECOMMENDED SESSION TO TEST: ${bestSession.code}`);
      console.log(`   - ${bestSession.imagesCount} exercises with images`);
      console.log(`   - Created: ${bestSession.createdAt}`);
      console.log(`   - Class: ${bestSession.className || 'Unknown'}`);
      
      console.log(`\n🧪 TO TEST:`);
      console.log(`1. Use session code: ${bestSession.code}`);
      console.log(`2. Enter as student with any name`);
      console.log(`3. Images should now display correctly`);
    } else {
      console.log('\n❌ NO SESSIONS WITH IMAGES FOUND');
      console.log('This means:');
      console.log('1. Recent sessions were created without images');
      console.log('2. Image compression/upload may have failed');
      console.log('3. Database storage may have issues');
      
      console.log('\n💡 SOLUTION:');
      console.log('1. Create a new session with images');
      console.log('2. Ensure images are properly uploaded');
      console.log('3. Test with the new session code');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

// Run the search
findSessionWithImages().catch(console.error);