// Production API for fixed rooms system and teacher-student assignments
const { VercelRequest, VercelResponse } = require('@vercel/node');

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
// For production, consider using a database or external storage
let rooms = new Map()
let roomPlayers = new Map()
let roomGameStates = new Map()
let roomQuestions = new Map()
let roomExercises = new Map()

// Teacher-Student Assignment System Storage
let students = new Map()
let exercises = new Map()
let dailyAssignments = new Map()
let studentSessions = new Map()
let studentAnswers = new Map()
let teachers = new Map()

// Session management now uses Supabase instead of in-memory storage

// Initialize fixed rooms and sample data
function initializeFixedRooms() {
  if (rooms.size > 0) return // Already initialized
  
  const grades = [3, 4, 5, 6, 7, 8]
  
  grades.forEach(grade => {
    const roomId = `grade-${grade}-room`
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase()
    const roomCode = `${grade}${randomCode}`
    
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
    }
    
    rooms.set(roomId, fixedRoom)
    roomPlayers.set(roomId, [])
    
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
    })
  })

  // Initialize sample teachers
  if (teachers.size === 0) {
    const sampleTeachers = [
      { id: 'teacher_info', email: 'informatika@szenmihalyatisk.hu', fullName: 'Informatika Tanár', subject: 'Informatika' },
      { id: 'teacher_matek', email: 'matematika@szenmihalyatisk.hu', fullName: 'Matematika Tanár', subject: 'Matematika' },
      { id: 'teacher_tori', email: 'tortenelem@szenmihalyatisk.hu', fullName: 'Történelem Tanár', subject: 'Történelem' },
      { id: 'teacher_magy', email: 'magyar@szenmihalyatisk.hu', fullName: 'Magyar Tanár', subject: 'Magyar nyelv' },
      { id: 'teacher_angol', email: 'angol@szenmihalyatisk.hu', fullName: 'Angol Tanár', subject: 'Angol nyelv' },
      { id: 'teacher_term', email: 'termeszet@szenmihalyatisk.hu', fullName: 'Természettudomány Tanár', subject: 'Természettudomány' }
    ]
    
    sampleTeachers.forEach(teacher => {
      teachers.set(teacher.id, {
        ...teacher,
        authProvider: 'code',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      })
    })
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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
  initializeFixedRooms()

  const { url, method } = req
  const path = url?.split('?')[0] || ''

  try {
    // Health check
    if (path === '/api/simple-api' && method === 'GET') {
      return res.json({ 
        status: 'ok', 
        roomsCount: rooms.size,
        timestamp: new Date() 
      })
    }

    // Test connection endpoint
    if (path === '/api/simple-api' && method === 'POST' && req.body?.action === 'test_connection') {
      const envVars = {
        SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
      }

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
      }

      // Test actual connection if client is initialized
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('teacher_sessions')
            .select('count')
            .limit(1)

          if (error) {
            result.supabase.connectionError = error.message
            result.supabase.canConnect = false
          } else {
            result.supabase.canConnect = true
          }
        } catch (error) {
          result.supabase.connectionError = error instanceof Error ? error.message : 'Unknown error'
          result.supabase.canConnect = false
        }
      }

      return res.json({
        success: true,
        message: 'Connection test completed',
        result
      })
    }

    // Get fixed rooms
    if (path === '/api/simple-api/rooms/fixed' && method === 'GET') {
      const fixedRooms = Array.from(rooms.values())
        .filter(room => room.isFixed)
        .map(room => {
          const players = roomPlayers.get(room.id) || []
          return {
            ...room,
            playerCount: players.length,
            availableSlots: room.maxPlayers - players.length
          }
        })
        .sort((a, b) => a.grade - b.grade)
      
      return res.json({
        fixedRooms,
        count: fixedRooms.length,
        message: 'Fix szobák betöltve'
      })
    }

    // Set custom room code
    if (path.includes('/rooms/fixed/') && path.includes('/set-code') && method === 'POST') {
      const gradeMatch = path.match(/\/rooms\/fixed\/(\d+)\/set-code/)
      if (!gradeMatch) {
        return res.status(400).json({ error: 'Invalid grade parameter' })
      }

      const grade = parseInt(gradeMatch[1])
      const { customCode } = req.body

      if (!customCode || customCode.length !== 6) {
        return res.status(400).json({ error: 'A kód pontosan 6 karakter hosszú kell legyen' })
      }

      if (!/^[A-Z0-9]+$/.test(customCode)) {
        return res.status(400).json({ error: 'A kód csak betűket és számokat tartalmazhat' })
      }

      // Check for duplicates
      const existingRoom = Array.from(rooms.values()).find(room => 
        (room.customCode === customCode || room.roomCode === customCode) && room.grade !== grade
      )

      if (existingRoom) {
        return res.status(400).json({ error: 'Ez a kód már használatban van' })
      }

      const roomId = `grade-${grade}-room`
      const room = rooms.get(roomId)
      
      if (!room) {
        return res.status(404).json({ error: 'Szoba nem található' })
      }

      room.customCode = customCode
      rooms.set(roomId, room)

      return res.json({ 
        success: true, 
        message: `Kód beállítva: ${customCode}`,
        room: room
      })
    }

    // Check room by code
    if (path.includes('/rooms/check/') && method === 'GET') {
      const codeMatch = path.match(/\/rooms\/check\/(.+)/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Invalid room code' })
      }

      const roomCode = codeMatch[1]
      const room = Array.from(rooms.values()).find(r => 
        r.roomCode === roomCode || r.customCode === roomCode
      )

      if (!room) {
        return res.status(404).json({ error: 'Szoba nem található' })
      }

      const players = roomPlayers.get(room.id) || []
      return res.json({
        exists: true,
        room: {
          ...room,
          playerCount: players.length,
          availableSlots: room.maxPlayers - players.length
        }
      })
    }

    // Join room
    if (path.includes('/rooms/') && path.includes('/join') && method === 'POST') {
      const codeMatch = path.match(/\/rooms\/(.+)\/join/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Invalid room code' })
      }

      const roomCode = codeMatch[1]
      const { playerName } = req.body

      if (!playerName || playerName.trim().length === 0) {
        return res.status(400).json({ error: 'A név megadása kötelező' })
      }

      const room = Array.from(rooms.values()).find(r => 
        r.roomCode === roomCode || r.customCode === roomCode
      )

      if (!room) {
        return res.status(404).json({ error: 'Szoba nem található' })
      }

      const players = roomPlayers.get(room.id) || []

      // Check if name already exists
      if (players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
        return res.status(400).json({ error: 'Ez a név már foglalt ebben a szobában' })
      }

      // Check room capacity
      if (players.length >= room.maxPlayers) {
        return res.status(400).json({ error: 'A szoba megtelt' })
      }

      const newPlayer = {
        id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        name: playerName.trim(),
        joinedAt: new Date(),
        score: 0,
        correctAnswers: 0
      }

      players.push(newPlayer)
      roomPlayers.set(room.id, players)

      // Update game state
      const gameState = roomGameStates.get(room.id)
      if (gameState) {
        gameState.playerCount = players.length
        roomGameStates.set(room.id, gameState)
      }

      return res.json({
        success: true,
        message: 'Sikeresen csatlakoztál a szobához',
        player: newPlayer,
        room: {
          ...room,
          playerCount: players.length
        }
      })
    }

    // ===== TEACHER-STUDENT ASSIGNMENT SYSTEM =====

    // Student registration
    if (path === '/api/simple-api/students/register' && method === 'POST') {
      const { name, className, subject } = req.body

      if (!name || !className || !subject) {
        return res.status(400).json({ error: 'Név, osztály és tantárgy megadása kötelező' })
      }

      const studentId = generateId()
      const student = {
        id: studentId,
        name: name.trim(),
        className: className.trim(),
        subject: subject.trim(),
        createdAt: new Date(),
        lastActive: new Date()
      }

      students.set(studentId, student)

      return res.json({
        success: true,
        student,
        message: 'Diák sikeresen regisztrálva'
      })
    }

    // Get student by name, class and subject
    if (path === '/api/simple-api/students/find' && method === 'POST') {
      const { name, className, subject } = req.body

      if (!name || !className || !subject) {
        return res.status(400).json({ error: 'Név, osztály és tantárgy megadása kötelező' })
      }

      const student = Array.from(students.values()).find(s => 
        s.name.toLowerCase() === name.toLowerCase() && 
        s.className.toLowerCase() === className.toLowerCase() &&
        s.subject.toLowerCase() === subject.toLowerCase()
      )

      if (!student) {
        return res.status(404).json({ error: 'Diák nem található' })
      }

      // Update last active
      student.lastActive = new Date()
      students.set(student.id, student)

      return res.json({
        success: true,
        student
      })
    }

    // Create exercise (teacher)
    if (path === '/api/simple-api/exercises' && method === 'POST') {
      const teacher = getTeacherFromAuth(req)
      if (!teacher) {
        return res.status(401).json({ error: 'Bejelentkezés szükséges' })
      }

      const { title, imageUrl, exerciseData, subject, difficultyLevel, tags } = req.body

      if (!title || !imageUrl || !exerciseData) {
        return res.status(400).json({ error: 'Cím, kép és feladat adat megadása kötelező' })
      }

      const exerciseId = generateId()
      const exercise = {
        id: exerciseId,
        teacherId: teacher.id,
        title: title.trim(),
        imageUrl,
        exerciseData,
        subject: subject || teacher.subject,
        difficultyLevel: difficultyLevel || 1,
        tags: tags || [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      exercises.set(exerciseId, exercise)

      return res.json({
        success: true,
        exercise,
        message: 'Feladat sikeresen létrehozva'
      })
    }

    // Get teacher's exercises
    if (path === '/api/simple-api/exercises' && method === 'GET') {
      const teacher = getTeacherFromAuth(req)
      if (!teacher) {
        return res.status(401).json({ error: 'Bejelentkezés szükséges' })
      }

      const teacherExercises = Array.from(exercises.values())
        .filter(ex => ex.teacherId === teacher.id && ex.isActive)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return res.json({
        exercises: teacherExercises,
        count: teacherExercises.length
      })
    }

    // Create daily assignment (teacher)
    if (path === '/api/simple-api/assignments' && method === 'POST') {
      const teacher = getTeacherFromAuth(req)
      if (!teacher) {
        return res.status(401).json({ error: 'Bejelentkezés szükséges' })
      }

      const { title, description, targetClass, subject, exerciseIds, startDate, endDate } = req.body

      if (!title || !targetClass || !subject || !exerciseIds || !Array.isArray(exerciseIds) || exerciseIds.length === 0) {
        return res.status(400).json({ error: 'Cím, célcsoport, tantárgy és feladatok megadása kötelező' })
      }

      // Validate exercises belong to teacher
      const validExercises = exerciseIds.filter(id => {
        const exercise = exercises.get(id)
        return exercise && exercise.teacherId === teacher.id && exercise.isActive
      })

      if (validExercises.length === 0) {
        return res.status(400).json({ error: 'Nem található érvényes feladat' })
      }

      const assignmentId = generateId()
      const assignment = {
        id: assignmentId,
        teacherId: teacher.id,
        title: title.trim(),
        description: description?.trim() || '',
        targetClass: targetClass.trim(),
        subject: subject.trim(),
        exerciseIds: validExercises,
        isActive: true,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      dailyAssignments.set(assignmentId, assignment)

      return res.json({
        success: true,
        assignment,
        message: 'Napi feladat sikeresen létrehozva'
      })
    }

    // Get active assignments for a class and subject (student)
    if (path === '/api/simple-api/assignments/active' && method === 'POST') {
      const { className, subject } = req.body
      
      if (!className || !subject) {
        return res.status(400).json({ error: 'Osztály és tantárgy megadása kötelező' })
      }

      const today = new Date().toISOString().split('T')[0]

      const activeAssignments = Array.from(dailyAssignments.values())
        .filter(assignment => 
          assignment.isActive && 
          assignment.targetClass.toLowerCase() === className.toLowerCase() &&
          assignment.subject.toLowerCase() === subject.toLowerCase() &&
          assignment.startDate <= today &&
          (!assignment.endDate || assignment.endDate >= today)
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Include exercise details
      const assignmentsWithExercises = activeAssignments.map(assignment => ({
        ...assignment,
        exercises: assignment.exerciseIds.map(id => exercises.get(id)).filter(Boolean)
      }))

      return res.json({
        assignments: assignmentsWithExercises,
        count: assignmentsWithExercises.length
      })
    }

    // Get assignments for a class (student) - legacy endpoint
    if (path.includes('/api/simple-api/assignments/class/') && method === 'GET') {
      const classMatch = path.match(/\/assignments\/class\/(.+)/)
      if (!classMatch) {
        return res.status(400).json({ error: 'Osztály megadása kötelező' })
      }

      const className = decodeURIComponent(classMatch[1])
      const today = new Date().toISOString().split('T')[0]

      const classAssignments = Array.from(dailyAssignments.values())
        .filter(assignment => 
          assignment.isActive && 
          assignment.targetClass.toLowerCase() === className.toLowerCase() &&
          assignment.startDate <= today &&
          (!assignment.endDate || assignment.endDate >= today)
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Include exercise details
      const assignmentsWithExercises = classAssignments.map(assignment => ({
        ...assignment,
        exercises: assignment.exerciseIds.map(id => exercises.get(id)).filter(Boolean)
      }))

      return res.json({
        assignments: assignmentsWithExercises,
        count: assignmentsWithExercises.length
      })
    }

    // Start student session
    if (path === '/api/simple-api/sessions/start' && method === 'POST') {
      const { studentId, assignmentId } = req.body

      if (!studentId || !assignmentId) {
        return res.status(400).json({ error: 'Diák és feladat azonosító megadása kötelező' })
      }

      const student = students.get(studentId)
      const assignment = dailyAssignments.get(assignmentId)

      if (!student) {
        return res.status(404).json({ error: 'Diák nem található' })
      }

      if (!assignment || !assignment.isActive) {
        return res.status(404).json({ error: 'Feladat nem található vagy nem aktív' })
      }

      const sessionId = generateId()
      const session = {
        id: sessionId,
        studentId,
        assignmentId,
        startedAt: new Date(),
        completedAt: null,
        totalExercises: assignment.exerciseIds.length,
        completedExercises: 0,
        totalScore: 0,
        status: 'in_progress'
      }

      studentSessions.set(sessionId, session)

      return res.json({
        success: true,
        session,
        assignment: {
          ...assignment,
          exercises: assignment.exerciseIds.map(id => exercises.get(id)).filter(Boolean)
        }
      })
    }

    // Submit student answer
    if (path === '/api/simple-api/sessions/answer' && method === 'POST') {
      const { sessionId, exerciseId, studentAnswer, isCorrect, score, timeSpentSeconds } = req.body

      if (!sessionId || !exerciseId || studentAnswer === undefined) {
        return res.status(400).json({ error: 'Munkamenet, feladat és válasz megadása kötelező' })
      }

      const session = studentSessions.get(sessionId)
      if (!session) {
        return res.status(404).json({ error: 'Munkamenet nem található' })
      }

      const answerId = generateId()
      const answer = {
        id: answerId,
        sessionId,
        exerciseId,
        studentAnswer,
        isCorrect: isCorrect || false,
        score: score || 0,
        timeSpentSeconds: timeSpentSeconds || 0,
        answeredAt: new Date()
      }

      studentAnswers.set(answerId, answer)

      // Update session progress
      session.completedExercises += 1
      session.totalScore += answer.score

      if (session.completedExercises >= session.totalExercises) {
        session.status = 'completed'
        session.completedAt = new Date()
      }

      studentSessions.set(sessionId, session)

      return res.json({
        success: true,
        answer,
        session,
        message: 'Válasz sikeresen rögzítve'
      })
    }

    // Get teacher's assignments
    if (path === '/api/simple-api/assignments' && method === 'GET') {
      const teacher = getTeacherFromAuth(req)
      if (!teacher) {
        return res.status(401).json({ error: 'Bejelentkezés szükséges' })
      }

      const teacherAssignments = Array.from(dailyAssignments.values())
        .filter(assignment => assignment.teacherId === teacher.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Include exercise details and session stats
      const assignmentsWithDetails = teacherAssignments.map(assignment => {
        const assignmentSessions = Array.from(studentSessions.values())
          .filter(session => session.assignmentId === assignment.id)
        
        return {
          ...assignment,
          exercises: assignment.exerciseIds.map(id => exercises.get(id)).filter(Boolean),
          sessionCount: assignmentSessions.length,
          completedSessions: assignmentSessions.filter(s => s.status === 'completed').length
        }
      })

      return res.json({
        assignments: assignmentsWithDetails,
        count: assignmentsWithDetails.length
      })
    }

    // === SESSION MANAGEMENT ENDPOINTS ===

    // Create session (teacher) - Database only with fallback
    if (path === '/api/simple-api/sessions/create' && method === 'POST') {
      const { code, exercises } = req.body

      if (!code || !exercises || !Array.isArray(exercises)) {
        return res.status(400).json({ error: 'Kód és feladatok megadása kötelező' })
      }

      if (!supabase) {
        return res.status(500).json({ 
          error: 'Adatbázis nem elérhető',
          details: supabaseError || 'Supabase client not initialized',
          solution: 'Ellenőrizd a Supabase beállításokat a .env.local fájlban'
        })
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
          .single()

        if (error) {
          console.error('❌ Database error:', error)
          
          // If table doesn't exist, provide helpful error
          if (error.code === 'PGRST205') {
            return res.status(500).json({ 
              error: 'A teacher_sessions tábla nem létezik az adatbázisban',
              details: 'Futtasd le a create-missing-tables.sql fájlt a Supabase SQL Editor-ban',
              sqlFile: 'create-missing-tables.sql',
              code: error.code
            })
          }
          
          return res.status(500).json({ 
            error: 'Adatbázis hiba a munkamenet létrehozásakor',
            details: error.message,
            code: error.code
          })
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
        })

      } catch (error) {
        console.error('❌ Session creation error:', error)
        return res.status(500).json({ 
          error: 'Szerver hiba a munkamenet létrehozásakor',
          details: error instanceof Error ? error.message : 'Ismeretlen hiba'
        })
      }
    }

    // Check session exists (student) - Database only
    if (path.includes('/api/simple-api/sessions/') && path.includes('/check') && method === 'GET') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/check/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()
      
      if (!supabase) {
        return res.status(500).json({ 
          error: 'Adatbázis nem elérhető',
          details: supabaseError || 'Supabase client not initialized'
        })
      }
      
      try {
        console.log('🔍 Checking session in database:', sessionCode);
        
        const { data, error } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (error || !data) {
          console.log('❌ Session not found in database:', error?.message || 'No data');
          return res.json({ 
            exists: false, 
            error: 'Hibás kód vagy a munkamenet nem aktív',
            hint: 'A munkamenet lehet, hogy lejárt (24 óra után). Kérj új kódot a tanártól!'
          })
        }

        console.log('✅ Session found in database:', data.session_code);
        
        return res.json({
          exists: true,
          session: {
            id: data.id,
            code: data.session_code,
            exerciseCount: data.exercises.length,
            isActive: data.is_active,
            expiresAt: data.expires_at
          },
          storage: 'database'
        })
        
      } catch (error) {
        console.error('❌ Session check error:', error)
        return res.status(500).json({ 
          error: 'Szerver hiba a munkamenet ellenőrzésekor',
          details: error instanceof Error ? error.message : 'Ismeretlen hiba'
        })
      }
    }

    // Join session (student) - Database only
    if (path === '/api/simple-api/sessions/join' && method === 'POST') {
      const { name, className, sessionCode } = req.body

      if (!name || !className || !sessionCode) {
        return res.status(400).json({ error: 'Név, osztály és kód megadása kötelező' })
      }

      if (!supabase) {
        return res.status(500).json({ 
          error: 'Adatbázis nem elérhető',
          details: supabaseError || 'Supabase client not initialized'
        })
      }

      try {
        console.log('🚪 Student joining session:', { name, className, sessionCode: sessionCode.toUpperCase() });
        
        // First check if session exists and is active
        const { data: session, error: sessionError } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode.toUpperCase())
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (sessionError || !session) {
          console.log('❌ Session not found for join:', sessionError?.message);
          return res.status(404).json({ error: 'Hibás kód vagy a munkamenet nem aktív' })
        }

        // Check if student already joined
        const { data: existingParticipant, error: participantError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', session.id)
          .eq('student_name', name.trim())
          .eq('student_class', className.trim())
          .single()

        if (existingParticipant) {
          console.log('🔄 Student rejoining session:', existingParticipant.id);
          
          // Update last seen time
          await supabase
            .from('session_participants')
            .update({ 
              last_seen: new Date().toISOString(),
              is_online: true 
            })
            .eq('id', existingParticipant.id)
          
          return res.json({
            success: true,
            student: existingParticipant,
            message: 'Újracsatlakozás sikeres'
          })
        }

        // Create new participant
        const { data: newParticipant, error: createError } = await supabase
          .from('session_participants')
          .insert({
            session_id: session.id,
            student_name: name.trim(),
            student_class: className.trim(),
            joined_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            is_online: true,
            current_exercise: 0,
            completed_exercises: 0,
            total_score: 0,
            results: []
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Participant creation error:', createError)
          return res.status(500).json({ error: 'Hiba a csatlakozáskor' })
        }

        console.log('✅ New participant created:', newParticipant.id);

        return res.json({
          success: true,
          student: newParticipant,
          message: 'Sikeresen csatlakoztál a munkamenethez'
        })
      } catch (error) {
        console.error('❌ Session join error:', error)
        return res.status(500).json({ error: 'Szerver hiba a csatlakozáskor' })
      }
    }

    // Get session exercises (student) - Database only
    if (path.includes('/api/simple-api/sessions/') && path.includes('/exercises') && method === 'GET') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/exercises/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()
      
      if (!supabase) {
        return res.status(500).json({ 
          error: 'Adatbázis nem elérhető',
          details: supabaseError || 'Supabase client not initialized'
        })
      }
      
      try {
        console.log('📚 Getting exercises for session:', sessionCode);
        
        const { data, error } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (error || !data) {
          console.log('❌ Session not found for exercises:', error?.message);
          return res.status(404).json({ 
            error: 'Munkamenet nem található vagy nem aktív',
            hint: 'A munkamenet lehet, hogy lejárt. Kérj új kódot a tanártól!'
          })
        }

        console.log('✅ Exercises found:', data.exercises.length);

        return res.json({
          exercises: data.exercises,
          count: data.exercises.length,
          sessionCode: data.session_code,
          storage: 'database'
        })
        
      } catch (error) {
        console.error('❌ Session exercises error:', error)
        return res.status(500).json({ 
          error: 'Szerver hiba a feladatok lekérésekor',
          details: error instanceof Error ? error.message : 'Ismeretlen hiba'
        })
      }
    }
            count: session.exercises.length,
            sessionCode: session.code,
            storage: 'memory'
          })
        }

        return res.status(404).json({ 
          error: 'Munkamenet nem található vagy nem aktív',
          hint: 'Adatbázis nem elérhető és memóriában sem található session'
        })
      }
    }

    // Stop session (teacher) - Now using Supabase
    if (path.includes('/api/simple-api/sessions/') && path.includes('/stop') && method === 'POST') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/stop/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()

      try {
        const { data, error } = await supabase
          .from('teacher_sessions')
          .update({ is_active: false })
          .eq('session_code', sessionCode)
          .select()
          .single()

        if (error || !data) {
          return res.status(404).json({ error: 'Munkamenet nem található' })
        }

        return res.json({
          success: true,
          message: 'Munkamenet leállítva'
        })
      } catch (error) {
        console.error('Session stop error:', error)
        return res.status(500).json({ error: 'Hiba a munkamenet leállításakor' })
      }
    }

    // Delete session (teacher) - Now using Supabase
    if (path.includes('/api/simple-api/sessions/') && path.includes('/delete') && method === 'DELETE') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/delete/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()

      try {
        const { error } = await supabase
          .from('teacher_sessions')
          .delete()
          .eq('session_code', sessionCode)

        if (error) {
          console.error('Session delete error:', error)
          return res.status(500).json({ error: 'Hiba a munkamenet törlésekor' })
        }

        return res.json({
          success: true,
          message: 'Munkamenet törölve'
        })
      } catch (error) {
        console.error('Session delete error:', error)
        return res.status(500).json({ error: 'Szerver hiba a munkamenet törlésekor' })
      }
    }

    // Delete all sessions (teacher) - Now using Supabase
    if (path === '/api/simple-api/sessions/delete-all' && method === 'DELETE') {
      try {
        const { error } = await supabase
          .from('teacher_sessions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

        if (error) {
          console.error('All sessions delete error:', error)
          return res.status(500).json({ error: 'Hiba az összes munkamenet törlésekor' })
        }

        return res.json({
          success: true,
          message: 'Összes munkamenet törölve az adatbázisból'
        })
      } catch (error) {
        console.error('All sessions delete error:', error)
        return res.status(500).json({ error: 'Szerver hiba az összes munkamenet törlésekor' })
      }
    }

    // Get session status (teacher) - Now using Supabase
    if (path.includes('/api/simple-api/sessions/') && path.includes('/status') && method === 'GET') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/status/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()

      try {
        // Get session with participants
        const { data: session, error: sessionError } = await supabase
          .from('teacher_sessions')
          .select(`
            *,
            session_participants (*)
          `)
          .eq('session_code', sessionCode)
          .single()

        if (sessionError || !session) {
          return res.status(404).json({ error: 'Munkamenet nem található' })
        }

        // Update online status (consider offline if not seen in last 30 seconds)
        const now = new Date()
        const participants = session.session_participants || []
        
        participants.forEach((participant: any) => {
          const timeSinceLastSeen = now.getTime() - new Date(participant.last_seen).getTime()
          participant.is_online = timeSinceLastSeen < 30000 // 30 seconds
        })

        return res.json({
          success: true,
          session: {
            code: session.session_code,
            isActive: session.is_active,
            createdAt: session.created_at,
            expiresAt: session.expires_at,
            totalExercises: session.exercises.length,
            students: participants,
            onlineCount: participants.filter((s: any) => s.is_online).length,
            totalStudents: participants.length
          }
        })
      } catch (error) {
        console.error('Session status error:', error)
        return res.status(500).json({ error: 'Hiba a munkamenet állapotának lekérésekor' })
      }
    }

    // Submit exercise result (student) - Now using Supabase
    if (path.includes('/api/simple-api/sessions/') && path.includes('/result') && method === 'POST') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/result/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()
      const { studentId, exerciseIndex, isCorrect, score, timeSpent, answer } = req.body

      if (!studentId || exerciseIndex === undefined) {
        return res.status(400).json({ error: 'Diák ID és feladat index megadása kötelező' })
      }

      try {
        // Get session and participant
        const { data: session, error: sessionError } = await supabase
          .from('teacher_sessions')
          .select('*')
          .eq('session_code', sessionCode)
          .eq('is_active', true)
          .single()

        if (sessionError || !session) {
          return res.status(404).json({ error: 'Munkamenet nem található vagy nem aktív' })
        }

        const { data: participant, error: participantError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('id', studentId)
          .eq('session_id', session.id)
          .single()

        if (participantError || !participant) {
          return res.status(404).json({ error: 'Diák nem található' })
        }

        // Create result object
        const result = {
          exerciseIndex,
          exerciseTitle: session.exercises[exerciseIndex]?.data?.title || `Feladat ${exerciseIndex + 1}`,
          isCorrect: isCorrect || false,
          score: score || 0,
          timeSpent: timeSpent || 0,
          answer: answer || null,
          completedAt: new Date().toISOString()
        }

        // Update participant progress
        const updatedResults = [...(participant.results || []), result]
        const newCompletedExercises = participant.completed_exercises + (isCorrect ? 1 : 0)
        const newTotalScore = participant.total_score + (score || 0)
        const newCurrentExercise = Math.max(participant.current_exercise, exerciseIndex + 1)

        const { error: updateError } = await supabase
          .from('session_participants')
          .update({
            last_seen: new Date().toISOString(),
            is_online: true,
            current_exercise: newCurrentExercise,
            completed_exercises: newCompletedExercises,
            total_score: newTotalScore,
            results: updatedResults
          })
          .eq('id', studentId)

        if (updateError) {
          console.error('Participant update error:', updateError)
          return res.status(500).json({ error: 'Hiba az eredmény mentésekor' })
        }

        return res.json({
          success: true,
          message: 'Eredmény mentve',
          student: {
            currentExercise: newCurrentExercise,
            completedExercises: newCompletedExercises,
            totalScore: newTotalScore,
            progress: Math.round((newCurrentExercise / session.exercises.length) * 100)
          }
        })
      } catch (error) {
        console.error('Result submission error:', error)
        return res.status(500).json({ error: 'Szerver hiba az eredmény mentésekor' })
      }
    }

    // Update student heartbeat (keep alive) - Now using Supabase
    if (path.includes('/api/simple-api/sessions/') && path.includes('/heartbeat') && method === 'POST') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/heartbeat/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()
      const { studentId } = req.body

      if (!studentId) {
        return res.status(400).json({ error: 'Diák ID megadása kötelező' })
      }

      try {
        const { error } = await supabase
          .from('session_participants')
          .update({ 
            last_seen: new Date().toISOString(),
            is_online: true 
          })
          .eq('id', studentId)

        if (error) {
          console.error('Heartbeat update error:', error)
        }

        return res.json({ success: true })
      } catch (error) {
        console.error('Heartbeat error:', error)
        return res.json({ success: false })
      }
    }

    // Default response for unmatched routes
    return res.status(404).json({ error: 'Endpoint not found' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Helper functions for teacher-student system
function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function getTeacherFromAuth(req) {
  // Simple auth check - in production, validate JWT token
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = JSON.parse(atob(token))
    return teachers.get(decoded.teacherId)
  } catch {
    return null
  }
}