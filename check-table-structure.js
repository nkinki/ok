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
  console.error('❌ Hiányzó Supabase környezeti változók!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Tábla struktúra ellenőrzése...\n');

  try {
    // Get one session
    const { data: session, error: sessionError } = await supabase
      .from('teacher_sessions')
      .select('*')
      .limit(1)
      .single();

    if (sessionError) {
      console.error('❌ Hiba:', sessionError);
    } else {
      console.log('📋 teacher_sessions tábla mezői:');
      console.log(Object.keys(session));
      console.log('\nPélda rekord:');
      console.log(session);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get one participant
    const { data: participant, error: participantError } = await supabase
      .from('session_participants')
      .select('*')
      .limit(1)
      .single();

    if (participantError) {
      console.error('❌ Hiba:', participantError);
    } else {
      console.log('👥 session_participants tábla mezői:');
      console.log(Object.keys(participant));
      console.log('\nPélda rekord:');
      console.log(participant);
    }

  } catch (error) {
    console.error('❌ Hiba:', error);
  }
}

checkTableStructure();
