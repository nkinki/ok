import React, { useState, useEffect } from 'react'

interface GameResultsProps {
  roomId: string
  roomCode: string
  onClose: () => void
}

interface PlayerResult {
  rank: number
  playerId: string
  playerName: string
  totalScore: number
  correctAnswers: number
  joinedAt: string
}

interface Results {
  roomId: string
  roomCode: string
  roomTitle: string
  grade: number
  status: string
  gameState: string
  exerciseCount: number
  playerCount: number
  completedAt: string | null
  players: PlayerResult[]
}

export default function GameResults({ roomId, roomCode, onClose }: GameResultsProps) {
  const [results, setResults] = useState<Results | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [roomId])

  const loadResults = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/rooms/${roomId}/results`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!results) return

    const headers = ['Helyezés', 'Név', 'Pontszám', 'Helyes válaszok']
    const rows = results.players.map(p => [
      p.rank,
      p.playerName,
      p.totalScore,
      p.correctAnswers
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `eredmenyek_${roomCode}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Eredmények betöltése...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4">
          <div className="text-center">
            <p className="text-red-600">Hiba az eredmények betöltésekor</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg">
              Bezárás
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 overflow-hidden">
      {/* Animated Background - Dark Mode */}
      <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            animation: 'grid-move 15s linear infinite'
          }}></div>
        </div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>

      <div className="bg-white dark:bg-black rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10 dark:border-2 dark:border-emerald-500 dark:shadow-neon-green">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-emerald-500/30 dark:bg-gradient-to-r dark:from-black dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-emerald-400 dark:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                🏆 Verseny Eredmények
              </h2>
              <p className="text-gray-600 dark:text-cyan-400 mt-1">
                {results.roomTitle} • Kód: <span className="font-mono dark:text-emerald-400">{results.roomCode}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-emerald-400 hover:text-gray-600 dark:hover:text-emerald-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-emerald-500/30">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg dark:bg-gray-900 dark:border dark:border-emerald-500/50 dark:shadow-emerald-500/20 dark:animate-pulse">
              <div className="text-3xl font-bold text-purple-600 dark:text-emerald-400">{results.playerCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Játékos</div>
            </div>
            <div className="text-center p-3 rounded-lg dark:bg-gray-900 dark:border dark:border-cyan-500/50 dark:shadow-cyan-500/20 dark:animate-pulse" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-bold text-blue-600 dark:text-cyan-400">{results.exerciseCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Feladat</div>
            </div>
            <div className="text-center p-3 rounded-lg dark:bg-gray-900 dark:border dark:border-purple-500/50 dark:shadow-purple-500/20 dark:animate-pulse" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl font-bold text-green-600 dark:text-purple-400">
                {results.players.length > 0 ? Math.round(results.players.reduce((sum, p) => sum + p.totalScore, 0) / results.players.length) : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Átlag pont</div>
            </div>
            <div className="text-center p-3 rounded-lg dark:bg-gray-900 dark:border dark:border-pink-500/50 dark:shadow-pink-500/20 dark:animate-pulse" style={{ animationDelay: '0.6s' }}>
              <div className="text-3xl font-bold text-orange-600 dark:text-pink-400">
                {results.players.length > 0 ? Math.round(results.players.reduce((sum, p) => sum + p.correctAnswers, 0) / results.players.length) : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Átlag helyes</div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-y-auto p-6 dark:bg-gradient-to-b dark:from-black dark:to-gray-900">
          <div className="space-y-2">
            {results.players.map((player, index) => (
              <div
                key={player.playerId}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  player.rank === 1 ? 'bg-yellow-50 dark:bg-black border-2 border-yellow-400 dark:border-emerald-500 dark:shadow-neon-green dark:animate-glow' :
                  player.rank === 2 ? 'bg-gray-50 dark:bg-black border-2 border-gray-400 dark:border-cyan-500 dark:shadow-neon-cyan' :
                  player.rank === 3 ? 'bg-orange-50 dark:bg-black border-2 border-orange-400 dark:border-purple-500 dark:shadow-neon-purple' :
                  'bg-gray-50 dark:bg-gray-900 dark:border dark:border-gray-700'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    player.rank === 1 ? 'bg-yellow-500 dark:bg-emerald-500 text-white dark:shadow-emerald-500/50' :
                    player.rank === 2 ? 'bg-gray-400 dark:bg-cyan-500 text-white dark:shadow-cyan-500/50' :
                    player.rank === 3 ? 'bg-orange-600 dark:bg-purple-500 text-white dark:shadow-purple-500/50' :
                    'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {player.rank}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-white">{player.playerName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ID: {player.playerId.substring(0, 8)}...</div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600 dark:text-emerald-400">{player.totalScore}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">pont</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 dark:text-cyan-400">{player.correctAnswers}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">helyes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-emerald-500/30 bg-gray-50 dark:bg-black">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {results.completedAt && (
                <span>Befejezve: {new Date(results.completedAt).toLocaleString('hu-HU')}</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-6 py-2 bg-green-600 dark:bg-emerald-600 hover:bg-green-700 dark:hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 dark:border dark:border-emerald-500 dark:shadow-emerald-500/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Exportálás CSV
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 dark:bg-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors dark:border dark:border-gray-600"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8), 0 0 60px rgba(16, 185, 129, 0.4); }
        }
      `}</style>
    </div>
  )
}
