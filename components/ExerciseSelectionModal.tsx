import React, { useState, useEffect } from 'react'
import { ExerciseData, ExerciseType } from '../types'

interface ExerciseItem {
  id: string
  fileName: string
  imageUrl: string
  data: ExerciseData
}

interface ExerciseSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onExercisesSelected: (exercises: ExerciseItem[]) => void
  maxSelections?: number
}

export default function ExerciseSelectionModal({ 
  isOpen, 
  onClose, 
  onExercisesSelected,
  maxSelections = 20 
}: ExerciseSelectionModalProps) {
  const [exercises, setExercises] = useState<ExerciseItem[]>([])
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | ExerciseType>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadExercises()
    }
  }, [isOpen])

  const loadExercises = async () => {
    setIsLoading(true)
    try {
      // Load from localStorage (library)
      const libraryData = localStorage.getItem('okosgyakorlo_library')
      let libraryExercises: ExerciseItem[] = []
      
      if (libraryData) {
        const parsed = JSON.parse(libraryData)
        libraryExercises = parsed.map((item: any) => ({
          id: item.id,
          fileName: item.fileName || 'Generated Exercise',
          imageUrl: item.imageUrl,
          data: item.data
        }))
      }

      // Load manual exercises
      const response = await fetch('/manual-exercises.json')
      let manualExercises: ExerciseItem[] = []
      
      if (response.ok) {
        manualExercises = await response.json()
      }

      // Combine and deduplicate
      const allExercises = [...libraryExercises, ...manualExercises]
      const uniqueExercises = allExercises.filter((exercise, index, self) => 
        index === self.findIndex(e => e.id === exercise.id)
      )

      setExercises(uniqueExercises)
    } catch (error) {
      console.error('Error loading exercises:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExerciseToggle = (exerciseId: string) => {
    setSelectedExercises(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else if (newSet.size < maxSelections) {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const filteredExercises = getFilteredExercises()
    const allIds = filteredExercises.slice(0, maxSelections).map(e => e.id)
    setSelectedExercises(new Set(allIds))
  }

  const handleClearAll = () => {
    setSelectedExercises(new Set())
  }

  const handleConfirm = () => {
    const selectedExerciseItems = exercises.filter(e => selectedExercises.has(e.id))
    onExercisesSelected(selectedExerciseItems)
    onClose()
    setSelectedExercises(new Set())
  }

  const getFilteredExercises = () => {
    return exercises.filter(exercise => {
      const matchesFilter = filter === 'ALL' || exercise.data.type === filter
      const matchesSearch = searchTerm === '' || 
        exercise.data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.data.instruction.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }

  const getTypeIcon = (type: ExerciseType) => {
    switch (type) {
      case ExerciseType.QUIZ:
        return '❓'
      case ExerciseType.MATCHING:
        return '🔗'
      case ExerciseType.CATEGORIZATION:
        return '📂'
      default:
        return '📝'
    }
  }

  const getTypeLabel = (type: ExerciseType) => {
    switch (type) {
      case ExerciseType.QUIZ:
        return 'Kvíz'
      case ExerciseType.MATCHING:
        return 'Párosítás'
      case ExerciseType.CATEGORIZATION:
        return 'Kategorizálás'
      default:
        return 'Ismeretlen'
    }
  }

  if (!isOpen) return null

  const filteredExercises = getFilteredExercises()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Feladatok kiválasztása</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Keresés feladatok között..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'ALL' | ExerciseType)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ALL">Minden típus</option>
              <option value={ExerciseType.QUIZ}>Kvíz</option>
              <option value={ExerciseType.MATCHING}>Párosítás</option>
              <option value={ExerciseType.CATEGORIZATION}>Kategorizálás</option>
            </select>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {selectedExercises.size} / {maxSelections} kiválasztva
              </span>
              {filteredExercises.length > 0 && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Mind kiválaszt
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-slate-600 hover:text-slate-700 font-medium"
                  >
                    Törlés
                  </button>
                </>
              )}
            </div>
            <div className="text-sm text-slate-500">
              {filteredExercises.length} feladat található
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-slate-500 mt-2">Feladatok betöltése...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <h3 className="text-lg font-medium text-slate-400 mb-2">Nincsenek feladatok</h3>
              <p className="text-slate-400">Hozz létre feladatokat az Egyesével vagy Tömeges menüben!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedExercises.has(exercise.id)
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleExerciseToggle(exercise.id)}
                >
                  <div className="h-32 bg-slate-100 relative">
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.data.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                      <span>{getTypeIcon(exercise.data.type)}</span>
                      <span>{getTypeLabel(exercise.data.type)}</span>
                    </div>
                    {selectedExercises.has(exercise.id) && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">
                      {exercise.data.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {exercise.data.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {selectedExercises.size > 0 && (
                <span>
                  {selectedExercises.size} feladat kiválasztva a versenyhez
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Mégse
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedExercises.size === 0}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Feladatok hozzáadása ({selectedExercises.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}