import React, { useState, useEffect } from 'react';

interface StudentResult {
  sessionCode: string;
  sessionDate: string;
  studentName: string;
  studentClass: string;
  totalExercises: number;
  completedExercises: number;
  totalScore: number;
  results: Array<{
    exerciseTitle: string;
    exerciseType: string;
    isCorrect: boolean;
    score: number;
    timeSpent: number;
    studentAnswer?: any; // Add this field for detailed answers
  }>;
}

interface Props {
  onClose: () => void;
}

export default function StudentProgressDashboard({ onClose }: Props) {
  const [studentData, setStudentData] = useState<{[key: string]: StudentResult[]}>({});
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllStudentData();
  }, []);

  const refreshFromAPI = async () => {
    setRefreshing(true);
    try {
      // Get fresh data from API
      const response = await fetch('/api/simple-api/sessions/stats');
      if (response.ok) {
        const apiData = await response.json();
        console.log('📊 Fresh API data loaded:', apiData);
        
        // Reload local data after API refresh
        loadAllStudentData();
      }
    } catch (error) {
      console.error('Error refreshing from API:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadAllStudentData = () => {
    try {
      const allStudentData: {[key: string]: StudentResult[]} = {};
      
      // Get all session summaries and results from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('session_') && key.endsWith('_summary')) {
          const sessionCode = key.replace('session_', '').replace('_summary', '');
          
          // Get session data
          const sessionData = localStorage.getItem(`session_${sessionCode}`);
          const summaryData = localStorage.getItem(key);
          const resultsData = localStorage.getItem(`session_${sessionCode}_results`);
          
          if (summaryData) {
            const summaries = JSON.parse(summaryData);
            const results = resultsData ? JSON.parse(resultsData) : [];
            const session = sessionData ? JSON.parse(sessionData) : null;
            
            summaries.forEach((summary: any) => {
              const studentKey = `${summary.studentName} (${summary.studentClass})`;
              
              if (!allStudentData[studentKey]) {
                allStudentData[studentKey] = [];
              }
              
              // Get student's results for this session
              const studentResults = results.filter((r: any) => 
                r.studentName === summary.studentName && r.studentClass === summary.studentClass
              );
              
              const totalScore = (studentResults || []).reduce((sum: number, r: any) => sum + (r.score || 0), 0);
              
              allStudentData[studentKey].push({
                sessionCode,
                sessionDate: session?.createdAt || summary.completedAt,
                studentName: summary.studentName,
                studentClass: summary.studentClass,
                totalExercises: summary.totalExercises,
                completedExercises: summary.completedExercises,
                totalScore,
                results: studentResults
              });
            });
          }
        }
      }
      
      // Sort each student's sessions by date (newest first)
      Object.keys(allStudentData).forEach(studentKey => {
        allStudentData[studentKey].sort((a, b) => 
          new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
        );
      });
      
      setStudentData(allStudentData);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportStudentData = (studentKey: string) => {
    const data = studentData[studentKey];
    if (!data || data.length === 0) return;

    const csvData: (string | number)[][] = [];
    csvData.push([
      'Diák neve',
      'Osztály', 
      'Munkamenet kód',
      'Dátum',
      'Összes feladat',
      'Befejezett',
      'Összpontszám',
      'Feladat címe',
      'Feladat típusa',
      'Helyes',
      'Pontszám',
      'Idő (mp)'
    ]);

    data.forEach(session => {
      if (session.results.length === 0) {
        csvData.push([
          session.studentName,
          session.studentClass,
          session.sessionCode,
          new Date(session.sessionDate).toLocaleString('hu-HU'),
          session.totalExercises,
          session.completedExercises,
          session.totalScore,
          '', '', '', '', ''
        ]);
      } else {
        session.results.forEach(result => {
          csvData.push([
            session.studentName,
            session.studentClass,
            session.sessionCode,
            new Date(session.sessionDate).toLocaleString('hu-HU'),
            session.totalExercises,
            session.completedExercises,
            session.totalScore,
            result.exerciseTitle,
            result.exerciseType,
            result.isCorrect ? 'IGEN' : 'NEM',
            result.score,
            result.timeSpent
          ]);
        });
      }
    });

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `diak_${studentKey.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
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
            <p>Diák adatok betöltése...</p>
          </div>
        </div>
      </div>
    );
  }

  const studentKeys = Object.keys(studentData);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Diák Teljesítmény Áttekintés</h2>
            <p className="text-gray-600">Összes diák eredményeinek részletes áttekintése</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshFromAPI}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Frissítés...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Frissítés
                </>
              )}
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

        <div className="flex-1 overflow-hidden flex">
          {/* Student List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-bold text-gray-800 mb-4">Diákok ({studentKeys.length})</h3>
              {studentKeys.length === 0 ? (
                <p className="text-gray-500 italic">Nincs diák adat</p>
              ) : (
                <div className="space-y-2">
                  {studentKeys.map(studentKey => {
                    const sessions = studentData[studentKey];
                    const totalSessions = sessions.length;
                    const totalScore = (sessions || []).reduce((sum, s) => sum + s.totalScore, 0);
                    const avgScore = totalSessions > 0 ? Math.round(totalScore / totalSessions) : 0;
                    
                    return (
                      <div
                        key={studentKey}
                        onClick={() => setSelectedStudent(studentKey)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedStudent === studentKey 
                            ? 'bg-blue-100 border-2 border-blue-300' 
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-gray-800">{studentKey}</div>
                        <div className="text-sm text-gray-600">
                          {totalSessions} munkamenet • Átlag: {avgScore} pont
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Student Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedStudent ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">{selectedStudent}</h3>
                  <button
                    onClick={() => exportStudentData(selectedStudent)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export CSV
                  </button>
                </div>

                <div className="space-y-6">
                  {studentData[selectedStudent].map((session, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 font-mono">{session.sessionCode}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.sessionDate).toLocaleString('hu-HU')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{session.totalScore} pont</div>
                          <div className="text-sm text-gray-600">
                            {session.completedExercises}/{session.totalExercises} feladat
                          </div>
                        </div>
                      </div>

                      {session.results.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-700 mb-2">Feladat részletek:</h5>
                          <div className="space-y-2">
                            {session.results.map((result, resultIdx) => (
                              <div key={resultIdx} className="bg-white rounded p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800">{result.exerciseTitle}</div>
                                    <div className="text-sm text-gray-600">{result.exerciseType}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`font-bold ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.isCorrect ? '✓' : '✗'} {result.score} pont
                                    </div>
                                    <div className="text-sm text-gray-600">{result.timeSpent}s</div>
                                  </div>
                                </div>
                                
                                {/* Show detailed answers if available */}
                                {result.studentAnswer && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                    <div className="font-medium text-gray-700 mb-1">Részletes válaszok:</div>
                                    {result.exerciseType === 'QUIZ' && result.studentAnswer.questions && (
                                      <div className="space-y-1">
                                        {result.studentAnswer.questions.map((q: any, qIdx: number) => (
                                          <div key={qIdx} className="text-xs">
                                            <span className="font-medium">{q.question}</span>
                                            <div className="ml-2 text-gray-600">
                                              Helyes: {q.options[q.correctAnswer]} | 
                                              Válasz: {q.options[result.studentAnswer?.selectedAnswers?.[qIdx]] || 'Nincs válasz'}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {result.exerciseType === 'MATCHING' && result.studentAnswer.pairs && (
                                      <div className="space-y-1">
                                        {result.studentAnswer.pairs.map((pair: any, pIdx: number) => (
                                          <div key={pIdx} className="text-xs">
                                            <span className="font-medium">{pair.left}</span>
                                            <div className="ml-2 text-gray-600">
                                              Helyes: {pair.right} | Válasz: {pair.userMatch}
                                              <span className={pair.isCorrect ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                                {pair.isCorrect ? '✓' : '✗'}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {result.exerciseType === 'CATEGORIZATION' && result.studentAnswer.items && (
                                      <div className="space-y-1">
                                        {result.studentAnswer.items.map((item: any, iIdx: number) => (
                                          <div key={iIdx} className="text-xs">
                                            <span className="font-medium">{item.text}</span>
                                            <div className="ml-2 text-gray-600">
                                              Helyes: {item.correctCategory} | Válasz: {item.userCategory}
                                              <span className={item.isCorrect ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                                {item.isCorrect ? '✓' : '✗'}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                  <p>Válassz egy diákot a bal oldalról</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}