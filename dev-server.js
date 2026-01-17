// Simple development server for API routes
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// Mock game sessions storage - MOVED TO TOP
const gameSessions = new Map()
const playerScores = new Map() // Track player scores across sessions
const gameAnalytics = new Map() // Track game analytics
const roomPlayers = new Map() // Track players in each room
const rooms = new Map() // Track created rooms

// Sample questions for development
const sampleQuestions = [
  {
    id: 'q1',
    questionText: 'Mi a 2 + 2 eredménye?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    questionOrder: 1
  },
  {
    id: 'q2',
    questionText: 'Melyik a legnagyobb szám?',
    options: ['10', '20', '15', '25'],
    correctAnswer: 3,
    questionOrder: 2
  },
  {
    id: 'q3',
    questionText: 'Hány nap van egy hétben?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    questionOrder: 3
  }
]

import fs from 'fs'

// Load exercises from localStorage (same as frontend)
function loadExercisesFromLibrary() {
  try {
    const savedLibrary = JSON.parse(fs.readFileSync('./manual-exercises.json', 'utf8'))
    // Convert to the format expected by the frontend
    return savedLibrary.map(item => ({
      id: item.id,
      title: item.data.title,
      type: item.data.type,
      content: item.data.content,
      instruction: item.data.instruction,
      imageUrl: item.imageUrl, // Add imageUrl
      fileName: item.fileName  // Add fileName for reference
    }))
  } catch (error) {
    console.log('📚 No exercises found, using sample questions:', error.message)
    return []
  }
}

// Convert exercise to questions format
function convertExerciseToQuestions(exercise) {
  const questions = []
  
  // Extract exercise number from ID (manual-001 -> 1, manual-002 -> 2, etc.)
  const exerciseNumber = exercise.id ? exercise.id.replace('manual-', '').replace(/^0+/, '') : '1'
  
  if (exercise.type === 'QUIZ' && exercise.content && exercise.content.questions) {
    exercise.content.questions.forEach((q, index) => {
      questions.push({
        id: `${exercise.id}_q${index + 1}`,
        text: `${exerciseNumber}. feladat - ${exercise.instruction || exercise.title}`, // Show exercise number and instruction
        options: q.options || [],
        correctAnswers: [q.correctIndex || 0],
        timeLimit: 30,
        points: 100,
        questionOrder: index + 1,
        exerciseNumber: exerciseNumber, // Store exercise number
        imageUrl: exercise.imageUrl, // Store image URL
        originalQuestion: q.question // Store original question for reference
      })
    })
  } else if (exercise.type === 'CATEGORIZATION' && exercise.content) {
    const categories = exercise.content.categories || []
    const items = exercise.content.items || []
    
    items.forEach((item, itemIndex) => {
      const correctCategory = categories.find(cat => cat.id === item.categoryId)
      if (correctCategory) {
        const otherCategories = categories.filter(cat => cat.id !== item.categoryId).slice(0, 3)
        const options = [correctCategory.name, ...otherCategories.map(c => c.name)]
        
        questions.push({
          id: `${exercise.id}_cat_${itemIndex}`,
          text: `${exerciseNumber}. feladat - Melyik kategóriába tartozik: "${item.text}"?`,
          options: options.slice(0, 4),
          correctAnswers: [0],
          timeLimit: 30,
          points: 100,
          questionOrder: questions.length + 1,
          exerciseNumber: exerciseNumber,
          imageUrl: exercise.imageUrl,
          instruction: exercise.instruction || exercise.title
        })
      }
    })
  } else if (exercise.type === 'MATCHING' && exercise.content && exercise.content.pairs) {
    exercise.content.pairs.forEach((pair, index) => {
      const otherPairs = exercise.content.pairs.filter((_, i) => i !== index).slice(0, 3)
      const options = [pair.right, ...otherPairs.map(p => p.right)]
      
      questions.push({
        id: `${exercise.id}_match_${index}`,
        text: `${exerciseNumber}. feladat - Mi tartozik ehhez: "${pair.left}"?`,
        options: options.slice(0, 4),
        correctAnswers: [0],
        timeLimit: 30,
        points: 100,
        questionOrder: index + 1,
        exerciseNumber: exerciseNumber,
        imageUrl: exercise.imageUrl,
        instruction: exercise.instruction || exercise.title
      })
    })
  }
  
  console.log(`📝 Converted ${exercise.type} exercise "${exercise.title}" (${exerciseNumber}. feladat) to ${questions.length} questions`)
  return questions
}

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

