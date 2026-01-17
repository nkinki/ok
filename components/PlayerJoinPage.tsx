import React, { useState } from 'react'
import { GameRoom, GamePlayer } from '../types/game'

interface PlayerJoinPageProps {
  onJoinSuccess: (player: GamePlayer, room: GameRoom) => void
}

export default function PlayerJoinPage({ onJoinSuccess }: PlayerJoinPageProps) {
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'code' | 'name'>('code')
  const [roomInfo, setRoomInfo] = useState<GameRoom | null>(null)

  const handleRoomCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const code = roomCode.toUpperCase().trim()
      
      // Determine which server to use based on code length
      // 5 characters = old format, use main server
      // 6 characters = new format, use simple-server
      let response
      if (code.length === 6) {
        try {
          response = await fetch(`http://localhost:3002/api/rooms/check/${code}`)
        } catch (err) {
          console.error('Simple-server not available:', err)
          setError('A fix szobák szervere nem elérhető. Kérlek, próbáld újra később.')
          setIsLoading(false)
          return
        }
      } else if (code.length === 5) {
        try {
          response = await fetch(`http://localhost:3001/api/rooms/check/${code}`)
        } catch (err) {
          console.error('Main server not available:', err)
          setError('A szerver nem elérhető. Kérlek, próbáld újra később.')
          setIsLoading(false)
          return
        }
      } else {
        setError('A verseny kód 5 vagy 6 karakter hosszú kell legyen')
        setIsLoading(false)
        return
      }
      
      const data = await response.json()

      if (response.ok) {
        setRoomInfo(data.room)
        setStep('name')
      } else {
        setError(data.message || 'Verseny kód nem található')
      }
    } catch (err) {
      setError('Hiba történt a verseny kód ellenőrzésekor')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayerJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || !roomInfo) return

    setIsLoading(true)
    setError('')

    try {
      // Determine server based on room code length
      let response
      if (roomInfo.roomCode.length === 6) {
        // 6-character code = fixed rooms (simple-server)
        try {
          response = await fetch(`http://localhost:3002/api/rooms/${roomInfo.roomCode}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerName: playerName.trim() }),
          })
        } catch (err) {
          console.error('Simple-server not available:', err)
          setError('A fix szobák szervere nem elérhető')
          setIsLoading(false)
          return
        }
      } else if (roomInfo.roomCode.length === 5) {
        // 5-character code = regular rooms (main server)
        try {
          response = await fetch(`http://localhost:3001/api/rooms/${roomInfo.roomCode}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerName: playerName.trim() }),
          })
        } catch (err) {
          console.error('Main server not available:', err)
          setError('A szerver nem elérhető')
          setIsLoading(false)
          return
        }
      } else {
        setError('Érvénytelen verseny kód formátum')
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (response.ok) {
        onJoinSuccess(data.player, data.room)
      } else {
        setError(data.message || 'Hiba történt a csatlakozáskor')
      }
    } catch (err) {
      setError('Hiba történt a csatlakozáskor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep('code')
    setRoomInfo(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-purple-100 text-purple-900 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl shadow-sm font-bold text-lg sm:text-2xl border border-purple-200 mx-auto mb-3 sm:mb-4">
            OK
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Okos Gyakorló</h1>
          <p className="text-slate-600 text-sm sm:text-base">Csatlakozás versenyhez</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {step === 'code' ? (
          <form onSubmit={handleRoomCodeSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-slate-700 mb-2">
                Verseny kód
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                required
                minLength={5}
                maxLength={6}
                className="w-full px-3 py-3 sm:px-4 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-xl sm:text-2xl font-mono font-bold tracking-widest touch-manipulation"
                placeholder="ABC12"
                disabled={isLoading}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <p className="text-xs sm:text-sm text-slate-500 mt-2 text-center">
                Add meg a tanár által megadott 5-6 karakteres kódot
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base sm:text-lg"
              disabled={isLoading || roomCode.length < 5}
            >
              {isLoading ? 'Ellenőrzés...' : 'Tovább'}
            </button>
          </form>
        ) : (
          <div>
            {/* Room Info */}
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">{roomInfo?.title}</h3>
              {roomInfo?.description && (
                <p className="text-slate-600 text-xs sm:text-sm mb-2">{roomInfo.description}</p>
              )}
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
                <span>Kód: <span className="font-mono font-bold">{roomInfo?.roomCode}</span></span>
                <span>{roomInfo?.questionsCount} kérdés</span>
              </div>
            </div>

            <form onSubmit={handlePlayerJoin} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-slate-700 mb-2">
                  A te neved
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={20}
                  className="w-full px-3 py-3 sm:px-4 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 touch-manipulation text-base"
                  placeholder="pl. Kiss Anna"
                  disabled={isLoading}
                  autoComplete="name"
                />
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  2-20 karakter között, egyedi név a versenyben
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-3 py-3 sm:px-4 sm:py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation text-sm sm:text-base"
                  disabled={isLoading}
                >
                  Vissza
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 px-3 sm:px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
                  disabled={isLoading || playerName.trim().length < 2}
                >
                  {isLoading ? 'Csatlakozás...' : 'Csatlakozás'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs sm:text-sm text-slate-500 mb-2">
            Diák vagy? <a href="?mode=player" className="text-purple-600 hover:text-purple-700 font-medium">Csatlakozás versenyhez</a>
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            Tanár vagy? <a href="/auth" className="text-purple-600 hover:text-purple-700 font-medium">Bejelentkezés</a>
          </p>
        </div>
      </div>
    </div>
  )
}