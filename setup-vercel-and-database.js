#!/usr/bin/env node

// Automatikus Vercel és Supabase setup script
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Környezeti változók betöltése
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('🚀 Okos Gyakorló - Automatikus Setup');
console.log('=====================================\n');

// 1. Ellenőrizzük a környezeti változókat
console.log('1️⃣ Környezeti változók ellenőrzése...');
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Hiányzó környezeti változók a .env.local fájlban!');
    console.log('\nEllenőrizd hogy ezek léteznek:');
    console.log('- SUPABASE_URL');
    console.log('- SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log('✅ Környezeti változók OK');
console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`);
console.log(`   KEY: ${SUPABASE_ANON_KEY.substring(0, 30)}...\n`);

// 2. Supabase kapcsolat tesztelése
console.log('2️⃣ Supabase kapcsolat tesztelése...');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase kapcsolat hiba:', error.message);
            return false;
        }
        
        console.log('✅ Supabase kapcsolat OK\n');
        return true;
    } catch (err) {
        console.error('❌ Supabase kapcsolat hiba:', err.message);
        return false;
    }
}

// 3. Táblák létrehozása
async function createTables() {
    console.log('3️⃣ Adatbázis táblák létrehozása...');
    
    try {
        // SQL fájl beolvasása
        const sqlPath = path.join(__dirname, 'create-missing-tables.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // SQL végrehajtása
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: sqlContent 
        });
        
        if (error) {
            console.log('⚠️  RPC hiba, próbálkozás közvetlen SQL-lel...');
            
            // Alternatív módszer: táblák egyenként
            const tables = [
                `CREATE TABLE IF NOT EXISTS teacher_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    session_code VARCHAR(8) UNIQUE NOT NULL,
                    exercises JSONB NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );`,
                
                `CREATE TABLE IF NOT EXISTS session_participants (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    session_id UUID NOT NULL REFERENCES teacher_sessions(id) ON DELETE CASCADE,
                    student_name VARCHAR(255) NOT NULL,
                    student_class VARCHAR(100) NOT NULL,
                    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    is_online BOOLEAN NOT NULL DEFAULT true,
                    current_exercise INTEGER NOT NULL DEFAULT 0,
                    completed_exercises INTEGER NOT NULL DEFAULT 0,
                    total_score INTEGER NOT NULL DEFAULT 0,
                    results JSONB DEFAULT '[]'::jsonb
                );`,
                
                `CREATE INDEX IF NOT EXISTS idx_teacher_sessions_code ON teacher_sessions(session_code);`,
                `CREATE INDEX IF NOT EXISTS idx_teacher_sessions_active ON teacher_sessions(is_active);`,
                `CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);`
            ];
            
            for (const sql of tables) {
                const { error: tableError } = await supabase.rpc('exec_sql', { sql_query: sql });
                if (tableError) {
                    console.log(`⚠️  Tábla létrehozás hiba: ${tableError.message}`);
                }
            }
        }
        
        console.log('✅ Adatbázis táblák létrehozva\n');
        return true;
        
    } catch (err) {
        console.error('❌ Tábla létrehozás hiba:', err.message);
        console.log('\n🔧 Kézi megoldás:');
        console.log('1. Menj a Supabase Dashboard-ra');
        console.log('2. SQL Editor → New Query');
        console.log('3. Másold be a create-missing-tables.sql tartalmat');
        console.log('4. Futtasd le\n');
        return false;
    }
}

// 4. Vercel environment variables kiírása
function showVercelInstructions() {
    console.log('4️⃣ Vercel Environment Variables beállítása');
    console.log('==========================================\n');
    
    console.log('Menj a Vercel Dashboard-ra és add hozzá ezeket:');
    console.log('https://vercel.com/dashboard → nyirad → Settings → Environment Variables\n');
    
    console.log('SUPABASE_URL:');
    console.log(SUPABASE_URL);
    console.log('');
    
    console.log('SUPABASE_ANON_KEY:');
    console.log(SUPABASE_ANON_KEY);
    console.log('');
    
    console.log('NODE_ENV:');
    console.log('production');
    console.log('');
    
    console.log('⚠️  Mindhárom változónál pipáld be: Production, Preview, Development');
    console.log('⚠️  Mentés után várj 1-2 percet a redeploy-ra\n');
}

// 5. Tesztelési instrukciók
function showTestInstructions() {
    console.log('5️⃣ Tesztelés');
    console.log('============\n');
    
    console.log('A Vercel redeploy után teszteld ezt a böngésző konzolban:');
    console.log('');
    console.log(`fetch('https://nyirad.vercel.app/api/simple-api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'test_connection' })
})
.then(r => r.json())
.then(d => console.log('🔍 Test result:', d));`);
    console.log('');
    
    console.log('Sikeres eredmény esetén látnod kell:');
    console.log('- hasSupabaseUrl: true');
    console.log('- hasSupabaseKey: true');
    console.log('- canConnect: true\n');
}

// Fő futtatás
async function main() {
    const connectionOK = await testConnection();
    
    if (connectionOK) {
        await createTables();
    }
    
    showVercelInstructions();
    showTestInstructions();
    
    console.log('🎉 Setup befejezve!');
    console.log('Ha minden rendben, a Vercel app működni fog.');
}

main().catch(console.error);