// Check data size of the latest session in Supabase
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

async function checkLatestSession() {
  console.log('🔍 Fetching latest session...\n');
  
  // Get the latest session
  const { data: sessions, error: sessionError } = await supabase
    .from('teacher_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (sessionError || !sessions || sessions.length === 0) {
    console.error('❌ No sessions found:', sessionError);
    return;
  }
  
  const session = sessions[0];
  
  console.log('📊 Latest Session:', {
    code: session.session_code,
    subject: session.subject,
    class: session.class_name,
    created: new Date(session.created_at).toLocaleString('hu-HU'),
    is_active: session.is_active,
    expires: new Date(session.expires_at).toLocaleString('hu-HU')
  });
  
  console.log('\n📏 Session Data Size Analysis:\n');
  
  // Calculate session row size
  const sessionSize = estimateSize(session);
  console.log(`Session row total: ${formatBytes(sessionSize)}`);
  
  // Break down by field
  const fields = {
    'session_code': session.session_code,
    'subject': session.subject,
    'class_name': session.class_name,
    'exercises': session.exercises,
    'max_possible_score': session.max_possible_score,
    'is_active': session.is_active,
    'created_at': session.created_at,
    'expires_at': session.expires_at,
    'updated_at': session.updated_at,
    'session_json_url': session.session_json_url,
    'full_session_json': session.full_session_json,
    'json_uploaded_at': session.json_uploaded_at
  };
  
  console.log('\nField breakdown:');
  let totalFieldSize = 0;
  for (const [key, value] of Object.entries(fields)) {
    const size = estimateSize(value);
    totalFieldSize += size;
    if (size > 100) { // Only show fields larger than 100 bytes
      console.log(`  ${key}: ${formatBytes(size)}`);
    }
  }
  
  // Get participants for this session
  const { data: participants, error: participantsError } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', session.id);
  
  if (participantsError) {
    console.error('❌ Error fetching participants:', participantsError);
    return;
  }
  
  console.log(`\n👥 Participants: ${participants.length}`);
  
  if (participants.length > 0) {
    let totalParticipantsSize = 0;
    let largestParticipant = null;
    let largestSize = 0;
    
    participants.forEach(p => {
      const size = estimateSize(p);
      totalParticipantsSize += size;
      if (size > largestSize) {
        largestSize = size;
        largestParticipant = p;
      }
    });
    
    console.log(`\nParticipants total size: ${formatBytes(totalParticipantsSize)}`);
    console.log(`Average per participant: ${formatBytes(totalParticipantsSize / participants.length)}`);
    console.log(`Largest participant: ${formatBytes(largestSize)} (${largestParticipant.student_name})`);
    
    // Analyze largest participant
    if (largestParticipant) {
      console.log('\nLargest participant breakdown:');
      const pFields = {
        'student_name': largestParticipant.student_name,
        'student_class': largestParticipant.student_class,
        'total_score': largestParticipant.total_score,
        'completed_exercises': largestParticipant.completed_exercises,
        'percentage': largestParticipant.percentage,
        'results': largestParticipant.results,
        'performance_category': largestParticipant.performance_category,
        'joined_at': largestParticipant.joined_at,
        'last_seen': largestParticipant.last_seen,
        'is_online': largestParticipant.is_online
      };
      
      for (const [key, value] of Object.entries(pFields)) {
        const size = estimateSize(value);
        if (size > 50) { // Only show fields larger than 50 bytes
          console.log(`  ${key}: ${formatBytes(size)}`);
        }
      }
    }
    
    // Total size
    console.log('\n' + '='.repeat(50));
    console.log(`📊 TOTAL SESSION SIZE: ${formatBytes(sessionSize + totalParticipantsSize)}`);
    console.log('='.repeat(50));
    
    // Breakdown
    console.log('\nBreakdown:');
    console.log(`  Session metadata: ${formatBytes(sessionSize)} (${Math.round(sessionSize / (sessionSize + totalParticipantsSize) * 100)}%)`);
    console.log(`  Participants data: ${formatBytes(totalParticipantsSize)} (${Math.round(totalParticipantsSize / (sessionSize + totalParticipantsSize) * 100)}%)`);
    
    // Check for images in exercises
    if (session.exercises && session.exercises.length > 0) {
      console.log('\n🖼️ Checking for images in exercises...');
      let hasImages = false;
      session.exercises.forEach((ex, index) => {
        if (ex.imageUrl) {
          hasImages = true;
          const isBase64 = ex.imageUrl.startsWith('data:image');
          const isDriveUrl = ex.imageUrl.includes('drive.google.com');
          console.log(`  Exercise ${index + 1}: ${isBase64 ? '❌ BASE64 IMAGE' : isDriveUrl ? '✅ Drive URL' : '⚠️ Unknown URL'}`);
          if (isBase64) {
            console.log(`    Size: ${formatBytes(estimateSize(ex.imageUrl))}`);
          }
        }
      });
      if (!hasImages) {
        console.log('  ✅ No images in exercises metadata (good!)');
      }
    }
    
    // Check for images in results
    console.log('\n🖼️ Checking for images in participant results...');
    let resultsWithImages = 0;
    participants.forEach(p => {
      if (p.results && Array.isArray(p.results)) {
        p.results.forEach(r => {
          if (r.imageUrl && r.imageUrl.startsWith('data:image')) {
            resultsWithImages++;
          }
        });
      }
    });
    if (resultsWithImages > 0) {
      console.log(`  ❌ Found ${resultsWithImages} results with BASE64 images!`);
    } else {
      console.log('  ✅ No BASE64 images in results (good!)');
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (sessionSize > 10000) {
      console.log('  ⚠️ Session metadata is large (>10KB). Consider removing full_session_json if present.');
    }
    if (totalParticipantsSize / participants.length > 2000) {
      console.log('  ⚠️ Average participant size is large (>2KB). Check for unnecessary data in results.');
    }
    if (sessionSize + totalParticipantsSize < 50000) {
      console.log('  ✅ Total size is good (<50KB). Minimal Supabase egress!');
    } else if (sessionSize + totalParticipantsSize < 100000) {
      console.log('  ⚠️ Total size is moderate (50-100KB). Consider optimization.');
    } else {
      console.log('  ❌ Total size is large (>100KB). Optimization needed!');
    }
  }
}

checkLatestSession().catch(console.error);
