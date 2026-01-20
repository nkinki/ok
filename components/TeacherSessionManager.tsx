import React, { useState } from 'react'
import { BulkResultItem } from './BulkProcessor'
import SessionMonitor from './SessionMonitor'
import StudentProgressDashboard from './StudentProgressDashboard'

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
  const [showMonitor, setShowMonitor] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showStudentDashboard, setShowStudentDashboard] = useState(false)

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

  const getAllSessionHistory = () => {
    try {
      const sessions: Array<{code: string, summaries: any[], results: any[], createdAt?: string}> = [];
      
      // Get all localStorage keys that match session pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('session_') && key.endsWith('_summary')) {
          const sessionCode = key.replace('session_', '').replace('_summary', '');
          const { summaries, results } = getSessionResults(sessionCode);
          
          // Try to get session creation date
          const sessionKey = `session_${sessionCode}`;
          const sessionData = localStorage.getItem(sessionKey);
          let createdAt = undefined;
          if (sessionData) {
            try {
              const parsed = JSON.parse(sessionData);
              createdAt = parsed.createdAt;
            } catch (e) {
              // Ignore parse errors
            }
          }
          
          if (summaries.length > 0 || results.length > 0) {
            sessions.push({ code: sessionCode, summaries, results, createdAt });
          }
        }
      }
      
      // Sort by creation date (newest first)
      return sessions.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      console.error('Error loading session history:', error);
      return [];
    }
  }

  const deleteSession = (sessionCode: string) => {
    // This function is now disabled - sessions should be kept for history
    alert('Az egyedi munkamenet törlés le van tiltva. Használd a "Teljes előzmények törlése" gombot ha minden adatot törölni szeretnél.');
  }

  const deleteAllSessions = () => {
    if (!confirm('⚠️ FIGYELEM!\n\nEz törölni fogja az ÖSSZES munkamenet előzményt és eredményt!\n\nBiztosan folytatod?')) {
      return;
    }

    try {
      // Get all session-related keys from localStorage
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('session_') || key.includes('_summary') || key.includes('_results'))) {
          keysToDelete.push(key);
        }
      }

      // Delete all session keys
      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
      });

      // Also try to delete from API if available
      fetch('/api/simple-api/sessions/delete-all', {
        method: 'DELETE'
      }).catch(error => {
        console.warn('Could not delete sessions from API:', error);
      });

      console.log(`✅ All sessions deleted (${keysToDelete.length} items)`);
      alert(`Sikeresen törölve ${keysToDelete.length} munkamenet adat.`);
      
      // Force re-render
      setShowHistory(false);
      setTimeout(() => setShowHistory(true), 100);
    } catch (error) {
      console.error('Error deleting all sessions:', error);
      alert('Hiba történt a munkamenetek törlésekor.');
    }
  }

  const exportSessionToCSV = (sessionCode: string) => {
    const { summaries, results } = getSessionResults(sessionCode);
    
    if (summaries.length === 0 && results.length === 0) {
      alert('Nincs exportálható adat ehhez a munkamenethez.');
      return;
    }

    const csvData: (string | number)[][] = [];
    
    // Header
    csvData.push([
      'Munkamenet kód',
      'Diák neve', 
      'Osztály', 
      'Összes feladat',
      'Befejezett feladat',
      'Befejezés időpontja',
      'Feladat címe',
      'Feladat típusa', 
      'Helyes válasz',
      'Pontszám',
      'Időtartam (mp)'
    ]);

    // Add summary data first
    summaries.forEach((summary: any) => {
      csvData.push([
        sessionCode,
        summary.studentName,
        summary.studentClass,
        summary.totalExercises,
        summary.completedExercises,
        new Date(summary.completedAt).toLocaleString('hu-HU'),
        'ÖSSZESÍTÉS',
        '',
        '',
        '',
        ''
      ]);
    });

    // Add detailed results
    results.forEach((result: any) => {
      csvData.push([
        sessionCode,
        result.studentName,
        result.studentClass,
        '',
        '',
        new Date(result.timeSpent ? Date.now() : Date.now()).toLocaleString('hu-HU'),
        result.exerciseTitle || 'Ismeretlen feladat',
        result.exerciseType || 'Ismeretlen típus',
        result.isCorrect ? 'IGEN' : 'NEM',
        result.score || 0,
        result.timeSpent || 0
      ]);
    });

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Download CSV
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `munkamenet_${sessionCode}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const cleanupOldSessions = () => {
    try {
      const sessionKeys: string[] = [];
      const now = new Date().getTime();
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000); // 1 week ago
      
      // Find all session-related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('session_')) {
          sessionKeys.push(key);
        }
      }
      
      let deletedCount = 0;
      
      // Check each session and delete old ones
      sessionKeys.forEach(key => {
        try {
          if (key.includes('_summary') || key.includes('_results')) {
            // Skip summary/results, check the main session
            return;
          }
          
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            const sessionDate = new Date(session.createdAt).getTime();
            
            if (sessionDate < oneWeekAgo) {
              // Delete old session and related data
              localStorage.removeItem(key);
              localStorage.removeItem(`${key}_summary`);
              localStorage.removeItem(`${key}_results`);
              deletedCount++;
            }
          }
        } catch (e) {
          // If parsing fails, delete the corrupted key
          localStorage.removeItem(key);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old sessions`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
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
      // Clean up old sessions first to free up space
      const cleanedCount = cleanupOldSessions();
      if (cleanedCount > 0) {
        console.log(`🧹 Freed up space by cleaning ${cleanedCount} old sessions`);
      }

      const sessionCode = generateSessionCode()
      const selectedExerciseData = library.filter(item => selectedExercises.includes(item.id))

      // Try API first for network sharing
      let apiSuccess = false
      try {
        console.log('🌐 Creating session via API...');
        console.log('📊 Session data:', { code: sessionCode, exerciseCount: selectedExerciseData.length });
        
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

        console.log('📡 API create response status:', response.status);
        
        if (response.ok) {
          const apiResult = await response.json()
          console.log('✅ Session created via API for network sharing:', apiResult)
          apiSuccess = true
        } else {
          const errorText = await response.text();
          console.warn('⚠️ API session creation failed with status:', response.status, errorText)
        }
      } catch (apiError) {
        console.warn('⚠️ API session creation failed:', apiError)
      }

      // Create local session object
      const session: Session = {
        code: sessionCode,
        exercises: selectedExerciseData,
        createdAt: new Date(),
        isActive: true
      }

      setActiveSession(session)
      
      // Always also store in localStorage as backup
      const sessionDataForStorage = {
        code: sessionCode,
        exercises: selectedExerciseData,
        createdAt: new Date().toISOString(),
        isActive: true
      }
      
      try {
        localStorage.setItem(`session_${sessionCode}`, JSON.stringify(sessionDataForStorage))
        console.log('💾 Session saved to localStorage as backup')
      } catch (storageError) {
        console.warn('⚠️ Could not save session to localStorage:', storageError)
        
        // If quota exceeded, try to clean up more aggressively
        if (storageError instanceof DOMException && storageError.code === 22) {
          console.log('🧹 Quota exceeded, trying aggressive cleanup...');
          
          // Delete all old sessions (older than 1 day)
          const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
          let aggressiveCleanCount = 0;
          
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('session_')) {
              try {
                if (key.includes('_summary') || key.includes('_results')) {
                  continue;
                }
                
                const data = localStorage.getItem(key);
                if (data) {
                  const session = JSON.parse(data);
                  const sessionDate = new Date(session.createdAt).getTime();
                  
                  if (sessionDate < oneDayAgo) {
                    localStorage.removeItem(key);
                    localStorage.removeItem(`${key}_summary`);
                    localStorage.removeItem(`${key}_results`);
                    aggressiveCleanCount++;
                  }
                }
              } catch (e) {
                localStorage.removeItem(key);
                aggressiveCleanCount++;
              }
            }
          }
          
          console.log(`🧹 Aggressive cleanup removed ${aggressiveCleanCount} sessions`);
          
          // Try to save again
          try {
            localStorage.setItem(`session_${sessionCode}`, JSON.stringify(sessionDataForStorage));
            console.log('💾 Session saved after cleanup');
          } catch (retryError) {
            console.warn('⚠️ Still could not save after cleanup');
            if (!apiSuccess) {
              throw new Error('Tárhely megtelt és nem sikerült felszabadítani helyet. Használd a "Teljes előzmények törlése" gombot.');
            }
          }
        } else if (!apiSuccess) {
          throw new Error('Nem sikerült menteni a munkamenetet')
        }
      }

      if (apiSuccess) {
        console.log('🌐 Session available for network access with code:', sessionCode)
      } else {
        console.log('💻 Session available locally only with code:', sessionCode)
      }

    } catch (error) {
      console.error('❌ Session creation error:', error)
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
          console.log('✅ Session stopped via API')
        } else {
          console.warn('⚠️ API session stop failed with status:', response.status)
        }
      } catch (apiError) {
        console.warn('⚠️ API session stop failed:', apiError)
      }

      // Remove session from localStorage
      try {
        localStorage.removeItem(`session_${activeSession.code}`)
        console.log('💾 Session removed from localStorage')
      } catch (storageError) {
        console.warn('⚠️ Could not remove session from localStorage:', storageError)
      }

      setActiveSession(null)
      setSelectedExercises([])
    } catch (error) {
      console.error('❌ Error stopping session:', error)
      // Still stop the session even if cleanup fails
      setActiveSession(null)
      setSelectedExercises([])
    }
  }

  // --- RENDER: SESSION HISTORY ---
  if (showHistory) {
    const sessionHistory = getAllSessionHistory();
    
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Munkamenet előzmények</h2>
            <p className="text-slate-600">Korábbi munkamenetek és eredmények kezelése</p>
          </div>
          <div className="flex gap-3">
            {sessionHistory.length > 0 && (
              <button
                onClick={deleteAllSessions}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                title="Összes munkamenet törlése"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Teljes előzmények törlése
              </button>
            )}
            <button
              onClick={() => setShowHistory(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Vissza
            </button>
          </div>
        </div>

        {sessionHistory.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="text-xl font-medium text-slate-400">Nincs korábbi munkamenet</h3>
            <p className="text-slate-400 mt-2">Indíts el egy munkamenetet, hogy itt megjelenjenek az eredmények.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessionHistory.map((session) => (
              <div key={session.code} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 font-mono">{session.code}</h3>
                    <p className="text-sm text-slate-500">
                      {session.createdAt ? new Date(session.createdAt).toLocaleString('hu-HU') : 'Ismeretlen időpont'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportSessionToCSV(session.code)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-1"
                      title="Eredmények exportálása CSV-be"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      CSV Export
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Participants Summary */}
                  <div>
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                      </svg>
                      Résztvevők ({session.summaries.length})
                    </h4>
                    {session.summaries.length === 0 ? (
                      <p className="text-slate-500 italic text-sm">Nincs befejezett munkamenet</p>
                    ) : (
                      <div className="space-y-2">
                        {session.summaries.map((summary: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 rounded p-3 text-sm">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{summary.studentName}</span>
                                <span className="text-slate-500 ml-2">({summary.studentClass})</span>
                              </div>
                              <span className="font-bold text-green-600">
                                {summary.completedExercises}/{summary.totalExercises}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Results Summary */}
                  <div>
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"/>
                      </svg>
                      Statisztikák
                    </h4>
                    {session.results.length === 0 ? (
                      <p className="text-slate-500 italic text-sm">Nincs részletes eredmény</p>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Összes válasz:</span>
                          <span className="font-bold">{session.results.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Helyes válaszok:</span>
                          <span className="font-bold text-green-600">
                            {session.results.filter((r: any) => r.isCorrect).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hibás válaszok:</span>
                          <span className="font-bold text-red-600">
                            {session.results.filter((r: any) => !r.isCorrect).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sikerességi arány:</span>
                          <span className="font-bold">
                            {Math.round((session.results.filter((r: any) => r.isCorrect).length / session.results.length) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
          
          {/* Network Access Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">🌐 Hálózati Hozzáférés</h3>
            <p className="text-sm text-blue-700">
              <strong>Ugyanazon gép:</strong> Minden böngésző működik<br/>
              <strong>Más gépek:</strong> API-n keresztül (ha elérhető)<br/>
              <strong>Helyi hálózat:</strong> Használd a <code className="bg-blue-100 px-1 rounded">npm run dev:network</code> parancsot
            </p>
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
            <button
              onClick={() => setShowMonitor(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              📊 Valós idejű monitor
            </button>
            {summaries.length > 0 && (
              <button
                onClick={() => setShowResults(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
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
        
        {/* Session Monitor Modal */}
        {showMonitor && (
          <SessionMonitor 
            sessionCode={activeSession.code}
            onClose={() => setShowMonitor(false)}
          />
        )}
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
            onClick={() => setShowStudentDashboard(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
            </svg>
            Diák teljesítmények
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
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
      
      {/* Student Progress Dashboard */}
      {showStudentDashboard && (
        <StudentProgressDashboard onClose={() => setShowStudentDashboard(false)} />
      )}
    </div>
  )
}