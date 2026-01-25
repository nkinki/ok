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

    // Subject Authentication
    if (method === 'POST' && path.includes('/auth/subject')) {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Jelszó megadása kötelező' });
      }

      try {
        // Tantárgyi jelszavak (egyszerű megoldás)
        const SUBJECT_CREDENTIALS = {
          'infoxxx': { subject: 'info', displayName: 'Informatika', theme: 'blue' },
          'matekxxx': { subject: 'matek', displayName: 'Matematika', theme: 'green' },
          'magyxxx': { subject: 'magy', displayName: 'Magyar nyelv', theme: 'red' },
          'torixxx': { subject: 'tori', displayName: 'Történelem', theme: 'purple' },
          'termxxx': { subject: 'termeszet', displayName: 'Természetismeret', theme: 'orange' }
        };

        const credential = SUBJECT_CREDENTIALS[password.toLowerCase()];
        
        if (!credential) {
          return res.status(401).json({ 
            error: 'Hibás jelszó',
            hint: 'Használd a tantárgyi jelszavakat: infoxxx, matekxxx, magyxxx, torixxx, termxxx'
          });
        }

        // Egyszerű token generálás (session alapú)
        const token = Buffer.from(`${credential.subject}:${Date.now()}`).toString('base64');

        return res.status(200).json({
          success: true,
          subject: credential.subject,
          displayName: credential.displayName,
          theme: credential.theme,
          token: token,
          message: `Sikeres bejelentkezés: ${credential.displayName}`
        });

      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

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
          .eq('session_id', data.id); // Use session_id instead of session_code

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
            hint: 'A munkamenet lehet, hogy lejárt (60 perc után). Kérj új kódot a tanártól!'
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

    // Join session (student)
    if (method === 'POST' && path.includes('/sessions/join')) {
      const { sessionCode, name, className } = req.body;

      if (!sessionCode || !name) {
        return res.status(400).json({ error: 'Session kód és diák név megadása kötelező' });
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Check if session exists and is active
        const { data: session, error: sessionError } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode.toUpperCase())
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (sessionError || !session) {
          return res.status(404).json({ 
            error: 'Munkamenet nem található vagy nem aktív',
            hint: 'Ellenőrizd a kódot vagy kérj új kódot a tanártól!'
          });
        }

        // Add participant to session using session_id (not session_code)
        const { data: participant, error: participantError } = await supabase
          .from('session_participants')
          .insert({
            session_id: session.id, // Use session.id instead of session_code
            student_name: name,
            student_class: className || '',
            joined_at: new Date().toISOString(),
            is_online: true,
            current_exercise: 0,
            completed_exercises: 0,
            total_score: 0
            // Remove percentage and performance_category for now - they may not exist
          })
          .select()
          .single();

        if (participantError) {
          console.error('Participant join error:', participantError);
          return res.status(500).json({ 
            error: 'Hiba a csatlakozáskor',
            details: participantError.message
          });
        }

        console.log('✅ Student joined session:', name, 'to', sessionCode);

        return res.status(200).json({
          success: true,
          student: {
            id: participant.id,
            sessionCode: sessionCode.toUpperCase(),
            sessionId: session.id,
            studentName: participant.student_name,
            studentClass: participant.student_class,
            joinedAt: participant.joined_at
          },
          message: 'Sikeresen csatlakoztál a munkamenethez!'
        });

      } catch (err) {
        console.error('Session join error:', err);
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Submit exercise results (student)
    if (method === 'POST' && path.includes('/sessions/') && path.includes('/results')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/results/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      const { studentId, results, summary } = req.body;

      if (!studentId || !results || !summary) {
        return res.status(400).json({ error: 'Student ID, eredmények és összesítő megadása kötelező' });
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Check if session exists
        const { data: session, error: sessionError } = await supabase
          .from('teacher_sessions')
          .select('id')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (sessionError || !session) {
          return res.status(404).json({ 
            error: 'Munkamenet nem található vagy nem aktív'
          });
        }

        // Update participant results
        const { error: updateError } = await supabase
          .from('session_participants')
          .update({
            completed_exercises: summary.completedExercises,
            total_score: summary.totalScore,
            results: results,
            last_seen: new Date().toISOString(),
            is_online: false // Mark as completed
          })
          .eq('id', studentId);

        if (updateError) {
          console.error('Results update error:', updateError);
          return res.status(500).json({ 
            error: 'Hiba az eredmények mentésekor',
            details: updateError.message
          });
        }

        console.log('✅ Results submitted for student:', studentId, 'in session:', sessionCode);

        return res.status(200).json({
          success: true,
          message: 'Eredmények sikeresen elmentve!'
        });

      } catch (err) {
        console.error('Results submission error:', err);
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Get exercise image by ID (for lazy loading)
    if (method === 'GET' && path.includes('/exercises/') && path.includes('/image')) {
      const idMatch = path.match(/\/exercises\/([^\/]+)\/image/);
      if (!idMatch) {
        return res.status(400).json({ error: 'Exercise ID megadása kötelező' });
      }

      const exerciseId = idMatch[1];
      
      try {
        // For now, return a placeholder or redirect to a static image service
        // In a real implementation, you'd fetch from a proper image storage
        return res.status(200).json({
          imageUrl: `/images/placeholder-${exerciseId}.jpg`, // Placeholder for now
          message: 'Image endpoint - implement proper image storage'
        });
        
      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Get session exercises (student) - return full JSON for fast loading
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

        // Return full JSON session data for fast loading
        const sessionData = {
          sessionCode: data.session_code,
          subject: data.subject || 'general',
          createdAt: data.created_at,
          exercises: data.exercises, // Full exercise data with images
          metadata: {
            version: '1.0.0',
            exportedBy: 'Okos Gyakorló API',
            totalExercises: data.exercises.length,
            estimatedTime: data.exercises.length * 3,
            sessionId: data.id // For result submission
          }
        };

        return res.status(200).json(sessionData);
        
      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }
    // Create session
    if (method === 'POST' && path.includes('/sessions/create')) {
      const { code, exercises, subject = 'general', maxScore, className } = req.body;

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
        
        // Számítsuk ki a maximális pontszámot ha nincs megadva
        const calculatedMaxScore = maxScore || exercises.length * 10; // Alapértelmezett: 10 pont/feladat
        
        // Optimize: Prepare minimal data for database
        const sessionData = {
          session_code: code.toUpperCase(),
          exercises: exercises, // Already optimized from frontend
          subject: subject,
          class_name: className || null,
          max_possible_score: calculatedMaxScore,
          is_active: true,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 60 minutes instead of 24 hours
        };

        console.log('💾 Inserting session with', exercises.length, 'exercises, subject:', subject);
        
        // Create session in database
        const { data, error } = await supabase
          .from('teacher_sessions')
          .insert(sessionData)
          .select('id, session_code, subject, max_possible_score, is_active, created_at, expires_at')
          .single();

        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            error: 'Database error',
            details: error.message
          });
        }

        console.log('✅ Session created successfully:', data.session_code);

        // Return minimal response for speed
        return res.status(200).json({
          success: true,
          session: {
            id: data.id,
            code: data.session_code,
            exerciseCount: exercises.length,
            subject: data.subject,
            maxPossibleScore: data.max_possible_score,
            isActive: data.is_active,
            createdAt: data.created_at,
            expiresAt: data.expires_at
          },
          message: 'Session created successfully'
        });

      } catch (err) {
        console.error('Session creation error:', err);
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Get all sessions (history and active) with subject filtering
    if (method === 'GET' && path.includes('/sessions/list')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get subject filter from query params
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const subjectFilter = urlParams.get('subject');
        
        // Build query with optional subject filter
        let query = supabase
          .from('teacher_sessions')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (subjectFilter && subjectFilter !== 'all') {
          query = query.eq('subject', subjectFilter);
        }

        const { data: sessions, error } = await query;

        if (error) {
          return res.status(500).json({ 
            error: 'Database error',
            details: error.message
          });
        }

        // Get participant counts and performance stats for each session
        const sessionsWithStats = await Promise.all(
          sessions.map(async (session) => {
            const { data: participants } = await supabase
              .from('session_participants')
              .select('id, percentage, performance_category')
              .eq('session_id', session.id); // Use session_id instead of session_code

            // Calculate performance statistics
            const participantCount = participants?.length || 0;
            const avgPercentage = participantCount > 0 
              ? Math.round(participants.reduce((sum, p) => sum + (p.percentage || 0), 0) / participantCount)
              : 0;
              
            const categoryCount = {
              excellent: participants?.filter(p => p.performance_category === 'excellent').length || 0,
              good: participants?.filter(p => p.performance_category === 'good').length || 0,
              average: participants?.filter(p => p.performance_category === 'average').length || 0,
              poor: participants?.filter(p => p.performance_category === 'poor').length || 0
            };

            return {
              id: session.id,
              code: session.session_code,
              subject: session.subject || 'general',
              className: session.class_name || null,
              exerciseCount: session.exercises.length,
              maxPossibleScore: session.max_possible_score || 0,
              participantCount: participantCount,
              averagePercentage: avgPercentage,
              performanceDistribution: categoryCount,
              isActive: session.is_active,
              createdAt: session.created_at,
              expiresAt: session.expires_at,
              updatedAt: session.updated_at
            };
          })
        );

        // Calculate subject-wide statistics
        const subjectStats = {
          totalSessions: sessionsWithStats.length,
          activeSessions: sessionsWithStats.filter(s => s.isActive).length,
          totalParticipants: sessionsWithStats.reduce((sum, s) => sum + s.participantCount, 0),
          averagePerformance: sessionsWithStats.length > 0 
            ? Math.round(sessionsWithStats.reduce((sum, s) => sum + s.averagePercentage, 0) / sessionsWithStats.length)
            : 0,
          performanceDistribution: {
            excellent: sessionsWithStats.reduce((sum, s) => sum + s.performanceDistribution.excellent, 0),
            good: sessionsWithStats.reduce((sum, s) => sum + s.performanceDistribution.good, 0),
            average: sessionsWithStats.reduce((sum, s) => sum + s.performanceDistribution.average, 0),
            poor: sessionsWithStats.reduce((sum, s) => sum + s.performanceDistribution.poor, 0)
          }
        };

        return res.status(200).json({
          sessions: sessionsWithStats,
          statistics: subjectStats,
          subject: subjectFilter || 'all',
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
        
        // Delete participants first (using session_id)
        const { data: session } = await supabase
          .from('teacher_sessions')
          .select('id')
          .eq('session_code', sessionCode)
          .single();

        if (session) {
          await supabase
            .from('session_participants')
            .delete()
            .eq('session_id', session.id);
        }

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

    // Performance Analytics endpoint
    if (method === 'GET' && path.includes('/performance/analytics')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get query parameters
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const subjectFilter = urlParams.get('subject');
        const period = urlParams.get('period') || 'week'; // week, month, all
        
        // Calculate date range
        const now = new Date();
        let dateFilter = null;
        
        switch (period) {
          case 'week':
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFilter = null; // All time
        }
        
        // Build sessions query
        let sessionsQuery = supabase
          .from('teacher_sessions')
          .select('*');
          
        if (subjectFilter && subjectFilter !== 'all') {
          sessionsQuery = sessionsQuery.eq('subject', subjectFilter);
        }
        
        if (dateFilter) {
          sessionsQuery = sessionsQuery.gte('created_at', dateFilter.toISOString());
        }
        
        const { data: sessions, error: sessionsError } = await sessionsQuery;
        
        if (sessionsError) {
          return res.status(500).json({ 
            error: 'Database error',
            details: sessionsError.message
          });
        }
        
        // Get all participants for these sessions
        const sessionCodes = sessions.map(s => s.session_code);
        const { data: participants, error: participantsError } = await supabase
          .from('session_participants')
          .select('*')
          .in('session_code', sessionCodes);
          
        if (participantsError) {
          return res.status(500).json({ 
            error: 'Database error',
            details: participantsError.message
          });
        }
        
        // Calculate analytics
        const totalStudents = participants.length;
        const averagePerformance = totalStudents > 0 
          ? Math.round(participants.reduce((sum, p) => sum + (p.percentage || 0), 0) / totalStudents)
          : 0;
          
        const categoryDistribution = {
          excellent: participants.filter(p => p.performance_category === 'excellent').length,
          good: participants.filter(p => p.performance_category === 'good').length,
          average: participants.filter(p => p.performance_category === 'average').length,
          poor: participants.filter(p => p.performance_category === 'poor').length
        };
        
        // Top performers (top 10)
        const topPerformers = participants
          .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
          .slice(0, 10)
          .map(p => ({
            studentName: p.student_name || 'Névtelen',
            studentClass: p.student_class || '',
            percentage: p.percentage || 0,
            category: p.performance_category || 'poor',
            sessionCode: p.session_code
          }));
          
        // Performance trends (by day for the period)
        const trends = [];
        if (dateFilter) {
          const days = Math.ceil((now - dateFilter) / (24 * 60 * 60 * 1000));
          for (let i = 0; i < days; i++) {
            const day = new Date(dateFilter.getTime() + i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            
            const dayParticipants = participants.filter(p => {
              const pDate = new Date(p.created_at);
              return pDate >= dayStart && pDate < dayEnd;
            });
            
            const dayAverage = dayParticipants.length > 0
              ? Math.round(dayParticipants.reduce((sum, p) => sum + (p.percentage || 0), 0) / dayParticipants.length)
              : 0;
              
            trends.push({
              date: dayStart.toISOString().split('T')[0],
              averagePerformance: dayAverage,
              studentCount: dayParticipants.length
            });
          }
        }

        return res.status(200).json({
          overview: {
            totalSessions: sessions.length,
            totalStudents: totalStudents,
            averagePerformance: averagePerformance,
            categoryDistribution: categoryDistribution
          },
          trends: trends,
          topPerformers: topPerformers,
          period: period,
          subject: subjectFilter || 'all',
          dateRange: {
            from: dateFilter ? dateFilter.toISOString() : null,
            to: now.toISOString()
          }
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
        'POST /api/simple-api/auth/subject - Subject authentication',
        'POST /api/simple-api/sessions/create - Create session (with subject)',
        'POST /api/simple-api/sessions/join - Join session (student)',
        'GET /api/simple-api/sessions/list?subject=info - Get sessions with subject filter',
        'GET /api/simple-api/sessions/stats - Get session statistics',
        'GET /api/simple-api/performance/analytics?subject=info&period=week - Performance analytics',
        'GET /api/simple-api/sessions/{code}/check - Check session exists',
        'GET /api/simple-api/sessions/{code}/status - Get session status (real-time)',
        'GET /api/simple-api/sessions/{code}/exercises - Get session JSON data',
        'POST /api/simple-api/sessions/{code}/results - Submit student results',
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