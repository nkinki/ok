// Ultra minimális API - csak environment variables tesztelése

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Health check
    if (req.method === 'GET') {
      return res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Ultra minimális API működik',
        nodeVersion: process.version
      });
    }

    // Test connection - csak environment variables ellenőrzése
    if (req.method === 'POST' && req.body?.action === 'test_connection') {
      const envCheck = {
        hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasSupabaseKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
        supabaseKeyLength: (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').length,
        nodeEnv: process.env.NODE_ENV || 'unknown',
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
      };

      return res.json({
        success: true,
        message: 'Environment variables check completed',
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
    }

    // Default response
    return res.status(404).json({ 
      error: 'Endpoint not found',
      availableEndpoints: [
        'GET /api/simple-api - Health check',
        'POST /api/simple-api with action=test_connection - Environment test'
      ]
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};