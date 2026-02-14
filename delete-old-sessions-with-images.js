// Delete old sessions with images
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteOldSessions() {
  console.log('🔍 Finding sessions with images...\n');

  const { data: sessions, error } = await supabase
    .from('teacher_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  const sessionsToDelete = [];

  for (const session of sessions) {
    let hasImages = false;
    
    // Check exercises field
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
    
    // Check full_session_json
    if (session.full_session_json && JSON.stringify(session.full_session_json).includes('data:image')) {
      hasImages = true;
    }

    if (hasImages) {
      const sessionJson = JSON.stringify(session);
      const size = new Blob([sessionJson]).size;
      sessionsToDelete.push({
        code: session.session_code,
        id: session.id,
        size: (size / 1024).toFixed(2) + ' KB'
      });
    }
  }

  console.log(`📊 Found ${sessionsToDelete.length} sessions with images:\n`);
  sessionsToDelete.forEach(s => {
    console.log(`   ${s.code} - ${s.size}`);
  });

  if (sessionsToDelete.length === 0) {
    console.log('\n✅ No sessions with images found!');
    return;
  }

  console.log('\n🗑️  Deleting sessions...\n');

  for (const session of sessionsToDelete) {
    // Delete participants first
    const { error: participantsError } = await supabase
      .from('session_participants')
      .delete()
      .eq('session_id', session.id);

    if (participantsError) {
      console.log(`   ❌ ${session.code} - Failed to delete participants: ${participantsError.message}`);
      continue;
    }

    // Delete session
    const { error: sessionError } = await supabase
      .from('teacher_sessions')
      .delete()
      .eq('id', session.id);

    if (sessionError) {
      console.log(`   ❌ ${session.code} - Failed to delete session: ${sessionError.message}`);
    } else {
      console.log(`   ✅ ${session.code} - Deleted (${session.size})`);
    }
  }

  console.log('\n✅ Cleanup complete!');
}

deleteOldSessions().catch(console.error);
