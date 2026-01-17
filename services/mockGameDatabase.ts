// Mock game database for local development
import { GameRoom, GameQuestion, GamePlayer, GameSession, PlayerAnswer } from '../types/game'

// Local storage keys
const GAME_ROOMS_KEY = 'mock_game_rooms'
const GAME_QUESTIONS_KEY = 'mock_game_questions'
const GAME_PLAYERS_KEY = 'mock_game_players'
const GAME_SESSIONS_KEY = 'mock_game_sessions'
const PLAYER_ANSWERS_KEY = 'mock_player_answers'

// In-memory storage for development
let gameRooms: GameRoom[] = []
let gameQuestions: GameQuestion[] = []
let gamePlayers: GamePlayer[] = []
let gameSessions: GameSession[] = []
let playerAnswers: PlayerAnswer[] = []

// Helper functions
function loadFromStorage<T>(key: string, defaultValue: T[]): T[] {
  // Server-side: use in-memory storage
  if (typeof window === 'undefined') {
    return defaultValue
  }
  
  // Client-side: use localStorage
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error(`Error parsing ${key}:`, e)
    }
  }
  return defaultValue
}

function saveToStorage<T>(key: string, data: T[]): void {
  // Server-side: no-op (data is already in memory)
  if (typeof window === 'undefined') {
    return
  }
  
  // Client-side: save to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`Error saving ${key}:`, e)
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36)
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Game Room Repository
export class MockGameRoomRepository {
  static async findAll(): Promise<GameRoom[]> {
    gameRooms = loadFromStorage(GAME_ROOMS_KEY, [])
    return gameRooms
  }

  static async findById(id: string): Promise<GameRoom | null> {
    // Initialize with some test data if empty
    if (gameRooms.length === 0) {
      gameRooms = [
        {
          id: 'dev-room-1768240865698',
          roomCode: 'DEV123',
          title: 'Teszt Verseny',
          description: 'Fejlesztői teszt verseny',
          teacherId: 'dev-teacher',
          maxPlayers: 10,
          questionsCount: 5,
          timePerQuestion: 30,
          status: 'waiting',
          createdAt: new Date()
        }
      ]
    }
    
    return gameRooms.find(room => room.id === id) || null
  }

  static async findByCode(roomCode: string): Promise<GameRoom | null> {
    gameRooms = loadFromStorage(GAME_ROOMS_KEY, [])
    return gameRooms.find(room => room.roomCode === roomCode) || null
  }

  static async findByTeacher(teacherId: string): Promise<GameRoom[]> {
    gameRooms = loadFromStorage(GAME_ROOMS_KEY, [])
    return gameRooms.filter(room => room.teacherId === teacherId)
  }

  static async create(roomData: Omit<GameRoom, 'id' | 'roomCode' | 'createdAt'>): Promise<GameRoom> {
    gameRooms = loadFromStorage(GAME_ROOMS_KEY, [])
    
    // Generate unique room code
    let roomCode: string
    do {
      roomCode = generateRoomCode()
    } while (gameRooms.some(room => room.roomCode === roomCode))

    const newRoom: GameRoom = {
      id: generateId(),
      roomCode,
      ...roomData,
      createdAt: new Date()
    }

    gameRooms.push(newRoom)
    saveToStorage(GAME_ROOMS_KEY, gameRooms)
    return newRoom
  }

  static async update(id: string, updates: Partial<GameRoom>): Promise<GameRoom | null> {
    gameRooms = loadFromStorage(GAME_ROOMS_KEY, [])
    const roomIndex = gameRooms.findIndex(room => room.id === id)
    
    if (roomIndex === -1) return null
    
    gameRooms[roomIndex] = { ...gameRooms[roomIndex], ...updates }
    saveToStorage(GAME_ROOMS_KEY, gameRooms)
    return gameRooms[roomIndex]
  }

  static async delete(id: string): Promise<boolean> {
    gameRooms = loadFromStorage(GAME_ROOMS_KEY, [])
    const initialLength = gameRooms.length
    gameRooms = gameRooms.filter(room => room.id !== id)
    
    if (gameRooms.length < initialLength) {
      saveToStorage(GAME_ROOMS_KEY, gameRooms)
      return true
    }
    return false
  }
}

