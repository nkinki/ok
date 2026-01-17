// WebSocket Manager for real-time game communication
import { io, Socket } from 'socket.io-client'
import { WebSocketEvent, PlayerJoinEvent, GameStartEvent, QuestionEvent, AnswerEvent, LeaderboardEvent, GameEndEvent } from '../types/game'

export class GameWebSocketManager {
  private socket: Socket | null = null
  private roomCode: string | null = null
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor() {
    this.initializeEventHandlers()
  }

  // Initialize default event handlers
  private initializeEventHandlers(): void {
    this.eventHandlers.set('connect', [])
    this.eventHandlers.set('disconnect', [])
    this.eventHandlers.set('error', [])
    this.eventHandlers.set('player_join', [])
    this.eventHandlers.set('player_leave', [])
    this.eventHandlers.set('game_start', [])
    this.eventHandlers.set('question', [])
    this.eventHandlers.set('answer', [])
    this.eventHandlers.set('leaderboard', [])
    this.eventHandlers.set('game_end', [])
  }

  // Connect to WebSocket server
  connect(serverUrl: string = 'http://localhost:3001'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000
        })

        this.socket.on('connect', () => {
          console.log('🔌 WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.triggerEvent('connect', { connected: true })
          resolve()
        })

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket disconnected:', reason)
          this.isConnected = false
          this.triggerEvent('disconnect', { reason })
        })

        this.socket.on('connect_error', (error) => {
          console.error('🔌 WebSocket connection error:', error)
          this.reconnectAttempts++
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.triggerEvent('error', { error: 'Max reconnection attempts reached' })
            reject(new Error('Failed to connect to WebSocket server'))
          }
        })

        // Game event listeners
        this.socket.on('player_join', (data: PlayerJoinEvent['data']) => {
          this.triggerEvent('player_join', data)
        })

        this.socket.on('player_leave', (data: any) => {
          this.triggerEvent('player_leave', data)
        })

        this.socket.on('game_start', (data: GameStartEvent['data']) => {
          this.triggerEvent('game_start', data)
        })

        this.socket.on('question', (data: QuestionEvent['data']) => {
          this.triggerEvent('question', data)
        })

        this.socket.on('answer', (data: AnswerEvent['data']) => {
          this.triggerEvent('answer', data)
        })

        this.socket.on('leaderboard', (data: LeaderboardEvent['data']) => {
          this.triggerEvent('leaderboard', data)
        })

        this.socket.on('game_end', (data: GameEndEvent['data']) => {
          this.triggerEvent('game_end', data)
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.roomCode = null
    }
  }

  // Join a game room
  joinRoom(roomCode: string, playerName?: string, isTeacher: boolean = false): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected')
    }

    this.roomCode = roomCode
    this.socket.emit('join_room', {
      roomCode,
      playerName,
      isTeacher,
      timestamp: new Date()
    })
  }

  // Leave current room
  leaveRoom(): void {
    if (!this.socket || !this.roomCode) return

    this.socket.emit('leave_room', {
      roomCode: this.roomCode,
      timestamp: new Date()
    })

    this.roomCode = null
  }

  // Send player answer
  sendAnswer(questionId: string, selectedAnswers: number[], responseTime: number): void {
    if (!this.socket || !this.roomCode) {
      throw new Error('Not connected to a room')
    }

    this.socket.emit('answer', {
      roomCode: this.roomCode,
      questionId,
      selectedAnswers,
      responseTime,
      timestamp: new Date()
    })
  }

  // Start game (teacher only)
  startGame(): void {
    if (!this.socket || !this.roomCode) {
      throw new Error('Not connected to a room')
    }

    this.socket.emit('start_game', {
      roomCode: this.roomCode,
      timestamp: new Date()
    })
  }

  // Send next question (teacher only)
  sendQuestion(questionData: QuestionEvent['data']): void {
    if (!this.socket || !this.roomCode) {
      throw new Error('Not connected to a room')
    }

    this.socket.emit('question', {
      roomCode: this.roomCode,
      ...questionData,
      timestamp: new Date()
    })
  }

  // Send leaderboard update (teacher only)
  sendLeaderboard(leaderboardData: LeaderboardEvent['data']): void {
    if (!this.socket || !this.roomCode) {
      throw new Error('Not connected to a room')
    }

    this.socket.emit('leaderboard', {
      roomCode: this.roomCode,
      ...leaderboardData,
      timestamp: new Date()
    })
  }

  // End game (teacher only)
  endGame(finalResults: GameEndEvent['data']): void {
    if (!this.socket || !this.roomCode) {
      throw new Error('Not connected to a room')
    }

    this.socket.emit('game_end', {
      roomCode: this.roomCode,
      ...finalResults,
      timestamp: new Date()
    })
  }

  // Event handler management
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler?: Function): void {
    if (!this.eventHandlers.has(event)) return

    if (handler) {
      const handlers = this.eventHandlers.get(event)!
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      this.eventHandlers.set(event, [])
    }
  }

  private triggerEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in ${event} handler:`, error)
      }
    })
  }

  // Getters
  get connected(): boolean {
    return this.isConnected
  }

  get currentRoom(): string | null {
    return this.roomCode
  }
}

// Singleton instance for global use
export const gameWebSocket = new GameWebSocketManager()

// Development mock WebSocket for when server is not available
export class MockWebSocketManager {
  private eventHandlers: Map<string, Function[]> = new Map()
  private roomCode: string | null = null
  private isConnected: boolean = false

  constructor() {
    this.initializeEventHandlers()
  }

  private initializeEventHandlers(): void {
    this.eventHandlers.set('connect', [])
    this.eventHandlers.set('disconnect', [])
    this.eventHandlers.set('error', [])
    this.eventHandlers.set('player_join', [])
    this.eventHandlers.set('player_leave', [])
    this.eventHandlers.set('game_start', [])
    this.eventHandlers.set('question', [])
    this.eventHandlers.set('answer', [])
    this.eventHandlers.set('leaderboard', [])
    this.eventHandlers.set('game_end', [])
  }

  async connect(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500))
    this.isConnected = true
    this.triggerEvent('connect', { connected: true })
    console.log('🔌 Mock WebSocket connected')
  }

  disconnect(): void {
    this.isConnected = false
    this.roomCode = null
    this.triggerEvent('disconnect', { reason: 'client disconnect' })
    console.log('🔌 Mock WebSocket disconnected')
  }

  joinRoom(roomCode: string, playerName?: string, isTeacher: boolean = false): void {
    this.roomCode = roomCode
    console.log(`🎮 Mock: Joined room ${roomCode} as ${isTeacher ? 'teacher' : 'player'}`)
    
    // Simulate other players joining
    if (!isTeacher) {
      setTimeout(() => {
        this.triggerEvent('player_join', {
          playerName: 'Mock Player 1',
          playerId: 'mock_player_1'
        })
      }, 1000)
    }
  }

  leaveRoom(): void {
    console.log(`🎮 Mock: Left room ${this.roomCode}`)
    this.roomCode = null
  }

  sendAnswer(questionId: string, selectedAnswers: number[], responseTime: number): void {
    console.log(`🎮 Mock: Answer sent for question ${questionId}:`, selectedAnswers)
  }

  startGame(): void {
    console.log('🎮 Mock: Game started')
    this.triggerEvent('game_start', {
      questionsCount: 5,
      timePerQuestion: 30
    })
  }

  sendQuestion(questionData: QuestionEvent['data']): void {
    console.log('🎮 Mock: Question sent:', questionData)
  }

  sendLeaderboard(leaderboardData: LeaderboardEvent['data']): void {
    console.log('🎮 Mock: Leaderboard sent:', leaderboardData)
  }

  endGame(finalResults: GameEndEvent['data']): void {
    console.log('🎮 Mock: Game ended:', finalResults)
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler?: Function): void {
    if (!this.eventHandlers.has(event)) return

    if (handler) {
      const handlers = this.eventHandlers.get(event)!
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      this.eventHandlers.set(event, [])
    }
  }

  private triggerEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in ${event} handler:`, error)
      }
    })
  }

  get connected(): boolean {
    return this.isConnected
  }

  get currentRoom(): string | null {
    return this.roomCode
  }
}

// Export mock instance for development
export const mockGameWebSocket = new MockWebSocketManager()