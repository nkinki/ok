import React, { useState } from 'react'
import { BulkResultItem } from './BulkProcessor'

interface Props {
  library: BulkResultItem[]
  onExit: () => void
  onLibraryUpdate?: () => void
}

interface Session {
  code: string
  exercises: BulkResultItem[]
  createdAt: Date
  isActive: boolean
}

export default function TeacherSessionManager({ library, onExit, onLibraryUpdate }: Props) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  const getSessionResults = (sessionCode: string) => {
    try {
      const summaryKey = `session_${sessionCode}_summary`;
      const resultsKey = `session_${sessionCode}_results`;
      
      const summaryData = localStorage.getItem(summaryKey);
      const resultsData = localStorage.getItem(resultsKey);
      
      const summaries = summaryData ? JSON.parse(summaryData) : [];
      const results = resultsData ? JSON.parse(resultsData) : [];
      
      return { summaries, results };
    } catch (error) {
      console.error('Error loading session results:', error);
      return { summaries: [], results: [] };
    }
  }

  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleStartSession = async () => {
    if (selectedExercises.length === 0) {
      setError('Válassz ki legalább egy feladatot!')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const sessionCode = generateSessionCode()
      const selectedExerciseData = library.filter(item => selectedExercises.includes(item.id))

      // Create session via API for network sharing (primary method)
      const response = await fetch('/api/simple-api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: sessionCode,
          exercises: selectedExerciseData
        })
      })

      if (!response.ok) {
        throw new Error('Nem sikerült létrehozni a hálózati munkamenetet')
      }

      const apiResult = await response.json()
      console.log('Session created via API for network sharing:', apiResult)

      // Create local session object
      const session: Session = {
        code: sessionCode,
        exercises: selectedExerciseData,
        createdAt: new Date(),
        isActive: true
      }

      setActiveSession(session)
      
      // Also store in localStorage as backup for same-browser access
      try {
        const sessionData = {
          code: sessionCode,
          exercises: selectedExerciseData,
          createdAt: new Date().toISOString(),
          isActive: true
        }
        localStorage.setItem(`session_${sessionCode}`, JSON.stringify(sessionData))
      } catch (storageError) {
        console.warn('Could not save session to localStorage:', storageError)
        // This is not critical since API session is created
      }

    } catch (error) {
      console.error('Session creation error:', error)
      setError(error instanceof Error ? error.message : 'Ismeretlen hiba a munkamenet létrehozásakor')
    } finally {
      setLoading(false)
    }
  }

  const handleStopSession = async () => {
    if (!activeSession) return

    try {
      // Stop session via API for network sharing
      try {
        const response = await fetch(`/api/simple-api/sessions/${activeSession.code}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          console.log('Session stopped via API')
        }
      } catch (apiError) {
        console.warn('API session stop failed:', apiError)
      }

      // Remove session from localStorage
      localStorage.removeItem(`session_${activeSession.code}`)
      setActiveSession(null)
      setSelectedExercises([])
    } catch (error) {
      console.error('Error stopping session:', error)
      // Still stop the session even if API fails
      setActiveSession(null)
      setSelectedExercises([])
    }
  }

  if (activeSession) {
    const { summaries, results } = getSessionResults(activeSession.code);
    
    if (showResults) {
      return (
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Munkamenet eredmények</h2>
                <p className="text-slate-600">Kód: {activeSession.code}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResults(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Vissza a munkamenethez
                </button>
                <button
                  onClick={handleStopSession}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Munkamenet leállítása
                </button>
              </div>
            </div>

            {/* Student Summaries */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Résztvevő diákok ({summaries.length})</h3>
              {summaries.length === 0 ? (
                <p className="text-slate-500 italic">Még nincs befejezett munkamenet.</p>
              ) : (
                <div className="grid gap-4">
                  {summaries.map((summary: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800">{summary.studentName}</h4>
                          <p className="text-sm text-slate-600">{summary.studentClass}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {summary.completedExercises}/{summary.totalExercises}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(summary.completedAt).toLocaleString('hu-HU')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Results */}
            {results.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Részletes eredmények ({results.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="text-left p-3 font-medium">Diák</th>
                        <th className="text-left p-3 font-medium">Osztály</th>
                        <th className="text-left p-3 font-medium">Feladat</th>
                        <th className="text-left p-3 font-medium">Típus</th>
                        <th className="text-center p-3 font-medium">Eredmény</th>
                        <th className="text-center p-3 font-medium">Idő</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-3">{result.studentName}</td>
                          <td className="p-3">{result.studentClass}</td>
                          <td className="p-3 max-w-xs truncate" title={result.exerciseTitle}>
                            {result.exerciseTitle}
                          </td>
                          <td className="p-3">{result.exerciseType}</td>
                          <td className="p-3 text-center">
                            {result.isCorrect ? (
                              <span className="text-green-600 font-bold">✓</span>
                            ) : (
                              <span className="text-red-600 font-bold">✗</span>
                            )}
                          </td>
                          <td className="p-3 text-center">{result.timeSpent}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            ✓
          </div>
          <h2 className="text-3xl font-bold text-green-800 mb-4">Munkamenet aktív!</h2>
          <div className="bg-white rounded-xl p-6 mb-6 border border-green-200">
            <p className="text-sm text-green-600 font-medium mb-2">Tanári kód:</p>
            <div className="text-6xl font-mono font-bold text-green-800 tracking-wider">
              {activeSession.code}
            </div>
          </div>
          <p className="text-green-700 mb-6">
            A diákok ezzel a kóddal csatlakozhatnak a feladatokhoz.
            <br />
            Összesen {activeSession.exercises.length} feladat van kiválasztva.
            <br />
            {summaries.length > 0 && (
              <span className="font-bold">
                {summaries.length} diák fejezte be a munkamenetet.
              </span>
            )}
          </p>
          <div className="flex gap-4 justify-center">
            {summaries.length > 0 && (
              <button
                onClick={() => setShowResults(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Eredmények megtekintése ({summaries.length})
              </button>
            )}
            <button
              onClick={handleStopSession}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Munkamenet leállítása
            </button>
            <button
              onClick={onExit}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Vissza a főoldalra
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Tanári munkamenet</h2>
          <p className="text-slate-600">Válassz ki feladatokat a könyvtárból és indíts munkamenetet a diákoknak</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg font-medium"
          >
            Vissza
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {library.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <h3 className="text-xl font-medium text-slate-400">Nincs feladat a könyvtárban</h3>
          <p className="text-slate-400 mt-2">Menj a "Tömeges" feldolgozóba és hozz létre feladatokat!</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Kiválasztott feladatok ({selectedExercises.length}/{library.length})
              </h3>
              <button
                onClick={handleStartSession}
                disabled={selectedExercises.length === 0 || loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Indítás...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 016 0v2M5 12a7 7 0 1114 0v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5z"/>
                    </svg>
                    Munkamenet indítása
                  </>
                )}
              </button>
            </div>
            {selectedExercises.length > 0 && (
              <p className="text-sm text-slate-600">
                Kattints a "Munkamenet indítása" gombra, hogy kódot generálj a diákoknak.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {library.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden cursor-pointer transition-all ${
                  selectedExercises.includes(item.id) 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => toggleExerciseSelection(item.id)}
              >
                <div className="h-48 bg-slate-100 relative">
                  <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.data.title} />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    {item.data.type}
                  </div>
                  {selectedExercises.includes(item.id) && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <div className="bg-green-500 text-white rounded-full p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 truncate mb-2">{item.data.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{item.data.instruction}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}