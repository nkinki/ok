// Simple script to create Supabase tables
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function createTables() {
  console.log('🚀 Creating Supabase tables...')
  
  try {
    const client = await pool.connect()
    
    // Create users table
    console.log('1. Creating users table...')
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
    console.log('   ✅ Users table created')
    
    // Create game_sessions table
    console.log('2. Creating game_sessions table...')
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
    console.log('   ✅ Game sessions table created')
    
    // Create game_results table
    console.log('3. Creating game_results table...')
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
    console.log('   ✅ Game results table created')
    
    // Test insert
    console.log('4. Testing tables...')
    const testResult = await client.query('SELECT COUNT(*) FROM users')
    console.log(`   ✅ Tables working! Users count: ${testResult.rows[0].count}`)
    
    client.release()
    console.log('\n🎉 All tables created successfully!')
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

createTables()