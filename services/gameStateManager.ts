// Game State Management System
import { GameRoom, GameQuestion, GamePlayer } from '../types/game'

export type GameState = 'waiting' | 'starting' | 'question' | 'answer_reveal' | 'leaderboard' | 'finished'

export interface GameSession {
  roomId: string
  currentState: GameState
  currentQuestionIndex: number
  questions: GameQuestion[]
  players: GamePlayer[]
  startTime?: Date
  questionStartTime?: Date
  timeRemaining: number
  isActive: boolean
}

export interface GameStateUpdate {
  type: 'state_change' | 'question_start' | 'time_update' | 'player_answer' | 'leaderboard_update'
  roomId: string
  data: any
  timestamp: Date
}

class GameStateManager {
  private sessions: Map<string, GameSession> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private callbacks: Map<string, ((update: GameStateUpdate) => void)[]> = new Map()

  // Create a new game session
  createSession(room: GameRoom, questions: GameQuestion[], players: GamePlayer[]): GameSession {
    const session: GameSession = {
      roomId: room.id,
      currentState: 'waiting',
      currentQuestionIndex: 0,
      questions: questions.sort((a, b) => a.questionOrder - b.questionOrder),
      players: [...players],
      timeRemaining: 0,
      isActive: false
    }

    this.sessions.set(room.id, session)
    return session
  }

  // Get session by room ID
  getSession(roomId: string): GameSession | null {
    return this.sessions.get(roomId) || null
  }

  // Start the game
  startGame(roomId: string): boolean {
    const session = this.sessions.get(roomId)
    if (!session || session.isActive) {
      return false
    }

    session.currentState = 'starting'
    session.isActive = true
    session.startTime = new Date()
    
    this.broadcastUpdate(roomId, {
      type: 'state_change',
      roomId,
      data: { state: 'starting', message: 'A verseny hamarosan kezdődik...' },
      timestamp: new Date()
    })

    // Start first question after 3 seconds
    setTimeout(() => {
      this.startQuestion(roomId)
    }, 3000)

    return true
  }

  // Start a question
  private startQuestion(roomId: string): void {
    const session = this.sessions.get(roomId)
    if (!session || !session.isActive) return

    if (session.currentQuestionIndex >= session.questions.length) {
      this.endGame(roomId)
      return
    }

    const currentQuestion = session.questions[session.currentQuestionIndex]
    session.currentState = 'question'
    session.questionStartTime = new Date()
    session.timeRemaining = currentQuestion.timeLimit

    this.broadcastUpdate(roomId, {
      type: 'question_start',
      roomId,
      data: {
        questionIndex: session.currentQuestionIndex + 1,
        totalQuestions: session.questions.length,
        question: {
          id: currentQuestion.id,
          text: currentQuestion.questionText,
          options: currentQuestion.options,
          timeLimit: currentQuestion.timeLimit
        }
      },
      timestamp: new Date()
    })

    // Start countdown timer
    this.startQuestionTimer(roomId, currentQuestion.timeLimit)
  }

  // Start question timer
  private startQuestionTimer(roomId: string, timeLimit: number): void {
    const session = this.sessions.get(roomId)
    if (!session) return

    // Clear existing timer
    const existingTimer = this.timers.get(roomId)
    if (existingTimer) {
      clearInterval(existingTimer)
    }

    let timeRemaining = timeLimit
    session.timeRemaining = timeRemaining

    const timer = setInterval(() => {
      timeRemaining--
      session.timeRemaining = timeRemaining

      // Broadcast time update every second
      this.broadcastUpdate(roomId, {
        type: 'time_update',
        roomId,
        data: { timeRemaining },
        timestamp: new Date()
      })

      // Time's up
      if (timeRemaining <= 0) {
        clearInterval(timer)
        this.timers.delete(roomId)
        this.endQuestion(roomId)
      }
    }, 1000)

    this.timers.set(roomId, timer)
  }

  // End current question and show results
  private endQuestion(roomId: string): void {
    const session = this.sessions.get(roomId)
    if (!session) return

    session.currentState = 'answer_reveal'
    const currentQuestion = session.questions[session.currentQuestionIndex]

    this.broadcastUpdate(roomId, {
      type: 'state_change',
      roomId,
      data: {
        state: 'answer_reveal',
        correctAnswers: currentQuestion.correctAnswers,
        explanation: `A helyes válasz: ${currentQuestion.correctAnswers.map(i => currentQuestion.options[i]).join(', ')}`
      },
      timestamp: new Date()
    })

    // Show leaderboard after 3 seconds
    setTimeout(() => {
      this.showLeaderboard(roomId)
    }, 3000)
  }

