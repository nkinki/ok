import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProfileModal from './ProfileModal'
import GameHistoryModal from './GameHistoryModal'
import CreateRoomModal from './CreateRoomModal'
import RoomActionsDropdown from './RoomActionsDropdown'
import RoomDetailsModal from './RoomDetailsModal'
import FixedRoomsPanel from './FixedRoomsPanel'
import { GameRoom } from '../types/game'

interface TeacherDashboardProps {
  onHostGame?: (room: GameRoom) => void
}

export default function TeacherDashboard({ onHostGame }: TeacherDashboardProps) {
  const { teacher, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null)
  const [isRoomDetailsOpen, setIsRoomDetailsOpen] = useState(false)
  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)

  // Load teacher's rooms
  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setIsLoadingRooms(true)
      const response = await fetch('/api/rooms/list')
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      } else {
        console.warn('Failed to load rooms:', response.status, response.statusText)
        // In development, if API is not available, use empty array
        setRooms([])
      }
    } catch (error) {
      console.error('Error loading rooms:', error)
      // In development, if API is not available, use empty array
      setRooms([])
    } finally {
      setIsLoadingRooms(false)
    }
  }

  const handleRoomCreated = (newRoom: GameRoom) => {
    setRooms(prev => [newRoom, ...prev])
  }

  const handleStartGame = (room: GameRoom) => {
    if (onHostGame) {
      onHostGame(room)
    } else {
      // Fallback for development
      console.log('Starting game for room:', room.roomCode)
      alert(`Verseny indítása: ${room.title}\nKód: ${room.roomCode}\n\nGame Host felület betöltése...`)
    }
  }

  const handleViewDetails = (room: GameRoom) => {
    setSelectedRoom(room)
    setIsRoomDetailsOpen(true)
  }

  const handleEditRoom = (room: GameRoom) => {
    // TODO: Implement room editing
    console.log('Editing room:', room.roomCode)
    alert(`Verseny szerkesztése: ${room.title}\n\nEz a funkció hamarosan elérhető lesz!`)
  }

  const handleDeleteRoom = async (room: GameRoom) => {
    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setRooms(prev => prev.filter(r => r.id !== room.id))
      } else {
        const data = await response.json()
        alert(`Hiba a törlés során: ${data.message}`)
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Hiba történt a verseny törlésekor')
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: GameRoom['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'finished': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: GameRoom['status']) => {
    switch (status) {
      case 'waiting': return 'Várakozik'
      case 'active': return 'Aktív'
      case 'finished': return 'Befejezett'
      case 'cancelled': return 'Törölve'
      default: return 'Ismeretlen'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 text-purple-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm font-bold text-lg border border-purple-200">
              OK
            </div>
            <div>
              <h1 className="font-bold text-slate-800">Okos Gyakorló</h1>
              <p className="text-sm text-slate-600">Tanári felület</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-slate-800">{teacher?.fullName}</p>
              <p className="text-sm text-slate-600">@{teacher?.username}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="?mode=player"
                className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                title="Diák belépés"
              >
                👨‍🎓 Diák belépés
              </a>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                title="Profil szerkesztése"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </button>
              <button
                onClick={logout}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Kijelentkezés
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Üdvözöljük, {teacher?.fullName}!
          </h2>
          <p className="text-slate-600">
            Itt kezelheti a versenyeket és követheti nyomon a diákok teljesítményét.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </div>
              <h3 className="font-bold text-slate-800">Új verseny</h3>
            </div>
            <p className="text-slate-600 mb-4">Hozzon létre egy új Kahoot-szerű versenyt a diákoknak.</p>
            <button 
              onClick={() => setIsCreateRoomOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Verseny létrehozása
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <h3 className="font-bold text-slate-800">Feladat könyvtár</h3>
            </div>
            <p className="text-slate-600 mb-4">Böngésszen a meglévő feladatok között és válasszon versenyhez.</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
              Könyvtár megnyitása
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="font-bold text-slate-800">Statisztikák</h3>
            </div>
            <p className="text-slate-600 mb-4">Tekintse meg a korábbi versenyek eredményeit és elemzéseket.</p>
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Statisztikák megtekintése
            </button>
          </div>
        </div>

        {/* Fixed Rooms Panel */}
        <div className="mb-8">
          <FixedRoomsPanel onStartGame={handleStartGame} />
        </div>

        {/* Recent Games */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Versenyeim</h3>
            <button
              onClick={loadRooms}
              className="text-slate-500 hover:text-slate-700 transition-colors"
              disabled={isLoadingRooms}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
          
          {isLoadingRooms ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-slate-500 mt-2">Versenyek betöltése...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              <h4 className="text-lg font-medium text-slate-400 mb-2">Még nincsenek versenyek</h4>
              <p className="text-slate-400">Hozza létre az első versenyét a fenti gombbal!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div key={room.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-800">{room.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                          {getStatusText(room.status)}
                        </span>
                      </div>
                      
                      {room.description && (
                        <p className="text-slate-600 text-sm mb-2">{room.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Kód: <span className="font-mono font-bold text-slate-700">{room.roomCode}</span></span>
                        <span>Max: {room.maxPlayers} játékos</span>
                        <span>{room.questionsCount} kérdés</span>
                        <span>{room.timePerQuestion}s/kérdés</span>
                      </div>
                      
                      <div className="text-xs text-slate-400 mt-2">
                        Létrehozva: {formatDate(room.createdAt)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {room.status === 'waiting' && (
                        <button 
                          onClick={() => handleStartGame(room)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Indítás
                        </button>
                      )}
                      <RoomActionsDropdown
                        room={room}
                        onStartGame={handleStartGame}
                        onViewDetails={handleViewDetails}
                        onEditRoom={handleEditRoom}
                        onDeleteRoom={handleDeleteRoom}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <GameHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <CreateRoomModal 
        isOpen={isCreateRoomOpen} 
        onClose={() => setIsCreateRoomOpen(false)}
        onRoomCreated={handleRoomCreated}
      />
      <RoomDetailsModal
        isOpen={isRoomDetailsOpen}
        onClose={() => setIsRoomDetailsOpen(false)}
        room={selectedRoom}
      />
    </div>
  )
}