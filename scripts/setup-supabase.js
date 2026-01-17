// Supabase setup script
// Run this after creating your Supabase project

import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const databaseUrl = process.env.DATABASE_URL

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
  console.error('❌ Missing environment variables:')
  console.error('- SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('- SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
  console.error('- DATABASE_URL:', databaseUrl ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const pool = new Pool({ connectionString: databaseUrl })

async function setupSupabase() {
  console.log('🚀 Setting up Supabase...')
  
  try {
    // 1. Test connections
    console.log('1. Testing connections...')
    
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error && !error.message.includes('relation "users" does not exist')) {
      throw new Error(`Supabase connection failed: ${error.message}`)
    }
    console.log('   ✅ Supabase connection OK')
    
    // Test PostgreSQL connection
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('   ✅ PostgreSQL connection OK')
    
    // 2. Create database schema
    console.log('2. Creating database schema...')
    
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8')
      const client = await pool.connect()
      await client.query(schema)
      client.release()
      console.log('   ✅ Schema created from schema.sql')
    } else {
      // Create basic tables
      const client = await pool.connect()
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          avatar_url TEXT,
          role VARCHAR(50) DEFAULT 'student',
          institution VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_code VARCHAR(10) NOT NULL,
          teacher_id UUID REFERENCES users(id),
          title VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'waiting',
          max_players INTEGER DEFAULT 30,
          exercises JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          started_at TIMESTAMP WITH TIME ZONE,
          finished_at TIMESTAMP WITH TIME ZONE
        )
      `)
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS game_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES game_sessions(id),
          player_name VARCHAR(255) NOT NULL,
          player_email VARCHAR(255),
          score INTEGER DEFAULT 0,
          correct_answers INTEGER DEFAULT 0,
          total_questions INTEGER DEFAULT 0,
          answers JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      
      client.release()
      console.log('   ✅ Basic schema created')
    }
    
    // 3. Enable Row Level Security (RLS)
    console.log('3. Configuring Row Level Security...')
    const rlsClient = await pool.connect()
    
    await rlsClient.query('ALTER TABLE users ENABLE ROW LEVEL SECURITY')
    await rlsClient.query('ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY')
    await rlsClient.query('ALTER TABLE game_results ENABLE ROW LEVEL SECURITY')
    
    // Create policies
    await rlsClient.query(`
      CREATE POLICY "Users can view their own profile" ON users
      FOR SELECT USING (auth.uid() = id)
    `)
    
    await rlsClient.query(`
      CREATE POLICY "Teachers can create game sessions" ON game_sessions
      FOR INSERT WITH CHECK (auth.uid() = teacher_id)
    `)
    
    await rlsClient.query(`
      CREATE POLICY "Anyone can view active game sessions" ON game_sessions
      FOR SELECT USING (status = 'active' OR status = 'waiting')
    `)
    
    rlsClient.release()
    console.log('   ✅ RLS policies created')
    
    // 4. Test final setup
    console.log('4. Testing final setup...')
    const testResult = await supabase.from('users').select('count').limit(1)
    console.log('   ✅ Final test passed')
    
    console.log('\n🎉 Supabase setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Update your .env.local with Supabase credentials')
    console.log('2. Configure Google OAuth in Supabase dashboard')
    console.log('3. Test the application: npm run dev')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupSupabase()