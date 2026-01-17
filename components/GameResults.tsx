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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Verseny Eredmények</h2>
              <p className="text-gray-600 mt-1">
                {results.roomTitle} • Kód: {results.roomCode}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{results.playerCount}</div>
              <div className="text-sm text-gray-600">Játékos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{results.exerciseCount}</div>
              <div className="text-sm text-gray-600">Feladat</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {results.players.length > 0 ? Math.round(results.players.reduce((sum, p) => sum + p.totalScore, 0) / results.players.length) : 0}
              </div>
              <div className="text-sm text-gray-600">Átlag pont</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {results.players.length > 0 ? Math.round(results.players.reduce((sum, p) => sum + p.correctAnswers, 0) / results.players.length) : 0}
              </div>
              <div className="text-sm text-gray-600">Átlag helyes</div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {results.players.map((player) => (
              <div
                key={player.playerId}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  player.rank === 1 ? 'bg-yellow-50 border-2 border-yellow-400' :
                  player.rank === 2 ? 'bg-gray-50 border-2 border-gray-400' :
                  player.rank === 3 ? 'bg-orange-50 border-2 border-orange-400' :
                  'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    player.rank === 1 ? 'bg-yellow-500 text-white' :
                    player.rank === 2 ? 'bg-gray-400 text-white' :
                    player.rank === 3 ? 'bg-orange-600 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {player.rank}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{player.playerName}</div>
                    <div className="text-sm text-gray-500">ID: {player.playerId.substring(0, 8)}...</div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{player.totalScore}</div>
                    <div className="text-xs text-gray-500">pont</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{player.correctAnswers}</div>
                    <div className="text-xs text-gray-500">helyes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {results.completedAt && (
                <span>Befejezve: {new Date(results.completedAt).toLocaleString('hu-HU')}</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Exportálás CSV
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
