// Test if database has the new columns
const testDatabaseColumns = async () => {
  console.log('🧪 Testing database columns...');
  
  try {
    console.log('📤 Checking session TEST123...');
    const response = await fetch('https://nyirad.vercel.app/api/simple-api/sessions/TEST123/check');

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
    } else {
      const result = await response.json();
      console.log('✅ Session check response:', result);
    }

    // Test download endpoint
    console.log('📤 Testing download endpoint...');
    const downloadResponse = await fetch('https://nyirad.vercel.app/api/simple-api/sessions/TEST123/download');
    console.log('📡 Download response status:', downloadResponse.status);
    
    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.error('❌ Download error:', errorText);
    } else {
      const downloadResult = await downloadResponse.json();
      console.log('✅ Download response:', downloadResult);
    }

  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Run the test
testDatabaseColumns();