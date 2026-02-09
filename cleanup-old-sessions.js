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
  console.error('❌ Hiányzó Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOldSessions() {
  console.log('🧹 Régi munkamenetek törlése...\n');

  try {
    // 1. Find expired sessions older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log(`📅 Keresés: ${sevenDaysAgo.toLocaleString('hu-HU')} előtti lejárt munkamenetek\n`);

    const { data: oldSessions, error: findError } = await supabase
      .from('teacher_sessions')
      .select('id, session_code, created_at, expires_at')
      .lt('expires_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (findError) {
      console.error('❌ Hiba a keresés során:', findError);
      return;
    }

    if (!oldSessions || oldSessions.length === 0) {
      console.log('✅ Nincsenek törlendő munkamenetek!');
      return;
    }

    console.log(`🔍 Talált munkamenetek: ${oldSessions.length}\n`);

    // Show what will be deleted
    console.log('📋 TÖRLÉSRE JELÖLT MUNKAMENETEK:\n');
    oldSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.session_code}`);
      console.log(`   Létrehozva: ${new Date(session.created_at).toLocaleString('hu-HU')}`);
      console.log(`   Lejárt: ${new Date(session.expires_at).toLocaleString('hu-HU')}`);
      console.log('');
    });

    // Ask for confirmation (in production, you might want to skip this)
    console.log('⚠️  FIGYELEM: Ez a művelet törli a munkameneteket és a hozzájuk tartozó résztvevőket!\n');
    
    // Delete participants first (due to foreign key constraint)
    const sessionIds = oldSessions.map(s => s.id);
    
    const { error: participantsError } = await supabase
      .from('session_participants')
      .delete()
      .in('session_id', sessionIds);

    if (participantsError) {
      console.error('❌ Hiba a résztvevők törlésekor:', participantsError);
      return;
    }

    console.log('✅ Résztvevők törölve');

    // Delete sessions
    const { error: sessionsError } = await supabase
      .from('teacher_sessions')
      .delete()
      .in('id', sessionIds);

    if (sessionsError) {
      console.error('❌ Hiba a munkamenetek törlésekor:', sessionsError);
      return;
    }

    console.log('✅ Munkamenetek törölve');
    console.log(`\n🎉 Sikeresen törölve: ${oldSessions.length} munkamenet`);

  } catch (error) {
    console.error('❌ Hiba:', error);
  }
}

// Run cleanup
cleanupOldSessions();
