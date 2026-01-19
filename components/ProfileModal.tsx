import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { teacher } = useAuth()
  const [fullName, setFullName] = useState(teacher?.fullName || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // In development, simulate API call
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
      
      if (isDevelopment) {
        // Mock profile update
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (fullName.trim().length < 2) {
          throw new Error('A teljes név legalább 2 karakter hosszú legyen')
        }
        
        // Update localStorage mock data
        const teacherData = localStorage.getItem('teacher_data')
        if (teacherData) {
          const updatedTeacher = { ...JSON.parse(teacherData), fullName: fullName.trim() }
          localStorage.setItem('teacher_data', JSON.stringify(updatedTeacher))
        }
        
        setSuccess(true)
        setTimeout(() => {
          onClose()
          window.location.reload() // Refresh to show updated name
        }, 1000)
      } else {
        // Real API call for production
        const token = localStorage.getItem('auth_token')
        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ fullName: fullName.trim() })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Profil frissítési hiba')
        }

        const data = await response.json()
        localStorage.setItem('teacher_data', JSON.stringify(data.teacher))
        
        setSuccess(true)
        setTimeout(() => {
          onClose()
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ismeretlen hiba')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Profil szerkesztése</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email cím
            </label>
            <input
              type="email"
              value={teacher?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Az email cím nem módosítható (Google fiók)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Felhasználónév
            </label>
            <input
              type="text"
              value={teacher?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              A felhasználónév automatikusan generált
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Teljes név *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Teljes név"
              required
              minLength={2}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              ✅ Profil sikeresen frissítve!
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mentés...' : success ? 'Mentve!' : 'Mentés'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}