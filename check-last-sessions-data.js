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
  console.error('❌ Hiányzó Supabase credentials a .env.local fájlból');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateSize(obj) {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
}

async function checkLastSessions() {
  console.log('🔍 Utolsó 2 munkamenet adathasználatának ellenőrzése...\n');

  try {
    // Get last 2 sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('teacher_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);

    if (sessionsError) {
      console.error('❌ Hiba a munkamenetek lekérésekor:', sessionsError);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('⚠️  Nincsenek munkamenetek az adatbázisban');
      return;
    }

    console.log(`📊 Talált munkamenetek: ${sessions.length}\n`);

    let totalSize = 0;

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      console.log(`${'='.repeat(60)}`);
      console.log(`📋 MUNKAMENET #${i + 1}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`🆔 Session ID: ${session.id}`);
      console.log(`🔑 Session Code: ${session.session_code || 'N/A'}`);
      console.log(`📅 Létrehozva: ${new Date(session.created_at).toLocaleString('hu-HU')}`);
      console.log(`⏰ Lejár: ${new Date(session.expires_at).toLocaleString('hu-HU')}`);
      console.log(`📝 Státusz: ${session.is_active ? 'Aktív' : 'Inaktív'}`);
      console.log(`📚 Feladatok száma: ${session.exercises ? (Array.isArray(session.exercises) ? session.exercises.length : 'N/A') : 0}`);

      // Calculate session data size
      const sessionSize = calculateSize(session);
      console.log(`\n📦 Session rekord mérete: ${formatBytes(sessionSize)}`);

      // Get participants for this session
      const { data: participants, error: participantsError } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', session.id);

      let participantsSize = 0;
      if (!participantsError && participants) {
        participantsSize = calculateSize(participants);
        console.log(`👥 Résztvevők száma: ${participants.length}`);
        console.log(`📦 Résztvevők mérete: ${formatBytes(participantsSize)}`);
        
        // Calculate results size from participants
        let totalResultsSize = 0;
        participants.forEach(p => {
          if (p.results) {
            totalResultsSize += calculateSize(p.results);
          }
        });
        if (totalResultsSize > 0) {
          console.log(`📊 Eredmények mérete: ${formatBytes(totalResultsSize)}`);
        }
      }

      // Check if session has exercises data
      let exercisesSize = 0;
      if (session.exercises) {
        exercisesSize = calculateSize(session.exercises);
        console.log(`📚 Feladatok száma: ${Array.isArray(session.exercises) ? session.exercises.length : 'N/A'}`);
        console.log(`📦 Feladatok mérete: ${formatBytes(exercisesSize)}`);
      }

      // Check for images in exercises
      let imageCount = 0;
      let totalImageSize = 0;
      if (session.exercises && Array.isArray(session.exercises)) {
        session.exercises.forEach(ex => {
          if (ex.image) {
            imageCount++;
            totalImageSize += calculateSize(ex.image);
          }
          if (ex.options && Array.isArray(ex.options)) {
            ex.options.forEach(opt => {
              if (opt.image) {
                imageCount++;
                totalImageSize += calculateSize(opt.image);
              }
            });
          }
        });
      }

      if (imageCount > 0) {
        console.log(`🖼️  Képek száma: ${imageCount}`);
        console.log(`📦 Képek mérete: ${formatBytes(totalImageSize)}`);
      }

      const sessionTotal = sessionSize + participantsSize;
      totalSize += sessionTotal;

      console.log(`\n💾 MUNKAMENET ÖSSZESEN: ${formatBytes(sessionTotal)}`);
      console.log(`   ├─ Session: ${formatBytes(sessionSize)}`);
      console.log(`   └─ Résztvevők: ${formatBytes(participantsSize)}`);
      
      if (imageCount > 0) {
        console.log(`   └─ Képek: ${formatBytes(totalImageSize)}`);
      }
      console.log('');
    }

    console.log(`${'='.repeat(60)}`);
    console.log(`📊 ÖSSZESÍTÉS`);
    console.log(`${'='.repeat(60)}`);
    console.log(`💾 Utolsó 2 munkamenet összes adata: ${formatBytes(totalSize)}`);
    console.log(`📈 Átlagos munkamenet méret: ${formatBytes(totalSize / sessions.length)}`);
    
    // Supabase free tier info
    console.log(`\n📋 SUPABASE FREE TIER LIMITEK:`);
    console.log(`   • Adatbázis méret: 500 MB`);
    console.log(`   • Egress (letöltés): 5 GB / hó`);
    console.log(`   • API kérések: 500,000 / hó`);
    
    // Estimate monthly usage
    const estimatedMonthly = (totalSize / 2) * 30; // Assuming 30 sessions per month
    console.log(`\n🔮 BECSÜLT HAVI HASZNÁLAT (30 munkamenet):`);
    console.log(`   • Adattárolás: ${formatBytes(estimatedMonthly)}`);
    console.log(`   • Egress (ha minden letöltődik): ${formatBytes(estimatedMonthly * 2)}`);

  } catch (error) {
    console.error('❌ Hiba:', error);
  }
}

checkLastSessions();