// CORS for development
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`) // Add request logging
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Mock authentication middleware
app.use('/api', (req, res, next) => {
  // Add mock teacher for development
  req.teacher = {
    id: 'dev-teacher-1',
    email: 'teacher@szenmihalyatisk.hu',
    fullName: 'Fejlesztő Tanár',
    username: 'fejleszto.tanar'
  }
  next()
})

// Simple API routes for development
console.log('🔧 Defining /api/rooms/list route...')
app.get('/api/rooms/list', (req, res) => {
  console.log('📋 GET /api/rooms/list')
  console.log('📊 Rooms map size:', rooms.size)
  console.log('📊 Rooms keys:', Array.from(rooms.keys()))
  
  // Get all rooms (both fixed and created)
  const allRooms = Array.from(rooms.values()).map(room => {
    const players = roomPlayers.get(room.id) || []
    return {
      ...room,
      playerCount: players.length,
      availableSlots: room.maxPlayers - players.length
    }
  })
  
  // Separate fixed rooms and regular rooms
  const fixedRooms = allRooms.filter(room => room.isFixed)
  const regularRooms = allRooms.filter(room => !room.isFixed)
  
  console.log('📊 Fixed rooms found:', fixedRooms.length)
  console.log('📊 Regular rooms found:', regularRooms.length)
  
  res.json({ 
    rooms: [...fixedRooms, ...regularRooms], // Fixed rooms first
    count: allRooms.length,
    fixedRooms: fixedRooms.length,
    regularRooms: regularRooms.length,
    debug: {
      totalRoomsInMap: rooms.size,
      fixedRoomsFound: fixedRooms,
      allRoomsKeys: Array.from(rooms.keys())
    }
  })
})

app.post('/api/rooms/create', (req, res) => {
  console.log('🏗️ POST /api/rooms/create', req.body)
  const { title, description, maxPlayers, questionsCount, timePerQuestion, selectedExercises } = req.body
  
  // Generate questions from selected exercises
  let allQuestions = []
  
  if (selectedExercises && selectedExercises.length > 0) {
    // Use selected exercises
    const availableExercises = loadExercisesFromLibrary()
    console.log(`📚 Available exercises: ${availableExercises.length}`)
    console.log('📚 Available exercises:', availableExercises.map(ex => ({ id: ex.id, title: ex.title, imageUrl: ex.imageUrl })))
    
    selectedExercises.forEach((selectedEx, index) => {
      console.log(`🔍 Processing selected exercise ${index + 1}:`, selectedEx)
      
      // Try to find exercise by different methods
      let exercise = null
      
      // Method 1: Find by ID
      if (selectedEx.id) {
        exercise = availableExercises.find(ex => ex.id === selectedEx.id)
        console.log(`🔍 Found by ID "${selectedEx.id}":`, exercise ? 'YES' : 'NO')
      }
      
      // Method 2: Find by title
      if (!exercise && selectedEx.title) {
        exercise = availableExercises.find(ex => ex.title === selectedEx.title)
        console.log(`🔍 Found by title "${selectedEx.title}":`, exercise ? 'YES' : 'NO')
      }
      
      // Method 3: Find by index
      if (!exercise && typeof selectedEx === 'number') {
        exercise = availableExercises[selectedEx]
        console.log(`🔍 Found by index ${selectedEx}:`, exercise ? 'YES' : 'NO')
      }
      
      // Method 4: If selectedEx is a string, try to find by ID or title
      if (!exercise && typeof selectedEx === 'string') {
        exercise = availableExercises.find(ex => ex.id === selectedEx || ex.title === selectedEx)
        console.log(`🔍 Found by string "${selectedEx}":`, exercise ? 'YES' : 'NO')
      }
      
      if (exercise) {
        console.log(`✅ Found exercise:`, { id: exercise.id, title: exercise.title, type: exercise.type, imageUrl: exercise.imageUrl })
        const questions = convertExerciseToQuestions(exercise)
        allQuestions.push(...questions)
        console.log(`📚 Loaded ${questions.length} questions from: "${exercise.title}"`)
      } else {
        console.log(`⚠️ Exercise not found:`, selectedEx)
      }
    })
  }
  
  // If no exercises selected or no questions generated, use default
  if (allQuestions.length === 0) {
    const defaultExercises = loadExercisesFromLibrary()
    if (defaultExercises.length > 0) {
      const questions = convertExerciseToQuestions(defaultExercises[0])
      allQuestions.push(...questions)
      console.log(`📚 Using default exercise: "${defaultExercises[0].title}"`)
    } else {
      // Final fallback to sample questions
      allQuestions = sampleQuestions.map(q => ({
        id: q.id,
        text: q.questionText,
        options: q.options,
        correctAnswers: [q.correctAnswer], // Convert to array format
        timeLimit: 30,
        points: 100
      }))
      console.log('📚 Using sample questions as final fallback')
    }
  }
  
  // Shuffle and limit questions
  const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5)
  const selectedQuestions = shuffledQuestions.slice(0, questionsCount || 10)
  
  const mockRoom = {
    id: 'dev-room-' + Date.now(),
    roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    title,
    description,
    teacherId: req.teacher.id,
    maxPlayers,
    questionsCount: selectedQuestions.length,
    timePerQuestion,
    status: 'waiting',
    createdAt: new Date(),
    questions: selectedQuestions // Store questions with room
  }
  
  // Store room and initialize player list
  rooms.set(mockRoom.id, mockRoom)
  roomPlayers.set(mockRoom.id, [])
  
  // Store room with questions for later use
  gameSessions.set(mockRoom.id + '_questions', selectedQuestions)
  console.log(`💾 Stored ${selectedQuestions.length} questions for room ${mockRoom.id}`)
  
  res.status(201).json({
    room: mockRoom,
    questionsGenerated: selectedQuestions.length,
    message: `Verseny sikeresen létrehozva ${selectedQuestions.length} kérdéssel (fejlesztési mód)`
  })
})

// Fixed rooms management
console.log('🔧 Defining /api/rooms/fixed route...')
app.get('/api/rooms/fixed', (req, res) => {
  console.log('🏫 GET /api/rooms/fixed')
  
  const fixedRooms = Array.from(rooms.values())
    .filter(room => room.isFixed)
    .map(room => {
      const players = roomPlayers.get(room.id) || []
      const session = gameSessions.get(room.id)
      
      return {
        ...room,
        playerCount: players.length,
        availableSlots: room.maxPlayers - players.length,
        gameState: session?.gameState || 'waiting',
        isActive: session?.isActive || false
      }
    })
    .sort((a, b) => a.grade - b.grade) // Sort by grade
  
  res.json({
    fixedRooms,
    count: fixedRooms.length,
    message: 'Fix szobák betöltve'
  })
})
console.log('✅ /api/rooms/fixed route defined')

// Start exercise in fixed room
app.post('/api/rooms/fixed/:grade/start-exercise', (req, res) => {
  console.log(`🏫 POST /api/rooms/fixed/${req.params.grade}/start-exercise`, req.body)
  
  const grade = parseInt(req.params.grade)
  const { selectedExercises, questionsCount, timePerQuestion } = req.body
  
  if (grade < 3 || grade > 8) {
    return res.status(400).json({ message: 'Érvénytelen osztály szám (3-8 között)' })
  }
  
  const roomId = `grade-${grade}-room`
  const room = rooms.get(roomId)
  
  if (!room) {
    return res.status(404).json({ message: 'Fix szoba nem található' })
  }
  
  // For now, just acknowledge the exercise selection
  // In a full implementation, this would generate questions from the exercises
  res.json({
    message: `${grade}. osztály szobájában feladatok betöltve`,
    roomId: roomId,
    roomCode: room.roomCode,
    questionsCount: questionsCount || 10,
    ready: true
  })
})

app.get('/api/rooms/check/:roomCode', (req, res) => {
  console.log('🔍 GET /api/rooms/check/' + req.params.roomCode)
  
  // Find room by code
  const room = Array.from(rooms.values()).find(r => r.roomCode === req.params.roomCode.toUpperCase())
  
  if (room) {
    const players = roomPlayers.get(room.id) || []
    res.json({
      room: {
        id: room.id,
        roomCode: room.roomCode,
        title: room.title,
        description: room.description,
        maxPlayers: room.maxPlayers,
        questionsCount: room.questionsCount,
        timePerQuestion: room.timePerQuestion,
        status: room.status
      },
      playerCount: players.length,
      availableSlots: room.maxPlayers - players.length
    })
  } else {
    // Fallback for development
    res.json({
      room: {
        id: 'dev-room-1',
        roomCode: req.params.roomCode,
        title: 'Fejlesztési Verseny',
        description: 'Ez egy teszt verseny fejlesztési módban',
        maxPlayers: 30,
        questionsCount: 10,
        timePerQuestion: 30,
        status: 'waiting'
      },
      playerCount: 0,
      availableSlots: 30
    })
  }
})

app.post('/api/rooms/:roomCode/join', (req, res) => {
  console.log('👨‍🎓 POST /api/rooms/' + req.params.roomCode + '/join', req.body)
  const { playerName } = req.body
  
  // Find room by code
  const room = Array.from(rooms.values()).find(r => r.roomCode === req.params.roomCode.toUpperCase())
  
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
  
  const playerId = 'dev-player-' + Date.now()
  const mockPlayer = {
    id: playerId,
    roomId: room.id,
    playerName,
    joinedAt: new Date(),
    isConnected: true,
    totalScore: 0,
    correctAnswers: 0
  }
  
  // Add player to room
  currentPlayers.push(mockPlayer)
  roomPlayers.set(room.id, currentPlayers)
  
  // Initialize player score tracking
  playerScores.set(playerId, {
    playerId,
    playerName,
    totalScore: 0,
    correctAnswers: 0,
    responseTime: 0
  })
  
  console.log(`✅ Player "${playerName}" joined room ${room.id}. Total players: ${currentPlayers.length}`)
  
  res.status(201).json({
    player: mockPlayer,
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      description: room.description,
      maxPlayers: room.maxPlayers,
      questionsCount: room.questionsCount,
      timePerQuestion: room.timePerQuestion,
      status: room.status
    },
    playerCount: currentPlayers.length,
    message: 'Sikeresen csatlakoztál a versenyhez! (fejlesztési mód)'
  })
})

// Test route
app.get('/api/test-fixed', (req, res) => {
  console.log('🧪 TEST /api/test-fixed')
  res.json({ 
    message: 'Test route works!',
    roomsCount: rooms.size,
    roomsKeys: Array.from(rooms.keys()),
    firstRoom: rooms.size > 0 ? Array.from(rooms.values())[0] : null
  })
})

// Debug route to check rooms
app.get('/api/debug-rooms', (req, res) => {
  console.log('🔍 DEBUG /api/debug-rooms')
  const allRooms = Array.from(rooms.values())
  res.json({
    totalRooms: rooms.size,
    roomKeys: Array.from(rooms.keys()),
    allRooms: allRooms,
    fixedRooms: allRooms.filter(room => room.isFixed)
  })
})

app.get('/api/rooms/:id/players', (req, res) => {
  console.log('📋 GET /api/rooms/' + req.params.id + '/players')
  
  const players = roomPlayers.get(req.params.id) || []
  const room = rooms.get(req.params.id)
  
  res.json({
    players: players,
    count: players.length,
    maxPlayers: room?.maxPlayers || 30,
    room: room ? {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      status: room.status
    } : {
      id: req.params.id,
      roomCode: 'DEV123',
      title: 'Fejlesztési Verseny',
      status: 'waiting'
    }
  })
})

// Start exercise in fixed room
app.post('/api/rooms/fixed/:grade/start-exercise', (req, res) => {
  console.log(`🏫 POST /api/rooms/fixed/${req.params.grade}/start-exercise`, req.body)
  
  const grade = parseInt(req.params.grade)
  const { selectedExercises, questionsCount, timePerQuestion } = req.body
  
  if (grade < 3 || grade > 8) {
    return res.status(400).json({ message: 'Érvénytelen osztály szám (3-8 között)' })
  }
  
  const roomId = `grade-${grade}-room`
  const room = rooms.get(roomId)
  
  if (!room) {
    return res.status(404).json({ message: 'Fix szoba nem található' })
  }
  
  // Generate questions from selected exercises
  let allQuestions = []
  
  if (selectedExercises && selectedExercises.length > 0) {
    const availableExercises = loadExercisesFromLibrary()
    
    selectedExercises.forEach(selectedEx => {
      let exercise = availableExercises.find(ex => ex.id === selectedEx.id)
      
      if (exercise) {
        const questions = convertExerciseToQuestions(exercise)
        allQuestions.push(...questions)
        console.log(`📚 Added ${questions.length} questions from: "${exercise.title}" to grade ${grade} room`)
      }
    })
  }
  
  // If no exercises, use grade-appropriate default questions
  if (allQuestions.length === 0) {
    allQuestions = generateGradeAppropriateQuestions(grade)
  }
  
  // Shuffle and limit questions
  const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5)
  const selectedQuestions = shuffledQuestions.slice(0, questionsCount || 10)
  
  // Store questions for this room
  gameSessions.set(roomId + '_questions', selectedQuestions)
  
  res.json({
    message: `${grade}. osztály szobájában ${selectedQuestions.length} kérdés betöltve`,
    roomId: roomId,
    roomCode: room.roomCode,
    questionsCount: selectedQuestions.length,
    ready: true
  })
})

// Generate grade-appropriate questions
function generateGradeAppropriateQuestions(grade) {
  const gradeQuestions = {
    3: [
      { id: 'g3_1', text: '3. osztály - Mennyi 5 + 3?', options: ['6', '7', '8', '9'], correctAnswers: [2], timeLimit: 20, points: 100, exerciseNumber: grade.toString(), questionOrder: 1 },
      { id: 'g3_2', text: '3. osztály - Melyik állat él a vízben?', options: ['Kutya', 'Hal', 'Macska', 'Nyúl'], correctAnswers: [1], timeLimit: 20, points: 100, exerciseNumber: grade.toString(), questionOrder: 2 }
    ],
    4: [
      { id: 'g4_1', text: '4. osztály - Mennyi 12 × 3?', options: ['34', '35', '36', '37'], correctAnswers: [2], timeLimit: 25, points: 100, exerciseNumber: grade.toString(), questionOrder: 1 },
      { id: 'g4_2', text: '4. osztály - Mi Magyarország fővárosa?', options: ['Debrecen', 'Szeged', 'Budapest', 'Pécs'], correctAnswers: [2], timeLimit: 25, points: 100, exerciseNumber: grade.toString(), questionOrder: 2 }
    ],
    5: [
      { id: 'g5_1', text: '5. osztály - Mennyi 144 ÷ 12?', options: ['10', '11', '12', '13'], correctAnswers: [2], timeLimit: 30, points: 100, exerciseNumber: grade.toString(), questionOrder: 1 },
      { id: 'g5_2', text: '5. osztály - Melyik kontinensen van Magyarország?', options: ['Ázsia', 'Afrika', 'Európa', 'Amerika'], correctAnswers: [2], timeLimit: 30, points: 100, exerciseNumber: grade.toString(), questionOrder: 2 }
    ],
    6: [
      { id: 'g6_1', text: '6. osztály - Mennyi 15²?', options: ['215', '225', '235', '245'], correctAnswers: [1], timeLimit: 30, points: 100, exerciseNumber: grade.toString(), questionOrder: 1 },
      { id: 'g6_2', text: '6. osztály - Ki írta a Pál utcai fiúk című regényt?', options: ['Petőfi Sándor', 'Molnár Ferenc', 'Arany János', 'Jókai Mór'], correctAnswers: [1], timeLimit: 30, points: 100, exerciseNumber: grade.toString(), questionOrder: 2 }
    ],
    7: [
      { id: 'g7_1', text: '7. osztály - Mennyi (-3) × (-4)?', options: ['12', '-12', '7', '-7'], correctAnswers: [0], timeLimit: 35, points: 100, exerciseNumber: grade.toString(), questionOrder: 1 },
      { id: 'g7_2', text: '7. osztály - Mikor volt a mohácsi csata?', options: ['1456', '1526', '1541', '1686'], correctAnswers: [1], timeLimit: 35, points: 100, exerciseNumber: grade.toString(), questionOrder: 2 }
    ],
    8: [
      { id: 'g8_1', text: '8. osztály - Mennyi √64?', options: ['6', '7', '8', '9'], correctAnswers: [2], timeLimit: 35, points: 100, exerciseNumber: grade.toString(), questionOrder: 1 },
      { id: 'g8_2', text: '8. osztály - Ki fedezte fel Amerikát?', options: ['Vasco da Gama', 'Kolumbusz Kristóf', 'Magellán', 'Cook kapitány'], correctAnswers: [1], timeLimit: 35, points: 100, exerciseNumber: grade.toString(), questionOrder: 2 }
    ]
  }
  
  return gradeQuestions[grade] || gradeQuestions[5] // Default to grade 5 if not found
}

// Create fixed rooms for each grade
function createFixedRooms() {
  console.log('🏗️ Starting to create fixed rooms...')
  const grades = [3, 4, 5, 6, 7, 8]
  
  grades.forEach(grade => {
    const roomId = `grade-${grade}-room`
    const roomCode = `${grade}OSZ` // 3OSZ, 4OSZ, 5OSZ, etc.
    
    const fixedRoom = {
      id: roomId,
      roomCode: roomCode,
      title: `${grade}. osztály - Állandó szoba`,
      description: `Fix szoba a ${grade}. osztály számára. Itt bármikor lehet gyakorolni!`,
      teacherId: 'system',
      maxPlayers: 35,
      questionsCount: 10,
      timePerQuestion: 30,
      status: 'waiting',
      createdAt: new Date(),
      isFixed: true, // Mark as fixed room
      grade: grade
    }
    
    rooms.set(roomId, fixedRoom)
    roomPlayers.set(roomId, [])
    
    console.log(`🏫 Created fixed room for grade ${grade}: ${roomCode}`)
  })
  
  console.log(`✅ Created ${grades.length} fixed rooms. Total rooms in map: ${rooms.size}`)
}

// Initialize fixed rooms on server start
console.log('🚀 Initializing fixed rooms...')
createFixedRooms()

// Debug: Check rooms after creation
console.log('🔍 Debug: Rooms after creation:')
console.log('  - Rooms map size:', rooms.size)
console.log('  - Rooms keys:', Array.from(rooms.keys()))
console.log('  - First room:', rooms.size > 0 ? Array.from(rooms.values())[0] : 'No rooms')

// Health check
app.get('/api/health', (req, res) => {
  const allRooms = Array.from(rooms.values())
  const fixedRooms = allRooms.filter(room => room.isFixed)
  
  res.json({ 
    status: 'ok', 
    mode: 'development', 
    timestamp: new Date(),
    debug: {
      roomsMapSize: rooms.size,
      totalRooms: allRooms.length,
      fixedRooms: fixedRooms.length,
      roomKeys: Array.from(rooms.keys()),
      firstRoom: allRooms.length > 0 ? allRooms[0] : null
    }
  })
})

// Egyszerű statikus szoba létrehozás gomb
// Használjuk a meglévő CreateRoomModal-t előre kitöltött adatokkal

// Egyszerű statikus szobák - csak a TeacherDashboard-ban
// Nincs szükség külön API endpoint-ra, használjuk a meglévő rendszert



// Game management endpoints
app.get('/api/rooms/:id/status', (req, res) => {
  console.log('📊 GET /api/rooms/' + req.params.id + '/status')
  
  const session = gameSessions.get(req.params.id)
  const players = roomPlayers.get(req.params.id) || []
  const room = rooms.get(req.params.id)
  
  if (!session) {
    return res.json({
      roomId: req.params.id,
      roomStatus: 'waiting',
      gameState: 'not_started',
      isActive: false,
      currentQuestionIndex: 0,
      totalQuestions: room?.questionsCount || sampleQuestions.length,
      timeRemaining: 0,
      playerCount: players.length,
      message: 'A verseny még nem kezdődött el (fejlesztési mód)'
    })
  }

  res.json({
    roomId: req.params.id,
    roomStatus: session.status,
    gameState: session.gameState,
    isActive: session.isActive,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: session.questions.length,
    timeRemaining: session.timeRemaining,
    playerCount: players.length,
    currentQuestion: session.gameState === 'question' ? {
      id: session.questions[session.currentQuestionIndex]?.id,
      text: session.questions[session.currentQuestionIndex]?.text,
      options: session.questions[session.currentQuestionIndex]?.options,
      timeLimit: session.questions[session.currentQuestionIndex]?.timeLimit,
      exerciseNumber: session.questions[session.currentQuestionIndex]?.exerciseNumber,
      imageUrl: session.questions[session.currentQuestionIndex]?.imageUrl,
      instruction: session.questions[session.currentQuestionIndex]?.instruction
    } : null,
    leaderboard: session.gameState === 'leaderboard' || session.gameState === 'finished' ? 
      Array.from(playerScores.values())
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((player, index) => ({
          rank: index + 1,
          playerId: player.playerId,
          playerName: player.playerName,
          totalScore: player.totalScore,
          correctAnswers: player.correctAnswers
        })) : null,
    message: `Játék állapot: ${session.gameState} (fejlesztési mód)`
  })
})

app.post('/api/rooms/:id/start', (req, res) => {
  console.log('🚀 POST /api/rooms/' + req.params.id + '/start')
  
  // Get questions for this room (either stored or default)
  let roomQuestions = gameSessions.get(req.params.id + '_questions')
  if (!roomQuestions || roomQuestions.length === 0) {
    // Fallback to default exercises
    const defaultExercises = loadExercisesFromLibrary()
    if (defaultExercises.length > 0) {
      roomQuestions = convertExerciseToQuestions(defaultExercises[0])
      console.log(`📚 Using default exercise questions: ${roomQuestions.length} questions`)
    } else {
      // Final fallback to sample questions
      roomQuestions = sampleQuestions.map(q => ({
        id: q.id,
        text: q.questionText,
        options: q.options,
        correctAnswers: [q.correctAnswer], // Convert to array format
        timeLimit: 30,
        points: 100
      }))
      console.log('📚 Using sample questions as final fallback')
    }
  } else {
    console.log(`📚 Using stored room questions: ${roomQuestions.length} questions`)
  }
  
  // Create a new game session
  const session = {
    roomId: req.params.id,
    status: 'active',
    gameState: 'starting',
    isActive: true,
    currentQuestionIndex: 0,
    questions: roomQuestions,
    timeRemaining: 0,
    startTime: new Date()
  }
  
  gameSessions.set(req.params.id, session)
  
  // Initialize analytics for this game
  const players = roomPlayers.get(req.params.id) || []
  gameAnalytics.set(req.params.id, {
    roomId: req.params.id,
    startTime: new Date(),
    endTime: null,
    totalPlayers: players.length,
    questionsAsked: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    averageResponseTime: 0,
    questionAnalytics: [],
    playerActions: []
  })
  
  console.log(`🎮 Starting game with ${roomQuestions.length} questions`)
  
  // Start first question after 3 seconds
  setTimeout(() => {
    if (gameSessions.has(req.params.id)) {
      const currentSession = gameSessions.get(req.params.id)
      currentSession.gameState = 'question'
      currentSession.timeRemaining = currentSession.questions[0].timeLimit
      console.log(`🎯 Question 1 started for room ${req.params.id}: "${currentSession.questions[0].text}"`)
      
      // Track question start in analytics
      const analytics = gameAnalytics.get(req.params.id)
      if (analytics) {
        analytics.questionsAsked++
        analytics.questionAnalytics.push({
          questionId: currentSession.questions[0].id,
          questionText: currentSession.questions[0].text,
          startTime: new Date(),
          answers: [],
          correctRate: 0,
          averageResponseTime: 0
        })
      }
      
      // Start countdown timer
      const timer = setInterval(() => {
        const session = gameSessions.get(req.params.id)
        if (!session || session.gameState !== 'question') {
          clearInterval(timer)
          return
        }
        
        session.timeRemaining--
        
        if (session.timeRemaining <= 0) {
          clearInterval(timer)
          session.gameState = 'answer_reveal'
          console.log(`⏰ Time's up for question ${session.currentQuestionIndex + 1}`)
          
          // Move to next question after 3 seconds
          setTimeout(() => {
            const currentSession = gameSessions.get(req.params.id)
            if (currentSession) {
              currentSession.currentQuestionIndex++
              if (currentSession.currentQuestionIndex >= currentSession.questions.length) {
                currentSession.gameState = 'finished'
                currentSession.isActive = false
                console.log(`🏁 Game finished for room ${req.params.id}`)
                
                // Finalize analytics
                const analytics = gameAnalytics.get(req.params.id)
                if (analytics) {
                  analytics.endTime = new Date()
                  analytics.totalPlayers = Array.from(playerScores.values()).length
                  analytics.correctAnswers = Array.from(playerScores.values())
                    .reduce((sum, player) => sum + player.correctAnswers, 0)
                  analytics.averageResponseTime = analytics.totalAnswers > 0 ? 
                    analytics.playerActions
                      .filter(action => action.type === 'answer')
                      .reduce((sum, action) => sum + action.responseTime, 0) / analytics.totalAnswers : 0
                }
              } else {
                // Show leaderboard before next question
                currentSession.gameState = 'leaderboard'
                console.log(`🏆 Showing leaderboard for room ${req.params.id}`)
                
                // Start next question after 5 seconds
                setTimeout(() => {
                  const session = gameSessions.get(req.params.id)
                  if (session) {
                    session.gameState = 'question'
                    session.timeRemaining = session.questions[session.currentQuestionIndex].timeLimit
                    console.log(`🎯 Question ${session.currentQuestionIndex + 1} started for room ${req.params.id}: "${session.questions[session.currentQuestionIndex].text}"`)
                    
                    // Track new question in analytics
                    const analytics = gameAnalytics.get(req.params.id)
                    if (analytics) {
                      analytics.questionsAsked++
                      analytics.questionAnalytics.push({
                        questionId: session.questions[session.currentQuestionIndex].id,
                        questionText: session.questions[session.currentQuestionIndex].text,
                        startTime: new Date(),
                        answers: [],
                        correctRate: 0,
                        averageResponseTime: 0
                      })
                    }
                  }
                }, 5000)
              }
            }
          }, 3000)
        }
      }, 1000)
    }
  }, 3000)
  
  res.json({
    message: 'Verseny sikeresen elindítva (fejlesztési mód)',
    session: {
      roomId: req.params.id,
      state: 'starting',
      playerCount: players.length,
      questionCount: roomQuestions.length
    }
  })
})

