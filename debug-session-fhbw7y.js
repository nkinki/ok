// Debug script for session FHBW7Y
const sessionCode = 'FHBW7Y';

console.log('🔍 Debugging session:', sessionCode);

// Test API endpoints
async function testSession() {
    try {
        // 1. Test session check
        console.log('📡 Testing session check...');
        const checkResponse = await fetch(`/api/simple-api/sessions/${sessionCode}/check`);
        const checkData = await checkResponse.json();
        console.log('✅ Session check response:', checkData);

        // 2. Test exercises endpoint
        console.log('📡 Testing exercises endpoint...');
        const exercisesResponse = await fetch(`/api/simple-api/sessions/${sessionCode}/exercises`);
        const exercisesData = await exercisesResponse.json();
        console.log('✅ Exercises response:', exercisesData);

        if (exercisesData.success && exercisesData.exercises) {
            console.log('📊 Exercise count:', exercisesData.exercises.length);
            
            exercisesData.exercises.forEach((exercise, index) => {
                console.log(`🔍 Exercise ${index + 1}:`, {
                    id: exercise.id,
                    title: exercise.data?.title || 'No title',
                    hasImageUrl: !!exercise.imageUrl,
                    imageUrlLength: exercise.imageUrl?.length || 0,
                    imageUrlType: typeof exercise.imageUrl,
                    imageUrlPreview: exercise.imageUrl ? exercise.imageUrl.substring(0, 50) + '...' : 'NONE'
                });
            });
        }

        // 3. Test Google Drive download
        console.log('📡 Testing Google Drive download...');
        const driveResponse = await fetch(`/api/simple-api/sessions/${sessionCode}/download-drive`);
        const driveData = await driveResponse.json();
        console.log('✅ Google Drive response:', driveData);

    } catch (error) {
        console.error('❌ Error testing session:', error);
    }
}

// Run the test
testSession();