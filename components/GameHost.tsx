import React, { useState, useEffect } from 'react'
import { GameRoom, GamePlayer } from '../types/game'

interface GameState {
  roomId: string
  gameState: string
  isActive: boolean
  currentQuestionIndex: number
  totalQuestions: number
  timeRemaining: number
  playerCount: number
}

interface GameHostProps {
  room: GameRoom
  onExit: () => void
}

export default function GameHost({ room, onExit }: GameHostProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<GamePlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGameStatus()
    loadPlayers()
    
    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      loadGameStatus()
      loadPlayers()
    }, 2000)

    return () => clearInterval(interval)
  }, [room.id])

  const loadGameStatus = async () => {
    try {
      const response = await fetch(`/api/rooms/${room.id}/status`)
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

  const loadPlayers = async () => {
    try {
      const response = await fetch(`/api/rooms/${room.id}/players`)
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players || [])
      }
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const handleStartGame = async () => {
    try {
      setError('')
      const response = await fetch(`/api/rooms/${room.id}/start`, {
        method: 'POST'
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(data.message || 'Hiba történt a verseny indításakor')
        return
      }

      // Game started successfully, status will be updated by polling
    } catch (err) {
      setError('Hiba történt a verseny indításakor')
    }
  }

  const getStateText = (state: string) => {
    switch (state) {
      case 'waiting': return 'Várakozás'
      case 'starting': return 'Indítás...'
      case 'question': return 'Kérdés'
      case 'answer_reveal': return 'Válasz felfedése'
      case 'leaderboard': return 'Eredménytábla'
      case 'finished': return 'Befejezve'
      default: return 'Ismeretlen'
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'starting': return 'bg-blue-100 text-blue-800'
      case 'question': return 'bg-green-100 text-green-800'
      case 'answer_reveal': return 'bg-purple-100 text-purple-800'
      case 'leaderboard': return 'bg-orange-100 text-orange-800'
      case 'finished': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Verseny betöltése...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 text-purple-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm font-bold text-lg border border-purple-200">
              🎮
            </div>
            <div>
              <h1 className="font-bold text-slate-800">{room.title}</h1>
              <p className="text-sm text-slate-600">Tanári vezérlő</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {gameState && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStateColor(gameState.gameState)}`}>
                {getStateText(gameState.gameState)}
              </div>
            )}
            <button
              onClick={onExit}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Kilépés
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Control */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Verseny vezérlés</h2>
              
              {gameState ? (
                <div className="space-y-4">
                  {/* Game Status */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800">{gameState.currentQuestionIndex + 1}</div>
                      <div className="text-sm text-slate-600">Jelenlegi kérdés</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800">{gameState.totalQuestions}</div>
                      <div className="text-sm text-slate-600">Összes kérdés</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800">{gameState.timeRemaining}</div>
                      <div className="text-sm text-slate-600">Másodperc</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-800">{gameState.playerCount}</div>
                      <div className="text-sm text-slate-600">Játékos</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {gameState.totalQuestions > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${((gameState.currentQuestionIndex) / gameState.totalQuestions) * 100}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Timer Bar */}
                  {gameState.gameState === 'question' && gameState.timeRemaining > 0 && (
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(gameState.timeRemaining / room.timePerQuestion) * 100}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Start Game Button */}
                  {!gameState.isActive && gameState.gameState === 'not_started' && (
                    <div className="text-center py-8">
                      <button
                        onClick={handleStartGame}
                        disabled={players.length === 0}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors disabled:cursor-not-allowed"
                      >
                        🚀 Verseny indítása
                      </button>
                      {players.length === 0 && (
                        <p className="text-slate-500 text-sm mt-2">Várj, amíg legalább egy játékos csatlakozik</p>
                      )}
                    </div>
                  )}

                  {/* Game Status Messages */}
                  {gameState.isActive && (
                    <div className="text-center py-4">
                      <div className="text-lg font-medium text-slate-800">
                        {gameState.gameState === 'starting' && '🎯 A verseny hamarosan kezdődik...'}
                        {gameState.gameState === 'question' && `❓ Kérdés ${gameState.currentQuestionIndex + 1}/${gameState.totalQuestions}`}
                        {gameState.gameState === 'answer_reveal' && '💡 Válasz felfedése...'}
                        {gameState.gameState === 'leaderboard' && '🏆 Eredménytábla'}
                        {gameState.gameState === 'finished' && '🎉 Verseny befejezve!'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">Verseny állapot betöltése...</p>
                </div>
              )}
            </div>
          </div>

          {/* Players List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">
              Játékosok ({players.length}/{room.maxPlayers})
            </h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <p className="text-slate-400 text-sm">Nincsenek játékosok</p>
                </div>
              ) : (
                players
                  .sort((a, b) => b.totalScore - a.totalScore)
                  .map((player, index) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{player.playerName}</p>
                        <p className="text-xs text-slate-500">
                          {player.totalScore} pont • {player.correctAnswers} helyes
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        player.isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} title={player.isConnected ? 'Online' : 'Offline'}></div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}