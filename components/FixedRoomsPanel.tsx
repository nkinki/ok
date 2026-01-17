import React, { useState, useEffect } from 'react'
import ExerciseSelectionModal from './ExerciseSelectionModal'
import GameResults from './GameResults'

interface FixedRoom {
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
  customCode?: string
}

interface SelectedExercise {
  id: string
  title: string
  type: string
  questionCount: number
  imageUrl: string
}

interface FixedRoomsPanelProps {
  onStartGame?: (room: FixedRoom) => void
}

export default function FixedRoomsPanel({ onStartGame }: FixedRoomsPanelProps) {
  const [fixedRooms, setFixedRooms] = useState<FixedRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [isExerciseSelectionOpen, setIsExerciseSelectionOpen] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [editingCode, setEditingCode] = useState<number | null>(null)
  const [newCode, setNewCode] = useState('')
  const [showResults, setShowResults] = useState<{ roomId: string, roomCode: string } | null>(null)

  useEffect(() => {
    loadFixedRooms()
    // Refresh every 10 seconds
    const interval = setInterval(loadFixedRooms, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadFixedRooms = async () => {
    try {
      // Use the working simple server for fixed rooms
      const response = await fetch('http://localhost:3002/api/rooms/fixed')
      if (response.ok) {
        const data = await response.json()
        setFixedRooms(data.fixedRooms || [])
      }
    } catch (error) {
      console.error('Error loading fixed rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartExercise = (grade: number) => {
    setSelectedGrade(grade)
    setIsExerciseSelectionOpen(true)
  }

  const handleEditCode = (grade: number, currentCode: string) => {
    setEditingCode(grade)
    setNewCode(currentCode)
  }

  const handleSaveCode = async (grade: number) => {
    if (!newCode || newCode.length !== 6) {
      alert('A kód pontosan 6 karakter hosszú kell legyen!')
      return
    }

    try {
      const response = await fetch(`http://localhost:3002/api/rooms/fixed/${grade}/set-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCode: newCode })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ ${data.message}`)
        loadFixedRooms() // Refresh the list
        setEditingCode(null)
        setNewCode('')
      } else {
        const errorData = await response.json()
        alert(`❌ Hiba: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error updating room code:', error)
      alert('❌ Hiba történt a kód frissítésekor')
    }
  }

  const handleCancelEdit = () => {
    setEditingCode(null)
    setNewCode('')
  }

  const handleExerciseSelection = async (exercises: any[]) => {
    if (!selectedGrade) return

    setIsStarting(true)
    try {
      // Send the full exercise objects as-is, no conversion needed
      const response = await fetch(`http://localhost:3002/api/rooms/fixed/${selectedGrade}/start-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedExercises: exercises.map(ex => ({
            id: ex.id,
            fileName: ex.fileName,
            imageUrl: ex.imageUrl,
            data: ex.data // Send complete data object as-is
          })),
          timePerQuestion: 30
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Feladatok betöltve!\n\n${data.questionsCount} feladat készen áll.\n\nMost nyomd meg a "START" gombot a verseny indításához!`)
        loadFixedRooms() // Refresh the list
      } else {
        const errorData = await response.json()
        alert(`❌ Hiba: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error loading exercises:', error)
      alert('❌ Hiba történt a feladatok betöltésekor')
    } finally {
      setIsStarting(false)
      setSelectedGrade(null)
      setIsExerciseSelectionOpen(false)
    }
  }

  const handleStartGame = async (grade: number) => {
    const roomId = `grade-${grade}-room`
    
    try {
      const startResponse = await fetch(`http://localhost:3002/api/rooms/${roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (startResponse.ok) {
        alert(`✅ Verseny elindítva!\n\nA diákok most játszhatnak!`)
        
        // Find the room and start the game
        const room = fixedRooms.find(r => r.grade === grade)
        if (room && onStartGame) {
          onStartGame(room)
        }
        
        loadFixedRooms() // Refresh the list
      } else {
        const errorData = await startResponse.json()
        alert(`❌ Hiba a verseny indításakor: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error starting game:', error)
      alert('❌ Hiba történt a verseny indításakor')
    }
  }

  const getQuestionCount = (exerciseData: any): number => {
    switch (exerciseData.type) {
      case 'QUIZ':
        return exerciseData.content?.questions?.length || 0
      case 'MATCHING':
        return exerciseData.content?.pairs?.length || 0
      case 'CATEGORIZATION':
        return exerciseData.content?.items?.length || 0
      default:
        return 0
    }
  }

  const getStatusColor = (room: FixedRoom) => {
    if (room.isActive) {
      return 'bg-green-100 text-green-800'
    } else if (room.playerCount > 0) {
      return 'bg-yellow-100 text-yellow-800'
    } else {
      return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusText = (room: FixedRoom) => {
    if (room.isActive) {
      return 'Aktív játék'
    } else if (room.playerCount > 0) {
      return 'Várakozás'
    } else {
      return 'Üres'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Fix osztályszobák</h2>
        <div className="text-sm text-slate-500">
          {fixedRooms.reduce((sum, room) => sum + room.playerCount, 0)} aktív diák
        </div>
      </div>

      <div className="space-y-3">
        {fixedRooms.map(room => (
          <div key={room.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 text-purple-900 w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg border border-purple-200">
                  {room.grade}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{room.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Kód:</span>
                    {editingCode === room.grade ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                          maxLength={6}
                          className="font-mono font-bold text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 text-sm w-20"
                          placeholder="6 karakter"
                        />
                        <button
                          onClick={() => handleSaveCode(room.grade)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {room.roomCode}
                        </span>
                        <button
                          onClick={() => handleEditCode(room.grade, room.roomCode)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Kód szerkesztése"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {room.playerCount}/{room.maxPlayers} diák
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(room)}`}>
                  {getStatusText(room)}
                </div>
                
                <button
                  onClick={() => handleStartExercise(room.grade)}
                  disabled={isStarting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isStarting && selectedGrade === room.grade ? 'Betöltés...' : 'Feladatok kiválasztása'}
                </button>
                
                <button
                  onClick={() => handleStartGame(room.grade)}
                  disabled={room.status === 'active'}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {room.status === 'active' ? 'Játék folyamatban' : 'START'}
                </button>
                
                <button
                  onClick={() => setShowResults({ roomId: room.id, roomCode: room.roomCode })}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  📊 Eredmények
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {fixedRooms.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <p className="text-slate-500">Nincsenek fix szobák</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Hogyan működik?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Minden osztálynak van egy állandó szobája</li>
          <li>• Kattints a ✏️ ikonra a szoba kódjának megváltoztatásához</li>
          <li>• A kód pontosan 6 karakter hosszú kell legyen (betűk és számok)</li>
          <li>• A diákok ezzel a kóddal csatlakozhatnak</li>
          <li>• Válassz feladatokat és indítsd el a gyakorlást</li>
          <li>• A szoba mindig elérhető, nem kell újra létrehozni</li>
        </ul>
      </div>

      {/* Exercise Selection Modal */}
      <ExerciseSelectionModal
        isOpen={isExerciseSelectionOpen}
        onClose={() => {
          setIsExerciseSelectionOpen(false)
          setSelectedGrade(null)
        }}
        onExercisesSelected={handleExerciseSelection}
        maxSelections={10}
      />
      
      {/* Game Results Modal */}
      {showResults && (
        <GameResults
          roomId={showResults.roomId}
          roomCode={showResults.roomCode}
          onClose={() => setShowResults(null)}
        />
      )}
    </div>
  )
}