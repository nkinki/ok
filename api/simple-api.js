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

    // Debug percentage calculation endpoint
    if (method === 'POST' && path.includes('/debug/percentage')) {
      const { sessionCode, studentId, score } = req.body;

      if (!sessionCode || !studentId || score === undefined) {
        return res.status(400).json({ error: 'sessionCode, studentId és score megadása kötelező' });
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get session data for debugging
        const { data: sessionData, error: sessionDataError } = await supabase
          .from('teacher_sessions')
          .select('exercises, full_session_json')
          .eq('session_code', sessionCode.toUpperCase())
          .single();

        const debugInfo = {
          sessionFound: !!sessionData,
          sessionError: sessionDataError?.message || null,
          hasExercises: !!sessionData?.exercises,
          hasFullJson: !!sessionData?.full_session_json,
          exerciseCount: sessionData?.exercises?.length || 0,
          fullJsonExerciseCount: sessionData?.full_session_json?.exercises?.length || 0
        };

        let totalQuestions = 0;
        let exercisesToAnalyze = null;
        let dataSource = 'none';

        // Use full_session_json if available, otherwise use exercises
        if (sessionData?.full_session_json?.exercises) {
          dataSource = 'full_session_json';
          exercisesToAnalyze = sessionData.full_session_json.exercises;
        } else if (sessionData?.exercises) {
          dataSource = 'exercises';
          exercisesToAnalyze = sessionData.exercises;
        }

        const exerciseAnalysis = [];

        if (exercisesToAnalyze) {
          exercisesToAnalyze.forEach((exercise, index) => {
            let exerciseQuestions = 0;
            if (exercise.type === 'QUIZ') {
              exerciseQuestions = exercise.content?.questions?.length || 0;
            } else if (exercise.type === 'MATCHING') {
              exerciseQuestions = exercise.content?.pairs?.length || 0;
            } else if (exercise.type === 'CATEGORIZATION') {
              exerciseQuestions = exercise.content?.items?.length || 0;
            }
            
            exerciseAnalysis.push({
              index: index + 1,
              type: exercise.type,
              title: exercise.title?.substring(0, 50) || 'No title',
              hasContent: !!exercise.content,
              contentKeys: exercise.content ? Object.keys(exercise.content) : [],
              questionCount: exerciseQuestions
            });
            
            totalQuestions += exerciseQuestions;
          });
        }

        // Calculate percentage
        const maxPossibleScore = totalQuestions * 10;
        const percentage = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;

        return res.status(200).json({
          debug: debugInfo,
          dataSource: dataSource,
          exerciseAnalysis: exerciseAnalysis,
          calculation: {
            totalQuestions: totalQuestions,
            maxPossibleScore: maxPossibleScore,
            currentScore: score,
            percentage: percentage,
            formula: `(${score} / ${maxPossibleScore}) * 100 = ${percentage}%`
          }
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

        // Calculate total questions across all exercises for question-based scoring
        const totalQuestions = data.exercises.reduce((total, exercise) => {
          if (exercise.type === 'QUIZ') {
            return total + (exercise.content?.questions?.length || 0);
          } else if (exercise.type === 'MATCHING') {
            return total + (exercise.content?.pairs?.length || 0);
          } else if (exercise.type === 'CATEGORIZATION') {
            return total + (exercise.content?.items?.length || 0);
          }
          return total;
        }, 0);

        return res.status(200).json({
          exists: true,
          isActive: data.is_active,
          session: {
            id: data.id,
            code: data.session_code,
            exerciseCount: data.exercises.length,
            totalQuestions: totalQuestions, // Add total questions for question-based scoring
            participantCount: participantCount,
            createdAt: data.created_at,
            expiresAt: data.expires_at,
            updatedAt: data.updated_at,
            exercises: data.exercises // Include exercises for question counting
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
            expiresAt: data.expires_at,
            jsonDownloadUrl: data.session_json_url || `/api/simple-api/sessions/${sessionCode}/download` // URL for JSON download
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

      if (!className || !className.trim()) {
        return res.status(400).json({ error: 'Osztály neve kötelező' });
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

    // Student heartbeat (keep session alive)
    if (method === 'POST' && path.includes('/sessions/') && path.includes('/heartbeat')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/heartbeat/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: 'Student ID megadása kötelező' });
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Update student's last seen timestamp
        const { error: updateError } = await supabase
          .from('session_participants')
          .update({
            last_seen: new Date().toISOString(),
            is_online: true
          })
          .eq('id', studentId);

        if (updateError) {
          console.error('Heartbeat update error:', updateError);
          return res.status(500).json({ 
            error: 'Hiba a heartbeat frissítésekor',
            details: updateError.message
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Heartbeat updated successfully'
        });

      } catch (err) {
        console.error('Heartbeat error:', err);
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
      let { studentId, results, summary } = req.body;

      console.log('📊 Results endpoint called:', {
        sessionCode,
        studentId,
        resultsCount: results?.length || 0,
        summaryScore: summary?.totalScore || 0,
        summaryExercises: summary?.completedExercises || 0
      });

      if (!studentId || !results || !summary) {
        console.error('❌ Missing required data:', { studentId: !!studentId, results: !!results, summary: !!summary });
        return res.status(400).json({ error: 'Student ID, eredmények és összesítő megadása kötelező' });
      }

      // Add debug flag to response
      let debugInfo = {
        step: 'starting',
        sessionCode: sessionCode,
        studentId: studentId
      };

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
          debugInfo.step = 'session_not_found';
          debugInfo.sessionError = sessionError?.message || 'Session not found';
          return res.status(404).json({ 
            error: 'Munkamenet nem található vagy nem aktív',
            debug: debugInfo
          });
        }

        debugInfo.step = 'session_found';
        debugInfo.sessionId = session.id;

        // Get current participant data first
        console.log('🔍 Looking for participant with ID:', studentId);
        debugInfo.step = 'looking_for_participant';
        
        let { data: currentParticipant, error: fetchError } = await supabase
          .from('session_participants')
          .select('total_score, results, completed_exercises')
          .eq('id', studentId)
          .single();

        console.log('📊 Participant lookup result:', {
          found: !!currentParticipant,
          error: fetchError?.message || null,
          currentScore: currentParticipant?.total_score || 0,
          currentExercises: currentParticipant?.completed_exercises || 0,
          existingResults: currentParticipant?.results?.length || 0
        });

        debugInfo.participantFound = !!currentParticipant;
        debugInfo.participantError = fetchError?.message || null;

        if (fetchError) {
          console.error('Failed to fetch current participant data:', fetchError);
          debugInfo.step = 'participant_lookup_failed';
          
          // If participant not found, try to find by name and session
          if (fetchError.code === 'PGRST116') { // No rows returned
            console.log('🔍 Participant not found by ID, trying to find by name and session...');
            debugInfo.step = 'trying_fallback_lookup';
            
            // Get session first
            const { data: session } = await supabase
              .from('teacher_sessions')
              .select('id')
              .eq('session_code', sessionCode)
              .single();
              
            if (session) {
              const { data: participantByName } = await supabase
                .from('session_participants')
                .select('*')
                .eq('session_id', session.id)
                .eq('student_name', summary.studentName)
                .eq('student_class', summary.studentClass)
                .single();
                
              if (participantByName) {
                console.log('✅ Found participant by name:', participantByName.id);
                // Use the found participant
                currentParticipant = participantByName;
                studentId = participantByName.id; // Update studentId for the update query
                debugInfo.step = 'fallback_lookup_success';
                debugInfo.fallbackStudentId = participantByName.id;
              } else {
                console.error('❌ Participant not found by name either');
                debugInfo.step = 'fallback_lookup_failed';
                return res.status(404).json({ 
                  error: 'Résztvevő nem található',
                  details: 'A diák nincs regisztrálva ehhez a munkamenethez',
                  debug: debugInfo
                });
              }
            }
          } else {
            debugInfo.step = 'participant_error';
            return res.status(500).json({ 
              error: 'Hiba a résztvevő adatok lekérésekor',
              details: fetchError.message,
              debug: debugInfo
            });
          }
        }

        // FIXED: Don't accumulate scores - replace results for the same exercise
        const existingResults = currentParticipant?.results || [];
        
        // Remove any existing results for the same exercise index to prevent duplicates
        const filteredResults = existingResults.filter((result: any) => result.exerciseIndex !== results[0]?.exerciseIndex);
        const newResults = [...filteredResults, ...results];
        
        // FIXED: Calculate total score from all results, don't accumulate
        const totalScoreFromResults = newResults.reduce((sum: number, result: any) => sum + (result.score || 0), 0);
        
        console.log('📊 Score calculation (FIXED):', {
          exerciseIndex: results[0]?.exerciseIndex,
          newExerciseScore: summary.totalScore,
          totalScoreFromResults,
          existingResultsCount: existingResults.length,
          filteredResultsCount: filteredResults.length,
          newResultsCount: newResults.length,
          replacedExistingResult: existingResults.length > filteredResults.length
        });

        // Get session data to calculate total questions for percentage
        // IMPORTANT: Use the same logic as participants endpoint for consistency
        const { data: sessionData, error: sessionDataError } = await supabase
          .from('teacher_sessions')
          .select('exercises, full_session_json')
          .eq('session_code', sessionCode)
          .single();

        console.log('📊 Session data for percentage calculation:', {
          found: !!sessionData,
          error: sessionDataError?.message || null,
          hasFullJson: !!sessionData?.full_session_json,
          exerciseCount: sessionData?.exercises?.length || 0
        });

        let totalQuestions = 0;
        let exercisesToAnalyze = null;

        // CONSISTENCY FIX: Always use exercises field first (same as participants endpoint)
        // Only use full_session_json as fallback if exercises field is empty
        if (sessionData?.exercises && sessionData.exercises.length > 0) {
          console.log('📊 Using exercises field for question counting (consistent with participants endpoint)');
          exercisesToAnalyze = sessionData.exercises;
        } else if (sessionData?.full_session_json?.exercises) {
          console.log('📊 Using full_session_json as fallback for question counting');
          exercisesToAnalyze = sessionData.full_session_json.exercises;
        } else {
          console.error('❌ No exercise data found for percentage calculation');
        }

        if (exercisesToAnalyze) {
          console.log('📊 Analyzing exercises for question count...');
          exercisesToAnalyze.forEach((exercise, index) => {
            let exerciseQuestions = 0;
            if (exercise.type === 'QUIZ') {
              exerciseQuestions = exercise.content?.questions?.length || 0;
            } else if (exercise.type === 'MATCHING') {
              exerciseQuestions = exercise.content?.pairs?.length || 0;
            } else if (exercise.type === 'CATEGORIZATION') {
              exerciseQuestions = exercise.content?.items?.length || 0;
            }
            console.log(`📊 Exercise ${index + 1} (${exercise.type}): ${exerciseQuestions} questions`);
            totalQuestions += exerciseQuestions;
          });
        }

        console.log('📊 Total questions in session:', totalQuestions);

        // Calculate percentage based on total questions (10 points per question)
        const maxPossibleScore = totalQuestions * 10;
        let percentage = maxPossibleScore > 0 ? Math.round((totalScoreFromResults / maxPossibleScore) * 100) : 0;
        
        // SAFETY FIX: Cap percentage at 100% maximum
        if (percentage > 100) {
          console.warn(`⚠️ Percentage over 100% detected: ${percentage}% - capping at 100%`);
          percentage = 100;
        }
        
        console.log('📊 Percentage calculation:', {
          totalScoreFromResults,
          maxPossibleScore,
          percentage,
          capped: percentage === 100 && totalScoreFromResults > maxPossibleScore,
          formula: `(${totalScoreFromResults} / ${maxPossibleScore}) * 100 = ${Math.round((totalScoreFromResults / maxPossibleScore) * 100)}% → ${percentage}%`
        });

        // Determine performance category
        let performanceCategory = 'poor';
        if (percentage >= 90) performanceCategory = 'excellent';
        else if (percentage >= 75) performanceCategory = 'good';
        else if (percentage >= 60) performanceCategory = 'average';

        // Update participant results (FIXED: use calculated total score)
        console.log('💾 Updating participant with:', {
          studentId,
          completedExercises: Math.max(summary.completedExercises || 0, currentParticipant?.completed_exercises || 0),
          totalScoreFromResults,
          percentage,
          performanceCategory,
          newResultsCount: newResults.length
        });
        
        const { error: updateError } = await supabase
          .from('session_participants')
          .update({
            completed_exercises: Math.max(summary.completedExercises || 0, currentParticipant?.completed_exercises || 0),
            total_score: totalScoreFromResults, // FIXED: use calculated total, not accumulated
            percentage: percentage,  // Re-enabled after DB migration
            performance_category: performanceCategory,  // Re-enabled after DB migration
            results: newResults,
            last_seen: new Date().toISOString(),
            is_online: summary.completedExercises >= summary.totalExercises ? false : true // Mark as completed only when all exercises done
          })
          .eq('id', studentId);

        if (updateError) {
          console.error('Results update error:', updateError);
          return res.status(500).json({ 
            error: 'Hiba az eredmények mentésekor',
            details: updateError.message
          });
        }

        console.log('✅ Results updated successfully for student:', studentId, 'in session:', sessionCode);

        return res.status(200).json({
          success: true,
          message: 'Eredmények sikeresen elmentve!',
          debug: {
            ...debugInfo,
            step: 'completed',
            totalQuestions: totalQuestions,
            maxPossibleScore: maxPossibleScore,
            totalScoreFromResults: totalScoreFromResults,
            calculatedPercentage: percentage,
            performanceCategory: performanceCategory,
            dataSource: sessionData?.full_session_json ? 'full_session_json' : 'exercises'
          }
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
          exercises: data.exercises, // Should now have full exercise data
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

    // Upload session JSON to Google Drive
    if (method === 'POST' && path.includes('/sessions/upload-drive')) {
      const { code, sessionJson } = req.body;

      if (!code || !sessionJson) {
        return res.status(400).json({ error: 'Kód és session JSON megadása kötelező' });
      }

      try {
        console.log('📤 Google Drive upload requested for:', code.toUpperCase());
        
        // Check payload size and reject if too large for Vercel
        const payloadSize = JSON.stringify(sessionJson).length;
        console.log('📊 Upload payload size:', Math.round(payloadSize / 1024), 'KB');
        
        if (payloadSize > 4500000) { // 4.5MB limit (Vercel has 5MB limit)
          console.error('❌ Payload too large for Vercel:', Math.round(payloadSize / 1024), 'KB');
          return res.status(413).json({
            error: 'Session data too large for upload',
            details: `Payload size: ${Math.round(payloadSize / 1024)}KB exceeds 4.5MB limit`,
            hint: 'Try reducing image quality or number of exercises',
            payloadSizeKB: Math.round(payloadSize / 1024)
          });
        }
        
        // For now, we'll use a simple approach: store the JSON in the database
        // This allows students to download it via the API
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ 
            error: 'Supabase credentials missing'
          });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Store the full session JSON in the database (this OVERWRITES any previous data)
        console.log('💾 Storing full session JSON with images in database...');
        console.log('🖼️ Session JSON contains', sessionJson.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0, 'exercises with images');
        
        const { error: updateError } = await supabase
          .from('teacher_sessions')
          .update({
            full_session_json: sessionJson,
            json_uploaded_at: new Date().toISOString()
          })
          .eq('session_code', code.toUpperCase());

        if (updateError) {
          console.error('Database JSON storage error:', updateError);
          return res.status(500).json({
            error: 'Failed to store session JSON',
            details: updateError.message
          });
        }

        console.log('✅ Session JSON stored in database for Drive access');

        return res.status(200).json({
          success: true,
          fileId: `db_${code.toUpperCase()}_${Date.now()}`,
          downloadUrl: `/api/simple-api/sessions/${code.toUpperCase()}/download-json`,
          fileName: `session_${code.toUpperCase()}.json`,
          message: 'Session JSON stored successfully (database fallback)'
        });

      } catch (err) {
        console.error('Google Drive upload error:', err);
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Download session JSON from Google Drive
    if (method === 'GET' && path.includes('/sessions/') && path.includes('/download-drive')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/download-drive/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      
      try {
        console.log('📥 Google Drive download requested for:', sessionCode);
        
        // Get full session JSON from database
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: session, error } = await supabase
          .from('teacher_sessions')
          .select('full_session_json, json_uploaded_at, exercises, subject, created_at, id')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .single();

        if (error || !session) {
          console.error('Session not found:', error);
          return res.status(404).json({
            error: 'Session not found',
            hint: 'Session may not exist or may have expired'
          });
        }

        let sessionJson;
        
        // Try to use full_session_json first, fallback to exercises
        if (session.full_session_json) {
          console.log('✅ Using stored full_session_json (Drive fallback)');
          sessionJson = session.full_session_json;
        } else if (session.exercises) {
          console.log('⚠️ full_session_json not found, creating from exercises (Drive fallback)');
          // Create session JSON from exercises data
          sessionJson = {
            sessionCode: sessionCode,
            subject: session.subject || 'general',
            createdAt: session.created_at,
            exercises: session.exercises,
            metadata: {
              version: '1.0.0',
              exportedBy: 'Okos Gyakorló API',
              totalExercises: session.exercises.length,
              estimatedTime: session.exercises.length * 3,
              sessionId: session.id
            }
          };
        } else {
          console.error('No exercise data found (Drive fallback)');
          return res.status(404).json({
            error: 'No exercise data found',
            hint: 'Session may be corrupted or incomplete'
          });
        }

        console.log('✅ Session JSON prepared for Drive download');
        
        // Return the session JSON
        return res.status(200).json(sessionJson);

      } catch (err) {
        console.error('Google Drive download error:', err);
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Download session JSON (simple approach)
    if (method === 'GET' && path.includes('/sessions/') && path.includes('/download-json')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/download-json/);
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      const sessionCode = codeMatch[1].toUpperCase();
      
      try {
        console.log('📥 JSON download requested for:', sessionCode);
        
        // Get full session JSON from database
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return res.status(500).json({ error: 'Supabase credentials missing' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: session, error } = await supabase
          .from('teacher_sessions')
          .select('full_session_json, json_uploaded_at, exercises, subject, created_at, id')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .single();

        if (error || !session) {
          console.error('Session not found:', error);
          return res.status(404).json({
            error: 'Session not found',
            hint: 'Session may not exist or may have expired'
          });
        }

        let sessionJson;
        
        // Try to use full_session_json first, fallback to exercises
        if (session.full_session_json) {
          console.log('✅ Using stored full_session_json');
          console.log('🖼️ Full session JSON contains', session.full_session_json.exercises?.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0, 'exercises with images');
          sessionJson = session.full_session_json;
        } else if (session.exercises) {
          console.log('⚠️ full_session_json not found, creating from exercises');
          console.log('🖼️ Fallback exercises contain', session.exercises.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length || 0, 'exercises with images');
          // Create session JSON from exercises data
          sessionJson = {
            sessionCode: sessionCode,
            subject: session.subject || 'general',
            createdAt: session.created_at,
            exercises: session.exercises,
            metadata: {
              version: '1.0.0',
              exportedBy: 'Okos Gyakorló API',
              totalExercises: session.exercises.length,
              estimatedTime: session.exercises.length * 3,
              sessionId: session.id
            }
          };
        } else {
          console.error('No exercise data found');
          return res.status(404).json({
            error: 'No exercise data found',
            hint: 'Session may be corrupted or incomplete'
          });
        }

        console.log('✅ Session JSON prepared for download');
        
        // Return the session JSON
        return res.status(200).json(sessionJson);
        
      } catch (err) {
        console.error('JSON download error:', err);
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Create minimal session (new approach - localStorage based)
    if (method === 'POST' && path.includes('/sessions/create-minimal')) {
      const { code, subject = 'general', className, exerciseCount, maxScore } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Kód megadása kötelező' });
      }

      if (!className || !className.trim()) {
        return res.status(400).json({ error: 'Osztály neve kötelező' });
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
        
        // Create minimal session record for tracking - only use columns that exist
        const sessionData = {
          session_code: code.toUpperCase(),
          exercises: [], // Empty - data is in localStorage
          subject: subject,
          class_name: className.trim(),
          max_possible_score: maxScore || (exerciseCount ? exerciseCount * 10 : 100),
          is_active: true,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 60 minutes
        };

        console.log('💾 Creating minimal session record:', code.toUpperCase());
        console.log('📊 Session data to insert:', JSON.stringify(sessionData, null, 2));
        
        // Create session in database with explicit column selection
        const { data, error } = await supabase
          .from('teacher_sessions')
          .insert([sessionData]) // Use array format to be explicit
          .select('id, session_code, subject, class_name, is_active, created_at, expires_at')
          .single();

        if (error) {
          console.error('Database error details:', error);
          return res.status(500).json({ 
            error: 'Database error',
            details: error.message,
            hint: 'Check if all required columns exist in teacher_sessions table'
          });
        }

        console.log('✅ Minimal session created successfully:', data.session_code);

        return res.status(200).json({
          success: true,
          session: {
            id: data.id,
            code: data.session_code,
            subject: data.subject,
            className: data.class_name,
            isActive: data.is_active,
            createdAt: data.created_at,
            expiresAt: data.expires_at,
            storageType: 'localStorage'
          },
          message: 'Minimal session created successfully'
        });

      } catch (err) {
        console.error('Minimal session creation error:', err);
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message,
          stack: err.stack
        });
      }
    }
    
    // Create session
    if (method === 'POST' && path.includes('/sessions/create')) {
      const { code, exercises, subject = 'general', maxScore, className, fullExercises } = req.body;

      if (!code || !exercises) {
        return res.status(400).json({ error: 'Kód és feladatok megadása kötelező' });
      }

      if (!className || !className.trim()) {
        return res.status(400).json({ error: 'Osztály neve kötelező' });
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
        
        // Create session with full exercise data for student access
        const sessionData = {
          session_code: code.toUpperCase(),
          exercises: fullExercises || exercises, // Store full exercises if available
          subject: subject,
          class_name: className.trim(),
          max_possible_score: calculatedMaxScore,
          is_active: true,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 60 minutes
          full_session_json: fullExercises ? {
            sessionCode: code.toUpperCase(),
            subject: subject,
            createdAt: new Date().toISOString(),
            exercises: fullExercises,
            metadata: {
              version: '1.0.0',
              exportedBy: 'Okos Gyakorló API',
              totalExercises: fullExercises.length,
              estimatedTime: fullExercises.length * 3
            }
          } : null, // Store full session JSON if available
          json_uploaded_at: fullExercises ? new Date().toISOString() : null
        };

        console.log('💾 Inserting session with', exercises.length, 'exercises, subject:', subject, 'class:', className.trim());
        console.log('📊 Using', fullExercises ? 'full' : 'minimal', 'exercise data');
        
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

        return res.status(200).json({
          success: true,
          session: {
            id: data.id,
            code: data.session_code,
            exerciseCount: exercises.length,
            subject: data.subject,
            className: data.class_name,
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

    // Download session JSON (student) - fast file download
    if (method === 'GET' && path.includes('/sessions/') && path.includes('/download')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/download/);
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
          .select('full_session_json')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data || !data.full_session_json) {
          return res.status(404).json({ 
            error: 'Munkamenet JSON nem található',
            hint: 'A munkamenet lehet, hogy lejárt vagy nem létezik.'
          });
        }

        // Return JSON file for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="session_${sessionCode}.json"`);
        return res.status(200).json(data.full_session_json);
        
      } catch (err) {
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
        const sessionIds = sessions.map(s => s.id);
        const { data: participants, error: participantsError } = await supabase
          .from('session_participants')
          .select('*')
          .in('session_id', sessionIds);
          
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
        
        // Get subject filter from query params
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const subjectFilter = urlParams.get('subject');
        
        // Build queries with optional subject filter
        let allSessionsQuery = supabase.from('teacher_sessions').select('*');
        let activeSessionsQuery = supabase.from('teacher_sessions').select('*')
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString());
        
        if (subjectFilter && subjectFilter !== 'all') {
          allSessionsQuery = allSessionsQuery.eq('subject', subjectFilter);
          activeSessionsQuery = activeSessionsQuery.eq('subject', subjectFilter);
        }
        
        const { data: allSessions } = await allSessionsQuery;
        const { data: activeSessions } = await activeSessionsQuery;

        // Get participants only for sessions of the current subject
        let participantsQuery;
        if (subjectFilter && subjectFilter !== 'all') {
          // Get session IDs for the current subject
          const sessionIds = allSessions?.map(s => s.id) || [];
          participantsQuery = supabase
            .from('session_participants')
            .select('*')
            .in('session_id', sessionIds);
        } else {
          participantsQuery = supabase
            .from('session_participants')
            .select('*');
        }
        
        const { data: allParticipants } = await participantsQuery;

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

    // Get session participants (teacher)
    if (method === 'GET' && path.includes('/sessions/') && path.includes('/participants')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/participants/);
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
        
        // Get session first
        const { data: session, error: sessionError } = await supabase
          .from('teacher_sessions')
          .select('id')
          .eq('session_code', sessionCode)
          .single();

        if (sessionError || !session) {
          return res.status(404).json({ 
            error: 'Munkamenet nem található'
          });
        }

        // Get participants for this session
        const { data: participants, error: participantsError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', session.id)
          .order('joined_at', { ascending: false });

        if (participantsError) {
          return res.status(500).json({ 
            error: 'Database error',
            details: participantsError.message
          });
        }

        // Calculate performance categories for each participant
        const participantsWithPerformance = (participants || []).map(participant => {
          const percentage = participant.percentage || 0;
          let performance_category = 'poor';
          
          if (percentage >= 90) performance_category = 'excellent';
          else if (percentage >= 75) performance_category = 'good';
          else if (percentage >= 60) performance_category = 'average';
          
          return {
            ...participant,
            performance_category
          };
        });

        return res.status(200).json({
          participants: participantsWithPerformance,
          total: participantsWithPerformance.length,
          sessionCode: sessionCode
        });

      } catch (err) {
        return res.status(500).json({ 
          error: 'Server error',
          details: err.message
        });
      }
    }

    // Get session participants (teacher)
    if (method === 'GET' && path.includes('/sessions/') && path.includes('/participants')) {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/participants/);
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
        
        // Get session first
        const { data: session, error: sessionError } = await supabase
          .from('teacher_sessions')
          .select('id, session_code, exercises')
          .eq('session_code', sessionCode)
          .single();

        if (sessionError || !session) {
          return res.status(404).json({ 
            error: 'Munkamenet nem található'
          });
        }

        // Get participants for this session
        const { data: participants, error: participantsError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', session.id)
          .order('joined_at', { ascending: false });

        if (participantsError) {
          return res.status(500).json({ 
            error: 'Database error',
            details: participantsError.message
          });
        }

        // Calculate performance categories and percentages based on questions, not exercises
        // Count total questions across all exercises
        const totalQuestions = session.exercises.reduce((total, exercise) => {
          if (exercise.type === 'QUIZ') {
            return total + (exercise.content?.questions?.length || 0);
          } else if (exercise.type === 'MATCHING') {
            return total + (exercise.content?.pairs?.length || 0);
          } else if (exercise.type === 'CATEGORIZATION') {
            return total + (exercise.content?.items?.length || 0);
          }
          return total;
        }, 0);
        
        const maxPossibleScore = totalQuestions * 10; // 10 points per question
        
        const enhancedParticipants = (participants || []).map(participant => {
          let percentage = maxPossibleScore > 0 
            ? Math.round((participant.total_score / maxPossibleScore) * 100)
            : 0;
          
          // SAFETY FIX: Cap percentage at 100% maximum
          if (percentage > 100) {
            console.warn(`⚠️ Participant ${participant.student_name} percentage over 100%: ${percentage}% - capping at 100%`);
            percentage = 100;
          }
          
          let performance_category = 'poor';
          if (percentage >= 90) performance_category = 'excellent';
          else if (percentage >= 75) performance_category = 'good';
          else if (percentage >= 60) performance_category = 'average';
          
          return {
            ...participant,
            percentage,
            performance_category
          };
        });

        return res.status(200).json({
          success: true,
          sessionCode: sessionCode,
          sessionId: session.id,
          exerciseCount: session.exercises.length,
          totalQuestions: totalQuestions, // Add total questions count
          maxPossibleScore,
          participants: enhancedParticipants,
          participantCount: enhancedParticipants.length,
          averagePercentage: enhancedParticipants.length > 0 
            ? Math.round(enhancedParticipants.reduce((sum, p) => sum + p.percentage, 0) / enhancedParticipants.length)
            : 0
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