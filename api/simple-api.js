// Production API for fixed rooms system and teacher-student assignments

// Import Supabase - database-only storage
let supabase = null;
let supabaseError = null;

try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    supabaseError = 'Supabase credentials missing in environment variables';
    console.error('❌ Supabase credentials missing:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    });
  } else {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  }
} catch (error) {
  supabaseError = `Supabase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  console.error('❌ Supabase initialization failed:', error);
}

// In-memory storage (will reset on each function invocation)
let rooms = new Map();
let roomPlayers = new Map();
let roomGameStates = new Map();

// Initialize fixed rooms
function initializeFixedRooms() {
  if (rooms.size > 0) return; // Already initialized
  
  const grades = [3, 4, 5, 6, 7, 8];
  
  grades.forEach(grade => {
    const roomId = `grade-${grade}-room`;
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const roomCode = `${grade}${randomCode}`;
    
    const fixedRoom = {
      id: roomId,
      roomCode: roomCode,
      title: `${grade}. osztály - Állandó szoba`,
      description: `Fix szoba a ${grade}. osztály számára`,
      maxPlayers: 35,
      status: 'waiting',
      isFixed: true,
      grade: grade,
      createdAt: new Date(),
      customCode: null
    };
    
    rooms.set(roomId, fixedRoom);
    roomPlayers.set(roomId, []);
    
    // Initialize game state
    roomGameStates.set(roomId, {
      roomId: roomId,
      roomStatus: 'waiting',
      gameState: 'waiting',
      isActive: false,
      currentQuestionIndex: 0,
      playerCount: 0,
      exercisesLoaded: false,
      gameStarted: false,
      gameFinished: false,
      results: []
    });
  });
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check Supabase availability for database operations
  if (!supabase && supabaseError) {
    console.error('Supabase not available:', supabaseError);
    return res.status(500).json({ 
      error: 'Adatbázis nem elérhető', 
      details: supabaseError,
      timestamp: new Date().toISOString()
    });
  }

  // Initialize rooms on first request
  initializeFixedRooms();

  const { url, method } = req;
  const path = url?.split('?')[0] || '';

  try {
    // Health check
    if (path === '/api/simple-api' && method === 'GET') {
      return res.json({ 
        status: 'ok', 
        roomsCount: rooms.size,
        timestamp: new Date() 
      });
    }

    // Test connection endpoint
    if (path === '/api/simple-api' && method === 'POST' && req.body?.action === 'test_connection') {
      const envVars = {
        SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
      };

      const result = {
        timestamp: new Date().toISOString(),
        environment: {
          hasSupabaseUrl: !!envVars.SUPABASE_URL,
          hasSupabaseKey: !!envVars.SUPABASE_ANON_KEY,
          supabaseUrlLength: envVars.SUPABASE_URL.length,
          supabaseKeyLength: envVars.SUPABASE_ANON_KEY.length,
          nodeEnv: envVars.NODE_ENV,
          vercelEnv: envVars.VERCEL_ENV
        },
        supabase: {
          clientInitialized: !!supabase,
          initializationError: supabaseError,
          canConnect: false,
          connectionError: null
        }
      };

      // Test actual connection if client is initialized
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('teacher_sessions')
            .select('count')
            .limit(1);

          if (error) {
            result.supabase.connectionError = error.message;
            result.supabase.canConnect = false;
          } else {
            result.supabase.canConnect = true;
          }
        } catch (error) {
          result.supabase.connectionError = error instanceof Error ? error.message : 'Unknown error';
          result.supabase.canConnect = false;
        }
      }

      return res.json({
        success: true,
        message: 'Connection test completed',
        result
      });
    }

    // Create session (teacher) - Database only
    if (path === '/api/simple-api/sessions/create' && method === 'POST') {
      const { code, exercises } = req.body;

      if (!code || !exercises || !Array.isArray(exercises)) {
        return res.status(400).json({ error: 'Kód és feladatok megadása kötelező' });
      }

      if (!supabase) {
        return res.status(500).json({ 
          error: 'Adatbázis nem elérhető',
          details: supabaseError || 'Supabase client not initialized',
          solution: 'Ellenőrizd a Supabase beállításokat a .env.local fájlban'
        });
      }

      try {
        console.log('🗄️ Creating session in database with code:', code.toUpperCase());
        
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
          console.error('❌ Database error:', error);
          
          // If table doesn't exist, provide helpful error
          if (error.code === 'PGRST205') {
            return res.status(500).json({ 
              error: 'A teacher_sessions tábla nem létezik az adatbázisban',
              details: 'Futtasd le a create-missing-tables.sql fájlt a Supabase SQL Editor-ban',
              sqlFile: 'create-missing-tables.sql',
              code: error.code
            });
          }
          
          return res.status(500).json({ 
            error: 'Adatbázis hiba a munkamenet létrehozásakor',
            details: error.message,
            code: error.code
          });
        }

        console.log('✅ Session created successfully:', data.session_code);

        return res.json({
          success: true,
          session: {
            id: data.id,
            code: data.session_code,
            exercises: data.exercises,
            isActive: data.is_active,
            createdAt: data.created_at,
            expiresAt: data.expires_at
          },
          message: 'Munkamenet sikeresen létrehozva az adatbázisban'
        });

      } catch (error) {
        console.error('❌ Session creation error:', error);
        return res.status(500).json({ 
          error: 'Szerver hiba a munkamenet létrehozásakor',
          details: error instanceof Error ? error.message : 'Ismeretlen hiba'
        });
      }
    }

    // Default response for unmatched routes
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};