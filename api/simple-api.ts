// Production API for fixed rooms system
import { VercelRequest, VercelResponse } from '@vercel/node'

// In-memory storage (will reset on each function invocation)
// For production, consider using a database or external storage
let rooms = new Map()
let roomPlayers = new Map()
let roomGameStates = new Map()
let roomQuestions = new Map()
let roomExercises = new Map()

// Initialize fixed rooms
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

    // Default response for unmatched routes
    return res.status(404).json({ error: 'Endpoint not found' })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}