app.post('/api/rooms/:id/answer', (req, res) => {
  console.log('✍️ POST /api/rooms/' + req.params.id + '/answer', req.body)
  
  const session = gameSessions.get(req.params.id)
  if (!session || session.gameState !== 'question') {
    return res.status(400).json({
      error: 'Nem lehet válaszolni ebben az állapotban',
      gameState: session?.gameState || 'unknown'
    })
  }
  
  const { playerId, selectedAnswers, responseTime } = req.body
  const currentQuestion = session.questions[session.currentQuestionIndex]
  
  // Debug logging
  console.log('🔍 Current question:', currentQuestion)
  console.log('🔍 Question index:', session.currentQuestionIndex)
  console.log('🔍 Total questions:', session.questions.length)
  
  if (!currentQuestion) {
    return res.status(400).json({
      error: 'Nincs aktuális kérdés',
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length
    })
  }
  
  if (!currentQuestion.correctAnswers) {
    console.log('⚠️ Question missing correctAnswers, using fallback')
    // Fallback for old format
    currentQuestion.correctAnswers = [currentQuestion.correctAnswer || 0]
  }
  
  // Check if answer is correct
  const isCorrect = selectedAnswers.length === currentQuestion.correctAnswers.length &&
    selectedAnswers.every(answer => currentQuestion.correctAnswers.includes(answer))
  
  // Update player score if correct
  if (isCorrect && playerScores.has(playerId)) {
    const playerScore = playerScores.get(playerId)
    
    // Calculate points based on response time (faster = more points)
    const maxPoints = currentQuestion.points || 100 // Fallback to 100 points
    const timeBonus = Math.max(0, (currentQuestion.timeLimit - responseTime) / currentQuestion.timeLimit)
    const points = Math.round(maxPoints * (0.5 + 0.5 * timeBonus))
    
    playerScore.totalScore += points
    playerScore.correctAnswers += 1
    playerScore.responseTime = responseTime
    
    console.log(`🏆 Player ${playerScore.playerName} scored ${points} points! Total: ${playerScore.totalScore}`)
  }
  
  // Track answer in analytics
  const analytics = gameAnalytics.get(req.params.id)
  if (analytics) {
    analytics.totalAnswers++
    if (isCorrect) analytics.correctAnswers++
    
    // Add to player actions
    analytics.playerActions.push({
      type: 'answer',
      playerId,
      playerName: playerScores.get(playerId)?.playerName || 'Unknown',
      questionId: currentQuestion.id,
      selectedAnswers,
      isCorrect,
      responseTime,
      timestamp: new Date()
    })
    
    // Update current question analytics
    const currentQuestionAnalytics = analytics.questionAnalytics[analytics.questionAnalytics.length - 1]
    if (currentQuestionAnalytics) {
      currentQuestionAnalytics.answers.push({
        playerId,
        selectedAnswers,
        isCorrect,
        responseTime
      })
      
      // Recalculate question stats
      const questionAnswers = currentQuestionAnalytics.answers
      currentQuestionAnalytics.correctRate = questionAnswers.length > 0 ? 
        (questionAnswers.filter(a => a.isCorrect).length / questionAnswers.length) * 100 : 0
      currentQuestionAnalytics.averageResponseTime = questionAnswers.length > 0 ?
        questionAnswers.reduce((sum, a) => sum + a.responseTime, 0) / questionAnswers.length : 0
    }
  }
  
  console.log(`📝 Player answer: ${selectedAnswers} | Correct: ${currentQuestion.correctAnswers} | Result: ${isCorrect ? '✅' : '❌'}`)
  
  res.json({
    message: 'Válasz sikeresen elküldve (fejlesztési mód)',
    isCorrect,
    correctAnswers: currentQuestion.correctAnswers,
    responseTime,
    pointsEarned: isCorrect && playerScores.has(playerId) ? 
      Math.round((currentQuestion.points || 100) * (0.5 + 0.5 * Math.max(0, (currentQuestion.timeLimit - responseTime) / currentQuestion.timeLimit))) : 0,
    timestamp: new Date()
  })
})