// Game Player Repository
export class MockGamePlayerRepository {
  static async findByRoom(roomId: string): Promise<GamePlayer[]> {
    gamePlayers = loadFromStorage(GAME_PLAYERS_KEY, [])
    return gamePlayers.filter(player => player.roomId === roomId)
  }

  static async findById(id: string): Promise<GamePlayer | null> {
    gamePlayers = loadFromStorage(GAME_PLAYERS_KEY, [])
    return gamePlayers.find(player => player.id === id) || null
  }

  static async findByNameInRoom(roomId: string, playerName: string): Promise<GamePlayer | null> {
    gamePlayers = loadFromStorage(GAME_PLAYERS_KEY, [])
    return gamePlayers.find(player => 
      player.roomId === roomId && player.playerName === playerName
    ) || null
  }

  static async create(playerData: Omit<GamePlayer, 'id' | 'joinedAt'>): Promise<GamePlayer> {
    gamePlayers = loadFromStorage(GAME_PLAYERS_KEY, [])
    
    const newPlayer: GamePlayer = {
      id: generateId(),
      ...playerData,
      joinedAt: new Date()
    }

    gamePlayers.push(newPlayer)
    saveToStorage(GAME_PLAYERS_KEY, gamePlayers)
    return newPlayer
  }

  static async update(id: string, updates: Partial<GamePlayer>): Promise<GamePlayer | null> {
    gamePlayers = loadFromStorage(GAME_PLAYERS_KEY, [])
    const playerIndex = gamePlayers.findIndex(player => player.id === id)
    
    if (playerIndex === -1) return null
    
    gamePlayers[playerIndex] = { ...gamePlayers[playerIndex], ...updates }
    saveToStorage(GAME_PLAYERS_KEY, gamePlayers)
    return gamePlayers[playerIndex]
  }

  static async delete(id: string): Promise<boolean> {
    gamePlayers = loadFromStorage(GAME_PLAYERS_KEY, [])
    const initialLength = gamePlayers.length
    gamePlayers = gamePlayers.filter(player => player.id !== id)
    
    if (gamePlayers.length < initialLength) {
      saveToStorage(GAME_PLAYERS_KEY, gamePlayers)
      return true
    }
    return false
  }
}

// Game Question Repository
export class MockGameQuestionRepository {
  static async findByRoom(roomId: string): Promise<GameQuestion[]> {
    gameQuestions = loadFromStorage(GAME_QUESTIONS_KEY, [])
    return gameQuestions
      .filter(question => question.roomId === roomId)
      .sort((a, b) => a.questionOrder - b.questionOrder)
  }

  static async create(questionData: Omit<GameQuestion, 'id'>): Promise<GameQuestion> {
    gameQuestions = loadFromStorage(GAME_QUESTIONS_KEY, [])
    
    const newQuestion: GameQuestion = {
      id: generateId(),
      ...questionData
    }

    gameQuestions.push(newQuestion)
    saveToStorage(GAME_QUESTIONS_KEY, gameQuestions)
    return newQuestion
  }

  static async deleteByRoom(roomId: string): Promise<void> {
    gameQuestions = loadFromStorage(GAME_QUESTIONS_KEY, [])
    gameQuestions = gameQuestions.filter(question => question.roomId !== roomId)
    saveToStorage(GAME_QUESTIONS_KEY, gameQuestions)
  }
}

// Game Session Repository
export class MockGameSessionRepository {
  static async findByTeacher(teacherId: string): Promise<GameSession[]> {
    gameSessions = loadFromStorage(GAME_SESSIONS_KEY, [])
    return gameSessions
      .filter(session => session.teacherId === teacherId)
      .sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime())
  }

  static async create(sessionData: Omit<GameSession, 'id'>): Promise<GameSession> {
    gameSessions = loadFromStorage(GAME_SESSIONS_KEY, [])
    
    const newSession: GameSession = {
      id: generateId(),
      ...sessionData
    }

    gameSessions.push(newSession)
    saveToStorage(GAME_SESSIONS_KEY, gameSessions)
    return newSession
  }
}

// Initialize with some sample data for development
export function initializeMockGameData(): void {
  // Only initialize if no data exists
  const existingRooms = loadFromStorage(GAME_ROOMS_KEY, [])
  if (existingRooms.length === 0) {
    console.log('🎮 Initializing mock game data for development')
  }
}