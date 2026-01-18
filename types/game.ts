// Game-related type definitions
export interface GameRoom {
  id: string
  roomCode: string
  title: string
  description?: string
  teacherId: string
  maxPlayers: number
  questionsCount: number
  timePerQuestion: number // seconds
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  createdAt: Date
  startedAt?: Date
  finishedAt?: Date
}

export interface FixedRoom {
  id: string
  roomCode: string
  title: string
  description: string
  grade: number
  playerCount: number
  availableSlots: number
  maxPlayers: number
  gameState: string
  isActive: boolean
  status?: 'waiting' | 'active' | 'finished' | 'cancelled'
  customCode?: string
}

export interface GameQuestion {
  id: string
  roomId: string
  questionOrder: number
  questionText: string
  questionType: 'multiple_choice' | 'true_false' | 'matching'
  options: string[]
  correctAnswers: number[]
  points: number
  timeLimit: number // seconds
}

export interface GamePlayer {
  id: string
  roomId: string
  playerName: string
  joinedAt: Date
  isConnected: boolean
  totalScore: number
  correctAnswers: number
}

export interface GameSession {
  id: string
  roomId: string
  teacherId: string
  title: string
  playerCount: number
  questionsCount: number
  avgScore: number
  duration: number // minutes
  status: 'completed' | 'abandoned'
  startedAt: Date
  finishedAt: Date
}

export interface PlayerAnswer {
  id: string
  roomId: string
  playerId: string
  questionId: string
  selectedAnswers: number[]
  isCorrect: boolean
  pointsEarned: number
  responseTimeMs: number
  answeredAt: Date
}

// WebSocket event types
export interface WebSocketEvent {
  type: string
  roomCode?: string
  data?: any
  timestamp: Date
}

export interface PlayerJoinEvent extends WebSocketEvent {
  type: 'player_join'
  data: {
    playerName: string
    playerId: string
  }
}

export interface GameStartEvent extends WebSocketEvent {
  type: 'game_start'
  data: {
    questionsCount: number
    timePerQuestion: number
  }
}

export interface QuestionEvent extends WebSocketEvent {
  type: 'question'
  data: {
    questionOrder: number
    questionText: string
    options: string[]
    timeLimit: number
  }
}

export interface AnswerEvent extends WebSocketEvent {
  type: 'answer'
  data: {
    playerId: string
    selectedAnswers: number[]
    responseTime: number
  }
}

export interface LeaderboardEvent extends WebSocketEvent {
  type: 'leaderboard'
  data: {
    players: Array<{
      playerId: string
      playerName: string
      totalScore: number
      correctAnswers: number
    }>
  }
}

export interface GameEndEvent extends WebSocketEvent {
  type: 'game_end'
  data: {
    finalLeaderboard: Array<{
      playerId: string
      playerName: string
      totalScore: number
      correctAnswers: number
      rank: number
    }>
  }
}