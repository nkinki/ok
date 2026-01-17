import React, { useState, useRef, useEffect } from 'react'
import { GameRoom } from '../types/game'

interface RoomActionsDropdownProps {
  room: GameRoom
  onStartGame?: (room: GameRoom) => void
  onViewDetails?: (room: GameRoom) => void
  onEditRoom?: (room: GameRoom) => void
  onDeleteRoom?: (room: GameRoom) => void
}

export default function RoomActionsDropdown({ 
  room, 
  onStartGame, 
  onViewDetails, 
  onEditRoom, 
  onDeleteRoom 
}: RoomActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
          {room.status === 'waiting' && onStartGame && (
            <button
              onClick={() => handleAction(() => onStartGame(room))}
              className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Verseny indítása
            </button>
          )}
          
          {onViewDetails && (
            <button
              onClick={() => handleAction(() => onViewDetails(room))}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Részletek megtekintése
            </button>
          )}

          {room.status === 'waiting' && onEditRoom && (
            <button
              onClick={() => handleAction(() => onEditRoom(room))}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Szerkesztés
            </button>
          )}

          <div className="border-t border-slate-200 my-1"></div>

          <button
            onClick={() => {
              const confirmed = window.confirm(`Biztosan törli a "${room.title}" versenyt?`)
              if (confirmed && onDeleteRoom) {
                handleAction(() => onDeleteRoom(room))
              }
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Törlés
          </button>
        </div>
      )}
    </div>
  )
}