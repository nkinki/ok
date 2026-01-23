// Javított API - ES6 export használatával

export default function handler(req, res) {
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
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'API működik',
        roomsCount: 6
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

      // Próbáljuk meg a Supabase kapcsolatot
      let supabaseTest = { canConnect: false, error: null };
      
      try {
        // Dinamikus import a Supabase-hez
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase
            .from('teacher_sessions')
            .select('count')
            .limit(1);
          
          if (error) {
            supabaseTest.error = error.message;
          } else {
            supabaseTest.canConnect = true;
          }
        } else {
          supabaseTest.error = 'Missing credentials';
        }
      } catch (err) {
        supabaseTest.error = err.message;
      }

      return res.status(200).json({
        success: true,
        message: 'Connection test completed',
        environment: envCheck,
        supabase: supabaseTest,
        timestamp: new Date().toISOString()
      });
    }

    // Session creation endpoint
    if (req.method === 'POST' && req.url?.includes('/sessions/create')) {
      const { code, exercises } = req.body;

      if (!code || !exercises) {
        return res.status(400).json({ error: 'Kód és feladatok megadása kötelező' });
      }

      // Egyszerű válasz Supabase nélkül egyelőre
      return res.status(200).json({
        success: true,
        session: {
          id: `session_${Date.now()}`,
          code: code.toUpperCase(),
          exercises: exercises,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        message: 'Munkamenet létrehozva (teszt módban)'
      });
    }

    // Default response
    return res.status(404).json({ 
      error: 'Endpoint not found',
      availableEndpoints: [
        'GET /api/simple-api - Health check',
        'POST /api/simple-api with action=test_connection - Environment test',
        'POST /api/simple-api/sessions/create - Create session'
      ]
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}