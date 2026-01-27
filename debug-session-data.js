// Debug what's actually stored in the database for session exercises

const API_BASE = 'https://nyirad.vercel.app';

async function debugSessionData() {
  console.log('🔍 Debugging session data structure...');
  
  try {
    // Check the current session HYM7L0
    console.log('📊 Checking session HYM7L0 exercises...');
    
    const exercisesResponse = await fetch(`${API_BASE}/api/simple-api/sessions/HYM7L0/exercises`);
    
    if (!exercisesResponse.ok) {
      console.error('❌ Failed to get exercises:', exercisesResponse.status);
      return;
    }
    
    const sessionData = await exercisesResponse.json();
    
    console.log('📊 Session data structure:');
    console.log('- Session code:', sessionData.sessionCode);
    console.log('- Exercise count:', sessionData.exercises?.length || 0);
    
    if (sessionData.exercises && sessionData.exercises.length > 0) {
      sessionData.exercises.forEach((exercise, index) => {
        console.log(`\n📋 Exercise ${index + 1}:`);
        console.log('- ID:', exercise.id);
        console.log('- Title:', exercise.title);
        console.log('- Type:', exercise.type);
        console.log('- Has content:', !!exercise.content);
        
        if (exercise.content) {
          console.log('- Content keys:', Object.keys(exercise.content));
          
          // Check for questions/pairs/items
          if (exercise.type === 'QUIZ' && exercise.content.questions) {
            console.log('- Questions count:', exercise.content.questions.length);
            console.log('- First question:', exercise.content.questions[0]?.question || 'N/A');
          } else if (exercise.type === 'MATCHING' && exercise.content.pairs) {
            console.log('- Pairs count:', exercise.content.pairs.length);
          } else if (exercise.type === 'CATEGORIZATION' && exercise.content.items) {
            console.log('- Items count:', exercise.content.items.length);
          } else {
            console.log('- Content structure:', JSON.stringify(exercise.content, null, 2));
          }
        } else {
          console.log('❌ No content found for this exercise!');
        }
      });
      
      // Calculate total questions manually
      let totalQuestions = 0;
      sessionData.exercises.forEach(exercise => {
        if (exercise.type === 'QUIZ' && exercise.content?.questions) {
          totalQuestions += exercise.content.questions.length;
        } else if (exercise.type === 'MATCHING' && exercise.content?.pairs) {
          totalQuestions += exercise.content.pairs.length;
        } else if (exercise.type === 'CATEGORIZATION' && exercise.content?.items) {
          totalQuestions += exercise.content.items.length;
        }
      });
      
      console.log('\n📊 Manual question count calculation:');
      console.log('- Total questions:', totalQuestions);
      console.log('- Max possible score (10 points/question):', totalQuestions * 10);
      
      if (totalQuestions === 0) {
        console.error('❌ PROBLEM: No questions found in exercises!');
        console.error('💡 This explains why percentage is always 0');
        console.error('🔧 The exercises in the database are missing content data');
      } else {
        console.log('✅ Questions found - percentage calculation should work');
      }
      
    } else {
      console.error('❌ No exercises found in session data');
    }
    
    // Also check the download-json endpoint to see if it has better data
    console.log('\n📥 Checking download-json endpoint...');
    
    const downloadResponse = await fetch(`${API_BASE}/api/simple-api/sessions/HYM7L0/download-json`);
    
    if (downloadResponse.ok) {
      const downloadData = await downloadResponse.json();
      
      console.log('📊 Download JSON data:');
      console.log('- Exercise count:', downloadData.exercises?.length || 0);
      
      if (downloadData.exercises && downloadData.exercises.length > 0) {
        let downloadTotalQuestions = 0;
        downloadData.exercises.forEach((exercise, index) => {
          console.log(`\n📋 Download Exercise ${index + 1}:`);
          console.log('- Type:', exercise.type);
          console.log('- Has content:', !!exercise.content);
          
          if (exercise.content) {
            if (exercise.type === 'QUIZ' && exercise.content.questions) {
              console.log('- Questions count:', exercise.content.questions.length);
              downloadTotalQuestions += exercise.content.questions.length;
            } else if (exercise.type === 'MATCHING' && exercise.content.pairs) {
              console.log('- Pairs count:', exercise.content.pairs.length);
              downloadTotalQuestions += exercise.content.pairs.length;
            } else if (exercise.type === 'CATEGORIZATION' && exercise.content.items) {
              console.log('- Items count:', exercise.content.items.length);
              downloadTotalQuestions += exercise.content.items.length;
            }
          }
        });
        
        console.log('\n📊 Download JSON question count:');
        console.log('- Total questions:', downloadTotalQuestions);
        
        if (downloadTotalQuestions > 0 && totalQuestions === 0) {
          console.log('💡 SOLUTION: Use full_session_json data for percentage calculation!');
        }
      }
    } else {
      console.log('❌ Download JSON failed');
    }
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  }
}

// Run the debug
debugSessionData();