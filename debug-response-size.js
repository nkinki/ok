// Debug response size and potential truncation issues
const debugResponseSize = async () => {
  const baseUrl = 'https://nyirad.vercel.app';
  const sessionCode = 'W34OIR';
  
  console.log('🔍 Debugging response size and truncation...');
  
  try {
    console.log('\n1. Checking response size...');
    const response = await fetch(`${baseUrl}/api/simple-api/sessions/${sessionCode}/download-json`);
    
    // Get the raw response text to check size
    const responseText = await response.text();
    const responseSizeKB = Math.round(responseText.length / 1024);
    
    console.log('📊 Response size analysis:');
    console.log('- Response size:', responseSizeKB, 'KB');
    console.log('- Response length:', responseText.length, 'characters');
    console.log('- Vercel function limit: 5MB (5120KB)');
    console.log('- Size within limits:', responseSizeKB < 5120 ? '✅' : '❌');
    
    // Try to parse the JSON
    let sessionData;
    try {
      sessionData = JSON.parse(responseText);
      console.log('✅ JSON parsing successful');
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError.message);
      console.log('Response start:', responseText.substring(0, 200));
      console.log('Response end:', responseText.substring(responseText.length - 200));
      return;
    }
    
    // Check if exercises are complete
    console.log('\n2. Checking exercise completeness...');
    if (sessionData.exercises) {
      sessionData.exercises.forEach((exercise, index) => {
        console.log(`\nExercise ${index}:`);
        console.log(`  - ID: ${exercise.id}`);
        console.log(`  - Has imageUrl: ${!!exercise.imageUrl}`);
        
        if (exercise.imageUrl) {
          const imageSize = Math.round(exercise.imageUrl.length / 1024);
          console.log(`  - Image size: ${imageSize}KB`);
          console.log(`  - Image format valid: ${exercise.imageUrl.startsWith('data:image/')}`);
          
          // Check if image data is truncated
          const expectedEnd = exercise.imageUrl.endsWith('=') || exercise.imageUrl.endsWith('==');
          console.log(`  - Image data complete: ${expectedEnd ? '✅' : '⚠️ Possibly truncated'}`);
        } else {
          console.log(`  - Image missing: ❌`);
        }
      });
    }
    
    // Check total payload size breakdown
    console.log('\n3. Payload size breakdown...');
    const exercisesSize = JSON.stringify(sessionData.exercises).length;
    const exercisesSizeKB = Math.round(exercisesSize / 1024);
    
    console.log('- Exercises data size:', exercisesSizeKB, 'KB');
    console.log('- Other data size:', responseSizeKB - exercisesSizeKB, 'KB');
    
    // Calculate image sizes
    let totalImageSize = 0;
    if (sessionData.exercises) {
      sessionData.exercises.forEach(ex => {
        if (ex.imageUrl) {
          totalImageSize += ex.imageUrl.length;
        }
      });
    }
    const totalImageSizeKB = Math.round(totalImageSize / 1024);
    console.log('- Total image data size:', totalImageSizeKB, 'KB');
    
    // Check if this could be a browser memory issue
    console.log('\n4. Browser compatibility check...');
    console.log('- Total payload size:', responseSizeKB, 'KB');
    console.log('- Browser memory concern:', responseSizeKB > 1000 ? '⚠️ Large payload' : '✅ Reasonable size');
    
    // Test a smaller session for comparison
    console.log('\n5. Testing smaller session for comparison...');
    try {
      const smallResponse = await fetch(`${baseUrl}/api/simple-api/sessions/TESTPIXRGQ/download-json`);
      if (smallResponse.ok) {
        const smallText = await smallResponse.text();
        const smallSizeKB = Math.round(smallText.length / 1024);
        console.log('- Small session (TESTPIXRGQ) size:', smallSizeKB, 'KB');
        
        const smallData = JSON.parse(smallText);
        const smallImagesCount = smallData.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0;
        console.log('- Small session images:', smallImagesCount, '/', smallData.exercises?.length || 0);
      }
    } catch (error) {
      console.log('- Small session test failed:', error.message);
    }
    
    console.log('\n🎯 ANALYSIS:');
    if (responseSizeKB > 1000) {
      console.log('- Large response size may cause browser issues');
      console.log('- Consider image compression or chunked loading');
    } else {
      console.log('- Response size is reasonable');
      console.log('- Issue likely not related to size limits');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🏁 Response size debug completed');
};

// Run the debug
debugResponseSize();