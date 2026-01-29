// Debug the "A feladat nem tölthető be" error

const API_BASE = 'https://nyirad.vercel.app';

async function debugExerciseError() {
  console.log('🔍 Debugging Exercise Loading Error');
  console.log('===================================\n');
  
  try {
    // Check the specific session from the logs: N6LJHI
    const sessionCode = 'N6LJHI';
    console.log('📋 Checking session:', sessionCode);
    
    // Get session exercises
    const exercisesResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/exercises`);
    
    if (!exercisesResponse.ok) {
      console.log('❌ Failed to get exercises, status:', exercisesResponse.status);
      return;
    }
    
    const exercisesData = await exercisesResponse.json();
    console.log('✅ Session exercises retrieved');
    console.log('📊 Exercise count:', exercisesData.exercises?.length || 0);
    
    if (exercisesData.exercises && exercisesData.exercises.length > 0) {
      console.log('\n📝 Exercise Analysis:');
      
      exercisesData.exercises.forEach((exercise, index) => {
        console.log(`\n${index + 1}. Exercise Analysis:`);
        console.log('- ID:', exercise.id || 'missing');
        console.log('- Title:', exercise.title || 'missing');
        console.log('- Type:', exercise.type || 'missing');
        console.log('- Has content:', !!exercise.content);
        console.log('- Has imageUrl:', !!exercise.imageUrl);
        console.log('- ImageUrl length:', exercise.imageUrl?.length || 0);
        
        if (exercise.content) {
          console.log('- Content keys:', Object.keys(exercise.content));
          
          if (exercise.type === 'QUIZ' && exercise.content.questions) {
            console.log('- Questions count:', exercise.content.questions.length);
            exercise.content.questions.forEach((q, qIndex) => {
              console.log(`  Q${qIndex + 1}: "${q.question}" (${q.options?.length || 0} options)`);
            });
          } else if (exercise.type === 'MATCHING' && exercise.content.pairs) {
            console.log('- Pairs count:', exercise.content.pairs.length);
          } else if (exercise.type === 'CATEGORIZATION' && exercise.content.items) {
            console.log('- Items count:', exercise.content.items.length);
          }
        } else {
          console.log('❌ No content found!');
        }
        
        // Check for common issues
        const issues = [];
        if (!exercise.id) issues.push('Missing ID');
        if (!exercise.title) issues.push('Missing title');
        if (!exercise.type) issues.push('Missing type');
        if (!exercise.content) issues.push('Missing content');
        if (exercise.type === 'QUIZ' && !exercise.content?.questions) issues.push('Missing questions');
        if (exercise.type === 'MATCHING' && !exercise.content?.pairs) issues.push('Missing pairs');
        if (exercise.type === 'CATEGORIZATION' && !exercise.content?.items) issues.push('Missing items');
        
        if (issues.length > 0) {
          console.log('❌ Issues found:', issues.join(', '));
        } else {
          console.log('✅ Exercise structure looks good');
        }
      });
    } else {
      console.log('❌ No exercises found in session');
    }
    
    // Also check the download-json endpoint
    console.log('\n📥 Checking download-json endpoint...');
    const downloadResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/download-json`);
    
    if (downloadResponse.ok) {
      const downloadData = await downloadResponse.json();
      console.log('✅ Download JSON successful');
      console.log('📊 Download exercise count:', downloadData.exercises?.length || 0);
      
      if (downloadData.exercises && downloadData.exercises.length > 0) {
        console.log('\n📝 Download JSON Exercise Analysis:');
        downloadData.exercises.forEach((exercise, index) => {
          console.log(`${index + 1}. ${exercise.title} (${exercise.type})`);
          console.log('   - Has content:', !!exercise.content);
          console.log('   - ImageUrl length:', exercise.imageUrl?.length || 0);
        });
      }
    } else {
      console.log('❌ Download JSON failed, status:', downloadResponse.status);
    }
    
    // Check participants to see if results are being saved
    console.log('\n👥 Checking participants...');
    const participantsResponse = await fetch(`${API_BASE}/api/simple-api/sessions/${sessionCode}/participants`);
    
    if (participantsResponse.ok) {
      const participantsData = await participantsResponse.json();
      console.log('✅ Participants retrieved');
      console.log('📊 Participant count:', participantsData.participants?.length || 0);
      
      if (participantsData.participants && participantsData.participants.length > 0) {
        console.log('\n👤 Recent Participants:');
        participantsData.participants.slice(0, 3).forEach((p, index) => {
          console.log(`${index + 1}. ${p.student_name} (${p.student_class})`);
          console.log(`   - Score: ${p.total_score} points`);
          console.log(`   - Percentage: ${p.percentage}%`);
          console.log(`   - Results: ${p.results?.length || 0}`);
          console.log(`   - Last seen: ${p.last_seen}`);
        });
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('Based on the logs, the session loads successfully but the exercise fails to render.');
    console.log('This could be due to:');
    console.log('1. Missing or corrupted exercise data');
    console.log('2. Frontend rendering issues');
    console.log('3. Image loading problems');
    console.log('4. JavaScript errors in exercise components');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugExerciseError();