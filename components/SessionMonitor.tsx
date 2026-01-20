import React, { useState, useEffect } from 'react';

interface Student {
  id: string;
  name: string;
  className: string;
  joinedAt: string;
  lastSeen: string;
  isOnline: boolean;
  currentExercise: number;
  completedExercises: number;
  totalScore: number;
  results: Array<{
    exerciseIndex: number;
    exerciseTitle: string;
    isCorrect: boolean;
    score: number;
    timeSpent: number;
    completedAt: string;
  }>;
}

interface SessionStatus {
  code: string;
  isActive: boolean;
  createdAt: string;
  endedAt?: string;
  totalExercises: number;
  students: Student[];
  onlineCount: number;
  totalStudents: number;
}

interface Props {
  sessionCode: string;
  onClose: () => void;
}

export default function SessionMonitor({ sessionCode, onClose }: Props) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSessionStatus = async () => {
    try {
      // Try API first
      let apiData = null;
      try {
        const response = await fetch(`/api/simple-api/sessions/${sessionCode}/status`);
        if (response.ok) {
          const data = await response.json();
          apiData = data.session;
        }
      } catch (apiError) {
        console.warn('API fetch failed, using localStorage fallback:', apiError);
      }

      // Always also check localStorage for additional results
      const localSummaries = localStorage.getItem(`session_${sessionCode}_summary`);
      const localResults = localStorage.getItem(`session_${sessionCode}_results`);
      
      const summaries = localSummaries ? JSON.parse(localSummaries) : [];
      const results = localResults ? JSON.parse(localResults) : [];

      // If we have API data, merge with localStorage data
      if (apiData) {
        // Update API students with localStorage completion data
        const sessionData = apiData as SessionStatus;
        const students = sessionData.students || [];
        students.forEach((student: Student) => {
          // Find matching summary
          const summary = summaries.find((s: any) => 
            s.studentName === student.name && s.studentClass === student.className
          );
          if (summary) {
            student.completedExercises = summary.completedExercises;
          }

          // Find matching results
          const studentResults = results.filter((r: any) => 
            r.studentName === student.name && r.studentClass === student.className
          );
          if (studentResults.length > 0) {
            student.results = studentResults.map((r: any) => ({
              exerciseIndex: 0,
              exerciseTitle: r.exerciseTitle,
              isCorrect: r.isCorrect,
              score: r.score,
              timeSpent: r.timeSpent,
              completedAt: r.completedAt
            }));
            student.totalScore = studentResults.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
          }
        });
        setSessionStatus(sessionData);
      } else {
        // Fallback: create session status from localStorage only
        const sessionData = localStorage.getItem(`session_${sessionCode}`);
        if (sessionData || summaries.length > 0) {
          const session = sessionData ? JSON.parse(sessionData) : null;
          
          const fallbackStatus: SessionStatus = {
            code: sessionCode,
            isActive: session?.isActive ?? true,
            createdAt: session?.createdAt ?? new Date().toISOString(),
            totalExercises: session?.exercises?.length ?? 0,
            students: summaries.map((summary: any) => {
              const studentResults = results.filter((r: any) => 
                r.studentName === summary.studentName && r.studentClass === summary.studentClass
              );
              
              return {
                id: `${summary.studentName}_${summary.studentClass}`,
                name: summary.studentName,
                className: summary.studentClass,
                joinedAt: summary.completedAt,
                lastSeen: summary.completedAt,
                isOnline: false,
                currentExercise: summary.completedExercises,
                completedExercises: summary.completedExercises,
                totalScore: studentResults.reduce((sum: number, r: any) => sum + (r.score || 0), 0),
                results: studentResults.map((r: any) => ({
                  exerciseIndex: 0,
                  exerciseTitle: r.exerciseTitle,
                  isCorrect: r.isCorrect,
                  score: r.score,
                  timeSpent: r.timeSpent,
                  completedAt: r.completedAt
                }))
              };
            }),
            onlineCount: 0,
            totalStudents: summaries.length
          };
          
          setSessionStatus(fallbackStatus);
        } else {
          throw new Error('Munkamenet nem található');
        }
      }
      
      setError(null);
    } catch (err) {
      setError('Nem sikerült betölteni a munkamenet állapotát');
      console.error('Session status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, [sessionCode]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchSessionStatus, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, sessionCode]);

  const exportResults = () => {
    if (!sessionStatus) return;

    const csvData: (string | number)[][] = [];
    csvData.push(['Diák neve', 'Osztály', 'Csatlakozás', 'Online', 'Jelenlegi feladat', 'Befejezett', 'Pontszám', 'Feladat címe', 'Helyes', 'Pont', 'Idő (mp)', 'Befejezve']);

    sessionStatus.students.forEach(student => {
      if (student.results.length === 0) {
        csvData.push([
          student.name,
          student.className,
          new Date(student.joinedAt).toLocaleString('hu-HU'),
          student.isOnline ? 'Igen' : 'Nem',
          student.currentExercise,
          student.completedExercises,
          student.totalScore,
          '', '', '', '', ''
        ]);
      } else {
        student.results.forEach(result => {
          csvData.push([
            student.name,
            student.className,
            new Date(student.joinedAt).toLocaleString('hu-HU'),
            student.isOnline ? 'Igen' : 'Nem',
            student.currentExercise,
            student.completedExercises,
            student.totalScore,
            result.exerciseTitle,
            result.isCorrect ? 'Igen' : 'Nem',
            result.score,
            result.timeSpent,
            new Date(result.completedAt).toLocaleString('hu-HU')
          ]);
        });
      }
    });

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `munkamenet_${sessionCode}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p>Munkamenet állapot betöltése...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-bold text-red-800 mb-2">Hiba</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchSessionStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Újrapróbálás
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionStatus) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Munkamenet Monitor</h2>
            <p className="text-gray-600">Kód: {sessionStatus.code}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Automatikus frissítés
            </label>
            <button
              onClick={exportResults}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              📊 Export CSV
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{sessionStatus.onlineCount}</div>
              <div className="text-sm text-blue-800">Online diákok</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{sessionStatus.totalStudents}</div>
              <div className="text-sm text-green-800">Összes diák</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{sessionStatus.totalExercises}</div>
              <div className="text-sm text-purple-800">Feladatok száma</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {sessionStatus.students.reduce((sum, s) => sum + s.completedExercises, 0)}
              </div>
              <div className="text-sm text-yellow-800">Befejezett feladatok</div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Diákok ({sessionStatus.students.length})</h3>
          
          {sessionStatus.students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p>Még nincs csatlakozott diák</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionStatus.students.map((student) => (
                <div key={student.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        {student.name}
                        <span className={`w-3 h-3 rounded-full ${student.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      </h4>
                      <p className="text-sm text-gray-600">{student.className}</p>
                      <p className="text-xs text-gray-500">
                        Csatlakozott: {new Date(student.joinedAt).toLocaleString('hu-HU')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {student.currentExercise}/{sessionStatus.totalExercises}
                      </div>
                      <div className="text-sm text-gray-600">
                        {Math.round((student.currentExercise / sessionStatus.totalExercises) * 100)}% kész
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        {student.totalScore} pont
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(student.currentExercise / sessionStatus.totalExercises) * 100}%` }}
                    ></div>
                  </div>

                  {/* Recent Results */}
                  {student.results.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-bold text-gray-700 mb-2">Legutóbbi eredmények:</h5>
                      <div className="flex gap-2 flex-wrap">
                        {student.results.slice(-5).map((result, idx) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                            title={`${result.exerciseTitle} - ${result.score} pont - ${result.timeSpent}s`}
                          >
                            {result.isCorrect ? '✓' : '✗'} {result.score}p
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}