// New leaderboard endpoint
app.get('/api/rooms/:id/leaderboard', (req, res) => {
  console.log('🏆 GET /api/rooms/' + req.params.id + '/leaderboard')
  
  const leaderboard = Array.from(playerScores.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((player, index) => ({
      rank: index + 1,
      playerId: player.playerId,
      playerName: player.playerName,
      totalScore: player.totalScore,
      correctAnswers: player.correctAnswers,
      averageResponseTime: player.responseTime
    }))
  
  res.json({
    leaderboard,
    totalPlayers: leaderboard.length,
    timestamp: new Date()
  })
})

// Analytics endpoint
app.get('/api/rooms/:id/analytics', (req, res) => {
  console.log('📊 GET /api/rooms/' + req.params.id + '/analytics')
  
  const analytics = gameAnalytics.get(req.params.id)
  if (!analytics) {
    return res.status(404).json({
      error: 'Analytics not found for this room',
      message: 'Game may not have started yet'
    })
  }
  
  // Calculate additional metrics
  const duration = analytics.endTime ? 
    Math.round((analytics.endTime - analytics.startTime) / 1000) : 
    Math.round((new Date() - analytics.startTime) / 1000)
  
  const overallAccuracy = analytics.totalAnswers > 0 ? 
    Math.round((analytics.correctAnswers / analytics.totalAnswers) * 100) : 0
  
  res.json({
    ...analytics,
    duration,
    overallAccuracy,
    isCompleted: analytics.endTime !== null,
    generatedAt: new Date()
  })
})

// CSV export endpoint
app.get('/api/rooms/:id/export', (req, res) => {
  console.log('📄 GET /api/rooms/' + req.params.id + '/export')
  
  const analytics = gameAnalytics.get(req.params.id)
  if (!analytics) {
    return res.status(404).json({
      error: 'No data available for export',
      message: 'Game may not have started yet'
    })
  }
  
  // Generate CSV content
  let csvContent = 'Player Name,Total Score,Correct Answers,Average Response Time,Accuracy\n'
  
  const playerStats = Array.from(playerScores.values())
    .sort((a, b) => b.totalScore - a.totalScore)
  
  playerStats.forEach(player => {
    const playerActions = analytics.playerActions.filter(action => action.playerId === player.playerId)
    const totalAnswers = playerActions.length
    const accuracy = totalAnswers > 0 ? Math.round((player.correctAnswers / totalAnswers) * 100) : 0
    const avgResponseTime = totalAnswers > 0 ? 
      Math.round(playerActions.reduce((sum, action) => sum + action.responseTime, 0) / totalAnswers) : 0
    
    csvContent += `"${player.playerName}",${player.totalScore},${player.correctAnswers},${avgResponseTime},${accuracy}%\n`
  })
  
  // Add question-by-question breakdown
  csvContent += '\n\nQuestion Analysis\n'
  csvContent += 'Question,Text,Correct Rate,Average Response Time,Total Answers\n'
  
  analytics.questionAnalytics.forEach((q, index) => {
    csvContent += `"Question ${index + 1}","${q.questionText}",${Math.round(q.correctRate)}%,${Math.round(q.averageResponseTime)}s,${q.answers.length}\n`
  })
  
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="game-results-${req.params.id}-${new Date().toISOString().slice(0,10)}.csv"`)
  res.send(csvContent)
})

// Exercise library endpoint
app.get('/api/exercises', (req, res) => {
  console.log('📚 GET /api/exercises')
  
  const exercises = loadExercisesFromLibrary()
  
  const exerciseList = exercises.map((exercise, index) => ({
    id: exercise.id || index.toString(),
    title: exercise.title,
    type: exercise.type,
    description: exercise.instruction,
    questionCount: exercise.type === 'QUIZ' ? exercise.content.questions?.length || 0 :
                   exercise.type === 'CATEGORIZATION' ? exercise.content.items?.length || 0 :
                   exercise.type === 'MATCHING' ? exercise.content.pairs?.length || 0 : 0,
    estimatedTime: Math.ceil((exercise.type === 'QUIZ' ? exercise.content.questions?.length || 0 :
                              exercise.type === 'CATEGORIZATION' ? exercise.content.items?.length || 0 :
                              exercise.type === 'MATCHING' ? exercise.content.pairs?.length || 0 : 0) * 0.5) // 30s per question
  }))
  
  res.json({
    exercises: exerciseList,
    totalCount: exerciseList.length,
    message: 'Feladatok betöltve (fejlesztési mód)'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`)
  console.log('📡 Mock API routes loaded and ready')
  console.log('🔧 This is a simplified development server with mock data')
  console.log('')
  console.log('Available routes:')
  console.log('  GET  /api/health')
  console.log('  GET  /api/rooms/list')
  console.log('  GET  /api/rooms/fixed')
  console.log('  POST /api/rooms/create')
  console.log('  GET  /api/rooms/check/:roomCode')
  console.log('  POST /api/rooms/:roomCode/join')
  console.log('  GET  /api/rooms/:id/players')
  console.log('  GET  /api/rooms/:id/status')
  console.log('  POST /api/rooms/:id/start')
  console.log('  POST /api/rooms/:id/answer')
  console.log('  POST /api/rooms/fixed/:grade/start-exercise')
})