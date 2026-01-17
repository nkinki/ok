import React from 'react'
import { GameRoom } from '../types/game'

interface RoomDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  room: GameRoom | null
}

export default function RoomDetailsModal({ isOpen, onClose, room }: RoomDetailsModalProps) {
  if (!isOpen || !room) return null

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: GameRoom['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'finished': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: GameRoom['status']) => {
    switch (status) {
      case 'waiting': return 'Várakozik indításra'
      case 'active': return 'Aktív verseny'
      case 'finished': return 'Befejezett'
      case 'cancelled': return 'Törölve'
      default: return 'Ismeretlen állapot'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Verseny részletei</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{room.title}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(room.status)}`}>
                  {getStatusText(room.status)}
                </span>
              </div>
              
              {room.description && (
                <p className="text-slate-600 mb-4">{room.description}</p>
              )}

              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Verseny kód</p>
                  <p className="text-3xl font-mono font-bold text-slate-800 tracking-wider">{room.roomCode}</p>
                  <p className="text-sm text-slate-500 mt-1">A diákok ezzel a kóddal csatlakozhatnak</p>
                </div>
              </div>
            </div>

            {/* Game Settings */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Játék beállítások</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <span className="text-sm font-medium text-slate-600">Maximális játékosok</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{room.maxPlayers}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="text-sm font-medium text-slate-600">Kérdések száma</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{room.questionsCount}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="text-sm font-medium text-slate-600">Idő kérdésenként</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{room.timePerQuestion}s</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span className="text-sm font-medium text-slate-600">Becsült időtartam</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{Math.ceil((room.questionsCount * room.timePerQuestion) / 60)}p</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Időpontok</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Létrehozva:</span>
                  <span className="font-medium text-slate-800">{formatDate(room.createdAt)}</span>
                </div>
                {room.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Elindítva:</span>
                    <span className="font-medium text-slate-800">{formatDate(room.startedAt)}</span>
                  </div>
                )}
                {room.finishedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Befejezve:</span>
                    <span className="font-medium text-slate-800">{formatDate(room.finishedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Players (placeholder) */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Jelenlegi játékosok</h4>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-slate-500">0 / {room.maxPlayers} játékos csatlakozott</p>
                <p className="text-sm text-slate-400 mt-1">A játékosok listája itt fog megjelenni</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Bezárás
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}