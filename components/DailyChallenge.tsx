
import React, { useState, useEffect, useRef } from 'react';
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
  isPreviewMode?: boolean;
}

type DailyStep = 'LOGIN' | 'ASSIGNMENTS' | 'PLAYING' | 'RESULT';

interface Student {
  id: string;
  name: string;
  className: string;
  sessionId?: string; // For API result submission
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

const DailyChallenge: React.FC<Props> = ({ library, onExit, isStudentMode = false, sessionCode, isPreviewMode = false }) => {
  const [step, setStep] = useState<DailyStep>(
    isPreviewMode ? 'PLAYING' : (isStudentMode ? 'LOGIN' : 'ASSIGNMENTS')
  );
  const [student, setStudent] = useState<Student | null>(
    isPreviewMode ? { id: 'preview', name: 'Tanári előnézet', className: 'Előnézet' } : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to safely access exercise data (handles both old and new formats)
  const getExerciseData = (item: any) => {
    // New optimized format (flat structure)
    if (item.type && item.title && item.content) {
      return {
        type: item.type,
        title: item.title,
        instruction: item.instruction,
        content: item.content
      };
    }
    // Old format (nested under data property)
    return item.data || {};
  };

  // Helper function to get image URL (with lazy loading support)
  const getImageUrl = (item: any) => {
    // If imageUrl is directly available, use it
    if (item.imageUrl) {
      return item.imageUrl;
    }
    
    // For optimized format without imageUrl, try to construct from localStorage
    // This is a fallback for exercises that were created before the optimization
    const libraryKey = 'exerciseLibrary';
    try {
      const savedLibrary = localStorage.getItem(libraryKey);
      if (savedLibrary) {
        const library = JSON.parse(savedLibrary);
        const foundItem = library.find((libItem: any) => libItem.id === item.id);
        if (foundItem && foundItem.imageUrl) {
          return foundItem.imageUrl;
        }
      }
    } catch (error) {
      console.warn('Could not load image from localStorage:', error);
    }
    
    // Return empty string if no image found
    return '';
  };

  // ESC key handler for closing
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onExit();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onExit]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentSessionCode, setCurrentSessionCode] = useState<string | null>(sessionCode || null);
  
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Initialize playlist in preview mode
  useEffect(() => {
    if (isPreviewMode && library.length > 0) {
      console.log('🔍 Preview mode: initializing playlist with library item');
      setPlaylist(library);
      setCurrentIndex(0);
      setCompletedCount(0);
    }
  }, [isPreviewMode, library]);
  
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
    console.log('📊 submitExerciseResult called with:', { exerciseIndex, isCorrect, score, timeSpent, hasAnswer: !!answer });
    
    // Enhanced debugging
    console.log('🔍 Debug info:', {
      currentSessionCode,
      studentId: student?.id,
      studentName: student?.name,
      isPreviewMode,
      hasStudent: !!student
    });
    
    if (!currentSessionCode || !student?.id) {
      console.warn('⚠️ Cannot submit result: missing sessionCode or student.id', { currentSessionCode, studentId: student?.id });
      console.warn('⚠️ This means the student is in offline mode or session join failed');
      return;
    }

