// Production API for fixed rooms system and teacher-student assignments
import { VercelRequest, VercelResponse } from '@vercel/node'

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

// Session management storage
let sessions = new Map()

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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

    // Create session (teacher)
    if (path === '/api/simple-api/sessions/create' && method === 'POST') {
      const { code, exercises } = req.body

      if (!code || !exercises || !Array.isArray(exercises)) {
        return res.status(400).json({ error: 'Kód és feladatok megadása kötelező' })
      }

      const session = {
        code: code.toUpperCase(),
        exercises,
        createdAt: new Date(),
        isActive: true,
        students: []
      }

      sessions.set(code.toUpperCase(), session)

      return res.json({
        success: true,
        session,
        message: 'Munkamenet sikeresen létrehozva'
      })
    }

    // Check session exists (student)
    if (path.includes('/api/simple-api/sessions/') && path.includes('/check') && method === 'GET') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/check/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()
      const session = sessions.get(sessionCode)

      if (!session || !session.isActive) {
        return res.json({ 
          exists: false, 
          error: 'Hibás kód vagy a munkamenet nem aktív' 
        })
      }

      return res.json({
        exists: true,
        session: {
          code: session.code,
          exerciseCount: session.exercises.length,
          isActive: session.isActive
        }
      })
    }

    // Join session (student)
    if (path === '/api/simple-api/sessions/join' && method === 'POST') {
      const { name, className, sessionCode } = req.body

      if (!name || !className || !sessionCode) {
        return res.status(400).json({ error: 'Név, osztály és kód megadása kötelező' })
      }

      const session = sessions.get(sessionCode.toUpperCase())
      if (!session || !session.isActive) {
        return res.status(404).json({ error: 'Hibás kód vagy a munkamenet nem aktív' })
      }

      // Check if student already joined
      const existingStudent = session.students.find(s => 
        s.name.toLowerCase() === name.toLowerCase() && 
        s.className.toLowerCase() === className.toLowerCase()
      )

      if (existingStudent) {
        // Update last seen time
        existingStudent.lastSeen = new Date()
        existingStudent.isOnline = true
        sessions.set(sessionCode.toUpperCase(), session)
        
        return res.json({
          success: true,
          student: existingStudent,
          message: 'Újracsatlakozás sikeres'
        })
      }

      const student = {
        id: generateId(),
        name: name.trim(),
        className: className.trim(),
        joinedAt: new Date(),
        lastSeen: new Date(),
        isOnline: true,
        currentExercise: 0,
        completedExercises: 0,
        totalScore: 0,
        results: []
      }

      // Add student to session
      session.students.push(student)
      sessions.set(sessionCode.toUpperCase(), session)

      return res.json({
        success: true,
        student,
        message: 'Sikeresen csatlakoztál a munkamenethez'
      })
    }

    // Get session exercises (student)
    if (path.includes('/api/simple-api/sessions/') && path.includes('/exercises') && method === 'GET') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/exercises/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()
      const session = sessions.get(sessionCode)

      if (!session || !session.isActive) {
        return res.status(404).json({ error: 'Munkamenet nem található vagy nem aktív' })
      }

      return res.json({
        exercises: session.exercises,
        count: session.exercises.length,
        sessionCode: session.code
      })
    }

    // Stop session (teacher)
    if (path.includes('/api/simple-api/sessions/') && path.includes('/stop') && method === 'POST') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/stop/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()
      const session = sessions.get(sessionCode)

      if (!session) {
        return res.status(404).json({ error: 'Munkamenet nem található' })
      }

      session.isActive = false
      session.endedAt = new Date()
      sessions.set(sessionCode, session)

      return res.json({
        success: true,
        message: 'Munkamenet leállítva'
      })
    }

    // Get session status (teacher)
    if (path.includes('/api/simple-api/sessions/') && path.includes('/status') && method === 'GET') {
      const codeMatch = path.match(/\/sessions\/([^\/]+)\/status/)
      if (!codeMatch) {
        return res.status(400).json({ error: 'Kód megadása kötelező' })
      }

      const sessionCode = codeMatch[1].toUpperCase()
      const session = sessions.get(sessionCode)

      if (!session) {
        return res.status(404).json({ error: 'Munkamenet nem található' })
      }

      // Update online status (consider offline if not seen in last 30 seconds)
      const now = new Date()
      session.students.forEach(student => {
        const timeSinceLastSeen = now.getTime() - new Date(student.lastSeen).getTime()
        student.isOnline = timeSinceLastSeen < 30000 // 30 seconds
      })

      return res.json({
        success: true,
        session: {
          code: session.code,
          isActive: session.isActive,
          createdAt: session.createdAt,
          endedAt: session.endedAt || null,
          totalExercises: session.exercises.length,
          students: session.students,
          onlineCount: session.students.filter(s => s.isOnline).length,
          totalStudents: session.students.length
        }
      })
    }

    // Submit exercise result (student)
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

      const session = sessions.get(sessionCode)
      if (!session || !session.isActive) {
        return res.status(404).json({ error: 'Munkamenet nem található vagy nem aktív' })
      }

      const student = session.students.find(s => s.id === studentId)
      if (!student) {
        return res.status(404).json({ error: 'Diák nem található' })
      }

      // Update student progress
      student.lastSeen = new Date()
      student.isOnline = true
      student.currentExercise = Math.max(student.currentExercise, exerciseIndex + 1)
      
      if (isCorrect) {
        student.completedExercises += 1
        student.totalScore += score || 1
      }

      // Add result
      const result = {
        exerciseIndex,
        exerciseTitle: session.exercises[exerciseIndex]?.data?.title || `Feladat ${exerciseIndex + 1}`,
        isCorrect: isCorrect || false,
        score: score || 0,
        timeSpent: timeSpent || 0,
        answer: answer || null,
        completedAt: new Date()
      }

      student.results.push(result)
      sessions.set(sessionCode, session)

      return res.json({
        success: true,
        message: 'Eredmény mentve',
        student: {
          currentExercise: student.currentExercise,
          completedExercises: student.completedExercises,
          totalScore: student.totalScore,
          progress: Math.round((student.currentExercise / session.exercises.length) * 100)
        }
      })
    }

    // Update student heartbeat (keep alive)
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

      const session = sessions.get(sessionCode)
      if (!session) {
        return res.status(404).json({ error: 'Munkamenet nem található' })
      }

      const student = session.students.find(s => s.id === studentId)
      if (student) {
        student.lastSeen = new Date()
        student.isOnline = true
        sessions.set(sessionCode, session)
      }

      return res.json({ success: true })
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

function getTeacherFromAuth(req: VercelRequest) {
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