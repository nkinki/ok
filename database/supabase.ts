// Supabase client configuration
import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

// Supabase client (for auth, real-time, storage)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// PostgreSQL connection pool (for direct database queries)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Health check function
export async function healthCheck() {
  try {
    // Test PostgreSQL connection
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    return {
      status: 'healthy',
      database: 'connected',
      supabase: error ? 'error' : 'connected',
      timestamp: result.rows[0].now,
      error: error?.message
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      database: 'disconnected',
      supabase: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Initialize database tables if they don't exist
export async function initializeTables() {
  try {
    const client = await pool.connect()
    
    // Create users table
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
    
    // Create game_sessions table
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
    
    // Create game_results table
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
    console.log('✅ Database tables initialized')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize tables:', error)
    return false
  }
}