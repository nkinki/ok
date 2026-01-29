// Debug script to understand why images are missing for second exercise

const debugMissingImage = () => {
  console.log('🔍 Debugging missing image issue...');
  
  // Simulate the getImageUrl function logic
  const getImageUrl = (item) => {
    console.log('\n📊 getImageUrl called with item:', {
      id: item?.id,
      hasImageUrl: !!item?.imageUrl,
      imageUrlLength: item?.imageUrl?.length || 0,
      imageUrlPreview: item?.imageUrl?.substring(0, 50) || 'none'
    });
    
    // If imageUrl is directly available, use it
    if (item.imageUrl) {
      console.log('✅ Direct imageUrl found');
      return item.imageUrl;
    }
    
    console.log('⚠️ No direct imageUrl, trying localStorage fallback...');
    
    // For optimized format without imageUrl, try to construct from localStorage
    const libraryKey = 'exerciseLibrary';
    try {
      // Simulate localStorage check (can't actually access in Node.js)
      console.log('📦 Would check localStorage for key:', libraryKey);
      console.log('📦 Would look for item with id:', item?.id);
      
      // In real scenario, this would find the item in localStorage
      // const savedLibrary = localStorage.getItem(libraryKey);
      // if (savedLibrary) {
      //   const library = JSON.parse(savedLibrary);
      //   const foundItem = library.find((libItem) => libItem.id === item.id);
      //   if (foundItem && foundItem.imageUrl) {
      //     return foundItem.imageUrl;
      //   }
      // }
      
      console.log('❌ localStorage fallback would fail (no match found)');
    } catch (error) {
      console.warn('❌ localStorage fallback error:', error.message);
    }
    
    console.log('❌ Returning empty string - no image found');
    return '';
  };
  
  // Test scenarios based on the log data
  console.log('\n🧪 Testing different exercise scenarios:');
  
  // Scenario 1: Exercise with imageUrl (working)
  const exercise1 = {
    id: 'bulk-1768811651360-0',
    imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...(530379 chars)',
    type: 'QUIZ',
    title: 'First Exercise'
  };
  
  console.log('\n✅ Exercise 1 (working):');
  const result1 = getImageUrl(exercise1);
  console.log('- Has image:', result1.length > 0);
  
  // Scenario 2: Exercise without imageUrl (broken)
  const exercise2 = {
    id: 'bulk-1768811651360-1',
    imageUrl: '', // Empty or missing
    type: 'QUIZ',
    title: 'Second Exercise'
  };
  
  console.log('\n❌ Exercise 2 (broken):');
  const result2 = getImageUrl(exercise2);
  console.log('- Has image:', result2.length > 0);
  
  // Scenario 3: Exercise with null/undefined imageUrl
  const exercise3 = {
    id: 'bulk-1768811651360-2',
    imageUrl: null,
    type: 'QUIZ',
    title: 'Third Exercise'
  };
  
  console.log('\n❌ Exercise 3 (null imageUrl):');
  const result3 = getImageUrl(exercise3);
  console.log('- Has image:', result3.length > 0);
  
  console.log('\n🎯 Analysis:');
  console.log('- First exercise: Has imageUrl → Image displays ✅');
  console.log('- Second exercise: Missing/empty imageUrl → No image ❌');
  console.log('- localStorage fallback: Not working (item not found) ❌');
  
  console.log('\n🔧 Possible causes:');
  console.log('1. Session JSON missing imageUrl for second exercise');
  console.log('2. Image data lost during session transfer');
  console.log('3. Database full_session_json incomplete');
  console.log('4. API not returning complete exercise data');
  
  console.log('\n💡 Solutions:');
  console.log('1. Check session JSON in database for complete image data');
  console.log('2. Verify API returns all exercises with images');
  console.log('3. Add better error handling for missing images');
  console.log('4. Implement image lazy loading from API if missing');
  
  console.log('\n📋 Debug steps:');
  console.log('1. Check database: SELECT full_session_json FROM teacher_sessions WHERE session_code = "UGRRCF"');
  console.log('2. Verify all exercises have imageUrl in the JSON');
  console.log('3. Check if images are being stripped during API transfer');
  console.log('4. Test with fresh session creation');
};

// Run the debug
debugMissingImage();