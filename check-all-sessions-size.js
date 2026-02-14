// Check all Supabase sessions data size
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

async function checkAllSessions() {
  console.log('🔍 Checking all sessions data size...\n');

  // Get all sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('teacher_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (sessionsError) {
    console.error('❌ Error fetching sessions:', sessionsError.message);
    return;
  }

  console.log(`📊 TOTAL SESSIONS: ${sessions.length}\n`);

  let totalSize = 0;
  let totalParticipants = 0;
  let hasImagesCount = 0;

  for (const session of sessions) {
    const sessionJson = JSON.stringify(session);
    const sessionSize = new Blob([sessionJson]).size;
    totalSize += sessionSize;

    // Check for images
    let hasImages = false;
    if (session.exercises) {
      session.exercises.forEach((ex) => {
        if (ex.imageUrl && ex.imageUrl.startsWith('data:image')) {
          hasImages = true;
        }
        if (ex.content && JSON.stringify(ex.content).includes('data:image')) {
          hasImages = true;
        }
      });
    }
    if (session.full_session_json && JSON.stringify(session.full_session_json).includes('data:image')) {
      hasImages = true;
    }

    if (hasImages) hasImagesCount++;

    // Get participants
    const { data: participants } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', session.id);

    const participantCount = participants?.length || 0;
    totalParticipants += participantCount;

    let participantsSize = 0;
    if (participants) {
      participants.forEach(p => {
        const pJson = JSON.stringify(p);
        participantsSize += new Blob([pJson]).size;
      });
    }

    console.log(`📦 ${session.session_code} (${session.subject}/${session.class_name})`);
    console.log(`   Session: ${(sessionSize / 1024).toFixed(2)} KB | Participants: ${participantCount} (${(participantsSize / 1024).toFixed(2)} KB)`);
    console.log(`   Max score: ${session.max_possible_score} | ${hasImages ? '⚠️ HAS IMAGES' : '✅ No images'}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════');
  console.log(`📊 ÖSSZESÍTÉS:`);
  console.log(`   Sessions: ${sessions.length}`);
  console.log(`   Participants: ${totalParticipants}`);
  console.log(`   Total size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`   Average per session: ${(totalSize / sessions.length / 1024).toFixed(2)} KB`);
  console.log(`   Sessions with images: ${hasImagesCount}`);
  console.log('═══════════════════════════════════════════');

  // Estimate for 100 sessions with 20 students each
  const avgSessionSize = totalSize / sessions.length;
  const avgParticipantSize = 500; // bytes per participant (estimate)
  const estimated100Sessions = (avgSessionSize * 100 + avgParticipantSize * 20 * 100) / 1024 / 1024;
  
  console.log(`\n📈 BECSLÉS 100 munkamenetre (20 diák/munkamenet):`);
  console.log(`   Estimated size: ${estimated100Sessions.toFixed(2)} MB`);
  console.log(`   Per session: ${(estimated100Sessions * 1024 / 100).toFixed(2)} KB`);
}

checkAllSessions().catch(console.error);
