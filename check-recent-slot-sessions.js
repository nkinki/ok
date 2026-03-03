import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Hiányzó Supabase környezeti változók!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentSlotSessions() {
  console.log('🔍 Legutóbbi SLOT munkamenetek ellenőrzése...\n');

  try {
    // Get all sessions from last 24 hours, ordered by creation time
    const { data: sessions, error: sessionsError } = await supabase
      .from('teacher_sessions')
      .select(`
        *,
        participants:session_participants(*)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error('❌ Hiba a munkamenetek lekérdezésekor:', sessionsError);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('⚠️ Nincsenek munkamenetek az adatbázisban');
      return;
    }

    console.log(`📊 Talált munkamenetek: ${sessions.length}\n`);

    for (const session of sessions) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 Session Code: ${session.session_code}`);
      console.log(`🎰 Slot: ${session.slot_number || 'N/A'}`);
      console.log(`📅 Létrehozva: ${new Date(session.created_at).toLocaleString('hu-HU')}`);
      console.log(`⏰ Lejár: ${session.expires_at ? new Date(session.expires_at).toLocaleString('hu-HU') : 'N/A'}`);
      console.log(`✅ Aktív: ${session.is_active ? 'Igen' : 'Nem'}`);
      console.log(`📊 Max pontszám: ${session.max_possible_score || 'N/A'}`);

      // Get participants from the joined data
      const participants = session.participants || [];

      if (participants && participants.length > 0) {
        console.log(`\n👥 Résztvevők: ${participants.length}`);
        
        participants.forEach((p, index) => {
          console.log(`\n  ${index + 1}. ${p.student_name} (${p.student_class})`);
          console.log(`     📊 Pontszám: ${p.total_score}/${session.max_possible_score || '?'}`);
          console.log(`     📈 Százalék: ${p.percentage}%`);
          console.log(`     ⏱️ Idő: ${new Date(p.joined_at).toLocaleString('hu-HU')}`);
          
          // Check if results data exists
          if (p.results) {
            const resultsSize = JSON.stringify(p.results).length;
            console.log(`     💾 Results méret: ${(resultsSize / 1024).toFixed(2)} KB`);
          } else {
            console.log(`     ⚠️ Nincs results adat`);
          }
        });
      } else {
        console.log('\n⚠️ Még nincsenek résztvevők');
      }
      
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Hiba:', error);
  }
}

checkRecentSlotSessions();
