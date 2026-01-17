import React, { useState, useEffect } from 'react'
import { GameRoom, GamePlayer } from '../types/game'

interface PlayerWaitingRoomProps {
  player: GamePlayer
  room: GameRoom
  onGameStart: () => void
  onLeaveRoom: () => void
}

export default function PlayerWaitingRoom({ player, room, onGameStart, onLeaveRoom }: PlayerWaitingRoomProps) {
  const [players, setPlayers] = useState<GamePlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [gameStatus, setGameStatus] = useState<string>('waiting')

  // Load players in room
  useEffect(() => {
    loadPlayers()
    // TODO: Set up WebSocket connection for real-time updates
  }, [room.id])

  // Poll for game status changes
  useEffect(() => {
    const checkGameStatus = async () => {
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
          console.log('Game status:', data)
          
          // Check if game has started
          if (data.gameState && data.gameState !== 'not_started' && data.gameState !== 'waiting') {
            console.log('Game started! Transitioning to game view...')
            onGameStart()
          }
          
          setGameStatus(data.gameState || 'waiting')
        }
      } catch (error) {
        console.error('Error checking game status:', error)
      }
    }

    // Check immediately
    checkGameStatus()
    
    // Then poll every 2 seconds
    const interval = setInterval(checkGameStatus, 2000)
    
    return () => clearInterval(interval)
  }, [room.id, onGameStart])

  const loadPlayers = async () => {
    try {
      // If room code is 6 characters, use simple-server
      let response
      if (room.roomCode && room.roomCode.length === 6) {
        try {
          response = await fetch(`http://localhost:3002/api/rooms/${room.roomCode}/players`)
        } catch (err) {
          // Fallback to main server
          response = await fetch(`/api/rooms/${room.id}/players`)
        }
      } else {
        response = await fetch(`/api/rooms/${room.id}/players`)
      }
      
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players || [])
      }
    } catch (error) {
      console.error('Error loading players:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveRoom = () => {
    const confirmed = window.confirm('Biztosan ki szeretnél lépni a versenyből?')
    if (confirmed) {
      onLeaveRoom()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-green-100 text-green-900 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl shadow-sm font-bold text-lg sm:text-2xl border border-green-200 mx-auto mb-3 sm:mb-4">
            ✓
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-800 mb-2">Sikeresen csatlakoztál!</h1>
          <p className="text-slate-600 text-sm sm:text-base">Várakozás a verseny indítására...</p>
        </div>

        {/* Room Info */}
        <div className="bg-slate-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="text-center mb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-2">{room.title}</h2>
            {room.description && (
              <p className="text-slate-600 mb-4 text-sm sm:text-base">{room.description}</p>
            )}
            <div className="bg-white rounded-lg p-3 sm:p-4 inline-block">
              <p className="text-xs sm:text-sm text-slate-600 mb-1">Verseny kód</p>
              <p className="text-xl sm:text-3xl font-mono font-bold text-slate-800 tracking-wider">{room.roomCode}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{room.questionsCount}</p>
              <p className="text-xs sm:text-sm text-slate-600">kérdés</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{room.timePerQuestion}s</p>
              <p className="text-xs sm:text-sm text-slate-600">kérdésenként</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{Math.ceil((room.questionsCount * room.timePerQuestion) / 60)}p</p>
              <p className="text-xs sm:text-sm text-slate-600">becsült idő</p>
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 text-white w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full font-bold text-sm sm:text-base">
              {player.playerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm sm:text-base">{player.playerName}</p>
              <p className="text-xs sm:text-sm text-slate-600">Te vagy</p>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Játékosok ({players.length}/{room.maxPlayers})</h3>
            <button
              onClick={loadPlayers}
              className="text-slate-500 hover:text-slate-700 transition-colors p-1 touch-manipulation"
              disabled={isLoading}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-slate-500 mt-2 text-sm sm:text-base">Játékosok betöltése...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
              {players.map((p, index) => (
                <div 
                  key={p.id} 
                  className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${
                    p.id === player.id ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
                  }`}
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm ${
                    p.id === player.id ? 'bg-green-600 text-white' : 'bg-slate-400 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{p.playerName}</p>
                    {p.id === player.id && (
                      <p className="text-xs text-green-600">Te vagy</p>
                    )}
                  </div>
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                    p.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} title={p.isConnected ? 'Online' : 'Offline'}></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting Message */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="animate-pulse">
            <div className="flex justify-center items-center gap-1 sm:gap-2 mb-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-slate-600 text-sm sm:text-base">
              {gameStatus === 'starting' ? 'A verseny indul...' : 'Várakozás a tanárra, hogy elindítsa a versenyt...'}
            </p>
            {gameStatus !== 'waiting' && gameStatus !== 'not_started' && (
              <p className="text-green-600 text-xs sm:text-sm mt-1">
                Állapot: {gameStatus}
              </p>
            )}
          </div>
        </div>

        {/* Leave Button */}
        <div className="text-center">
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 sm:px-6 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation text-sm sm:text-base"
          >
            Kilépés a versenyből
          </button>
        </div>
      </div>
    </div>
  )
}