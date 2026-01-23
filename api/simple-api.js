// Teljes API - test.js néven

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url, method } = req;
    const path = url?.split('?')[0] || '';

    // Health check
    if (method === 'GET' && (path === '/api/test' || path === '/api/simple-api')) {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'API működik!',
        roomsCount: 6
      });
    }

    // Test connection
    if (method === 'POST' && req.body?.action === 'test_connection') {
      const envCheck = {
        hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasSupabaseKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
        supabaseKeyLength: (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').length,
        nodeEnv: process.env.NODE_ENV || 'unknown',
        vercelEnv: process.env.VERCEL_ENV || 'unknown'
      };

      // Supabase connection test
      let supabaseTest = { canConnect: false, error: null };
      
      try {
        // Dinamikus import
        const { createClient } = await import('@supabase/supabase-js');
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

    // Session creation
    if (method === 'POST' && path.includes('/sessions/create')) {
      const { code, exercises } = req.body;

      if (!code || !exercises) {
        return res.status(400).json({ error: 'Kód és feladatok megadása kötelező' });
      }

      try {
        // Dinamikus import
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ 
            error: 'Supabase credentials missing',
            solution: 'Check Vercel environment variables'
          });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Create session in database
        const { data, error } = await supabase
          .from('teacher_sessions')
          .insert({
            session_code: code.toUpperCase(),
            exercises: exercises,
            is_active: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ 
            error: 'Database error',
            details: error.message
          });
        }

        return res.status(200).json({
          success: true,
          session: {
            id: data.id,
            code: data.session_code,
            exercises: data.exercises,
            isActive: data.is_active,
            createdAt: data.created_at,
            expiresAt: data.expires_at
          },
          message: 'Session created successfully'
        });

      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Default response
    return res.status(404).json({ 
      error: 'Endpoint not found',
      path: path,
      method: method,
      availableEndpoints: [
        'GET /api/test - Health check',
        'POST /api/test with action=test_connection - Environment test',
        'POST /api/test/sessions/create - Create session'
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