    // Check if student ID looks like an offline ID - try to reconnect
    if (student.id.startsWith('student_') || student.id.startsWith('offline-')) {
      console.error('❌ Student has offline ID, attempting automatic reconnection:', student.id);
      
      // Try to rejoin the session automatically
      try {
        console.log('🔄 Attempting automatic reconnection...');
        const rejoinResponse = await fetch(`/api/simple-api/sessions/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionCode: currentSessionCode,
            name: student.name,
            className: student.className
          })
        });
        
        if (rejoinResponse.ok) {
          const rejoinData = await rejoinResponse.json();
          if (rejoinData.student?.id && !rejoinData.student.id.startsWith('student_') && !rejoinData.student.id.startsWith('offline-')) {
            console.log('✅ Automatic reconnection successful! New ID:', rejoinData.student.id);
            
            // Update student with new ID
            setStudent(prev => prev ? {
              ...prev,
              id: rejoinData.student.id,
              sessionId: rejoinData.student.sessionId
            } : null);
            
            // Continue with result submission using new ID
            console.log('🔄 Retrying result submission with new ID...');
            // Recursively call this function with updated student
            setTimeout(() => submitExerciseResult(exerciseIndex, isCorrect, score, timeSpent, answer), 100);
            return;
          }
        }
      } catch (reconnectError) {
        console.error('❌ Automatic reconnection failed:', reconnectError);
      }
      
      console.error('❌ Student remains offline - results will not be saved');
      console.error('❌ Student should manually rejoin the session');
      return;
    }

    try {
      console.log('📊 Submitting result to API:', { studentId: student.id, exerciseIndex, isCorrect, score, timeSpent });
      
      const payload = {
        studentId: student.id,
        results: [{
          exerciseIndex,
          isCorrect,
          score,
          timeSpent,
          answer,
          completedAt: new Date().toISOString()
        }],
        summary: {
          studentName: student.name,
          studentClass: student.className,
          sessionCode: currentSessionCode,
          totalExercises: playlist.length,
          completedExercises: exerciseIndex + 1,
          totalScore: score, // Only the current exercise score, API will accumulate
          completedAt: new Date().toISOString()
        }
      };
      
      console.log('📤 API payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`/api/simple-api/sessions/${currentSessionCode}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Result submitted to API successfully');
        const responseData = await response.json();
        console.log('📊 API response:', responseData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ API result submission failed:', errorData.error || 'Unknown error');
        console.warn('📊 Response status:', response.status);
        console.warn('📊 Error details:', errorData);
      }
    } catch (error) {
      console.warn('❌ Failed to submit result to API:', error);
    }
  };

  const handleStudentLogin = async (studentData: Student, code: string) => {
    setStudent(studentData);
    setCurrentSessionCode(code);
    setLoading(true);
    setError(null);

    try {
      let sessionFound = false;

      // NEW APPROACH: Try database JSON first (with images)
      console.log('☁️ Checking database for session JSON with images...');
      try {
        const cloudResponse = await fetch(`/api/simple-api/sessions/${code.toUpperCase()}/download-json`);
        if (cloudResponse.ok) {
          const sessionData = await cloudResponse.json();
          console.log('✅ Session data downloaded from database JSON');
          console.log('📊 Exercise count:', sessionData.exercises?.length || 0);
          
          // Convert database JSON to playlist format - PRESERVE IMAGE URLs
          const playlist = sessionData.exercises.map((exercise: any) => ({
            id: exercise.id,
            fileName: exercise.fileName || exercise.title,
            imageUrl: exercise.imageUrl || '', // This should contain the base64 image data
            data: {
              type: exercise.type,
              title: exercise.title,
              instruction: exercise.instruction,
              content: exercise.content
            }
          }));
          
          console.log('🖼️ Image check - First exercise imageUrl length:', playlist[0]?.imageUrl?.length || 0);
          console.log('🖼️ Image check - Has images:', playlist.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length, 'out of', playlist.length);
          
          setPlaylist(playlist);
          setCurrentIndex(0);
          setCompletedCount(0);
          setStep('PLAYING');
          sessionFound = true;
          
          console.log('🎯 Session loaded from database JSON with', playlist.length, 'exercises');
          
          // Still try to join session for statistics (non-blocking)
          try {
            await fetch(`/api/simple-api/sessions/join`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                sessionCode: code.toUpperCase(),
                name: studentData.name,
                className: studentData.className
              })
            });
            console.log('📊 Joined session for statistics');
          } catch (joinError) {
            console.warn('⚠️ Could not join for statistics (continuing anyway):', joinError);
          }
        } else {
          console.log('⚠️ Database JSON download failed, trying localStorage...');
        }
      } catch (cloudError) {
        console.warn('⚠️ Database JSON error, trying localStorage:', cloudError);
      }

