import React, { useState, useEffect } from 'react'
import { BulkResultItem } from './BulkProcessor'
import SessionMonitor from './SessionMonitor'
import StudentProgressDashboard from './StudentProgressDashboard'
import SessionManager from './SessionManager'
import { useSubject } from '../contexts/SubjectContext'
import { SessionTransferService } from '../services/sessionTransferService'
import StorageManager from '../utils/storageUtils'
import SafeStorage from '../utils/safeStorage'
import { googleDriveSessionService } from '../services/googleDriveSessionService'

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
  const { currentSubject, subjectDisplayName, subjectTheme, isAuthenticated: isSubjectAuthenticated, login } = useSubject()
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showMonitor, setShowMonitor] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<number>(1) // NEW: Slot választó

  const [className, setClassName] = useState<string>('')

  // Class options same as student form
  const classOptions = [
    '1.a', '1.b', '2.a', '2.b', '3.a', '3.b', 
    '4.a', '4.b', '5.a', '5.b', '6.a', '6.b',
    '7.a', '7.b', '8.a', '8.b'
  ]

  // Debug: Monitor activeSession changes
  useEffect(() => {
    console.log('🔍 ActiveSession changed:', activeSession)
  }, [activeSession])

  // Debug: Monitor loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed:', loading)
  }, [loading])

  // Debug: Monitor error state changes
  useEffect(() => {
    console.log('❌ Error state changed:', error)
  }, [error])

  // Show subject login if not authenticated
  if (!isSubjectAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-purple-100 text-purple-900 w-16 h-16 flex items-center justify-center rounded-2xl shadow-lg font-bold text-2xl mx-auto mb-4 border border-purple-200">
              🎯
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tantárgyi Bejelentkezés</h2>
            <p className="text-slate-600">Válaszd ki a tantárgyad a munkamenet kezeléshez</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="space-y-3">
              {[
                { subject: 'info', name: 'Informatika', password: 'infoxxx', color: 'blue' },
                { subject: 'matek', name: 'Matematika', password: 'matekxxx', color: 'green' },
                { subject: 'magy', name: 'Magyar nyelv', password: 'magyxxx', color: 'red' },
                { subject: 'tori', name: 'Történelem', password: 'torixxx', color: 'purple' },
                { subject: 'termeszet', name: 'Természetismeret', password: 'termxxx', color: 'orange' }
              ].map((subj) => (
                <button
                  key={subj.subject}
                  onClick={async () => {
                    // Use the SubjectContext login function
                    try {
                      const success = await login(subj.password);
                      if (!success) {
                        alert(`Bejelentkezési hiba: ${subj.name}`);
                      }
                      // If successful, the component will re-render automatically
                    } catch (error) {
                      console.error('Subject login error:', error);
                      alert('Hálózati hiba történt. Próbáld újra!');
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 hover:shadow-md transition-all text-left bg-${subj.color}-50 border-${subj.color}-200 hover:border-${subj.color}-300`}
                >
                  <div className="font-bold text-slate-800">{subj.name}</div>
                  <div className="text-sm text-slate-600">Kattints a bejelentkezéshez</div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={onExit}
                className="w-full px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                ← Vissza a főoldalra
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // Export selected exercises as JSON for offline use
  const exportSelectedAsJson = () => {
    if (selectedExercises.length === 0) {
      alert('Válassz ki legalább egy feladatot az exportáláshoz!')
      return
    }

    const selectedExerciseData = library.filter(item => selectedExercises.includes(item.id))
    const sessionCode = generateSessionCode()
    
    // Use the same format as AdvancedLibraryManager
    const exportData = {
      sessionCode: sessionCode,
      subject: currentSubject || 'general',
      createdAt: new Date().toISOString(),
      exercises: selectedExerciseData,
      metadata: {
        version: '1.0.0',
        exportedBy: 'Okos Gyakorló Tanári Felület',
        totalExercises: selectedExerciseData.length,
        estimatedTime: selectedExerciseData.length * 3
      }
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `munkamenet_${sessionCode}_${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('📁 JSON munkamenet exportálva:', sessionCode, selectedExerciseData.length, 'feladat')
  }

  const handleStartSession = async () => {
    if (selectedExercises.length === 0) {
      setError('Válassz ki legalább egy feladatot!')
      return
    }

    if (!className || !className.trim()) {
      setError('Az osztály kiválasztása kötelező!')
      return
    }

    setLoading(true)
    setError(null)

    const sessionCode = generateSessionCode()
    const selectedExerciseData = library.filter(item => selectedExercises.includes(item.id))

    try {
      console.log('🎰 SLOT SYSTEM - Automatikus feltöltés Google Drive-ra');
      console.log('📊 Session data:', { 
        code: sessionCode, 
        slotNumber: selectedSlot,
        exerciseCount: selectedExerciseData.length,
        subject: currentSubject || 'general',
        className: className
      });

      // Create session JSON with BASE64 images
      const fullSessionData = {
        code: sessionCode,
        sessionCode: sessionCode,
        slotNumber: selectedSlot,
        subject: currentSubject || 'general',
        className: className.trim(),
        createdAt: new Date().toISOString(),
        exercises: selectedExerciseData.map(item => ({
          id: item.id,
          fileName: item.fileName,
          imageUrl: item.imageUrl || '',
          title: item.data.title,
          instruction: item.data.instruction,
          type: item.data.type,
          content: item.data.content
        })),
        metadata: {
          version: '2.0.0',
          exportedBy: 'Okos Gyakorló - Slot System',
          totalExercises: selectedExerciseData.length,
          estimatedTime: selectedExerciseData.length * 3,
          slotNumber: selectedSlot
        }
      };

      console.log('✅ Session JSON létrehozva BASE64 képekkel');

      // Create session object for UI
      const session: Session = {
        code: sessionCode,
        exercises: selectedExerciseData,
        createdAt: new Date(),
        isActive: true
      }

      setActiveSession(session);
      console.log('🎯 Munkamenet aktív:', sessionCode);

      // Download JSON for manual Drive upload
      const dataStr = JSON.stringify(fullSessionData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `slot${selectedSlot}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('📁 JSON letöltve - Töltsd fel manuálisan Drive-ra!');

    } catch (error) {
      console.error('❌ Session creation error:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      setError(`Hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`)
    } finally {
      console.log('🔄 Session creation finally block - setting loading to false')
      setLoading(false)
    }
  }

  // Show session monitor if active session exists
  if (activeSession && showMonitor) {
    return (
      <SessionMonitor 
        sessionCode={activeSession.code}
        onClose={() => setShowMonitor(false)}
      />
    )
  }



  // Show session history
  if (showHistory) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Munkamenet előzmények</h2>
            <p className="text-slate-600">
              {currentSubject ? `${subjectDisplayName} tantárgy munkamenetei` : 'Korábbi munkamenetek és eredmények kezelése'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(false)}
              className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg font-medium"
            >
              Vissza
            </button>
          </div>
        </div>

        <SessionManager />
      </div>
    )
  }

  // Main session management interface
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-bold text-slate-800">Tanári munkamenet</h2>
            {currentSubject && (
              <div className={`px-4 py-2 rounded-lg border-2 font-bold text-sm ${
                subjectTheme === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                subjectTheme === 'green' ? 'bg-green-50 text-green-800 border-green-200' :
                subjectTheme === 'red' ? 'bg-red-50 text-red-800 border-red-200' :
                subjectTheme === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                'bg-orange-50 text-orange-800 border-orange-200'
              }`}>
                {subjectTheme === 'blue' ? '💻' :
                 subjectTheme === 'green' ? '🔢' :
                 subjectTheme === 'red' ? '📚' :
                 subjectTheme === 'purple' ? '🏛️' : '🌿'} {subjectDisplayName}
              </div>
            )}
          </div>
          <p className="text-slate-600">Válassz ki feladatokat a könyvtárból és indíts munkamenetet a diákoknak</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Munkamenet előzmények
          </button>
          
          <button
            onClick={onExit}
            className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg font-medium"
          >
            Vissza
          </button>
        </div>
      </div>

      {activeSession && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-green-100 text-green-800 w-16 h-16 flex items-center justify-center rounded-xl shadow-sm font-bold text-2xl border border-green-200">
              🎯
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-bold text-green-800">Aktív munkamenet</h3>
              <p className="text-green-700">
                🎰 Slot: <span className="font-mono text-xl font-bold">{selectedSlot}</span> | 
                Kód: <span className="font-mono text-xl font-bold">{activeSession.code}</span>
              </p>
              <p className="text-sm text-green-600 font-medium">{activeSession.exercises.length} feladat</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 font-medium">
              📢 Add meg a diákoknak:
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-yellow-900">
                <span className="font-bold">Slot szám:</span> <span className="font-mono text-lg">{selectedSlot}</span>
              </p>
              <p className="text-yellow-900">
                <span className="font-bold">Munkamenet kód:</span> <span className="font-mono text-lg">{activeSession.code}</span>
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveSession(null)}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold flex items-center gap-2 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Leállítás
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Exercise Selection */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            Kiválasztott feladatok ({selectedExercises.length}/{library.length})
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1">
                Slot szám <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(Number(e.target.value))}
                required
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={1}>🎰 Slot 1</option>
                <option value={2}>🎰 Slot 2</option>
                <option value={3}>🎰 Slot 3</option>
                <option value={4}>🎰 Slot 4</option>
                <option value={5}>🎰 Slot 5</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1">
                Osztály neve <span className="text-red-500">*</span>
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Válassz osztályt...</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            
            {/* Action Buttons - Organized and Symmetrical */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleStartSession}
                disabled={selectedExercises.length === 0 || !className.trim() || loading}
                className={`px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white transition-colors ${
                  subjectTheme === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                  subjectTheme === 'green' ? 'bg-green-600 hover:bg-green-700' :
                  subjectTheme === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  subjectTheme === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
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

              <button
                onClick={() => exportSelectedAsJson()}
                disabled={selectedExercises.length === 0}
                className="px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                JSON Export ({selectedExercises.length})
              </button>
            </div>
          </div>
        </div>

        {selectedExercises.length > 0 && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600 mb-2">Kiválasztott feladatok:</div>
            <div className="flex flex-wrap gap-2">
              {selectedExercises.map(id => {
                const exercise = library.find(item => item.id === id)
                return exercise ? (
                  <span key={id} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {exercise.data.title}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>

      {/* Library Display */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Feladat könyvtár</h3>
          <p className="text-slate-600">Válassz ki feladatokat a munkamenethez</p>
        </div>

        {library.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <h4 className="text-xl font-bold text-slate-400 mb-2">Üres könyvtár</h4>
            <p className="text-slate-500">Menj a "Kezdés" fülre és hozz létre feladatokat!</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-4">
              {library.map((item, index) => (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all flex items-center gap-4 ${
                    selectedExercises.includes(item.id)
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  onClick={() => toggleExerciseSelection(item.id)}
                >
                  {/* Sorszám */}
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center font-bold text-lg border-2 border-purple-200">
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 mb-1">{item.data.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">{item.data.instruction}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Típus: {item.data.type}</span>
                        <span>Fájl: {item.fileName}</span>
                        <span>ID: {item.id.substring(0, 8)}...</span>
                        {/* Completion Status */}
                        <label 
                          className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={item.isCompleted || false}
                            onChange={(e) => {
                              e.stopPropagation()
                              // Update the library through the parent component
                              if (onLibraryUpdate) {
                                // We need to trigger a library update in the parent
                                // This is a bit hacky but works with the current architecture
                                const updatedLibrary = library.map(libItem => 
                                  libItem.id === item.id 
                                    ? { ...libItem, isCompleted: e.target.checked }
                                    : libItem
                                )
                                
                                // Update localStorage directly since we don't have setLibrary here
                                try {
                                  localStorage.setItem('okosgyakorlo_library', JSON.stringify(updatedLibrary))
                                  onLibraryUpdate() // Trigger parent to reload from localStorage
                                } catch (error) {
                                  console.warn('Could not save to localStorage:', error)
                                }
                              }
                            }}
                            className="w-3 h-3 text-green-600 rounded"
                          />
                          <span className={`text-xs font-medium ${
                            item.isCompleted ? 'text-green-600' : 'text-slate-500'
                          }`}>
                            {item.isCompleted ? '✓ Kész' : 'Kész'}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedExercises.includes(item.id)
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-slate-300'
                      }`}>
                        {selectedExercises.includes(item.id) && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}