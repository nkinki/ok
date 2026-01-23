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

    // Session status endpoint (for real-time monitoring)
    if (method === 'GET' && path.includes('/sessions/') && path.includes('/status')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/status/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          return res.status(404).json({ 
            exists: false, 
            error: 'Munkamenet nem található',
            hint: 'A munkamenet lehet, hogy lejárt vagy nem aktív'
          });
        }

        // Get participant count
        const { data: participants, error: participantError } = await supabase
          .from('session_participants')
          .select('id')
          .eq('session_code', sessionCode);

        const participantCount = participantError ? 0 : (participants?.length || 0);

        return res.status(200).json({
          exists: true,
          isActive: data.is_active,
          session: {
            id: data.id,
            code: data.session_code,
            exerciseCount: data.exercises.length,
            participantCount: participantCount,
            createdAt: data.created_at,
            expiresAt: data.expires_at,
            updatedAt: data.updated_at
          }
        });
        
      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Session check endpoint (student)
    if (method === 'GET' && path.includes('/sessions/') && path.includes('/check')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/check/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          return res.status(404).json({ 
            exists: false, 
            error: 'Hibás kód vagy a munkamenet nem aktív',
            hint: 'A munkamenet lehet, hogy lejárt (24 óra után). Kérj új kódot a tanártól!'
          });
        }

        return res.status(200).json({
          exists: true,
          session: {
            id: data.id,
            code: data.session_code,
            exerciseCount: data.exercises.length,
            isActive: data.is_active,
            expiresAt: data.expires_at
          }
        });
        
      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Get session exercises (student)
    if (method === 'GET' && path.includes('/sessions/') && path.includes('/exercises')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/exercises/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          return res.status(404).json({ 
            error: 'Munkamenet nem található vagy nem aktív',
            hint: 'A munkamenet lehet, hogy lejárt. Kérj új kódot a tanártól!'
          });
        }

        return res.status(200).json({
          exercises: data.exercises,
          count: data.exercises.length,
          sessionCode: data.session_code
        });
        
      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }
    // Create session
    if (method === 'POST' && path.includes('/sessions/create')) {
      const { code, exercises } = req.body;

      if (!code || !exercises) {
        return res.status(400).json({ error: 'Kód és feladatok megadása kötelező' });
      }

      try {
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

    // Get all sessions (history and active)
    if (method === 'GET' && path.includes('/sessions/list')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get all sessions with participant counts
        const { data: sessions, error } = await supabase
          .from('teacher_sessions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({ 
            error: 'Database error',
            details: error.message
          });
        }

        // Get participant counts for each session
        const sessionsWithStats = await Promise.all(
          sessions.map(async (session) => {
            const { data: participants } = await supabase
              .from('session_participants')
              .select('id')
              .eq('session_code', session.session_code);

            return {
              id: session.id,
              code: session.session_code,
              exerciseCount: session.exercises.length,
              participantCount: participants?.length || 0,
              isActive: session.is_active,
              createdAt: session.created_at,
              expiresAt: session.expires_at,
              updatedAt: session.updated_at
            };
          })
        );

        return res.status(200).json({
          sessions: sessionsWithStats,
          total: sessionsWithStats.length,
          active: sessionsWithStats.filter(s => s.isActive).length,
          expired: sessionsWithStats.filter(s => !s.isActive || new Date(s.expiresAt) < new Date()).length
        });

      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Session management - activate/deactivate
    if (method === 'PUT' && path.includes('/sessions/') && path.includes('/toggle')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/toggle/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get current session
        const { data: currentSession, error: fetchError } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode)
          .single();

        if (fetchError || !currentSession) {
          return res.status(404).json({ error: 'Munkamenet nem található' });
        }

        // Toggle active status
        const { data, error } = await supabase
          .from('teacher_sessions')
          .update({ 
            is_active: !currentSession.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('session_code', sessionCode)
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
            isActive: data.is_active,
            updatedAt: data.updated_at
          },
          message: data.is_active ? 'Munkamenet aktiválva' : 'Munkamenet leállítva'
        });

      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Delete session
    if (method === 'DELETE' && path.includes('/sessions/')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)$/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Delete participants first
        await supabase
          .from('session_participants')
          .delete()
          .eq('session_code', sessionCode);

        // Delete session
        const { error } = await supabase
          .from('teacher_sessions')
          .delete()
          .eq('session_code', sessionCode);

        if (error) {
          return res.status(500).json({ 
            error: 'Database error',
            details: error.message
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Munkamenet törölve'
        });

      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Get session statistics
    if (method === 'GET' && path.includes('/sessions/stats')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get session counts
        const { data: allSessions } = await supabase
          .from('teacher_sessions')
          .select('*');

        const { data: activeSessions } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString());

        const { data: allParticipants } = await supabase
          .from('session_participants')
          .select('*');

        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const todaySessions = allSessions?.filter(s => 
          new Date(s.created_at) >= today
        ).length || 0;

        const weekSessions = allSessions?.filter(s => 
          new Date(s.created_at) >= thisWeek
        ).length || 0;

        const totalParticipants = allParticipants?.length || 0;
        const avgParticipantsPerSession = allSessions?.length > 0 
          ? Math.round(totalParticipants / allSessions.length * 10) / 10 
          : 0;

        return res.status(200).json({
          overview: {
            totalSessions: allSessions?.length || 0,
            activeSessions: activeSessions?.length || 0,
            todaySessions,
            weekSessions,
            totalParticipants,
            avgParticipantsPerSession
          },
          recentSessions: allSessions?.slice(0, 5).map(s => ({
            code: s.session_code,
            exerciseCount: s.exercises.length,
            isActive: s.is_active,
            createdAt: s.created_at
          })) || []
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
        'GET /api/simple-api - Health check',
        'POST /api/simple-api with action=test_connection - Environment test',
        'POST /api/simple-api/sessions/create - Create session',
        'GET /api/simple-api/sessions/list - Get all sessions with stats',
        'GET /api/simple-api/sessions/stats - Get session statistics',
        'GET /api/simple-api/sessions/{code}/check - Check session exists',
        'GET /api/simple-api/sessions/{code}/status - Get session status (real-time)',
        'GET /api/simple-api/sessions/{code}/exercises - Get session exercises',
        'PUT /api/simple-api/sessions/{code}/toggle - Activate/deactivate session',
        'DELETE /api/simple-api/sessions/{code} - Delete session'
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