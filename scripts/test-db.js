// Simple database health check script
import { Pool } from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.SUPABASE_DATABASE_URL

if (!connectionString) {
  console.error('❌ No DATABASE_URL found in environment variables')
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')))
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('Connection string:', connectionString.replace(/:[^:@]*@/, ':****@'))
    
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as timestamp, version() as version')
    client.release()
    
    console.log('✅ Database connection successful!')
    console.log('📅 Timestamp:', result.rows[0].timestamp)
    console.log('🗄️ Database:', result.rows[0].version.split(' ')[0])
    
    // Test if we can create a simple table
    const testClient = await pool.connect()
    await testClient.query('CREATE TABLE IF NOT EXISTS health_check (id SERIAL PRIMARY KEY, checked_at TIMESTAMP DEFAULT NOW())')
    await testClient.query('INSERT INTO health_check DEFAULT VALUES')
    const testResult = await testClient.query('SELECT COUNT(*) as count FROM health_check')
    testClient.release()
    
    console.log('✅ Database write test successful!')
    console.log('📊 Health check records:', testResult.rows[0].count)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    
    if (error.message.includes('password authentication failed')) {
      console.log('💡 Tip: Check your database password in the connection string')
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Tip: Check your database name and host')
    } else if (error.message.includes('timeout')) {
      console.log('💡 Tip: Check your network connection and database host')
    }
    
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()