      // Fallback 1: Try localStorage (same device)
      if (!sessionFound) {
        console.log('💾 Checking localStorage for session data...');
        const sessionKey = `session_${code.toUpperCase()}`;
        const localSessionData = localStorage.getItem(sessionKey);
        
        if (localSessionData) {
          try {
            const sessionData = JSON.parse(localSessionData);
            console.log('✅ Session data found in localStorage');
            console.log('📊 Exercise count:', sessionData.exercises?.length || 0);
            
            // Convert localStorage JSON to playlist format - PRESERVE IMAGE URLs
            const playlist = sessionData.exercises.map((exercise: any) => ({
              id: exercise.id,
              fileName: exercise.fileName,
              imageUrl: exercise.imageUrl || '', // This should contain the base64 image data
              data: {
                type: exercise.type,
                title: exercise.title,
                instruction: exercise.instruction,
                content: exercise.content
              }
            }));
            
            console.log('🖼️ localStorage Image check - First exercise imageUrl length:', playlist[0]?.imageUrl?.length || 0);
            console.log('🖼️ localStorage Image check - Has images:', playlist.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length, 'out of', playlist.length);
            
            setPlaylist(playlist);
            setCurrentIndex(0);
            setCompletedCount(0);
            setStep('PLAYING');
            sessionFound = true;
            
            // Still try to join session for statistics (non-blocking)
            try {
              await fetch(`/api/simple-api/sessions/join`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  sessionCode: code.toUpperCase(),
                  name: studentData.name,
                  className: studentData.className
                })
              });
              console.log('📊 Joined session for statistics');
            } catch (joinError) {
              console.warn('⚠️ Could not join for statistics (continuing anyway):', joinError);
            }
            
          } catch (parseError) {
            console.warn('⚠️ Could not parse localStorage session data:', parseError);
          }
        }
      }

      // Fallback: Try API approach if localStorage failed
      if (!sessionFound) {
        console.log('🌐 Fallback: Checking API for session...');
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
                  sessionCode: code.toUpperCase(),
                  name: studentData.name,
                  className: studentData.className
                })
              });

              if (joinResponse.ok) {
                const joinData = await joinResponse.json();
                console.log('✅ Joined session:', joinData);
                
                // CRITICAL: Update student ID immediately after successful join
                if (joinData.student?.id) {
                  console.log('🆔 Updating student ID from', student?.id, 'to', joinData.student.id);
                  setStudent(prev => prev ? { 
                    ...prev, 
                    id: joinData.student.id,
                    sessionId: joinData.student.sessionId 
                  } : null);
                  
                  // Also update the studentData parameter for immediate use
                  studentData.id = joinData.student.id;
                  console.log('✅ Student ID updated successfully:', joinData.student.id);
                } else {
                  console.error('❌ No student ID returned from join response');
                }

                // Start heartbeat to keep connection alive
                if (joinData.student?.id) {
                  startHeartbeat(code.toUpperCase(), joinData.student.id);
                }
              } else {
                console.error('❌ Session join failed:', joinResponse.status);
                const joinError = await joinResponse.json().catch(() => ({}));
                console.error('❌ Join error details:', joinError);
              }

              // Try to load from Google Drive first (faster)
              console.log('🌐 Trying to load session from Google Drive...');
              try {
                const driveResponse = await fetch(`/api/simple-api/sessions/${code.toUpperCase()}/download-drive`);
                console.log('📡 Google Drive response status:', driveResponse.status);
                
                if (driveResponse.ok) {
                  const sessionData = await driveResponse.json();
                  console.log('📡 Google Drive session data:', sessionData);
                  
                  if (sessionData.exercises && sessionData.exercises.length > 0) {
                    console.log('✅ Session JSON loaded from Google Drive');
                    console.log('📊 Exercise count:', sessionData.exercises.length);
                    
                    // Convert Drive JSON to playlist format - PRESERVE IMAGE URLs
                    const playlist = sessionData.exercises.map((exercise: any) => ({
                      id: exercise.id,
                      fileName: exercise.fileName,
                      imageUrl: exercise.imageUrl || '', // This should contain the base64 image data
                      data: {
                        type: exercise.type,
                        title: exercise.title,
                        instruction: exercise.instruction,
                        content: exercise.content
                      }
                    }));
                    
                    console.log('🖼️ Drive Image check - First exercise imageUrl length:', playlist[0]?.imageUrl?.length || 0);
                    console.log('🖼️ Drive Image check - Has images:', playlist.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length, 'out of', playlist.length);
                    
                    setPlaylist(playlist);
                    setCurrentIndex(0);
                    setCompletedCount(0);
                    
                    // Store session metadata for result submission
                    setCurrentSessionCode(code.toUpperCase());
                    
                    setStep('PLAYING');
                    sessionFound = true;
                  }
                } else {
                  console.log('❌ Session not found on Google Drive, trying API fallback...');
                }
              } catch (driveError) {
                console.warn('⚠️ Google Drive load failed, trying API fallback:', driveError);
              }

              // Fallback to API if Google Drive failed
              if (!sessionFound) {
                console.log('🌐 Checking API for session...');
                // Get exercises from API (now returns full JSON)
                const exercisesResponse = await fetch(`/api/simple-api/sessions/${code.toUpperCase()}/exercises`);
                console.log('📡 API exercises response status:', exercisesResponse.status);
                if (exercisesResponse.ok) {
                  const sessionData = await exercisesResponse.json();
                  console.log('📡 API session data:', sessionData);
                  
                  if (sessionData.exercises && sessionData.exercises.length > 0) {
                    console.log('✅ Session JSON loaded from API');
                    console.log('📊 Exercise count:', sessionData.exercises.length);
                    
                    // Convert API JSON to playlist format - PRESERVE IMAGE URLs
                    const playlist = sessionData.exercises.map((exercise: any) => ({
                      id: exercise.id,
                      fileName: exercise.fileName,
                      imageUrl: exercise.imageUrl || '', // This should contain the base64 image data
                      data: {
                        type: exercise.type,
                        title: exercise.title,
                        instruction: exercise.instruction,
                        content: exercise.content
                      }
                    }));
                    
                    console.log('🖼️ API Image check - First exercise imageUrl length:', playlist[0]?.imageUrl?.length || 0);
                    console.log('🖼️ API Image check - Has images:', playlist.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length, 'out of', playlist.length);
                    
                    setPlaylist(playlist);
                    setCurrentIndex(0);
                    setCompletedCount(0);
                    
                    // Store session metadata for result submission
                    setCurrentSessionCode(code.toUpperCase());
                    
                    setStep('PLAYING');
                    sessionFound = true;
                  } else {
                    console.log('❌ No exercises found in API response');
                  }
                } else {
                  console.log('❌ API exercises request failed');
                }
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
      }

      // If no session found, show error
      if (!sessionFound) {
        throw new Error('A megadott tanári kód nem található vagy a munkamenet nem aktív.\n\n🔄 Lehetséges okok:\n• A munkamenet lejárt (60 perc után)\n• Hibás kód\n• Hálózati probléma\n• Adatbázis nem elérhető\n\n💡 Megoldás: Kérj új kódot a tanártól!');
      }
      
    } catch (error) {
      console.error('❌ Error loading session exercises:', error);
      setError("A megadott tanári kód nem található vagy a munkamenet nem aktív. Kérj új kódot a tanártól!");
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

  // JSON import for offline sessions
  const handleJsonImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        let importedExercises: BulkResultItem[] = [];
        
        // Handle different JSON formats (same as AdvancedLibraryManager)
        if (Array.isArray(parsedData)) {
          // Direct array of BulkResultItem
          if (parsedData.length > 0 && parsedData[0].data) {
            importedExercises = parsedData as BulkResultItem[];
          }
        } else if (parsedData.exercises && Array.isArray(parsedData.exercises)) {
          // Collection format
          importedExercises = parsedData.exercises as BulkResultItem[];
        } else if (parsedData.collection && parsedData.exercises) {
          // Full collection export format
          importedExercises = parsedData.exercises as BulkResultItem[];
        }
        
        if (importedExercises.length > 0) {
          console.log('📁 JSON munkamenet betöltve:', importedExercises.length, 'feladat');
          
          // Set up offline session
          setPlaylist(importedExercises);
          setCurrentIndex(0);
          setCompletedCount(0);
          
          // Set student info for offline mode
          setStudent({
            id: 'offline-' + Date.now(),
            name: 'Offline Diák',
            className: 'JSON Import'
          });
          
          setStep('PLAYING');
        } else {
          setError("Hibás fájlformátum. Csak érvényes feladat JSON fájlokat lehet importálni.");
        }
      } catch (err) {
        console.error('JSON import error:', err);
        setError("Hiba a fájl beolvasásakor. Ellenőrizd, hogy érvényes JSON fájl-e.");
      }
    };
    
    reader.onerror = () => {
      setError("Fájl olvasási hiba");
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
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
      console.log('🎯 handleExerciseComplete called with:', { isCorrect, score, timeSpent, hasAnswer: !!answer });
      console.log('🔍 Current state:', {
        isPreviewMode,
        currentSessionCode,
        studentId: student?.id,
        studentName: student?.name,
        currentIndex,
        playlistLength: playlist.length
      });
      
      // Skip saving in preview mode
      if (isPreviewMode) {
        console.log('🔍 Preview mode: skipping result save');
        setCompletedCount(prev => prev + 1);
        
        // Move to next exercise or finish
        if (currentIndex < playlist.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setStep('RESULT');
        }
        return;
      }

      // Submit result to API if connected
      console.log('📤 About to submit exercise result:', { currentIndex, isCorrect, score, timeSpent });
      console.log('📤 Session info:', { currentSessionCode, studentId: student?.id });
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
          const exerciseData = getExerciseData(currentExercise);
          const resultData = {
            studentName: student.name,
            studentClass: student.className,
            exerciseTitle: exerciseData.title,
            exerciseType: exerciseData.type,
            exerciseContent: exerciseData.content, // Save the questions/content
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
          // Session completed - just mark as completed, don't resend all results
          if (student && currentSessionCode) {
            try {
              // Just mark the session as completed for this student
              if (student.id && student.id !== 'offline-' && !student.id.startsWith('student_')) {
                try {
                  const completionResponse = await fetch(`/api/simple-api/sessions/${currentSessionCode}/results`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      studentId: student.id,
                      results: [], // Empty results, just marking completion
                      summary: {
                        studentName: student.name,
                        studentClass: student.className,
                        sessionCode: currentSessionCode,
                        totalExercises: playlist.length,
                        completedExercises: playlist.length, // All exercises completed
                        totalScore: 0, // Don't add any more score
                        completedAt: new Date().toISOString()
                      }
                    })
                  });
                  
                  if (completionResponse.ok) {
                    console.log('✅ Session completion marked successfully');
                  }
                } catch (error) {
                  console.warn('⚠️ Failed to mark session completion:', error);
                }
              }
              
              // Also save locally (fallback)
              const sessionKey = `session_${currentSessionCode}_results`;
              const existingResults = localStorage.getItem(sessionKey);
              const results = existingResults ? JSON.parse(existingResults) : [];
              
              const summary = {
                studentName: student.name,
                studentClass: student.className,
                sessionCode: currentSessionCode,
                totalExercises: playlist.length,
                completedExercises: playlist.length,
                totalScore: results.reduce((sum: number, r: any) => sum + (r.score || 0), 0),
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
                summaries[existingIndex] = summary;
              } else {
                summaries.push(summary);
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
          return (
            <>
              <StudentLoginForm 
                onLoginSuccess={handleStudentLogin} 
                onBack={onExit} 
                onJsonImport={handleJsonImport}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                style={{ display: 'none' }}
              />
            </>
          );
      } else {
          // In teacher mode, also show login form
          return (
            <>
              <StudentLoginForm 
                onLoginSuccess={handleStudentLogin} 
                onBack={onExit} 
                onJsonImport={handleJsonImport}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                style={{ display: 'none' }}
              />
            </>
          );
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

      const exerciseData = getExerciseData(currentItem);
      const progress = ((currentIndex + 1) / playlist.length) * 100;
      const uniqueKey = `${currentItem.id}-${currentIndex}`; // Force re-render on change

      return (
          <div className={`${isStudentMode && !isPreviewMode ? 'h-screen' : 'h-[calc(100vh-80px)]'} flex flex-col lg:flex-row overflow-hidden`}>
              {/* Left Side: Original Image - Optimized for 15.6" monitors */}
              <div className="lg:w-2/5 h-[35vh] lg:h-full bg-slate-900 relative border-b lg:border-b-0 lg:border-r border-slate-700 order-1 lg:order-1">
                   {getImageUrl(currentItem) ? (
                        <ImageViewer 
                          src={getImageUrl(currentItem)} 
                          alt="Feladat forrása"
                          studentMode={true}
                          // No onImageUpdate in student mode - students can't edit exercises
                        />
                   ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📷</div>
                            <div>Kép betöltése...</div>
                            <div className="text-xs mt-1">Próbáld újra később</div>
                          </div>
                        </div>
                   )}
                   <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        Forrás: {currentItem.fileName}
                   </div>
              </div>

              {/* Right Side: Exercise - Optimized for 15.6" monitors */}
              <div className="lg:w-3/5 h-[65vh] lg:h-full bg-slate-50 overflow-y-auto order-2 lg:order-2 relative">
                  <div className="max-w-2xl mx-auto">
                      {/* Exercise Header - Always Visible */}
                      <div className="sticky top-0 z-20 bg-slate-50 p-2 pb-1 border-b border-slate-200 mb-2 shadow-sm opacity-95 backdrop-blur">
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                  <span className="font-bold text-purple-900 text-sm">
                                      {isPreviewMode ? 'Feladat Előnézet' : 'Napi Kihívás'}
                                  </span>
                                  {isPreviewMode && (
                                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                          Tanári előnézet
                                      </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">{student?.name} - {student?.className}</span>
                                  {/* Offline Mode Warning */}
                                  {student && (!currentSessionCode || student.id.startsWith('student_') || student.id.startsWith('offline-')) && (
                                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium" title="Az eredmények nem kerülnek mentésre">
                                          ⚠️ Offline
                                      </span>
                                  )}
                                  {/* Online Mode Indicator */}
                                  {student && currentSessionCode && !student.id.startsWith('student_') && !student.id.startsWith('offline-') && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium" title="Az eredmények mentésre kerülnek">
                                          ✅ Online
                                      </span>
                                  )}
                                  <button
                                      onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          onExit();
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                                      title="Bezárás"
                                  >
                                      <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                  </button>
                              </div>
                          </div>
                          
                          <div className="w-full bg-slate-200 rounded-full h-1 mb-2">
                              <div className="bg-purple-600 h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                          </div>

                          {/* Exercise Info with Better Styling */}
                          <div className="bg-white rounded-lg p-2 border border-slate-200">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feladat {currentIndex + 1} / {playlist.length}</span>
                                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{exerciseData.type}</span>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 mb-2 leading-tight">{exerciseData.title}</h3>
                          </div>
                      </div>

                      {/* Task Description Block - Separate with Different Background */}
                      <div className="mx-2 mb-3">
                          {/* Offline Mode Warning */}
                          {student && (!currentSessionCode || student.id.startsWith('student_') || student.id.startsWith('offline-')) && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 shadow-sm">
                                  <div className="flex items-start gap-2">
                                      <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"/>
                                      </svg>
                                      <div className="flex-1">
                                          <div className="text-orange-800 font-medium text-sm">⚠️ Offline mód</div>
                                          <div className="text-orange-700 text-xs mt-1 mb-2">
                                              Az eredményeid nem kerülnek mentésre. Csatlakozz újra a munkamenethez az eredmények mentéséhez.
                                          </div>
                                          <button
                                              onClick={async () => {
                                                  if (currentSessionCode && student) {
                                                      console.log('🔄 Manual reconnection attempt...');
                                                      try {
                                                          const rejoinResponse = await fetch(`/api/simple-api/sessions/join`, {
                                                              method: 'POST',
                                                              headers: { 'Content-Type': 'application/json' },
                                                              body: JSON.stringify({
                                                                  sessionCode: currentSessionCode,
                                                                  name: student.name,
                                                                  className: student.className
                                                              })
                                                          });
                                                          
                                                          if (rejoinResponse.ok) {
                                                              const rejoinData = await rejoinResponse.json();
                                                              if (rejoinData.student?.id && !rejoinData.student.id.startsWith('student_') && !rejoinData.student.id.startsWith('offline-')) {
                                                                  console.log('✅ Manual reconnection successful!');
                                                                  setStudent(prev => prev ? {
                                                                      ...prev,
                                                                      id: rejoinData.student.id,
                                                                      sessionId: rejoinData.student.sessionId
                                                                  } : null);
                                                              }
                                                          }
                                                      } catch (error) {
                                                          console.error('❌ Manual reconnection failed:', error);
                                                      }
                                                  }
                                              }}
                                              className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full hover:bg-orange-700 transition-colors"
                                          >
                                              🔄 Újracsatlakozás
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          )}
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                              <div className="flex items-start gap-2">
                                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                  <div className="text-blue-800 font-medium text-sm leading-relaxed">
                                      {exerciseData.instruction}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Scrollable Content - More Compact */}
                      <div className="p-4 pt-0">
                          {/* Render Dynamic Component based on Type */}
                          {exerciseData.type === ExerciseType.MATCHING && (
                              <MatchingExercise 
                                key={uniqueKey}
                                content={exerciseData.content as MatchingContent}
                                onComplete={() => {}} // Handled by Next button
                                onNext={(isCorrect, score, timeSpent, answer) => handleExerciseComplete(isCorrect, score, timeSpent, answer)} 
                              />
                          )}
                          
                          {exerciseData.type === ExerciseType.CATEGORIZATION && (
                              <CategorizationExercise
                                key={uniqueKey}
                                content={exerciseData.content as CategorizationContent}
                                onComplete={() => {}} 
                                onNext={(isCorrect, score, timeSpent, answer) => handleExerciseComplete(isCorrect, score, timeSpent, answer)}
                              />
                          )}

                          {exerciseData.type === ExerciseType.QUIZ && (
                              <QuizExercise
                                key={uniqueKey}
                                content={exerciseData.content as QuizContent}
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
              {isPreviewMode ? '👁️' : '🏆'}
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {isPreviewMode ? 'Előnézet befejezve!' : `Szép munka, ${student?.name}!`}
          </h2>
          <p className="text-slate-500 mb-8">
              {isPreviewMode 
                  ? 'A feladat előnézete véget ért. Szerkesztheted a feladatot a könyvtárban.' 
                  : 'A mai gyakorlás véget ért. Az eredmények automatikusan mentve lettek.'
              }
          </p>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
              <div className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">
                  {isPreviewMode ? 'Megtekintve' : 'Teljesítve'}
              </div>
              <div className="text-5xl font-black text-purple-600">{completedCount} <span className="text-2xl text-slate-400 font-medium">/ {playlist.length}</span></div>
              <div className="text-sm font-medium text-slate-600 mt-2">
                  {isPreviewMode ? 'feladat megtekintve' : 'feladat sikeresen megoldva'}
              </div>
          </div>

          {!isPreviewMode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span className="font-medium">Eredmények mentve!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">A tanár láthatja a teljesítményedet a munkamenet kezelőben.</p>
              </div>
          )}

          {isPreviewMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                      <span className="font-medium">Szerkesztés elérhető!</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">A könyvtárban szerkesztheted a feladat tartalmát és képét.</p>
              </div>
          )}

          <button onClick={onExit} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02]">
              {isPreviewMode ? 'Vissza a könyvtárba' : 'Vissza a főoldalra'}
          </button>

      </div>
  );
};

export default DailyChallenge;
