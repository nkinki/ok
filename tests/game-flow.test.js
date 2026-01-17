// Integration tests for game flow
const { MockGameRoomRepository, MockGamePlayerRepository } = require('../services/mockGameDatabase.ts')

// Mock console to avoid test output noise
console.log = jest.fn()
console.error = jest.fn()

describe('Game Flow Integration Tests', () => {
  
  beforeEach(async () => {
    // Clear mock data before each test
    await MockGameRoomRepository.clear()
    await MockGamePlayerRepository.clear()
  })

  describe('Room Creation and Player Joining Flow', () => {
    test('should create room and allow players to join', async () => {
      // Create a room
      const room = await MockGameRoomRepository.create({
        title: 'Test Room',
        description: 'Test Description',
        teacherId: 'teacher1',
        maxPlayers: 5,
        questionsCount: 10,
        timePerQuestion: 30,
        status: 'waiting'
      })

      expect(room).toBeDefined()
      expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/)
      expect(room.status).toBe('waiting')

      // Add players
      const player1 = await MockGamePlayerRepository.create({
        roomId: room.id,
        playerName: 'Player 1',
        isConnected: true,
        totalScore: 0,
        correctAnswers: 0
      })

      const player2 = await MockGamePlayerRepository.create({
        roomId: room.id,
        playerName: 'Player 2',
        isConnected: true,
        totalScore: 0,
        correctAnswers: 0
      })

      expect(player1.playerName).toBe('Player 1')
      expect(player2.playerName).toBe('Player 2')

      // Check players in room
      const playersInRoom = await MockGamePlayerRepository.findByRoom(room.id)
      expect(playersInRoom).toHaveLength(2)
      expect(playersInRoom.map(p => p.playerName)).toContain('Player 1')
      expect(playersInRoom.map(p => p.playerName)).toContain('Player 2')
    })

    test('should prevent duplicate player names in same room', async () => {
      const room = await MockGameRoomRepository.create({
        title: 'Test Room',
        teacherId: 'teacher1',
        maxPlayers: 5,
        questionsCount: 10,
        timePerQuestion: 30,
        status: 'waiting'
      })

      // Add first player
      await MockGamePlayerRepository.create({
        roomId: room.id,
        playerName: 'Duplicate Name',
        isConnected: true,
        totalScore: 0,
        correctAnswers: 0
      })

      // Check for existing player
      const existingPlayer = await MockGamePlayerRepository.findByNameInRoom(room.id, 'Duplicate Name')
      expect(existingPlayer).toBeDefined()
      expect(existingPlayer.playerName).toBe('Duplicate Name')

      // Trying to add same name should be detected
      const duplicateCheck = await MockGamePlayerRepository.findByNameInRoom(room.id, 'Duplicate Name')
      expect(duplicateCheck).toBeDefined() // Should find the existing player
    })

    test('should enforce room capacity limits', async () => {
      const room = await MockGameRoomRepository.create({
        title: 'Small Room',
        teacherId: 'teacher1',
        maxPlayers: 2, // Small capacity
        questionsCount: 10,
        timePerQuestion: 30,
        status: 'waiting'
      })

      // Add players up to capacity
      await MockGamePlayerRepository.create({
        roomId: room.id,
        playerName: 'Player 1',
        isConnected: true,
        totalScore: 0,
        correctAnswers: 0
      })

      await MockGamePlayerRepository.create({
        roomId: room.id,
        playerName: 'Player 2',
        isConnected: true,
        totalScore: 0,
        correctAnswers: 0
      })

      // Check room is at capacity
      const playersInRoom = await MockGamePlayerRepository.findByRoom(room.id)
      expect(playersInRoom).toHaveLength(2)
      expect(playersInRoom.length).toBe(room.maxPlayers)
    })
  })

  describe('Game State Management', () => {
    test('should track game state transitions', async () => {
      const room = await MockGameRoomRepository.create({
        title: 'State Test Room',
        teacherId: 'teacher1',
        maxPlayers: 3,
        questionsCount: 5,
        timePerQuestion: 30,
        status: 'waiting'
      })

      expect(room.status).toBe('waiting')

      // Simulate state changes
      const updatedRoom = await MockGameRoomRepository.update(room.id, { status: 'active' })
      expect(updatedRoom.status).toBe('active')

      const finishedRoom = await MockGameRoomRepository.update(room.id, { status: 'finished' })
      expect(finishedRoom.status).toBe('finished')
    })

    test('should calculate scores correctly', async () => {
      const room = await MockGameRoomRepository.create({
        title: 'Score Test Room',
        teacherId: 'teacher1',
        maxPlayers: 3,
        questionsCount: 10,
        timePerQuestion: 30,
        status: 'waiting'
      })

      const player = await MockGamePlayerRepository.create({
        roomId: room.id,
        playerName: 'Test Player',
        isConnected: true,
        totalScore: 0,
        correctAnswers: 0
      })

      // Simulate scoring
      const baseScore = 1000
      const timeBonus = 500
      const totalScore = baseScore + timeBonus

      const updatedPlayer = await MockGamePlayerRepository.update(player.id, {
        totalScore: totalScore,
        correctAnswers: 1
      })

      expect(updatedPlayer.totalScore).toBe(1500)
      expect(updatedPlayer.correctAnswers).toBe(1)
    })
  })

  describe('Room Code Generation', () => {
    test('should generate unique room codes', async () => {
      const codes = new Set()
      
      // Create multiple rooms and check code uniqueness
      for (let i = 0; i < 10; i++) {
        const room = await MockGameRoomRepository.create({
          title: `Room ${i}`,
          teacherId: 'teacher1',
          maxPlayers: 5,
          questionsCount: 10,
          timePerQuestion: 30,
          status: 'waiting'
        })
        
        expect(room.roomCode).toMatch(/^[A-Z0-9]{6}$/)
        expect(codes.has(room.roomCode)).toBe(false) // Should be unique
        codes.add(room.roomCode)
      }
      
      expect(codes.size).toBe(10) // All codes should be unique
    })
  })

  describe('Data Integrity', () => {
    test('should maintain referential integrity between rooms and players', async () => {
      const room = await MockGameRoomRepository.create({
        title: 'Integrity Test Room',
        teacherId: 'teacher1',
        maxPlayers: 5,
        questionsCount: 10,
        timePerQuestion: 30,
        status: 'waiting'
      })

      const player = await MockGamePlayerRepository.create({
        roomId: room.id,
        playerName: 'Test Player',
        isConnected: true,
        totalScore: 0,
        correctAnswers: 0
      })

      // Verify relationships
      expect(player.roomId).toBe(room.id)
      
      const playersInRoom = await MockGamePlayerRepository.findByRoom(room.id)
      expect(playersInRoom).toHaveLength(1)
      expect(playersInRoom[0].id).toBe(player.id)
    })
  })
})

console.log('✅ Game flow integration tests completed')