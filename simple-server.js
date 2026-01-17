// Simple test server to verify static rooms functionality
import express from 'express'

const app = express()
const PORT = 3002

// Enable JSON parsing
app.use(express.json())

// CORS for development
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`)
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Storage
const rooms = new Map()
const roomPlayers = new Map()
const roomGameStates = new Map() // Store game state for each room
const roomQuestions = new Map() // Store questions for each room
const roomExercises = new Map() // Store full exercise data for each room

// Create fixed rooms
function createFixedRooms() {
  console.log('🏗️ Creating fixed rooms...')
  const grades = [3, 4, 5, 6, 7, 8]
  
  grades.forEach(grade => {
    const roomId = `grade-${grade}-room`
    // Generate a 6-character room code: grade (1 char) + random 5 characters
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase()
    const roomCode = `${grade}${randomCode}` // e.g., 3AB12C, 4XY89Z, 5QW34T
    
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
      customCode: null // Will be set by teacher
    }
    
    rooms.set(roomId, fixedRoom)
    roomPlayers.set(roomId, [])
    
    console.log(`🏫 Created room: ${roomCode} (Grade ${grade})`)
  })
  
  console.log(`✅ Created ${grades.length} fixed rooms`)
}

// Initialize rooms
createFixedRooms()

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    roomsCount: rooms.size,
    timestamp: new Date() 
  })
})

app.get('/api/rooms/fixed', (req, res) => {
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
  
  res.json({
    fixedRooms,
    count: fixedRooms.length,
    message: 'Fix szobák betöltve'
  })
})

app.get('/api/rooms/list', (req, res) => {
  const allRooms = Array.from(rooms.values()).map(room => {
    const players = roomPlayers.get(room.id) || []
    return {
      ...room,
      playerCount: players.length,
      availableSlots: room.maxPlayers - players.length
    }
  })
  
  res.json({
    rooms: allRooms,
    count: allRooms.length
  })
})

app.post('/api/rooms/fixed/:grade/start-exercise', (req, res) => {
  console.log(`🏫 POST /api/rooms/fixed/${req.params.grade}/start-exercise`)
  
  const grade = parseInt(req.params.grade)
  const { selectedExercises, timePerQuestion } = req.body
  
  if (grade < 3 || grade > 8) {
    return res.status(400).json({ message: 'Érvénytelen osztály szám (3-8 között)' })
  }
  
  const roomId = `grade-${grade}-room`
  const room = rooms.get(roomId)
  
  if (!room) {
    return res.status(404).json({ message: 'Fix szoba nem található' })
  }
  
  console.log(`📚 Loading ${selectedExercises?.length || 0} exercises for grade ${grade}`)
  
  // Log first exercise to see structure
  if (selectedExercises && selectedExercises.length > 0) {
    console.log('📦 First exercise structure:', JSON.stringify(selectedExercises[0], null, 2))
  }
  
  // Store exercises as-is, no conversion needed
  const exercises = selectedExercises || []
  
  // Store exercises for this room
  roomExercises.set(roomId, exercises)
  
  // Update room with exercise info
  room.questionsCount = exercises.length
  room.timePerQuestion = timePerQuestion || 30
  rooms.set(roomId, room)
  
  console.log(`✅ Loaded ${exercises.length} exercises for grade ${grade}`)
  
  res.json({
    message: `${grade}. osztály szobájában ${exercises.length} feladat betöltve`,
    roomId: roomId,
    roomCode: room.roomCode,
    questionsCount: exercises.length,
    ready: true
  })
})

// Set custom 6-character code for a fixed room
app.post('/api/rooms/fixed/:grade/set-code', (req, res) => {
  console.log(`🔑 POST /api/rooms/fixed/${req.params.grade}/set-code`)
  
  const grade = parseInt(req.params.grade)
  const { customCode } = req.body
  
  if (grade < 3 || grade > 8) {
    return res.status(400).json({ message: 'Érvénytelen osztály szám (3-8 között)' })
  }
  
  // Validate custom code: exactly 6 characters, alphanumeric
  if (!customCode || customCode.length !== 6 || !/^[A-Z0-9]+$/.test(customCode.toUpperCase())) {
    return res.status(400).json({ message: 'A kód pontosan 6 karakter hosszú kell legyen (betűk és számok)' })
  }
  
  const roomId = `grade-${grade}-room`
  const room = rooms.get(roomId)
  
  if (!room) {
    return res.status(404).json({ message: 'Fix szoba nem található' })
  }
  
  // Check if code is already in use by another room
  const existingRoom = Array.from(rooms.values()).find(r => 
    r.roomCode.toUpperCase() === customCode.toUpperCase() && r.id !== roomId
  )
  
  if (existingRoom) {
    return res.status(400).json({ message: 'Ez a kód már használatban van' })
  }
  
  // Update room code
  room.roomCode = customCode.toUpperCase()
  room.customCode = customCode.toUpperCase()
  rooms.set(roomId, room)
  
  console.log(`🔑 Updated room code for grade ${grade}: ${room.roomCode}`)
  
  res.json({
    message: `${grade}. osztály szoba kódja frissítve`,
    roomId: roomId,
    roomCode: room.roomCode,
    grade: grade
  })
})

// Check if room exists by room code
app.get('/api/rooms/check/:roomCode', (req, res) => {
  console.log(`🔍 GET /api/rooms/check/${req.params.roomCode}`)
  
  const roomCode = req.params.roomCode.toUpperCase()
  
  // Find room by code
  const room = Array.from(rooms.values()).find(r => r.roomCode === roomCode)
  
  if (room) {
    const players = roomPlayers.get(room.id) || []
    res.json({
      room: {
        id: room.id,
        roomCode: room.roomCode,
        title: room.title,
        description: room.description,
        maxPlayers: room.maxPlayers,
        status: room.status,
        grade: room.grade
      },
      playerCount: players.length,
      availableSlots: room.maxPlayers - players.length
    })
  } else {
    res.status(404).json({
      message: 'Verseny kód nem található'
    })
  }
})

// Join room by room code
app.post('/api/rooms/:roomCode/join', (req, res) => {
  console.log(`👨‍🎓 POST /api/rooms/${req.params.roomCode}/join`, req.body)
  
  const roomCode = req.params.roomCode.toUpperCase()
  const { playerName } = req.body
  
  // Find room by code
  const room = Array.from(rooms.values()).find(r => r.roomCode === roomCode)
  
  if (!room) {
    return res.status(404).json({ message: 'Verseny kód nem található' })
  }
  
  // Get current players
  const currentPlayers = roomPlayers.get(room.id) || []
  
  // Check if room is full
  if (currentPlayers.length >= room.maxPlayers) {
    return res.status(400).json({ message: 'A verseny megtelt' })
  }
  
  // Check if name is already taken
  if (currentPlayers.some(p => p.playerName === playerName)) {
    return res.status(400).json({ message: 'Ez a név már foglalt ebben a versenyben' })
  }
  
  const playerId = 'player-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8)
  const player = {
    id: playerId,
    roomId: room.id,
    playerName,
    joinedAt: new Date(),
    isConnected: true,
    totalScore: 0,
    correctAnswers: 0
  }
  
  // Add player to room
  currentPlayers.push(player)
  roomPlayers.set(room.id, currentPlayers)
  
  console.log(`✅ Player "${playerName}" joined room ${room.roomCode} (Grade ${room.grade}). Total players: ${currentPlayers.length}`)
  
  res.status(201).json({
    player: player,
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      description: room.description,
      maxPlayers: room.maxPlayers,
      status: room.status,
      grade: room.grade
    },
    playerCount: currentPlayers.length,
    message: `Sikeresen csatlakoztál a ${room.grade}. osztály szobájához!`
  })
})

// Get players in a room by room code
app.get('/api/rooms/:roomCode/players', (req, res) => {
  console.log(`📋 GET /api/rooms/${req.params.roomCode}/players`)
  
  const roomCode = req.params.roomCode.toUpperCase()
  
  // Find room by code
  const room = Array.from(rooms.values()).find(r => r.roomCode === roomCode)
  
  if (!room) {
    return res.status(404).json({ message: 'Verseny kód nem található' })
  }
  
  const players = roomPlayers.get(room.id) || []
  
  res.json({
    players: players,
    count: players.length,
    maxPlayers: room.maxPlayers,
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      status: room.status,
      grade: room.grade
    }
  })
})

// Get room status by room ID (for player waiting room)
app.get('/api/rooms/:id/status', (req, res) => {
  console.log(`📊 GET /api/rooms/${req.params.id}/status`)
  
  const roomId = req.params.id
  const room = rooms.get(roomId)
  
  if (!room) {
    return res.json({
      roomId: roomId,
      roomStatus: 'waiting',
      gameState: 'not_started',
      isActive: false,
      message: 'Várakozás a verseny indítására...'
    })
  }
  
  const players = roomPlayers.get(roomId) || []
  const gameState = roomGameStates.get(roomId)
  const exercises = roomExercises.get(roomId) || []
  
  // If game is active, return detailed game state
  if (gameState && gameState.isActive) {
    const currentExercise = exercises[gameState.currentQuestionIndex]
    
    res.json({
      roomId: roomId,
      roomStatus: room.status,
      gameState: gameState.state,
      isActive: gameState.isActive,
      currentQuestionIndex: gameState.currentQuestionIndex,
      totalQuestions: exercises.length,
      timeRemaining: gameState.timeRemaining,
      currentExercise: currentExercise || null,
      playerCount: players.length,
      message: 'Verseny folyamatban...'
    })
  } else if (gameState && gameState.state === 'finished') {
    // Game finished - return leaderboard
    const sortedPlayers = [...players].sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      return b.correctAnswers - a.correctAnswers
    })
    
    const leaderboard = sortedPlayers.map((p, index) => ({
      rank: index + 1,
      playerId: p.id,
      playerName: p.playerName,
      totalScore: p.totalScore || 0,
      correctAnswers: p.correctAnswers || 0
    }))
    
    res.json({
      roomId: roomId,
      roomStatus: 'finished',
      gameState: 'finished',
      isActive: false,
      playerCount: players.length,
      leaderboard: leaderboard,
      message: 'Verseny befejezve!'
    })
  } else {
    // Game not started yet
    res.json({
      roomId: roomId,
      roomStatus: room.status,
      gameState: 'waiting',
      isActive: false,
      playerCount: players.length,
      message: 'Várakozás a tanárra, hogy elindítsa a versenyt...'
    })
  }
})

// Start game in a fixed room
app.post('/api/rooms/:id/start', (req, res) => {
  console.log(`🚀 POST /api/rooms/${req.params.id}/start`)
  
  const roomId = req.params.id
  const room = rooms.get(roomId)
  
  if (!room) {
    return res.status(404).json({ message: 'Szoba nem található' })
  }
  
  const exercises = roomExercises.get(roomId) || []
  
  if (exercises.length === 0) {
    return res.status(400).json({ message: 'Nincsenek feladatok betöltve' })
  }
  
  // Initialize game state
  const gameState = {
    isActive: true,
    state: 'starting',
    currentQuestionIndex: 0,
    timeRemaining: 3, // 3 second countdown
    startedAt: new Date()
  }
  
  roomGameStates.set(roomId, gameState)
  room.status = 'active'
  rooms.set(roomId, room)
  
  console.log(`✅ Game started in room ${room.roomCode} with ${exercises.length} exercises`)
  
  // Start countdown then first exercise
  setTimeout(() => {
    const state = roomGameStates.get(roomId)
    if (state) {
      state.state = 'question'
      state.timeRemaining = room.timePerQuestion || 30
      roomGameStates.set(roomId, state)
      
      // Start exercise timer
      startExerciseTimer(roomId)
    }
  }, 3000)
  
  res.json({
    message: 'Verseny elindítva!',
    roomId: roomId,
    questionsCount: exercises.length,
    gameState: gameState
  })
})

// Exercise timer function
function startExerciseTimer(roomId) {
  const gameState = roomGameStates.get(roomId)
  const exercises = roomExercises.get(roomId) || []
  const room = rooms.get(roomId)
  
  if (!gameState || !gameState.isActive || !room) return
  
  const currentExercise = exercises[gameState.currentQuestionIndex]
  if (!currentExercise) return
  
  const timer = setInterval(() => {
    const state = roomGameStates.get(roomId)
    if (!state || !state.isActive) {
      clearInterval(timer)
      return
    }
    
    state.timeRemaining--
    
    if (state.timeRemaining <= 0) {
      clearInterval(timer)
      
      // Move to next exercise or end game
      if (state.currentQuestionIndex < exercises.length - 1) {
        // Next exercise
        state.currentQuestionIndex++
        state.state = 'question'
        state.timeRemaining = room.timePerQuestion || 30
        roomGameStates.set(roomId, state)
        
        // Start timer for next exercise
        setTimeout(() => startExerciseTimer(roomId), 100)
      } else {
        // Game finished
        state.state = 'finished'
        state.isActive = false
        roomGameStates.set(roomId, state)
        
        const roomData = rooms.get(roomId)
        if (roomData) {
          roomData.status = 'finished'
          rooms.set(roomId, roomData)
        }
        
        console.log(`🏁 Game finished in room ${roomId}`)
      }
    } else {
      roomGameStates.set(roomId, state)
    }
  }, 1000)
}

// Submit answer
app.post('/api/rooms/:id/answer', (req, res) => {
  console.log(`📝 POST /api/rooms/${req.params.id}/answer`)
  
  const roomId = req.params.id
  const { playerId, selectedAnswers, responseTime, isCorrect } = req.body
  
  const room = rooms.get(roomId)
  const gameState = roomGameStates.get(roomId)
  
  if (!room || !gameState || !gameState.isActive) {
    return res.status(400).json({ message: 'Verseny nem aktív' })
  }
  
  // Find player
  const players = roomPlayers.get(roomId) || []
  const player = players.find(p => p.id === playerId)
  
  if (!player) {
    return res.status(404).json({ message: 'Játékos nem található' })
  }
  
  // Calculate score (1000 points max, decreasing with time)
  let points = 0
  if (isCorrect) {
    const maxPoints = 1000
    const timeLimit = room.timePerQuestion || 30
    const timeBonus = Math.max(0, 1 - (responseTime / timeLimit))
    points = Math.round(maxPoints * (0.5 + 0.5 * timeBonus)) // 500-1000 points
    
    player.correctAnswers = (player.correctAnswers || 0) + 1
  }
  
  player.totalScore = (player.totalScore || 0) + points
  
  // Update player in storage
  const playerIndex = players.findIndex(p => p.id === playerId)
  if (playerIndex !== -1) {
    players[playerIndex] = player
    roomPlayers.set(roomId, players)
  }
  
  console.log(`✅ Player ${player.playerName} answered: ${isCorrect ? 'correct' : 'incorrect'} (+${points} points, total: ${player.totalScore})`)
  
  res.json({
    isCorrect,
    points,
    totalScore: player.totalScore,
    correctAnswers: player.correctAnswers,
    message: isCorrect ? 'Helyes válasz!' : 'Helytelen válasz'
  })
})

// Get game results/statistics
app.get('/api/rooms/:id/results', (req, res) => {
  console.log(`📊 GET /api/rooms/${req.params.id}/results`)
  
  const roomId = req.params.id
  const room = rooms.get(roomId)
  const players = roomPlayers.get(roomId) || []
  const exercises = roomExercises.get(roomId) || []
  const gameState = roomGameStates.get(roomId)
  
  if (!room) {
    return res.status(404).json({ message: 'Szoba nem található' })
  }
  
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    return b.correctAnswers - a.correctAnswers
  })
  
  const results = {
    roomId: roomId,
    roomCode: room.roomCode,
    roomTitle: room.title,
    grade: room.grade,
    status: room.status,
    gameState: gameState?.state || 'not_started',
    exerciseCount: exercises.length,
    playerCount: players.length,
    completedAt: gameState?.state === 'finished' ? new Date() : null,
    players: sortedPlayers.map((p, index) => ({
      rank: index + 1,
      playerId: p.id,
      playerName: p.playerName,
      totalScore: p.totalScore || 0,
      correctAnswers: p.correctAnswers || 0,
      joinedAt: p.joinedAt
    }))
  }
  
  res.json(results)
})

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on http://localhost:${PORT}`)
  console.log(`📊 Rooms created: ${rooms.size}`)
})