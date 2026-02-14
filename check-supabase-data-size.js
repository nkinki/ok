// Check Supabase data size for session GIBR6C
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDataSize() {
  console.log('🔍 Checking data size for session GIBR6C...\n');

  // Get session data
  const { data: session, error: sessionError } = await supabase
    .from('teacher_sessions')
    .select('*')
    .eq('session_code', 'GIBR6C')
    .single();

  if (sessionError) {
    console.error('❌ Error fetching session:', sessionError.message);
    return;
  }

  console.log('📊 SESSION DATA:');
  console.log('Session Code:', session.session_code);
  console.log('Subject:', session.subject);
  console.log('Class:', session.class_name);
  console.log('Max Score:', session.max_possible_score);
  console.log('Created:', session.created_at);
  console.log('\n📦 DATA SIZE ANALYSIS:');
  
  // Check exercises field
  if (session.exercises) {
    const exercisesJson = JSON.stringify(session.exercises);
    const exercisesSize = new Blob([exercisesJson]).size;
    console.log(`Exercises field: ${(exercisesSize / 1024).toFixed(2)} KB`);
    console.log(`  - Exercise count: ${session.exercises.length}`);
    
    // Check if any exercise has imageUrl or content with images
    let hasImages = false;
    session.exercises.forEach((ex, idx) => {
      if (ex.imageUrl && ex.imageUrl.startsWith('data:image')) {
        console.log(`  ⚠️ Exercise ${idx + 1} has BASE64 image in imageUrl!`);
        hasImages = true;
      }
      if (ex.content) {
        const contentStr = JSON.stringify(ex.content);
        if (contentStr.includes('data:image')) {
          console.log(`  ⚠️ Exercise ${idx + 1} has BASE64 image in content!`);
          hasImages = true;
        }
      }
    });
    
    if (!hasImages) {
      console.log('  ✅ No images found in exercises field');
    }
  }
  
  // Check full_session_json field
  if (session.full_session_json) {
    const fullJsonStr = JSON.stringify(session.full_session_json);
    const fullJsonSize = new Blob([fullJsonStr]).size;
    console.log(`\nFull session JSON: ${(fullJsonSize / 1024).toFixed(2)} KB`);
    
    if (fullJsonStr.includes('data:image')) {
      console.log('  ⚠️ Contains BASE64 images!');
      
      // Count images
      const imageMatches = fullJsonStr.match(/data:image/g);
      console.log(`  ⚠️ Found ${imageMatches?.length || 0} BASE64 images`);
    } else {
      console.log('  ✅ No images in full_session_json');
    }
  } else {
    console.log('\nFull session JSON: NOT STORED ✅');
  }
  
  // Total size
  const totalJson = JSON.stringify(session);
  const totalSize = new Blob([totalJson]).size;
  console.log(`\n📊 TOTAL SESSION SIZE: ${(totalSize / 1024).toFixed(2)} KB`);
  
  if (totalSize > 100 * 1024) {
    console.log('⚠️ WARNING: Session data is over 100 KB - likely contains images!');
  } else {
    console.log('✅ Session data size is reasonable (no images)');
  }
  
  // Check participants
  const { data: participants, error: participantsError } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', session.id);
    
  if (!participantsError && participants) {
    console.log(`\n👥 PARTICIPANTS: ${participants.length}`);
    participants.forEach(p => {
      const resultsJson = JSON.stringify(p.results || []);
      const resultsSize = new Blob([resultsJson]).size;
      console.log(`  - ${p.student_name} (${p.student_class}): ${p.total_score} pts (${p.percentage}%) - Results: ${(resultsSize / 1024).toFixed(2)} KB`);
      
      // Check if results contain images
      if (resultsJson.includes('data:image')) {
        console.log('    ⚠️ Results contain BASE64 images!');
      }
    });
  }
}

checkDataSize().catch(console.error);
