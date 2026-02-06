// Supabase adatbázis méret ellenőrzés
// Ellenőrzi mennyi adatot tárol a DB egy munkamenetről

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials hiányoznak!');
  console.error('Ellenőrizd a .env.local fájlt!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function calculateObjectSize(obj) {
  // JSON string mérete bytes-ban
  return new Blob([JSON.stringify(obj)]).size;
}

async function checkDatabaseSize() {
  console.log('🔍 Supabase adatbázis méret ellenőrzés...\n');

  try {
    // 1. Legutóbbi munkamenet lekérése
    console.log('📥 Legutóbbi munkamenet lekérése...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('teacher_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError) {
      console.error('❌ Hiba a munkamenetek lekérésekor:', sessionsError.message);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('⚠️ Nincs még munkamenet az adatbázisban!');
      console.log('💡 Hozz létre egy munkamenetet a tanári felületen!');
      return;
    }

    const session = sessions[0];
    console.log(`✅ Munkamenet megtalálva: ${session.session_code}`);
    console.log(`📅 Létrehozva: ${new Date(session.created_at).toLocaleString('hu-HU')}`);
    console.log(`📚 Feladatok száma: ${session.exercises?.length || 0}`);
    console.log('');

    // 2. Méret számítás
    console.log('📊 MÉRET ELEMZÉS:\n');
    console.log('━'.repeat(60));

    // Teljes sor mérete
    const totalSize = calculateObjectSize(session);
    console.log(`📦 Teljes sor méret: ${formatBytes(totalSize)}`);
    console.log('');

    // Részletes bontás
    console.log('📋 RÉSZLETES BONTÁS:\n');

    // Metadata (kis mezők)
    const metadata = {
      id: session.id,
      session_code: session.session_code,
      subject: session.subject,
      class_name: session.class_name,
      max_possible_score: session.max_possible_score,
      is_active: session.is_active,
      created_at: session.created_at,
      expires_at: session.expires_at,
      updated_at: session.updated_at
    };
    const metadataSize = calculateObjectSize(metadata);
    console.log(`  📌 Metadata: ${formatBytes(metadataSize)}`);

    // Exercises tömb
    const exercisesSize = calculateObjectSize(session.exercises || []);
    console.log(`  📚 Exercises tömb: ${formatBytes(exercisesSize)}`);

    // Full session JSON
    const fullJsonSize = calculateObjectSize(session.full_session_json || {});
    console.log(`  📄 Full session JSON: ${formatBytes(fullJsonSize)}`);

    console.log('');
    console.log('━'.repeat(60));
    console.log('');

    // 3. Képek elemzése
    console.log('🖼️ KÉPEK ELEMZÉSE:\n');

    if (session.full_session_json && session.full_session_json.exercises) {
      const exercises = session.full_session_json.exercises;
      let totalImageSize = 0;
      let driveUrlCount = 0;
      let base64Count = 0;

      exercises.forEach((exercise, index) => {
        const imageUrl = exercise.imageUrl || '';
        const imageSize = new Blob([imageUrl]).size;
        totalImageSize += imageSize;

        const isDriveUrl = imageUrl.includes('drive.google.com');
        const isBase64 = imageUrl.startsWith('data:image/');

        if (isDriveUrl) driveUrlCount++;
        if (isBase64) base64Count++;

        console.log(`  ${index + 1}. ${exercise.title || 'Névtelen feladat'}`);
        console.log(`     Kép típus: ${isDriveUrl ? '🔗 Google Drive URL' : isBase64 ? '📸 Base64' : '❓ Ismeretlen'}`);
        console.log(`     Kép méret: ${formatBytes(imageSize)}`);
        console.log('');
      });

      console.log('━'.repeat(60));
      console.log(`  📊 Összesen: ${exercises.length} feladat`);
      console.log(`  🔗 Google Drive URL-ek: ${driveUrlCount}`);
      console.log(`  📸 Base64 képek: ${base64Count}`);
      console.log(`  💾 Összes kép adat: ${formatBytes(totalImageSize)}`);
      console.log('');
    }

    // 4. Összehasonlítás
    console.log('━'.repeat(60));
    console.log('');
    console.log('📈 ÖSSZEHASONLÍTÁS:\n');

    // Szimuláljuk a base64 méretet
    const avgBase64ImageSize = 300 * 1024; // 300 KB
    const exerciseCount = session.exercises?.length || 0;
    const estimatedBase64Size = avgBase64ImageSize * exerciseCount + metadataSize;

    console.log(`  ❌ Ha base64 képek lennének:`);
    console.log(`     ${formatBytes(estimatedBase64Size)} / munkamenet`);
    console.log('');
    console.log(`  ✅ Jelenlegi (Google Drive URL-ek):`);
    console.log(`     ${formatBytes(totalSize)} / munkamenet`);
    console.log('');

    const savings = estimatedBase64Size - totalSize;
    const savingsPercent = ((savings / estimatedBase64Size) * 100).toFixed(1);

    console.log(`  💰 Megtakarítás: ${formatBytes(savings)} (${savingsPercent}%)`);
    console.log('');

    // 5. Hálózati használat projekció
    console.log('━'.repeat(60));
    console.log('');
    console.log('🌐 HÁLÓZATI HASZNÁLAT PROJEKCIÓ:\n');

    const students20 = totalSize * 20;
    const students20Base64 = estimatedBase64Size * 20;

    console.log(`  👥 20 diák (1 munkamenet):`);
    console.log(`     ❌ Base64: ${formatBytes(students20Base64)}`);
    console.log(`     ✅ Drive URLs: ${formatBytes(students20)}`);
    console.log(`     💰 Megtakarítás: ${formatBytes(students20Base64 - students20)}`);
    console.log('');

    const sessions100 = totalSize * 20 * 100;
    const sessions100Base64 = estimatedBase64Size * 20 * 100;

    console.log(`  📚 100 munkamenet × 20 diák:`);
    console.log(`     ❌ Base64: ${formatBytes(sessions100Base64)}`);
    console.log(`     ✅ Drive URLs: ${formatBytes(sessions100)}`);
    console.log(`     💰 Megtakarítás: ${formatBytes(sessions100Base64 - sessions100)}`);
    console.log('');

    // 6. Kvóta ellenőrzés
    console.log('━'.repeat(60));
    console.log('');
    console.log('📊 SUPABASE KVÓTA (5 GB limit):\n');

    const quotaLimit = 5 * 1024 * 1024 * 1024; // 5 GB
    const quotaUsageBase64 = (sessions100Base64 / quotaLimit) * 100;
    const quotaUsageDrive = (sessions100 / quotaLimit) * 100;

    console.log(`  ❌ Base64 képekkel: ${quotaUsageBase64.toFixed(1)}%`);
    console.log(`  ✅ Google Drive URL-ekkel: ${quotaUsageDrive.toFixed(1)}%`);
    console.log('');

    if (quotaUsageBase64 > 100) {
      console.log(`  ⚠️ Base64-el TÚLLÉPNÉD a kvótát!`);
    } else {
      console.log(`  ✅ Base64-el még belefér (de közel van)`);
    }

    if (quotaUsageDrive > 100) {
      console.log(`  ⚠️ Drive URL-ekkel is túllépnéd (nem valószínű)`);
    } else {
      console.log(`  ✅ Drive URL-ekkel bőven belefér!`);
    }

    console.log('');
    console.log('━'.repeat(60));
    console.log('');
    console.log('✅ Ellenőrzés befejezve!');
    console.log('');

    // 7. Összefoglaló
    console.log('📋 ÖSSZEFOGLALÓ:\n');
    console.log(`  Munkamenet kód: ${session.session_code}`);
    console.log(`  Feladatok száma: ${exerciseCount}`);
    console.log(`  DB méret: ${formatBytes(totalSize)}`);
    console.log(`  Képek típusa: ${driveUrlCount > 0 ? '🔗 Google Drive URL-ek' : base64Count > 0 ? '📸 Base64' : '❓ Ismeretlen'}`);
    console.log(`  Megtakarítás: ${savingsPercent}%`);
    console.log('');

  } catch (error) {
    console.error('❌ Hiba történt:', error.message);
    console.error(error);
  }
}

// Futtatás
checkDatabaseSize();
