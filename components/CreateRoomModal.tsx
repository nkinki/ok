import React, { useState } from 'react'
import { GameRoom } from '../types/game'
import { ExerciseType } from '../types'
import ExerciseSelectionModal from './ExerciseSelectionModal'

interface SelectedExercise {
  id: string
  title: string
  type: ExerciseType
  questionCount: number
  imageUrl: string
}

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onRoomCreated: (room: GameRoom) => void
}

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxPlayers: 30,
    questionsCount: 10,
    timePerQuestion: 30
  })
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [isExerciseSelectionOpen, setIsExerciseSelectionOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate exercises are selected
      if (selectedExercises.length === 0) {
        setError('Válassz ki legalább egy feladatot a versenyhez!')
        setIsLoading(false)
        return
      }

      const totalQuestions = selectedExercises.reduce((sum, ex) => sum + ex.questionCount, 0)
      if (totalQuestions === 0) {
        setError('A kiválasztott feladatok nem tartalmaznak kérdéseket!')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          questionsCount: totalQuestions,
          selectedExercises: selectedExercises
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Hiba történt a verseny létrehozásakor')
      }

      onRoomCreated(data.room)
      onClose()
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        maxPlayers: 30,
        questionsCount: 10,
        timePerQuestion: 30
      })
      setSelectedExercises([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleExerciseSelection = (exercises: any[]) => {
    const selectedExerciseData: SelectedExercise[] = exercises.map(exercise => ({
      id: exercise.id,
      title: exercise.data.title,
      type: exercise.data.type,
      questionCount: getQuestionCount(exercise.data),
      imageUrl: exercise.imageUrl
    }))
    
    setSelectedExercises(selectedExerciseData)
    const totalQuestions = selectedExerciseData.reduce((sum, ex) => sum + ex.questionCount, 0)
    setFormData(prev => ({
      ...prev,
      questionsCount: totalQuestions
    }))
  }

  const getQuestionCount = (exerciseData: any): number => {
    switch (exerciseData.type) {
      case ExerciseType.QUIZ:
        return exerciseData.content?.questions?.length || 0
      case ExerciseType.MATCHING:
        return exerciseData.content?.pairs?.length || 0
      case ExerciseType.CATEGORIZATION:
        return exerciseData.content?.items?.length || 0
      default:
        return 0
    }
  }

  const getTotalQuestions = () => {
    return selectedExercises.reduce((sum, ex) => sum + ex.questionCount, 0)
  }

  const getTypeIcon = (type: ExerciseType) => {
    switch (type) {
      case ExerciseType.QUIZ: return '❓'
      case ExerciseType.MATCHING: return '🔗'
      case ExerciseType.CATEGORIZATION: return '📂'
      default: return '❓'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Új verseny létrehozása</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Verseny címe *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={100}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="pl. Matematika verseny 7.A"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Leírás (opcionális)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Rövid leírás a versenyről..."
                disabled={isLoading}
              />
            </div>

            {/* Exercise Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Feladatok kiválasztása *
              </label>
              <div className="border border-slate-300 rounded-lg p-4">
                {selectedExercises.length === 0 ? (
                  <div className="text-center py-4">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p className="text-slate-500 text-sm mb-3">Még nincsenek feladatok kiválasztva</p>
                    <button
                      type="button"
                      onClick={() => setIsExerciseSelectionOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      disabled={isLoading}
                    >
                      Feladatok kiválasztása
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">
                        {selectedExercises.length} feladat kiválasztva ({getTotalQuestions()} kérdés)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsExerciseSelectionOpen(true)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        disabled={isLoading}
                      >
                        Módosítás
                      </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedExercises.map((exercise, index) => (
                        <div key={exercise.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                          <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center text-sm">
                            {getTypeIcon(exercise.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{exercise.title}</p>
                            <p className="text-xs text-slate-500">{exercise.questionCount} kérdés</p>
                          </div>
                          <span className="text-xs text-slate-400">#{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxPlayers" className="block text-sm font-medium text-slate-700 mb-2">
                  Max játékosok
                </label>
                <input
                  type="number"
                  id="maxPlayers"
                  name="maxPlayers"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  min={2}
                  max={100}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="questionsCount" className="block text-sm font-medium text-slate-700 mb-2">
                  Kérdések száma
                </label>
                <input
                  type="number"
                  id="questionsCount"
                  name="questionsCount"
                  value={formData.questionsCount}
                  onChange={handleChange}
                  min={1}
                  max={50}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="timePerQuestion" className="block text-sm font-medium text-slate-700 mb-2">
                Idő kérdésenként (másodperc)
              </label>
              <input
                type="number"
                id="timePerQuestion"
                name="timePerQuestion"
                value={formData.timePerQuestion}
                onChange={handleChange}
                min={5}
                max={300}
                step={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isLoading}
              />
              <p className="text-sm text-slate-500 mt-1">
                Ajánlott: 15-60 másodperc
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isLoading}
              >
                Mégse
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Létrehozás...' : 'Verseny létrehozása'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Exercise Selection Modal */}
      <ExerciseSelectionModal
        isOpen={isExerciseSelectionOpen}
        onClose={() => setIsExerciseSelectionOpen(false)}
        onExercisesSelected={handleExerciseSelection}
        maxSelections={20}
      />
    </div>
  )
}