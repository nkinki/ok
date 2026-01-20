import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Exercise {
  id: string
  title: string
  imageUrl: string
  exerciseData: any
  subject?: string
  difficultyLevel?: number
  createdAt: Date
}

interface CreateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAssignmentCreated: (assignment: any) => void
}

export default function CreateAssignmentModal({ isOpen, onClose, onAssignmentCreated }: CreateAssignmentModalProps) {
  const { teacher } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetClass, setTargetClass] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const classOptions = [
    '1.a', '1.b', '2.a', '2.b', '3.a', '3.b', 
    '4.a', '4.b', '5.a', '5.b', '6.a', '6.b',
    '7.a', '7.b', '8.a', '8.b'
  ]

  // Load teacher's exercises when modal opens
  useEffect(() => {
    if (isOpen && teacher) {
      loadExercises()
    }
  }, [isOpen, teacher])

  // Set default start date to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      setStartDate(today)
    }
  }, [isOpen])

  const loadExercises = async () => {
    setLoadingExercises(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/simple-api/exercises', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Nem sikerült betölteni a feladatokat')
      }

      const data = await response.json()
      setExercises(data.exercises || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ismeretlen hiba')
    } finally {
      setLoadingExercises(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !targetClass || selectedExerciseIds.length === 0) {
      setError('Cím, célcsoport és legalább egy feladat megadása kötelező')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/simple-api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetClass,
          exerciseIds: selectedExerciseIds,
          startDate,
          endDate: endDate || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Nem sikerült létrehozni a feladatsort')
      }

      const data = await response.json()
      onAssignmentCreated(data.assignment)
      handleClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ismeretlen hiba')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setTargetClass('')
    setStartDate('')
    setEndDate('')
    setSelectedExerciseIds([])
    setError(null)
    onClose()
  }

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Új feladatsor létrehozása</h2>
          <button 
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feladatsor címe *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Pl: Matematika - Törtek"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Célcsoport *
                </label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Válassz osztályt...</option>
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leírás
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rövid leírás a feladatsorról..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kezdés dátuma
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Befejezés dátuma (opcionális)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Exercise Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feladatok kiválasztása * ({selectedExerciseIds.length} kiválasztva)
              </label>
              
              {loadingExercises ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Feladatok betöltése...</p>
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <p className="text-slate-400">Még nincsenek feladatok</p>
                  <p className="text-slate-400 text-sm">Hozzon létre feladatokat a főoldalon!</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                  {exercises.map((exercise) => (
                    <div 
                      key={exercise.id} 
                      className={`p-4 border-b border-slate-100 last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedExerciseIds.includes(exercise.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => toggleExerciseSelection(exercise.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedExerciseIds.includes(exercise.id)}
                          onChange={() => toggleExerciseSelection(exercise.id)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{exercise.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            {exercise.subject && <span>{exercise.subject}</span>}
                            {exercise.difficultyLevel && (
                              <span>Nehézség: {exercise.difficultyLevel}/5</span>
                            )}
                            <span>{new Date(exercise.createdAt).toLocaleDateString('hu-HU')}</span>
                          </div>
                        </div>
                        {exercise.imageUrl && (
                          <img 
                            src={exercise.imageUrl} 
                            alt={exercise.title}
                            className="w-12 h-12 object-cover rounded border border-slate-200"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !targetClass || selectedExerciseIds.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Létrehozás...
                  </div>
                ) : (
                  'Feladatsor létrehozása'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}