  // Show leaderboard
  private showLeaderboard(roomId: string): void {
    const session = this.sessions.get(roomId)
    if (!session) return

    session.currentState = 'leaderboard'

    // Sort players by score
    const sortedPlayers = [...session.players].sort((a, b) => b.totalScore - a.totalScore)

    this.broadcastUpdate(roomId, {
      type: 'leaderboard_update',
      roomId,
      data: {
        leaderboard: sortedPlayers.map((player, index) => ({
          rank: index + 1,
          playerId: player.id,
          playerName: player.playerName,
          totalScore: player.totalScore,
          correctAnswers: player.correctAnswers
        })),
        currentQuestion: session.currentQuestionIndex + 1,
        totalQuestions: session.questions.length
      },
      timestamp: new Date()
    })

    // Move to next question after 5 seconds
    setTimeout(() => {
      session.currentQuestionIndex++
      this.startQuestion(roomId)
    }, 5000)
  }

  // Submit player answer
  submitAnswer(roomId: string, playerId: string, selectedAnswers: number[], responseTime: number): boolean {
    const session = this.sessions.get(roomId)
    if (!session || session.currentState !== 'question') {
      return false
    }

    const player = session.players.find(p => p.id === playerId)
    const currentQuestion = session.questions[session.currentQuestionIndex]
    
    if (!player || !currentQuestion) {
      return false
    }

    // Calculate if answer is correct
    const isCorrect = this.checkAnswer(selectedAnswers, currentQuestion.correctAnswers)
    
    if (isCorrect) {
      // Calculate points based on response time (faster = more points)
      const maxPoints = currentQuestion.points
      const timeBonus = Math.max(0, (currentQuestion.timeLimit - responseTime) / currentQuestion.timeLimit)
      const points = Math.round(maxPoints * (0.5 + 0.5 * timeBonus))
      
      player.totalScore += points
      player.correctAnswers++
    }

    this.broadcastUpdate(roomId, {
      type: 'player_answer',
      roomId,
      data: {
        playerId,
        playerName: player.playerName,
        isCorrect,
        responseTime
      },
      timestamp: new Date()
    })

    return true
  }

  // Check if answer is correct
  private checkAnswer(selectedAnswers: number[], correctAnswers: number[]): boolean {
    if (selectedAnswers.length !== correctAnswers.length) {
      return false
    }
    
    const sortedSelected = [...selectedAnswers].sort()
    const sortedCorrect = [...correctAnswers].sort()
    
    return sortedSelected.every((answer, index) => answer === sortedCorrect[index])
  }

  // End the game
  private endGame(roomId: string): void {
    const session = this.sessions.get(roomId)
    if (!session) return

    session.currentState = 'finished'
    session.isActive = false

    // Clear any existing timers
    const timer = this.timers.get(roomId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(roomId)
    }

    // Final leaderboard
    const sortedPlayers = [...session.players].sort((a, b) => b.totalScore - a.totalScore)

    this.broadcastUpdate(roomId, {
      type: 'state_change',
      roomId,
      data: {
        state: 'finished',
        finalLeaderboard: sortedPlayers.map((player, index) => ({
          rank: index + 1,
          playerId: player.id,
          playerName: player.playerName,
          totalScore: player.totalScore,
          correctAnswers: player.correctAnswers,
          accuracy: session.questions.length > 0 ? Math.round((player.correctAnswers / session.questions.length) * 100) : 0
        }))
      },
      timestamp: new Date()
    })
  }

  // Subscribe to game updates
  subscribe(roomId: string, callback: (update: GameStateUpdate) => void): void {
    if (!this.callbacks.has(roomId)) {
      this.callbacks.set(roomId, [])
    }
    this.callbacks.get(roomId)!.push(callback)
  }

  // Unsubscribe from game updates
  unsubscribe(roomId: string, callback: (update: GameStateUpdate) => void): void {
    const callbacks = this.callbacks.get(roomId)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // Broadcast update to all subscribers
  private broadcastUpdate(roomId: string, update: GameStateUpdate): void {
    const callbacks = this.callbacks.get(roomId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(update)
        } catch (error) {
          console.error('Error in game state callback:', error)
        }
      })
    }
  }

  // Clean up session
  cleanup(roomId: string): void {
    const timer = this.timers.get(roomId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(roomId)
    }
    
    this.sessions.delete(roomId)
    this.callbacks.delete(roomId)
  }
}

// Singleton instance
export const gameStateManager = new GameStateManager()
export default gameStateManager