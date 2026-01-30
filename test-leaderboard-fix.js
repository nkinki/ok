// Test script to verify leaderboard only shows actual participants
import fetch from 'node-fetch';

async function testLeaderboard() {
    console.log('🧪 Testing leaderboard API fix...');
    
    try {
        // Test basic API connection first
        console.log('🔍 Testing basic API connection...');
        const basicResponse = await fetch('http://localhost:3002/api/simple-api');
        const basicData = await basicResponse.text();
        
        console.log('📊 Basic API response:', basicData.substring(0, 100));
        
        // Now test session check
        const sessionCode = 'FHBW7Y';
        
        console.log('🔍 Checking if session exists...');
        const checkResponse = await fetch(`http://localhost:3002/api/simple-api/sessions/${sessionCode}/check`);
        const checkText = await checkResponse.text();
        
        console.log('📊 Session check response status:', checkResponse.status);
        console.log('📊 Session check response:', checkText.substring(0, 200));
        
        console.log('📊 API Response Status:', response.status);
        console.log('📊 API Response:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ Leaderboard loaded successfully');
            console.log('👥 Total participants:', data.totalParticipants);
            console.log('🏆 Leaderboard entries:', data.leaderboard.length);
            
            // Check if participants have actual results
            data.leaderboard.forEach((participant, index) => {
                console.log(`${index + 1}. ${participant.name} (${participant.class}) - ${participant.percentage}% - ${participant.score} pont - ${participant.totalQuestions} kérdés`);
            });
            
            if (data.leaderboard.length === 1) {
                console.log('✅ SUCCESS: Only showing actual participants (1 participant)');
            } else {
                console.log(`⚠️ WARNING: Showing ${data.leaderboard.length} participants, expected 1`);
            }
        } else {
            console.log('❌ Failed to load leaderboard:', data.error);
        }
        
    } catch (error) {
        console.error('❌ Error testing leaderboard:', error.message);
    }
}

testLeaderboard();