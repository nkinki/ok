import { Pool, PoolClient } from 'pg'

// Database connection configuration
const isDevelopment = process.env.NODE_ENV === 'development'

// Support both Neon and Supabase connection strings
const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.SUPABASE_DATABASE_URL

if (!connectionString && !isDevelopment) {
  throw new Error('DATABASE_URL environment variable is required for production')
}

// Create connection pool
const pool = new Pool({
  connectionString,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
})

// Database query helper
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Transaction helper
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Health check
export async function healthCheck(): Promise<{ status: string; database: string; timestamp?: Date; error?: string }> {
  try {
    const result = await query('SELECT NOW() as timestamp')
    return {
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0]?.timestamp
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Initialize database (run migrations)
export async function initializeDatabase(): Promise<void> {
  try {
    // Read and execute schema.sql
    const fs = require('fs')
    const path = require('path')
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8')
      await query(schema)
      console.log('✅ Database schema initialized successfully')
    } else {
      console.warn('⚠️ Schema file not found, skipping database initialization')
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

export default pool