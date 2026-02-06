// Ellenőrizzük hogy a munkamenet létezik-e a Supabase-ben

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Betöltjük a .env.local fájlt
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    env[key] = value;
    process.env[key] = value;
  }
});

const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkSession() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('🔍 MUNKAMENET ELLENŐRZÉS SUPABASE-BEN');
  console.log('═══════════════════════════════════════════════════════════\n');

  const sessionCode = 'LEZ8VJ';
  
  console.log(`📊 Keresés: ${sessionCode}\n`);

  // Ellenőrizzük hogy létezik-e
  const { data, error } = await supabase
    .from('teacher_sessions')
    .select('*')
    .eq('session_code', sessionCode)
    .single();

  if (error) {
    console.log('❌ MUNKAMENET NEM TALÁLHATÓ A SUPABASE-BEN!');
    console.log('❌ Hiba:', error.message);
    console.log('\n🔍 Ez azt jelenti hogy:');
    console.log('   1. A munkamenet létrehozása NEM mentette el Supabase-be');
    console.log('   2. Csak localStorage-ban van');
    console.log('   3. Ezért az API mock adatokat ad vissza\n');
    
    // Nézzük meg az összes munkamenetet
    console.log('📊 Összes munkamenet a Supabase-ben:\n');
    const { data: allSessions } = await supabase
      .from('teacher_sessions')
      .select('session_code, created_at, is_active')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allSessions && allSessions.length > 0) {
      console.log('┌──────────┬─────────────────────┬─────────┐');
      console.log('│ Kód      │ Létrehozva          │ Aktív   │');
      console.log('├──────────┼─────────────────────┼─────────┤');
      allSessions.forEach(s => {
        const code = s.session_code.padEnd(8, ' ');
        const date = new Date(s.created_at).toLocaleString('hu-HU').padEnd(19, ' ');
        const active = s.is_active ? '✅ Igen' : '❌ Nem';
        console.log(`│ ${code}│ ${date}│ ${active}│`);
      });
      console.log('└──────────┴─────────────────────┴─────────┘');
    } else {
      console.log('❌ NINCS EGYETLEN MUNKAMENET SEM A SUPABASE-BEN!');
    }
    
    console.log('\n💡 MEGOLDÁS:');
    console.log('   1. Ellenőrizd hogy a TeacherSessionManager komponens');
    console.log('      valóban meghívja az API-t munkamenet létrehozáskor');
    console.log('   2. Nézd meg a böngésző Network tab-ot');
    console.log('   3. Keress egy POST /api/simple-api/sessions/create hívást');
    console.log('   4. Ha nincs ilyen hívás → A frontend nem hívja az API-t!');
    
  } else {
    console.log('✅ MUNKAMENET MEGTALÁLVA A SUPABASE-BEN!');
    console.log('\n📊 Munkamenet adatok:');
    console.log('   Kód:', data.session_code);
    console.log('   Létrehozva:', new Date(data.created_at).toLocaleString('hu-HU'));
    console.log('   Aktív:', data.is_active ? '✅ Igen' : '❌ Nem');
    console.log('   Feladatok:', data.exercises?.length || 0);
    console.log('   Osztály:', data.class_name || 'N/A');
    console.log('\n✅ Az API-nak valódi adatokat kellene visszaadnia!');
    console.log('⚠️  Ha még mindig mock adatok jelennek meg:');
    console.log('   → Ellenőrizd az API kódot');
    console.log('   → Nézd meg a szerver konzolt');
  }
}

checkSession().catch(console.error);
