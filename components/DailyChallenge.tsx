
import React, { useState, useEffect } from 'react';
import { BulkResultItem } from './BulkProcessor';
import { ExerciseType, MatchingContent, CategorizationContent, QuizContent } from '../types';
import ImageViewer from './ImageViewer';
import MatchingExercise from './MatchingExercise';
import CategorizationExercise from './CategorizationExercise';
import QuizExercise from './QuizExercise';
import StudentLoginForm from './auth/StudentLoginForm';

interface Props {
  library: BulkResultItem[];
  onExit: () => void;
  isStudentMode?: boolean;
  sessionCode?: string;
}

type DailyStep = 'LOGIN' | 'ASSIGNMENTS' | 'PLAYING' | 'RESULT';

interface Student {
  id: string;
  name: string;
  className: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  exercises: Array<{
    id: string;
    title: string;
    imageUrl: string;
    exerciseData: any;
  }>;
}

interface Session {
  id: string;
  studentId: string;
  assignmentId: string;
  totalExercises: number;
  completedExercises: number;
  totalScore: number;
  status: string;
}

const DailyChallenge: React.FC<Props> = ({ library, onExit, isStudentMode = false, sessionCode }) => {
  const [step, setStep] = useState<DailyStep>(isStudentMode ? 'LOGIN' : 'ASSIGNMENTS');
  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentSessionCode, setCurrentSessionCode] = useState<string | null>(sessionCode || null);
  
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Heartbeat to keep connection alive
  const startHeartbeat = (sessionCode: string, studentId: string) => {
    if (!studentId) return;
    
    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch(`/api/simple-api/sessions/${sessionCode}/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ studentId })
        });
      } catch (error) {
        console.warn('Heartbeat failed:', error);
      }
    }, 15000); // Every 15 seconds

    // Store interval ID to clear it later
    (window as any).heartbeatInterval = heartbeatInterval;
  };

  // Submit exercise result to API
  const submitExerciseResult = async (exerciseIndex: number, isCorrect: boolean, score: number, timeSpent: number, answer?: any) => {
    if (!currentSessionCode || !student?.id) return;

    try {
      await fetch(`/api/simple-api/sessions/${currentSessionCode}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: student.id,
          exerciseIndex,
          isCorrect,
          score,
          timeSpent,
          answer
        })
      });
      console.log('📊 Result submitted to API');
    } catch (error) {
      console.warn('Failed to submit result to API:', error);
    }
  };

  const handleStudentLogin = async (studentData: Student, code: string) => {
    setStudent(studentData);
    setCurrentSessionCode(code);
    setLoading(true);
    setError(null);

    try {
      let sessionFound = false;

      // Primary: Try API first (for network access)
      console.log('🌐 Checking API for session...');
      try {
        const response = await fetch(`/api/simple-api/sessions/${code.toUpperCase()}/check`);
        console.log('📡 API check response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📡 API check data:', data);
          if (data.exists) {
            // Join the session
            const joinResponse = await fetch(`/api/simple-api/sessions/join`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: studentData.name,
                className: studentData.className,
                sessionCode: code.toUpperCase()
              })
            });

            if (joinResponse.ok) {
              const joinData = await joinResponse.json();
              console.log('✅ Joined session:', joinData);
              
              // Store student ID for later use
              if (studentData && joinData.student?.id) {
                setStudent(prev => prev ? { ...prev, id: joinData.student.id } : null);
              }

              // Start heartbeat to keep connection alive
              if (joinData.student?.id) {
                startHeartbeat(code.toUpperCase(), joinData.student.id);
              }
            }

            // Get exercises from API
            const exercisesResponse = await fetch(`/api/simple-api/sessions/${code.toUpperCase()}/exercises`);
            console.log('📡 API exercises response status:', exercisesResponse.status);
            if (exercisesResponse.ok) {
              const exercisesData = await exercisesResponse.json();
              console.log('📡 API exercises data:', exercisesData);
              if (exercisesData.exercises && exercisesData.exercises.length > 0) {
                console.log('✅ Session loaded from API (network access)');
                console.log('📊 Exercise count:', exercisesData.exercises.length);
                setPlaylist(exercisesData.exercises);
                setCurrentIndex(0);
                setCompletedCount(0);
                setStep('PLAYING');
                sessionFound = true;
              } else {
                console.log('❌ No exercises found in API response');
              }
            } else {
              console.log('❌ API exercises request failed');
            }
          } else {
            console.log('❌ Session not found in API');
          }
        } else {
          console.log('⚠️ API session check failed with status:', response.status);
        }
      } catch (apiError) {
        console.warn('⚠️ API session check failed:', apiError);
      }

      // Secondary: Try localStorage fallback (same device only)
      if (!sessionFound) {
        console.log('💾 Trying localStorage fallback...');
        const sessionKey = `session_${code.toUpperCase()}`;
        const sessionData = localStorage.getItem(sessionKey);
        
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (session.isActive && session.exercises && session.exercises.length > 0) {
              console.log('✅ Session loaded from localStorage (local access)');
              setPlaylist(session.exercises);
              setCurrentIndex(0);
              setCompletedCount(0);
              setStep('PLAYING');
              sessionFound = true;
            }
          } catch (parseError) {
            console.error('❌ Error parsing session data:', parseError);
          }
        } else {
          console.log('❌ Session not found in localStorage');
        }
      }

      // If both methods failed
      if (!sessionFound) {
        throw new Error('Hibás tanári kód vagy a munkamenet nem aktív');
      }
      
    } catch (error) {
      console.error('❌ Error loading session exercises:', error);
      setError("Hibás tanári kód vagy a munkamenet nem aktív!");
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackToLibrary = () => {
    if (library.length === 0) {
      setError("Nincs elérhető feladat! Kérd meg a tanárt, hogy hozzon létre feladatokat.");
      return;
    }

    // Use library as fallback (original behavior)
    const shuffled = [...library].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    setPlaylist(selected);
    setCurrentIndex(0);
    setCompletedCount(0);
    setStep('PLAYING');
  };

  const handleSelectAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);
    setError(null);

    try {
      // Start a new session
      const response = await fetch('/api/simple-api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: student?.id,
          assignmentId: assignment.id
        })
      });

      if (!response.ok) {
        throw new Error('Nem sikerült elindítani a munkamenetet');
      }

      const data = await response.json();
      setCurrentSession(data.session);
      
      // Convert exercises to playlist format
      const exercisePlaylist = assignment.exercises.map(exercise => ({
        id: exercise.id,
        imageUrl: exercise.imageUrl,
        data: exercise.exerciseData,
        fileName: exercise.title
      }));

      setPlaylist(exercisePlaylist);
      setCurrentIndex(0);
      setCompletedCount(0);
      setStep('PLAYING');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ismeretlen hiba');
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseComplete = async (isCorrect: boolean = false, score: number = 0, timeSpent: number = 0, answer?: any) => {
      // Submit result to API if connected
      await submitExerciseResult(currentIndex, isCorrect, score, timeSpent, answer);
      
      setCompletedCount(prev => prev + 1);
      
      // Submit answer if we have a session (legacy localStorage method)
      if (currentSession && playlist[currentIndex]) {
        try {
          await fetch('/api/simple-api/sessions/answer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sessionId: currentSession.id,
              exerciseId: playlist[currentIndex].id,
              studentAnswer: answer || { completed: true }, // Include actual answer
              isCorrect,
              score,
              timeSpentSeconds: timeSpent
            })
          });
        } catch (error) {
          console.error('Error submitting answer:', error);
        }
      } else if (student && currentSessionCode) {
        // Save result to localStorage-based session for teacher to see (legacy method)
        try {
          const currentExercise = playlist[currentIndex];
          const resultData = {
            studentName: student.name,
            studentClass: student.className,
            exerciseTitle: currentExercise.data.title,
            exerciseType: currentExercise.data.type,
            exerciseContent: currentExercise.data.content, // Save the questions/content
            studentAnswer: answer, // Save the student's actual answer
            isCorrect,
            score,
            timeSpent,
            completedAt: new Date().toISOString()
          };
          
          // Get existing results for this session
          const sessionKey = `session_${currentSessionCode}_results`;
          const existingResults = localStorage.getItem(sessionKey);
          const results = existingResults ? JSON.parse(existingResults) : [];
          
          // Add new result
          results.push(resultData);
          
          // Save back to localStorage
          localStorage.setItem(sessionKey, JSON.stringify(results));
          console.log('💾 Detailed result saved:', resultData);
        } catch (error) {
          console.error('Error saving result:', error);
        }
      }
      
      if (currentIndex < playlist.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          // Session completed - save final summary
          if (student && currentSessionCode) {
            try {
              const summaryData = {
                studentName: student.name,
                studentClass: student.className,
                sessionCode: currentSessionCode,
                totalExercises: playlist.length,
                completedExercises: completedCount + 1,
                completedAt: new Date().toISOString()
              };
              
              const summaryKey = `session_${currentSessionCode}_summary`;
              const existingSummaries = localStorage.getItem(summaryKey);
              const summaries = existingSummaries ? JSON.parse(existingSummaries) : [];
              
              // Check if student already completed
              const existingIndex = summaries.findIndex((s: any) => 
                s.studentName === student.name && s.studentClass === student.className
              );
              
              if (existingIndex >= 0) {
                summaries[existingIndex] = summaryData;
              } else {
                summaries.push(summaryData);
              }
              
              localStorage.setItem(summaryKey, JSON.stringify(summaries));
            } catch (error) {
              console.error('Error saving summary:', error);
            }
          }

          // Clear heartbeat when session ends
          if ((window as any).heartbeatInterval) {
            clearInterval((window as any).heartbeatInterval);
          }

          setStep('RESULT');
      }
  };

  // --- RENDER: LOGIN ---
  if (step === 'LOGIN') {
      if (isStudentMode) {
          // In student mode, show the login form with session code input
          return <StudentLoginForm onLoginSuccess={handleStudentLogin} onBack={onExit} />;
      } else {
          // In teacher mode, also show login form
          return <StudentLoginForm onLoginSuccess={handleStudentLogin} onBack={onExit} />;
      }
  }

  // --- RENDER: ASSIGNMENTS ---
  if (step === 'ASSIGNMENTS') {
      return (
          <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
              <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                      📚
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Üdv, {student?.name}!</h2>
                  <p className="text-slate-500">Válassz egy feladatsort: {student?.className} osztály</p>
              </div>

              {loading && (
                  <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-slate-500 mt-2">Feladatok betöltése...</p>
                  </div>
              )}

              {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                      {error}
                  </div>
              )}

              {!loading && assignments.length === 0 && (
                  <div className="text-center py-12">
                      <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <h3 className="text-lg font-medium text-slate-400 mb-2">Nincs elérhető feladat</h3>
                      <p className="text-slate-400 mb-4">A tanár még nem hozott létre aktív feladatokat a {student?.className} osztály számára.</p>
                      <button
                          onClick={handleFallbackToLibrary}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                      >
                          Próbálkozás a könyvtárral
                      </button>
                  </div>
              )}

              {!loading && assignments.length > 0 && (
                  <div className="space-y-4">
                      {assignments.map((assignment) => (
                          <div key={assignment.id} className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors">
                              <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                      <h3 className="text-xl font-bold text-slate-800 mb-2">{assignment.title}</h3>
                                      {assignment.description && (
                                          <p className="text-slate-600 mb-4">{assignment.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-sm text-slate-500">
                                          <span>{assignment.exercises.length} feladat</span>
                                          <span>Becsült idő: {assignment.exercises.length * 3} perc</span>
                                      </div>
                                  </div>
                                  <button
                                      onClick={() => handleSelectAssignment(assignment)}
                                      disabled={loading}
                                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                                  >
                                      Kezdés
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              <div className="mt-8 text-center">
                  <button
                      onClick={onExit}
                      className="text-slate-500 hover:text-slate-700 font-medium underline"
                  >
                      Vissza a főoldalra
                  </button>
              </div>
          </div>
      );
  }

  // --- RENDER: PLAYING ---
  if (step === 'PLAYING') {
      const currentItem = playlist[currentIndex];
      
      if (!currentItem) {
          return <div className="p-8 text-center text-red-500">Hiba: A feladat nem tölthető be.</div>;
      }

      const progress = ((currentIndex + 1) / playlist.length) * 100;
      const uniqueKey = `${currentItem.id}-${currentIndex}`; // Force re-render on change

      return (
          <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden">
              {/* Left Side: Original Image */}
              <div className="lg:w-1/2 h-1/3 lg:h-full bg-slate-900 relative border-b lg:border-b-0 lg:border-r border-slate-700 order-1 lg:order-1">
                   {currentItem.imageUrl ? (
                        <ImageViewer 
                          src={currentItem.imageUrl} 
                          alt="Feladat forrása"
                          studentMode={true}
                          // No onImageUpdate in student mode - students can't edit exercises
                        />
                   ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">Nincs elérhető kép</div>
                   )}
                   <div className="absolute top-4 left-4 z-10 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                        Forrás: {currentItem.fileName}
                   </div>
              </div>

              {/* Right Side: Exercise */}
              <div className="lg:w-1/2 h-2/3 lg:h-full bg-slate-50 overflow-y-auto order-2 lg:order-2 relative">
                  <div className="max-w-2xl mx-auto">
                      {/* Sticky Header */}
                      <div className="sticky top-0 z-20 bg-slate-50 p-6 pb-2 border-b border-slate-200 mb-4 shadow-sm opacity-95 backdrop-blur">
                          <div className="flex justify-between items-center mb-4">
                              <span className="font-bold text-purple-900">Napi Kihívás</span>
                              <span className="text-sm font-medium text-slate-500">{student?.name} - {student?.className}</span>
                          </div>
                          
                          <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                              <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                          </div>

                          <div className="mb-2">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Feladat {currentIndex + 1} / {playlist.length}</span>
                              <h3 className="text-xl font-bold text-slate-800 line-clamp-2">{currentItem.data.title}</h3>
                              <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 mt-2 font-medium">{currentItem.data.instruction}</p>
                          </div>
                      </div>

                      {/* Scrollable Content */}
                      <div className="p-6 pt-0">
                          {/* Render Dynamic Component based on Type */}
                          {currentItem.data.type === ExerciseType.MATCHING && (
                              <MatchingExercise 
                                key={uniqueKey}
                                content={currentItem.data.content as MatchingContent}
                                onComplete={() => {}} // Handled by Next button
                                onNext={(isCorrect, score, timeSpent, answer) => handleExerciseComplete(isCorrect, score, timeSpent, answer)} 
                              />
                          )}
                          
                          {currentItem.data.type === ExerciseType.CATEGORIZATION && (
                              <CategorizationExercise
                                key={uniqueKey}
                                content={currentItem.data.content as CategorizationContent}
                                onComplete={() => {}} 
                                onNext={(isCorrect, score, timeSpent, answer) => handleExerciseComplete(isCorrect, score, timeSpent, answer)}
                              />
                          )}

                          {currentItem.data.type === ExerciseType.QUIZ && (
                              <QuizExercise
                                key={uniqueKey}
                                content={currentItem.data.content as QuizContent}
                                onComplete={() => {}}
                                onNext={(isCorrect, score, timeSpent, answer) => handleExerciseComplete(isCorrect, score, timeSpent, answer)}
                              />
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: RESULT ---
  return (
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center relative">
          <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl animate-bounce">
              🏆
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Szép munka, {student?.name}!</h2>
          <p className="text-slate-500 mb-8">A mai gyakorlás véget ért. Az eredmények automatikusan mentve lettek.</p>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
              <div className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Teljesítve</div>
              <div className="text-5xl font-black text-purple-600">{completedCount} <span className="text-2xl text-slate-400 font-medium">/ {playlist.length}</span></div>
              <div className="text-sm font-medium text-slate-600 mt-2">feladat sikeresen megoldva</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span className="font-medium">Eredmények mentve!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">A tanár láthatja a teljesítményedet a munkamenet kezelőben.</p>
          </div>

          <button onClick={onExit} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02]">
              Vissza a főoldalra
          </button>

      </div>
  );
};

export default DailyChallenge;
