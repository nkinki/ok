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

async function checkSession() {
  console.log('🔍 TKMG92 munkamenet ellenőrzése...\n');

  try {
    // Get session from teacher_sessions
    const { data: session, error: sessionError } = await supabase
      .from('teacher_sessions')
      .select('*')
      .eq('session_code', 'TKMG92')
      .single();

    if (sessionError) {
      console.error('❌ Hiba a munkamenet lekérésekor:', sessionError);
      return;
    }

    if (!session) {
      console.log('⚠️  Nincs TKMG92 kódú munkamenet a Supabase-ben');
      return;
    }

    console.log('✅ MUNKAMENET MEGTALÁLVA!\n');
    console.log('═'.repeat(60));
    console.log('📋 MUNKAMENET RÉSZLETEK');
    console.log('═'.repeat(60));
    console.log(`🆔 Session ID: ${session.id}`);
    console.log(`🔑 Session Code: ${session.session_code}`);
    console.log(`📅 Létrehozva: ${new Date(session.created_at).toLocaleString('hu-HU')}`);
    console.log(`⏰ Lejár: ${new Date(session.expires_at).toLocaleString('hu-HU')}`);
    console.log(`📝 Státusz: ${session.is_active ? '✅ Aktív' : '❌ Inaktív'}`);

    // Calculate session size
    const sessionSize = calculateSize(session);
    console.log(`\n📦 Session rekord mérete: ${formatBytes(sessionSize)}`);

    // Check exercises
    if (session.exercises) {
      const exercisesSize = calculateSize(session.exercises);
      const exerciseCount = Array.isArray(session.exercises) ? session.exercises.length : 0;
      console.log(`📚 Feladatok száma: ${exerciseCount}`);
      console.log(`📦 Feladatok mérete: ${formatBytes(exercisesSize)}`);

      // Check for images
      let imageCount = 0;
      let totalImageSize = 0;
      let base64Count = 0;
      let urlCount = 0;

      if (Array.isArray(session.exercises)) {
        session.exercises.forEach(ex => {
          if (ex.imageUrl) {
            imageCount++;
            const imageSize = calculateSize(ex.imageUrl);
            totalImageSize += imageSize;

            if (ex.imageUrl.startsWith('data:image/')) {
              base64Count++;
              console.log(`  📷 ${ex.title || 'Névtelen'}: BASE64 (${formatBytes(imageSize)})`);
            } else if (ex.imageUrl.startsWith('http')) {
              urlCount++;
              console.log(`  🔗 ${ex.title || 'Névtelen'}: URL (${ex.imageUrl.substring(0, 50)}...)`);
            }
          }
        });
      }

      console.log(`\n🖼️  Képek összesen: ${imageCount}`);
      console.log(`   ├─ BASE64 képek: ${base64Count}`);
      console.log(`   ├─ URL képek: ${urlCount}`);
      console.log(`   └─ Képek mérete: ${formatBytes(totalImageSize)}`);
    }

    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', session.id);

    if (!participantsError && participants) {
      const participantsSize = calculateSize(participants);
      console.log(`\n👥 Résztvevők száma: ${participants.length}`);
      console.log(`📦 Résztvevők mérete: ${formatBytes(participantsSize)}`);

      if (participants.length > 0) {
        console.log('\n📊 RÉSZTVEVŐK:');
        participants.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.student_name} (${p.student_class})`);
          console.log(`     Pontszám: ${p.total_score}`);
          console.log(`     Befejezett: ${p.completed_exercises}/${session.exercises?.length || 0}`);
        });
      }
    }

    // Total size
    const totalSize = sessionSize;
    console.log(`\n💾 ÖSSZESEN: ${formatBytes(totalSize)}`);

    // Check if using Google Drive or Supabase
    console.log('\n═'.repeat(60));
    console.log('🔍 TÁROLÁSI MÓD ELEMZÉS');
    console.log('═'.repeat(60));

    // Count image types
    let finalBase64Count = 0;
    let finalUrlCount = 0;
    
    if (Array.isArray(session.exercises)) {
      session.exercises.forEach(ex => {
        if (ex.imageUrl) {
          if (ex.imageUrl.startsWith('data:image/')) {
            finalBase64Count++;
          } else if (ex.imageUrl.startsWith('http')) {
            finalUrlCount++;
          }
        }
      });
    }

    if (finalBase64Count > 0) {
      console.log('✅ SUPABASE MÓD');
      console.log('   • Képek BASE64 formátumban a Supabase-ben');
      console.log('   • JSON letölthető diákoknak');
      console.log('   • Offline működés támogatva');
      console.log(`   • Supabase tárhely használat: ${formatBytes(totalSize)}`);
    } else if (finalUrlCount > 0) {
      console.log('✅ GOOGLE DRIVE MÓD');
      console.log('   • Képek URL-ként tárolva');
      console.log('   • Képek a Google Drive-on');
      console.log('   • Minimális Supabase tárhely használat');
      console.log(`   • Supabase tárhely használat: ${formatBytes(totalSize)}`);
    } else {
      console.log('⚠️  NINCS KÉP');
      console.log('   • Nincsenek képek a munkamenetben');
    }

  } catch (error) {
    console.error('❌ Hiba:', error);
  }
}

checkSession();
