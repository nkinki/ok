import React, { useState, useEffect } from 'react'
import { GameRoom, GamePlayer } from '../types/game'
import QuizExercise from './QuizExercise'
import CategorizationExercise from './CategorizationExercise'
import ImageViewer from './ImageViewer'

interface GameState {
  roomId: string
  gameState: string
  isActive: boolean
  currentQuestionIndex: number
  totalQuestions: number
  timeRemaining: number
  currentExercise?: {
    id: string
    type: string
    data: any
    imageUrl?: string
  }
  leaderboard?: Array<{
    rank: number
    playerId: string
    playerName: string
    totalScore: number
    correctAnswers: number
  }>
}

interface GamePlayerProps {
  player: GamePlayer
  room: GameRoom
  onExit: () => void
}

export default function GamePlayerComponent({ player, room, onExit }: GamePlayerProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [exerciseStartTime, setExerciseStartTime] = useState<Date>(new Date())

  useEffect(() => {
    loadGameStatus()
    
    // Poll for updates every second during active game
    const interval = setInterval(() => {
      loadGameStatus()
    }, 1000)

    return () => clearInterval(interval)
  }, [room.id])
  
  // Reset start time when exercise changes
  useEffect(() => {
    if (gameState?.currentExercise) {
      setExerciseStartTime(new Date())
    }
  }, [gameState?.currentExercise?.id])

  const loadGameStatus = async () => {
    try {
      // If room code is 6 characters, use simple-server
      let response
      if (room.roomCode && room.roomCode.length === 6) {
        try {
          response = await fetch(`http://localhost:3002/api/rooms/${room.id}/status`)
        } catch (err) {
          // Fallback to main server
          response = await fetch(`/api/rooms/${room.id}/status`)
        }
      } else {
        response = await fetch(`/api/rooms/${room.id}/status`)
      }
      
      if (response.ok) {
        const data = await response.json()
        setGameState(data)
      }
    } catch (error) {
      console.error('Error loading game status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExerciseComplete = () => {
    console.log('Exercise completed!')
    // The game will automatically progress to next question via polling
  }
  
  const handleQuizAnswer = async (selectedAnswers: number[], isCorrect: boolean, responseTime: number) => {
    console.log('Quiz answer:', { selectedAnswers, isCorrect, responseTime })
    
    try {
      let response
      if (room.roomCode && room.roomCode.length === 6) {
        response = await fetch(`http://localhost:3002/api/rooms/${room.id}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.id,
            selectedAnswers,
            responseTime,
            isCorrect
          })
        })
      }
      
      if (response && response.ok) {
        const data = await response.json()
        console.log('Answer submitted:', data)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }
  
  const handleCategorizationAnswer = async (isCorrect: boolean, responseTime: number) => {
    console.log('Categorization answer:', { isCorrect, responseTime })
    
    try {
      let response
      if (room.roomCode && room.roomCode.length === 6) {
        response = await fetch(`http://localhost:3002/api/rooms/${room.id}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.id,
            selectedAnswers: [], // Not applicable for categorization
            responseTime,
            isCorrect
          })
        })
      }
      
      if (response && response.ok) {
        const data = await response.json()
        console.log('Answer submitted:', data)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const getStateMessage = () => {
    if (!gameState) return 'Betöltés...'
    
    switch (gameState.gameState) {
      case 'not_started':
        return 'Várakozás a verseny indítására...'
      case 'starting':
        return 'A verseny hamarosan kezdődik!'
      case 'question':
        return `Kérdés ${gameState.currentQuestionIndex + 1}/${gameState.totalQuestions}`
      case 'answer_reveal':
        return 'Válasz felfedése...'
      case 'leaderboard':
        return 'Eredménytábla'
      case 'finished':
        return 'Verseny befejezve!'
      default:
        return 'Várakozás...'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Verseny betöltése...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Thin Progress Bar at Top */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-gray-800">{player.playerName}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">{room.title}</span>
            </div>
            <button
              onClick={onExit}
              className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              ✕ Kilépés
            </button>
          </div>
          
          {gameState && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-brand-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${((gameState.currentQuestionIndex + 1) / gameState.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                {gameState.currentQuestionIndex + 1} / {gameState.totalQuestions}
              </div>
              {gameState.gameState === 'question' && (
                <div className="text-xs font-bold text-brand-600 whitespace-nowrap">
                  {gameState.timeRemaining}s
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Full Screen Exercise */}
      <main className="flex-1 overflow-hidden">
        {gameState?.gameState === 'question' && gameState.currentExercise ? (
          <div className="h-full flex flex-col lg:flex-row">
            {/* Left Side - Image with Zoom */}
            <div className="lg:w-1/2 h-1/3 lg:h-full bg-slate-900 relative border-b lg:border-b-0 lg:border-r border-slate-700">
              <div className="absolute top-4 left-4 z-10 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                Eredeti feladat
              </div>
              
              {gameState.currentExercise.imageUrl ? (
                <ImageViewer 
                  src={`/${gameState.currentExercise.imageUrl}`} 
                  alt="Feladat"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  Nincs kép
                </div>
              )}
            </div>
            
            {/* Right Side - Exercise */}
            <div className="lg:w-1/2 h-2/3 lg:h-full bg-slate-50 overflow-y-auto p-4">
              <div className="max-w-none mx-auto">
                {/* Title and Instruction */}
                <div className="space-y-1 mb-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <h1 className="text-sm font-medium text-blue-900 leading-tight">
                      {gameState.currentExercise.data?.title || "Feladat"}
                    </h1>
                  </div>
                  
                  {gameState.currentExercise.data?.instruction && (
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 text-xs uppercase font-medium">Feladat</span>
                      </div>
                      <p className="text-xs font-medium text-green-800 leading-tight">
                        {gameState.currentExercise.data.instruction}
                      </p>
                    </div>
                  )}
                </div>

                {/* Render Exercise Component */}
                {gameState.currentExercise.data?.type === 'QUIZ' && gameState.currentExercise.data?.content && (
                  <QuizExercise
                    content={gameState.currentExercise.data.content}
                    onComplete={handleExerciseComplete}
                    onAnswer={handleQuizAnswer}
                    startTime={exerciseStartTime}
                  />
                )}
                
                {gameState.currentExercise.data?.type === 'CATEGORIZATION' && gameState.currentExercise.data?.content && (
                  <CategorizationExercise
                    content={gameState.currentExercise.data.content}
                    onComplete={handleExerciseComplete}
                    onAnswer={handleCategorizationAnswer}
                    startTime={exerciseStartTime}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">
                {gameState?.gameState === 'not_started' && '⏳'}
                {gameState?.gameState === 'starting' && '🚀'}
                {gameState?.gameState === 'finished' && '🎉'}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{getStateMessage()}</h3>
              
              {gameState?.gameState === 'starting' && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 p-8 rounded-xl text-white shadow-2xl">
                    <h3 className="text-3xl font-bold mb-6 text-center">Üdvözöllek az Okos Gyakorlóban!</h3>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>📋</span> Játékszabályok:
                      </h4>
                      <ul className="space-y-3 text-lg">
                        <li className="flex items-start gap-3">
                          <span className="text-yellow-300 text-xl flex-shrink-0">✓</span>
                          <span>Oldd meg a feladatokat a képek alapján</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-yellow-300 text-xl flex-shrink-0">✓</span>
                          <span>Használd a zoom gombokat (-, +, 1:1) a kép nagyításához</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-yellow-300 text-xl flex-shrink-0">✓</span>
                          <span>Húzd az elemeket a megfelelő kategóriákba</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-yellow-300 text-xl flex-shrink-0">✓</span>
                          <span>Válaszd ki a helyes válaszokat a kérdésekre</span>
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold animate-pulse">A játék hamarosan kezdődik...</p>
                      <p className="text-sm mt-2 opacity-80">Készülj fel!</p>
                    </div>
                  </div>
                </div>
              )}
              
              {gameState?.gameState === 'finished' && gameState.leaderboard && (
                <div className="mt-6 bg-white rounded-xl p-6 max-w-md mx-auto shadow-lg">
                  <h4 className="font-bold text-lg mb-4">Végeredmény</h4>
                  <div className="space-y-2">
                    {gameState.leaderboard.slice(0, 10).map((p, index) => (
                      <div 
                        key={p.playerId} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          p.playerId === player.id ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {p.rank}
                          </div>
                          <span className="font-medium">{p.playerName}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-brand-600">{p.totalScore} pont</div>
                          <div className="text-xs text-gray-500">{p.correctAnswers} helyes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}