// Debug session 02WRNT to check max_possible_score
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSession() {
  const sessionCode = '02WRNT';
  
  console.log('🔍 Debugging session:', sessionCode);
  console.log('');
  
  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('teacher_sessions')
    .select('*')
    .eq('session_code', sessionCode)
    .single();
  
  if (sessionError || !session) {
    console.error('❌ Session not found:', sessionError);
    return;
  }
  
  console.log('📊 SESSION DATA:');
  console.log('  Code:', session.session_code);
  console.log('  ID:', session.id);
  console.log('  max_possible_score:', session.max_possible_score);
  console.log('  Exercise count:', session.exercises?.length || 0);
  console.log('  Is active:', session.is_active);
  console.log('  Created:', session.created_at);
  console.log('');
  
  // Calculate what max_possible_score SHOULD be
  let calculatedMaxScore = 0;
  if (session.exercises) {
    session.exercises.forEach((ex, index) => {
      console.log(`  Exercise ${index + 1}:`, {
        type: ex.type,
        title: ex.title,
        hasContent: !!ex.content
      });
      
      if (ex.type === 'QUIZ' && ex.content?.questions) {
        const count = ex.content.questions.length;
        calculatedMaxScore += count * 10;
        console.log(`    → ${count} questions = ${count * 10} points`);
      } else if (ex.type === 'MATCHING' && ex.content?.pairs) {
        const count = ex.content.pairs.length;
        calculatedMaxScore += count * 10;
        console.log(`    → ${count} pairs = ${count * 10} points`);
      } else if (ex.type === 'CATEGORIZATION' && ex.content?.items) {
        const count = ex.content.items.length;
        calculatedMaxScore += count * 10;
        console.log(`    → ${count} items = ${count * 10} points`);
      } else {
        console.log(`    → No content or unknown type`);
      }
    });
  }
  
  console.log('');
  console.log('📊 SCORE COMPARISON:');
  console.log('  Stored max_possible_score:', session.max_possible_score);
  console.log('  Calculated max_possible_score:', calculatedMaxScore);
  console.log('  Match:', session.max_possible_score === calculatedMaxScore ? '✅ YES' : '❌ NO');
  console.log('');
  
  // Get some participants
  const { data: participants, error: participantsError } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', session.id)
    .limit(5);
  
  if (participantsError) {
    console.error('❌ Error fetching participants:', participantsError);
    return;
  }
  
  console.log('👥 SAMPLE PARTICIPANTS (first 5):');
  participants.forEach((p, index) => {
    const storedPercentage = p.percentage || 0;
    const calculatedPercentage = session.max_possible_score > 0 
      ? Math.round((p.total_score / session.max_possible_score) * 100)
      : 0;
    
    console.log(`  ${index + 1}. ${p.student_name}:`);
    console.log(`     Total score: ${p.total_score}`);
    console.log(`     Stored percentage: ${storedPercentage}%`);
    console.log(`     Calculated percentage (using stored max): ${calculatedPercentage}%`);
    console.log(`     Match: ${storedPercentage === calculatedPercentage ? '✅' : '❌'}`);
  });
  
  console.log('');
  console.log('🔍 DIAGNOSIS:');
  if (session.max_possible_score === 0) {
    console.log('  ❌ CRITICAL: max_possible_score is 0!');
    console.log('  → This will cause all percentages to show as 0%');
    console.log('  → Solution: Update max_possible_score to', calculatedMaxScore);
  } else if (session.max_possible_score !== calculatedMaxScore) {
    console.log('  ⚠️ WARNING: max_possible_score mismatch!');
    console.log('  → Stored:', session.max_possible_score);
    console.log('  → Should be:', calculatedMaxScore);
  } else {
    console.log('  ✅ max_possible_score is correct');
    console.log('  → If percentages still show 0%, check frontend code');
  }
}

debugSession().catch(console.error);
