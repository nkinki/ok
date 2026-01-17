import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface GameSession {
  id: string
  title: string
  createdAt: Date
  playerCount: number
  questionsCount: number
  avgScore: number
  duration: number // in minutes
  status: 'completed' | 'abandoned'
}

interface GameHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GameHistoryModal({ isOpen, onClose }: GameHistoryModalProps) {
  const { teacher } = useAuth()
  const [games, setGames] = useState<GameSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadGameHistory()
    }
  }, [isOpen])

  const loadGameHistory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In development, use mock data
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
      
      if (isDevelopment) {
        // Mock game history data
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockGames: GameSession[] = [
          {
            id: 'game_001',
            title: 'Matematika Verseny - 5. osztály',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            playerCount: 24,
            questionsCount: 10,
            avgScore: 78.5,
            duration: 15,
            status: 'completed'
          },
          {
            id: 'game_002',
            title: 'Magyar Irodalom Kvíz',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            playerCount: 18,
            questionsCount: 8,
            avgScore: 65.2,
            duration: 12,
            status: 'completed'
          },
          {
            id: 'game_003',
            title: 'Természetismeret Teszt',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            playerCount: 3,
            questionsCount: 15,
            avgScore: 0,
            duration: 2,
            status: 'abandoned'
          }
        ]
        
        setGames(mockGames)
      } else {
        // Real API call for production
        const token = localStorage.getItem('auth_token')
        const response = await fetch('/api/games/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Játék történet betöltési hiba')
        }

        const data = await response.json()
        setGames(data.games || [])
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ismeretlen hiba')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusBadge = (status: GameSession['status']) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Befejezett
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Megszakított
        </span>
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Játék történet</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-slate-600">Betöltés...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              <h3 className="text-lg font-medium text-slate-400 mb-2">Még nincsenek játékok</h3>
              <p className="text-slate-400">Hozza létre az első versenyét!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <div key={game.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">{game.title}</h3>
                      <p className="text-sm text-slate-600">{formatDate(game.createdAt)}</p>
                    </div>
                    {getStatusBadge(game.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Játékosok:</span>
                      <div className="font-medium text-slate-800">{game.playerCount}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Kérdések:</span>
                      <div className="font-medium text-slate-800">{game.questionsCount}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Átlag pontszám:</span>
                      <div className="font-medium text-slate-800">
                        {game.status === 'completed' ? `${game.avgScore.toFixed(1)}%` : '-'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Időtartam:</span>
                      <div className="font-medium text-slate-800">{game.duration} perc</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}