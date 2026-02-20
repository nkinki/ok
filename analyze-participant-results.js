// Analyze what's stored in participant results
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function estimateSize(obj) {
  return new Blob([JSON.stringify(obj)]).size;
}

async function analyzeResults() {
  // Get latest session
  const { data: sessions } = await supabase
    .from('teacher_sessions')
    .select('id, session_code')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (!sessions || sessions.length === 0) {
    console.error('❌ No sessions found');
    return;
  }
  
  const session = sessions[0];
  console.log(`📊 Analyzing session: ${session.session_code}\n`);
  
  // Get one participant with results
  const { data: participants } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', session.id)
    .not('results', 'is', null)
    .limit(1);
  
  if (!participants || participants.length === 0) {
    console.error('❌ No participants with results found');
    return;
  }
  
  const participant = participants[0];
  console.log(`👤 Participant: ${participant.student_name}`);
  console.log(`📝 Results count: ${participant.results?.length || 0}\n`);
  
  if (participant.results && participant.results.length > 0) {
    const firstResult = participant.results[0];
    
    console.log('📋 First result structure:');
    console.log(JSON.stringify(firstResult, null, 2));
    
    console.log('\n📏 Field sizes in first result:');
    for (const [key, value] of Object.entries(firstResult)) {
      const size = estimateSize(value);
      console.log(`  ${key}: ${formatBytes(size)}`);
    }
    
    console.log('\n📊 Total results array size:', formatBytes(estimateSize(participant.results)));
    
    // Check what fields are unnecessary
    console.log('\n💡 Unnecessary fields that should be removed:');
    const unnecessaryFields = [];
    
    if (firstResult.imageUrl) {
      unnecessaryFields.push('imageUrl');
      console.log(`  ❌ imageUrl: ${formatBytes(estimateSize(firstResult.imageUrl))} - NOT NEEDED`);
    }
    if (firstResult.instruction) {
      unnecessaryFields.push('instruction');
      console.log(`  ❌ instruction: ${formatBytes(estimateSize(firstResult.instruction))} - NOT NEEDED`);
    }
    if (firstResult.title) {
      unnecessaryFields.push('title');
      console.log(`  ⚠️ title: ${formatBytes(estimateSize(firstResult.title))} - Could be removed`);
    }
    if (firstResult.content) {
      unnecessaryFields.push('content');
      console.log(`  ❌ content: ${formatBytes(estimateSize(firstResult.content))} - NOT NEEDED`);
    }
    if (firstResult.options) {
      unnecessaryFields.push('options');
      console.log(`  ❌ options: ${formatBytes(estimateSize(firstResult.options))} - NOT NEEDED`);
    }
    
    // Calculate optimized size
    const optimizedResult = {
      exerciseIndex: firstResult.exerciseIndex,
      isCorrect: firstResult.isCorrect,
      score: firstResult.score,
      timeSpent: firstResult.timeSpent
    };
    
    const optimizedResults = participant.results.map(r => ({
      exerciseIndex: r.exerciseIndex,
      isCorrect: r.isCorrect,
      score: r.score,
      timeSpent: r.timeSpent
    }));
    
    console.log('\n✅ Optimized result structure:');
    console.log(JSON.stringify(optimizedResult, null, 2));
    
    console.log('\n📊 Size comparison:');
    console.log(`  Current: ${formatBytes(estimateSize(participant.results))}`);
    console.log(`  Optimized: ${formatBytes(estimateSize(optimizedResults))}`);
    console.log(`  Savings: ${formatBytes(estimateSize(participant.results) - estimateSize(optimizedResults))} (${Math.round((1 - estimateSize(optimizedResults) / estimateSize(participant.results)) * 100)}%)`);
  }
}

analyzeResults().catch(console.error);
