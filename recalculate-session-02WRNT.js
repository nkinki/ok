// Recalculate percentages for session 02WRNT
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

async function recalculateSession() {
  const sessionCode = '02WRNT';
  
  console.log('🔍 Fetching session:', sessionCode);
  
  // Get session with max_possible_score
  const { data: session, error: sessionError } = await supabase
    .from('teacher_sessions')
    .select('id, session_code, max_possible_score, exercises')
    .eq('session_code', sessionCode)
    .single();
  
  if (sessionError || !session) {
    console.error('❌ Session not found:', sessionError);
    return;
  }
  
  console.log('📊 Session found:', {
    code: session.session_code,
    id: session.id,
    max_possible_score: session.max_possible_score,
    exercise_count: session.exercises?.length || 0
  });
  
  // Get all participants for this session
  const { data: participants, error: participantsError } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', session.id);
  
  if (participantsError) {
    console.error('❌ Error fetching participants:', participantsError);
    return;
  }
  
  console.log(`\n👥 Found ${participants.length} participants\n`);
  
  // Recalculate percentage for each participant
  for (const participant of participants) {
    const totalScore = participant.total_score || 0;
    const maxPossibleScore = session.max_possible_score || 0;
    
    let newPercentage = 0;
    if (maxPossibleScore > 0) {
      newPercentage = Math.round((totalScore / maxPossibleScore) * 100);
      // Cap at 100%
      if (newPercentage > 100) {
        newPercentage = 100;
      }
    }
    
    const oldPercentage = participant.percentage || 0;
    
    console.log(`📊 ${participant.student_name} (${participant.student_class}):`, {
      id: participant.id,
      total_score: totalScore,
      max_possible_score: maxPossibleScore,
      old_percentage: oldPercentage + '%',
      new_percentage: newPercentage + '%',
      changed: oldPercentage !== newPercentage ? '✅ UPDATED' : '⏭️ No change'
    });
    
    // Update participant with new percentage
    if (oldPercentage !== newPercentage) {
      const { error: updateError } = await supabase
        .from('session_participants')
        .update({ 
          percentage: newPercentage,
          performance_category: 
            newPercentage >= 90 ? 'excellent' :
            newPercentage >= 75 ? 'good' :
            newPercentage >= 60 ? 'average' : 'poor'
        })
        .eq('id', participant.id);
      
      if (updateError) {
        console.error('  ❌ Update failed:', updateError);
      } else {
        console.log('  ✅ Updated successfully');
      }
    }
  }
  
  console.log('\n✅ Recalculation complete!');
}

recalculateSession().catch(console.error);
