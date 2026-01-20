
import React, { useState, useEffect } from 'react';
import { BulkResultItem } from './BulkProcessor';
import { ExerciseType, MatchingContent, CategorizationContent, QuizContent } from '../types';
import { generateEmailData } from '../utils/emailUtils';
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
  
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState<{link: string, body: string, subject: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Helper to get teacher email
  const getTeacherEmail = () => localStorage.getItem('teacher_email') || '';

  const handleStudentLogin = async (studentData: Student, code: string) => {
    setStudent(studentData);
    setLoading(true);
    setError(null);

    try {
      // Fetch session exercises using the code
      const response = await fetch(`/api/simple-api/sessions/${code}/exercises`);
      
      if (!response.ok) {
        throw new Error('Nem sikerült betölteni a feladatokat');
      }

      const data = await response.json();
      
      if (data.exercises && data.exercises.length > 0) {
        setPlaylist(data.exercises);
        setCurrentIndex(0);
        setCompletedCount(0);
        setStep('PLAYING');
      } else {
        setError("Nincs elérhető feladat ehhez a kódhoz!");
      }
    } catch (error) {
      console.error('Error loading session exercises:', error);
      setError("Hiba a feladatok betöltésekor. Ellenőrizd a tanári kódot!");
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

  const handleExerciseComplete = async (isCorrect: boolean = false, score: number = 0, timeSpent: number = 0) => {
      setCompletedCount(prev => prev + 1);
      
      // Submit answer if we have a session
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
              studentAnswer: { completed: true }, // Basic answer data
              isCorrect,
              score,
              timeSpentSeconds: timeSpent
            })
          });
        } catch (error) {
          console.error('Error submitting answer:', error);
        }
      }
      
      if (currentIndex < playlist.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          setStep('RESULT');
      }
  };

  const handlePrepareEmail = () => {
      const email = getTeacherEmail();
      if (!email) {
          alert("A tanár email címe nincs beállítva! Kérd meg a tanárt, hogy állítsa be a Beállításokban (Fogaskerék ikon).");
          return;
      }
      const data = generateEmailData(email, student?.name || '', student?.className || '', completedCount, playlist.length);
      setEmailData(data);
      setShowEmailModal(true);
      
      // Try to open automatically too
      window.location.href = data.link;
  };

  const copyToClipboard = () => {
      if (emailData) {
          navigator.clipboard.writeText(emailData.body);
          alert("Szöveg másolva a vágólapra! Most beillesztheted egy emailbe.");
      }
  };

  // --- RENDER: LOGIN ---
  if (step === 'LOGIN' && !isStudentMode) {
      return <StudentLoginForm onLoginSuccess={handleStudentLogin} onBack={onExit} />;
  }

  // Skip login in student mode and show assignments directly
  if (step === 'LOGIN' && isStudentMode) {
      // Auto-set a default student for student mode
      useEffect(() => {
          if (!student && !isStudentMode) {
              setStudent({
                  id: 'teacher-mode',
                  name: 'Tanár',
                  className: 'Általános'
              });
              setStep('ASSIGNMENTS');
          }
      }, [student, isStudentMode]);
      
      return (
          <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
      );
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
                          onImageUpdate={(newSrc) => {
                            // Update the current item's image URL
                            const updatedItem = { ...currentItem, imageUrl: newSrc };
                            // You might want to save this back to the library
                            console.log('Image updated:', newSrc);
                          }}
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
                                onNext={handleExerciseComplete} 
                              />
                          )}
                          
                          {currentItem.data.type === ExerciseType.CATEGORIZATION && (
                              <CategorizationExercise
                                key={uniqueKey}
                                content={currentItem.data.content as CategorizationContent}
                                onComplete={() => {}} 
                                onNext={handleExerciseComplete}
                              />
                          )}

                          {currentItem.data.type === ExerciseType.QUIZ && (
                              <QuizExercise
                                key={uniqueKey}
                                content={currentItem.data.content as QuizContent}
                                onComplete={() => {}}
                                onNext={handleExerciseComplete}
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
          <p className="text-slate-500 mb-8">A mai gyakorlás véget ért.</p>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
              <div className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Teljesítve</div>
              <div className="text-5xl font-black text-purple-600">{completedCount} <span className="text-2xl text-slate-400 font-medium">/ {playlist.length}</span></div>
              <div className="text-sm font-medium text-slate-600 mt-2">feladat sikeresen megoldva</div>
          </div>

          <button 
            onClick={handlePrepareEmail}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 mb-4 transition-transform hover:scale-[1.02]"
          >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              Eredmény küldése a Tanárnak
          </button>

          <button onClick={onExit} className="text-slate-500 hover:text-slate-700 font-medium">
              Vissza a főoldalra
          </button>

          {/* EMAIL MODAL */}
          {showEmailModal && emailData && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                          <h3 className="font-bold text-slate-800">Email küldése</h3>
                          <button onClick={() => setShowEmailModal(false)}><svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                      </div>
                      <div className="p-6">
                          <p className="text-sm text-slate-600 mb-4">
                              Ha nem nyílt meg automatikusan a levelezőprogramod, másold ki az alábbi szöveget és küldd el a tanárnak!
                          </p>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 mb-4 h-32 overflow-y-auto whitespace-pre-wrap">
                              {emailData.body}
                          </div>
                          <div className="flex gap-3">
                              <button onClick={copyToClipboard} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-2 rounded-lg font-bold">
                                  Szöveg másolása
                              </button>
                              <a href={emailData.link} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg font-bold text-center block">
                                  Megnyitás
                              </a>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

export default DailyChallenge;
