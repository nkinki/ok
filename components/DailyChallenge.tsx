
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

  // Helper function to get image URL (with enhanced debugging and fallbacks)
  const getImageUrl = (item) => {
    console.log('🖼️ getImageUrl called for item:', {
      id: item?.id,
      hasImageUrl: !!item?.imageUrl,
      imageUrlLength: item?.imageUrl?.length || 0,
      imageUrlPreview: item?.imageUrl?.substring(0, 50) || 'none'
    });
    
    // If imageUrl is directly available, use it
    if (item.imageUrl && item.imageUrl.length > 100) { // Minimum length check
      console.log('✅ Direct imageUrl found for item:', item.id);
      console.log('🎯 RETURNING IMAGE URL:', {
        length: item.imageUrl.length,
        isBase64: item.imageUrl.startsWith('data:'),
        preview: item.imageUrl.substring(0, 100) + '...'
      });
      return item.imageUrl;
    }
    
    // Check if imageUrl exists but is too short (corrupted)
    if (item.imageUrl && item.imageUrl.length <= 100) {
      console.warn('⚠️ ImageUrl exists but is too short (corrupted?):', item.imageUrl.length, 'chars');
    }
    
    console.log('⚠️ No valid direct imageUrl for item:', item.id, '- trying localStorage fallback...');
    
    // For optimized format without imageUrl, try to construct from localStorage
    // This is a fallback for exercises that were created before the optimization
    const libraryKey = 'exerciseLibrary';
    try {
      const savedLibrary = localStorage.getItem(libraryKey);
      if (savedLibrary) {
        const library = JSON.parse(savedLibrary);
        const foundItem = library.find((libItem) => libItem.id === item.id);
        if (foundItem && foundItem.imageUrl && foundItem.imageUrl.length > 100) {
          console.log('✅ Found valid imageUrl in localStorage for item:', item.id);
          return foundItem.imageUrl;
        } else {
          console.log('❌ Item not found in localStorage or imageUrl invalid:', item.id);
        }
      } else {
        console.log('❌ No exerciseLibrary in localStorage');
      }
    } catch (error) {
      console.warn('❌ localStorage fallback error for item:', item.id, error);
    }
    
    // Try to get from current session data as last resort
    try {
      const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('session_') && !key.includes('_results'));
      for (const sessionKey of sessionKeys) {
        const sessionDataStr = localStorage.getItem(sessionKey);
        if (sessionDataStr) {
          const sessionData = JSON.parse(sessionDataStr);
          if (sessionData && sessionData.exercises) {
            const foundExercise = sessionData.exercises.find(ex => ex.id === item.id);
            if (foundExercise && foundExercise.imageUrl && foundExercise.imageUrl.length > 100) {
              console.log('✅ Found imageUrl in session data for item:', item.id);
              return foundExercise.imageUrl;
            }
          }
        }
      }
    } catch (error) {
      console.warn('❌ Session data fallback error:', error);
    }
    
    console.error('❌ NO VALID IMAGE FOUND for item:', item.id, '- this will cause "blind" exercise!');
    console.error('🔍 Debug info:', {
      itemKeys: Object.keys(item || {}),
      itemImageUrl: item?.imageUrl ? `${item.imageUrl.length} chars` : 'missing',
      localStorageKeys: Object.keys(localStorage).filter(k => k.includes('session') || k.includes('exercise'))
    });
    
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

  // Student mode fullscreen handler - hide browser chrome
  useEffect(() => {
    if (isStudentMode && !isPreviewMode && step === 'PLAYING') {
      // Change page title to something shorter for student mode
      const originalTitle = document.title;
      document.title = "Feladat";
      
      // Add class to body to prevent browser chrome
      document.body.classList.add('student-fullscreen');
      
      // Request fullscreen API to completely hide browser chrome
      const requestFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          } else if ((document.documentElement as any).msRequestFullscreen) {
            await (document.documentElement as any).msRequestFullscreen();
          }
        } catch (error) {
          console.log('Fullscreen request failed:', error);
        }
      };
      
      // Auto-request fullscreen after a short delay
      const fullscreenTimeout = setTimeout(requestFullscreen, 1000);
      
      // Prevent context menu on right click
      const preventContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };
      
      // Prevent text selection
      const preventSelection = (e: Event) => {
        // Allow drag for exercise elements (categorization, matching)
        const target = e.target as HTMLElement;
        if (target && (
          target.closest('[draggable="true"]') || 
          target.hasAttribute('draggable') ||
          target.closest('.exercise-drag-item') ||
          target.closest('.categorization-item') ||
          target.closest('.matching-item')
        )) {
          return; // Allow drag for exercise elements
        }
        e.preventDefault();
        return false;
      };
      
      document.addEventListener('contextmenu', preventContextMenu);
      document.addEventListener('selectstart', preventSelection);
      document.addEventListener('dragstart', preventSelection);
      
      // Hide cursor after inactivity
      let cursorTimeout: NodeJS.Timeout;
      const hideCursor = () => {
        document.body.style.cursor = 'none';
      };
      
      const showCursor = () => {
        document.body.style.cursor = 'default';
        clearTimeout(cursorTimeout);
        cursorTimeout = setTimeout(hideCursor, 3000);
      };
      
      document.addEventListener('mousemove', showCursor);
      showCursor();
      
      return () => {
        // Restore original title
        document.title = originalTitle;
        
        document.body.classList.remove('student-fullscreen');
        document.body.style.cursor = 'default';
        document.removeEventListener('contextmenu', preventContextMenu);
        document.removeEventListener('selectstart', preventSelection);
        document.removeEventListener('dragstart', preventSelection);
        document.removeEventListener('mousemove', showCursor);
        clearTimeout(cursorTimeout);
        clearTimeout(fullscreenTimeout);
        
        // Exit fullscreen when leaving student mode
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      };
    }
  }, [isStudentMode, isPreviewMode, step]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentSessionCode, setCurrentSessionCode] = useState<string | null>(sessionCode || null);
  
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set()); // Track completed exercises
  const [finalPercentage, setFinalPercentage] = useState<number | null>(null);
  const [showPercentage, setShowPercentage] = useState(false);
  const [calculatingPercentage, setCalculatingPercentage] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Initialize playlist in preview mode
  useEffect(() => {
    if (isPreviewMode && library.length > 0) {
      console.log('🔍 Preview mode: initializing playlist with library item');
      setPlaylist(library);
      setCurrentIndex(0);
      setCompletedCount(0);
      setCompletedExercises(new Set()); // Reset completed exercises
    }
  }, [isPreviewMode, library]);

  // Calculate final percentage when step changes to RESULT
  useEffect(() => {
    if (step === 'RESULT' && !isPreviewMode && playlist.length > 0 && !finalPercentage) {
      console.log('📊 Calculating final percentage for results...');
      setCalculatingPercentage(true); // Set calculating state to hide temporary screen
      
      let totalQuestions = 0;
      let totalScore = 0;
      
      // Calculate total questions from all exercises
      playlist.forEach(exercise => {
        const exerciseData = getExerciseData(exercise);
        if (exerciseData.type === 'QUIZ') {
          totalQuestions += exerciseData.content?.questions?.length || 0;
        } else if (exerciseData.type === 'MATCHING') {
          totalQuestions += exerciseData.content?.pairs?.length || 0;
        } else if (exerciseData.type === 'CATEGORIZATION') {
          totalQuestions += exerciseData.content?.items?.length || 0;
        }
      });
      
      // FIXED: Get score from API instead of localStorage to avoid accumulation
      if (student && currentSessionCode && student.id && !student.id.startsWith('offline-') && !student.id.startsWith('student_')) {
        console.log('📊 Fetching final score from API for accurate percentage...');
        
        // Try to get the actual score from the API
        fetch(`/api/simple-api/sessions/${currentSessionCode}/participants`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.participants) {
              const currentStudent = data.participants.find(p => p.id === student.id);
              if (currentStudent) {
                totalScore = currentStudent.total_score || 0;
                console.log('📊 Final score from API:', {
                  totalQuestions,
                  totalScore,
                  maxPossibleScore: totalQuestions * 10,
                  apiPercentage: currentStudent.percentage
                });
                
                // Use the API calculated percentage for consistency
                const percentage = currentStudent.percentage || 0;
                
                console.log('🎯 Final percentage from API:', percentage + '%');
                
                // Set both states simultaneously to prevent flashing
                setFinalPercentage(percentage);
                setShowPercentage(true);
                setCalculatingPercentage(false);
                
                // Show percentage overlay immediately (no auto-hide)
                // User can interact with leaderboard and retry options
              } else {
                console.warn('⚠️ Student not found in API participants');
                // Fallback to localStorage calculation
                fallbackToLocalStorage();
              }
            } else {
              console.warn('⚠️ API participants fetch failed, using localStorage fallback');
              fallbackToLocalStorage();
            }
          })
          .catch(error => {
            console.error('❌ Error fetching from API, using localStorage fallback:', error);
            fallbackToLocalStorage();
          });
      } else {
        // Offline mode or no proper student ID - use localStorage
        console.log('📊 Using localStorage for offline/preview mode');
        fallbackToLocalStorage();
      }
      
      // Fallback function for localStorage calculation
      function fallbackToLocalStorage() {
        try {
          const sessionKey = `session_${currentSessionCode}_results`;
          const existingResults = localStorage.getItem(sessionKey);
          const results = existingResults ? JSON.parse(existingResults) : [];
          
          totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
          
          console.log('📊 Final score calculation (localStorage fallback):', {
            totalQuestions,
            totalScore,
            maxPossibleScore: totalQuestions * 10,
            results: results.length
          });
          
          // Calculate percentage
          const percentage = totalQuestions > 0 ? Math.round((totalScore / (totalQuestions * 10)) * 100) : 0;
          
          console.log('🎯 Final percentage calculated (localStorage):', percentage + '%');
          
          // Set both states simultaneously to prevent flashing
          setFinalPercentage(percentage);
          setShowPercentage(true);
          setCalculatingPercentage(false);
          
          // Show percentage overlay immediately (no auto-hide)
          // User can interact with leaderboard and retry options
          
        } catch (error) {
          console.error('Error calculating final percentage:', error);
        }
      }
    }
  }, [step, isPreviewMode, playlist, finalPercentage, student, currentSessionCode]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(0); // Force image refresh

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

    // Check if student ID looks like an offline ID - try to reconnect AUTOMATICALLY
    if (student.id.startsWith('student_') || student.id.startsWith('offline-')) {
      console.log('🔄 Student has offline ID, attempting SILENT automatic reconnection:', student.id);
      
      // Try to rejoin the session automatically (no user interaction needed)
      try {
        console.log('🔄 Silent automatic reconnection in progress...');
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
            console.log('✅ Silent automatic reconnection successful! New ID:', rejoinData.student.id);
            
            // Update student with new ID SILENTLY
            const updatedStudent = {
              ...student,
              id: rejoinData.student.id,
              sessionId: rejoinData.student.sessionId
            };
            
            setStudent(updatedStudent);
            
            // Continue with result submission using new ID directly
            console.log('🔄 Continuing with result submission using new ID...');
            // Use the updated student object directly instead of relying on state
            await submitResultWithStudent(exerciseIndex, isCorrect, score, timeSpent, answer, updatedStudent);
            return;
          }
        }
      } catch (reconnectError) {
        console.error('❌ Silent automatic reconnection failed:', reconnectError);
      }
      
      console.warn('⚠️ Student remains offline - results will not be saved to server');
      console.warn('⚠️ But exercise will continue normally');
      // Don't return here - let the exercise continue even if offline
    }

    // Submit with current student
    await submitResultWithStudent(exerciseIndex, isCorrect, score, timeSpent, answer, student);
  };

  // Helper function to submit results with a specific student object
  const submitResultWithStudent = async (exerciseIndex: number, isCorrect: boolean, score: number, timeSpent: number, answer: any, studentObj: any) => {
    try {
      console.log('📊 Submitting result to API:', { studentId: studentObj.id, exerciseIndex, isCorrect, score, timeSpent });
      
      const payload = {
        studentId: studentObj.id,
        results: [{
          exerciseIndex,
          isCorrect,
          score,
          timeSpent,
          answer,
          completedAt: new Date().toISOString()
        }],
        summary: {
          studentName: studentObj.name,
          studentClass: studentObj.className,
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

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    if (!currentSessionCode || isPreviewMode) return;
    
    setLoadingLeaderboard(true);
    try {
      const response = await fetch(`/api/simple-api/sessions/${currentSessionCode}/leaderboard`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
        console.log('🏆 Leaderboard loaded:', data.leaderboard);
      } else {
        console.error('Failed to load leaderboard:', data.error);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Download leaderboard in different formats
  const downloadLeaderboard = (format: 'txt' | 'csv') => {
    if (leaderboard.length === 0) {
      alert('Nincs adat a letöltéshez!');
      return;
    }

    const sessionInfo = `Munkamenet: ${currentSessionCode}\nDátum: ${new Date().toLocaleString('hu-HU')}\nRésztvevők száma: ${leaderboard.length}\n\n`;
    
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'txt') {
      content = sessionInfo + 'RANGLISTA\n' + '='.repeat(50) + '\n\n';
      leaderboard.forEach((participant, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        content += `${medal} ${participant.name} - ${participant.percentage}%\n`;
      });
      filename = `ranglista_${currentSessionCode}_${new Date().toISOString().slice(0,10)}.txt`;
      mimeType = 'text/plain;charset=utf-8';
    } else if (format === 'csv') {
      content = sessionInfo.replace(/\n/g, '\r\n');
      content += 'Helyezés,Név,Százalék,Osztály\r\n';
      leaderboard.forEach((participant, index) => {
        const rank = index + 1;
        content += `${rank},"${participant.name}",${participant.percentage}%,"${participant.className || 'N/A'}"\r\n`;
      });
      filename = `ranglista_${currentSessionCode}_${new Date().toISOString().slice(0,10)}.csv`;
      mimeType = 'text/csv;charset=utf-8';
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStudentLogin = async (studentData: Student, code: string) => {
    setStudent(studentData);
    setCurrentSessionCode(code);
    setLoading(true);
    setError(null);

    // CRITICAL DEBUG: Log the exact session code being used
    console.log('🎯 STUDENT LOGIN - Session code being used:', code.toUpperCase());
    console.log('🎯 STUDENT LOGIN - Student data:', { name: studentData.name, className: studentData.className });

    // CRITICAL DEBUG: Check what's in localStorage
    console.log('🎯 CRITICAL DEBUG - All localStorage keys:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('session') || key.includes('exercise'))) {
        const value = localStorage.getItem(key);
        console.log(`  ${key}: ${value ? value.length + ' chars' : 'null'}`);
      }
    }

    // CLEAR localStorage results for this session to prevent accumulation
    const sessionKey = `session_${code.toUpperCase()}_results`;
    localStorage.removeItem(sessionKey);
    console.log('🧹 Cleared localStorage results for session:', code.toUpperCase());

    try {
      let sessionFound = false;

      // FIRST: Try Google Drive (with images)
      console.log('🌐 Trying to load session from Google Drive first...');
      try {
        const driveResponse = await fetch(`/api/simple-api/sessions/${code.toUpperCase()}/download-drive`);
        console.log('📡 Google Drive response status:', driveResponse.status);
        
        if (driveResponse.ok) {
          const sessionData = await driveResponse.json();
          console.log('📡 Google Drive session data loaded');
          
          if (sessionData.exercises && sessionData.exercises.length > 0) {
            console.log('✅ Session JSON loaded from Google Drive with images');
            console.log('📊 Exercise count:', sessionData.exercises.length);
            
            // Convert to playlist format
            const playlist = sessionData.exercises.map((exercise: any) => ({
              id: exercise.id,
              fileName: exercise.fileName || exercise.title,
              imageUrl: exercise.imageUrl || '', // Google Drive has full images
              type: exercise.type,
              title: exercise.title,
              instruction: exercise.instruction,
              content: exercise.content,
              data: {
                type: exercise.type,
                title: exercise.title,
                instruction: exercise.instruction,
                content: exercise.content
              }
            }));

            console.log('🖼️ Image check - First exercise imageUrl length:', playlist[0]?.imageUrl?.length || 0);
            console.log('🖼️ Image check - Has images:', playlist.filter(ex => ex.imageUrl).length, 'out of', playlist.length);
            
            setPlaylist(playlist);
            setCurrentIndex(0);
            setCompletedCount(0);
            setCompletedExercises(new Set());
            setStep('PLAYING');
            sessionFound = true;
          }
        } else {
          console.log('❌ Session not found on Google Drive, trying database JSON fallback...');
        }
      } catch (driveError) {
        console.warn('⚠️ Google Drive load failed, trying database JSON fallback:', driveError);
      }

      // FALLBACK: Try database JSON (without images) only if Google Drive failed
      if (!sessionFound) {
        console.log('☁️ Checking database for session JSON (fallback without images)...');
        console.log('🎯 CRITICAL DEBUG - Session code for API call:', code.toUpperCase());
        try {
          const cloudResponse = await fetch(`/api/simple-api/sessions/${code.toUpperCase()}/download-json`);
          console.log('🎯 CRITICAL DEBUG - API response status:', cloudResponse.status);
          console.log('🎯 CRITICAL DEBUG - API response URL:', cloudResponse.url);
          
          if (cloudResponse.ok) {
            const sessionData = await cloudResponse.json();
            console.log('✅ Session data downloaded from database JSON (fallback)');
            console.log('🎯 CRITICAL DEBUG - Session data structure:', {
              hasExercises: !!sessionData.exercises,
              exerciseCount: sessionData.exercises?.length || 0,
              sessionCode: sessionData.sessionCode || 'not set',
              firstExerciseId: sessionData.exercises?.[0]?.id || 'none'
            });
            console.log('📊 Exercise count:', sessionData.exercises?.length || 0);
            
            // Convert database JSON to playlist format - USE NEW FORMAT [DEBUG v3.0]
            console.log('🔍 CONVERSION STARTING - Raw sessionData.exercises:', sessionData.exercises?.length || 0);
            
            const playlist = sessionData.exercises.map((exercise: any, index: number) => {
              // DEBUG: Log the raw exercise data to see what we're working with
              console.log(`🔍 Raw exercise ${index} data [v3.0]:`, {
                id: exercise.id,
                hasImageUrl: exercise.hasOwnProperty('imageUrl'),
                imageUrlType: typeof exercise.imageUrl,
                imageUrlLength: exercise.imageUrl?.length || 0,
                imageUrlTruthy: !!exercise.imageUrl,
                imageUrlPreview: exercise.imageUrl ? exercise.imageUrl.substring(0, 50) + '...' : 'NONE',
                allKeys: Object.keys(exercise)
              });
              
              const mappedExercise = {
                id: exercise.id,
                fileName: exercise.fileName || exercise.title,
                imageUrl: exercise.imageUrl || '', // This should contain the base64 image data
                // NEW FORMAT: properties directly on the object
                type: exercise.type,
                title: exercise.title,
                instruction: exercise.instruction,
                content: exercise.content,
                // OLD FORMAT: keep for compatibility
                data: {
                  type: exercise.type,
                  title: exercise.title,
                  instruction: exercise.instruction,
                  content: exercise.content
                }
              };
            
            // DEBUG: Log the mapped result
            console.log(`🔍 Mapped exercise ${index} result [v3.0]:`, {
              id: mappedExercise.id,
              hasImageUrl: !!mappedExercise.imageUrl,
              imageUrlLength: mappedExercise.imageUrl?.length || 0,
              imageUrlPreview: mappedExercise.imageUrl ? mappedExercise.imageUrl.substring(0, 50) + '...' : 'NONE'
            });
            
            return mappedExercise;
          });
          
          console.log('🖼️ Image check - First exercise imageUrl length:', playlist[0]?.imageUrl?.length || 0);
          console.log('🖼️ Image check - Has images:', playlist.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length, 'out of', playlist.length);
          
          // DEBUG: Log all exercises and their image status
          console.log('🔍 All exercises image status:');
          playlist.forEach((ex, index) => {
            console.log(`  Exercise ${index}: ${ex.id} - imageUrl: ${ex.imageUrl ? ex.imageUrl.length + ' chars' : 'MISSING'}`);
          });
          console.log('📝 Playlist format check - First exercise:', {
            hasType: !!playlist[0]?.type,
            hasTitle: !!playlist[0]?.title,
            hasContent: !!playlist[0]?.content,
            hasData: !!playlist[0]?.data
          });
          
          setPlaylist(playlist);
          setCurrentIndex(0);
          setCompletedCount(0);
          setCompletedExercises(new Set()); // Reset completed exercises for new session
          setStep('PLAYING');
          sessionFound = true;
          
          console.log('🎯 Session loaded from database JSON with', playlist.length, 'exercises');
          
          // AUTOMATIC JOIN: Try to join session for statistics (and get proper student ID)
          try {
            console.log('🔄 Attempting automatic session join...');
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
              if (joinData.student?.id && !joinData.student.id.startsWith('student_') && !joinData.student.id.startsWith('offline-')) {
                console.log('✅ Automatic session join successful! Student ID:', joinData.student.id);
                
                // Update student with proper ID immediately
                setStudent(prev => prev ? {
                  ...prev,
                  id: joinData.student.id,
                  sessionId: joinData.student.sessionId
                } : null);
                
                // Update the original studentData as well
                studentData.id = joinData.student.id;
                
                console.log('📊 Student now has proper online ID for result submission');
              } else {
                console.warn('⚠️ Join response did not provide proper student ID');
              }
            } else {
              console.warn('⚠️ Automatic session join failed, student will be in offline mode');
            }
          } catch (joinError) {
            console.warn('⚠️ Could not join for statistics (continuing anyway):', joinError);
          }
        } else {
          console.log('⚠️ Database JSON download failed, trying localStorage...');
          console.log('🎯 CRITICAL DEBUG - Failed response details:', {
            status: cloudResponse.status,
            statusText: cloudResponse.statusText,
            url: cloudResponse.url
          });
        }
      } catch (cloudError) {
        console.warn('⚠️ Database JSON error, trying localStorage:', cloudError);
      }

      // Fallback 1: Try localStorage (same device)
      if (!sessionFound) {
        console.log('💾 Checking localStorage for session data...');
        console.log('🎯 CRITICAL DEBUG - Looking for localStorage key:', `session_${code.toUpperCase()}`);
        
        const sessionKey = `session_${code.toUpperCase()}`;
        const localSessionData = localStorage.getItem(sessionKey);
        
        console.log('🎯 CRITICAL DEBUG - localStorage data found:', !!localSessionData);
        if (localSessionData) {
          console.log('🎯 CRITICAL DEBUG - localStorage data length:', localSessionData.length);
        }
        
        if (localSessionData) {
          try {
            const sessionData = JSON.parse(localSessionData);
            console.log('✅ Session data found in localStorage');
            console.log('📊 Exercise count:', sessionData.exercises?.length || 0);
            
            // Convert localStorage JSON to playlist format - USE NEW FORMAT
            const playlist = sessionData.exercises.map((exercise: any) => ({
              id: exercise.id,
              fileName: exercise.fileName,
              imageUrl: exercise.imageUrl || '', // This should contain the base64 image data
              // NEW FORMAT: properties directly on the object
              type: exercise.type,
              title: exercise.title,
              instruction: exercise.instruction,
              content: exercise.content,
              // OLD FORMAT: keep for compatibility
              data: {
                type: exercise.type,
                title: exercise.title,
                instruction: exercise.instruction,
                content: exercise.content
              }
            }));
            
            console.log('🖼️ localStorage Image check - First exercise imageUrl length:', playlist[0]?.imageUrl?.length || 0);
            console.log('🖼️ localStorage Image check - Has images:', playlist.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length, 'out of', playlist.length);
            console.log('📝 localStorage Playlist format check - First exercise:', {
              hasType: !!playlist[0]?.type,
              hasTitle: !!playlist[0]?.title,
              hasContent: !!playlist[0]?.content,
              hasData: !!playlist[0]?.data
            });
            
            setPlaylist(playlist);
            setCurrentIndex(0);
            setCompletedCount(0);
            setCompletedExercises(new Set()); // Reset completed exercises for new session
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
                    setCompletedExercises(new Set()); // Reset completed exercises for new session
                    
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
            } // Close the if (data.exists) block
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
      } // Added missing closing brace
      
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
    setCompletedExercises(new Set()); // Reset completed exercises for fallback
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
          setCompletedExercises(new Set()); // Reset completed exercises for imported session;
          
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
      setCompletedExercises(new Set()); // Reset completed exercises for manual session
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
        playlistLength: playlist.length,
        isAlreadyCompleted: completedExercises.has(currentIndex)
      });
      
      // PREVENT RE-COMPLETION: If this exercise is already completed, don't allow re-submission
      if (completedExercises.has(currentIndex)) {
        console.log('⚠️ Exercise already completed, preventing re-submission');
        console.log('✅ Moving to next exercise instead');
        
        // Just move to next exercise with safety check
        const nextIndex = currentIndex + 1;
        if (nextIndex < playlist.length) {
          console.log('➡️ Moving to next uncompleted exercise:', nextIndex);
          setCurrentIndex(nextIndex);
        } else {
          console.log('🏁 All exercises completed, showing results');
          setStep('RESULT');
        }
        return;
      }
      
      // Skip saving in preview mode
      if (isPreviewMode) {
        console.log('🔍 Preview mode: skipping result save');
        setCompletedCount(prev => prev + 1);
        setCompletedExercises(prev => new Set([...prev, currentIndex])); // Mark as completed
        
        // Move to next exercise or finish with safety check
        const nextIndex = currentIndex + 1;
        if (nextIndex < playlist.length) {
          console.log('➡️ Preview mode: moving to next exercise:', nextIndex);
          setCurrentIndex(nextIndex);
        } else {
          console.log('🏁 Preview mode: all exercises completed');
          setStep('RESULT');
        }
        return;
      }

      // CRITICAL: Prevent double execution by checking if we're already processing
      if ((window as any).processingExerciseComplete) {
        console.log('⚠️ Exercise completion already in progress, skipping...');
        return;
      }
      
      // Set flag to prevent double execution
      (window as any).processingExerciseComplete = true;

      // Mark this exercise as completed IMMEDIATELY to prevent re-submission
      setCompletedExercises(prev => new Set([...prev, currentIndex]));
      console.log('✅ Exercise marked as completed:', currentIndex);

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
      
      // Safe navigation to next exercise
      console.log('🔄 Navigation check:', {
        currentIndex,
        playlistLength: playlist.length,
        hasNextExercise: currentIndex < playlist.length - 1
      });
      
      if (currentIndex < playlist.length - 1) {
          const nextIndex = currentIndex + 1;
          console.log('➡️ Moving to next exercise:', nextIndex);
          
          // SAFETY CHECK: Ensure next index is valid before setting
          if (nextIndex < playlist.length) {
            setCurrentIndex(nextIndex);
          } else {
            console.error('❌ Next index would be out of bounds!', {
              nextIndex,
              playlistLength: playlist.length
            });
            console.log('🏁 Forcing results display due to bounds error');
            setStep('RESULT');
          }
      } else {
          console.log('🏁 All exercises completed, showing results');
          
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
                totalScore: results.reduce((sum, r) => sum + (r.score || 0), 0),
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
      
      // Clear the processing flag after navigation is complete
      setTimeout(() => {
        (window as any).processingExerciseComplete = false;
      }, 100);
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
      console.log('🎮 PLAYING step - Debug info:', {
        playlistLength: playlist.length,
        currentIndex,
        hasCurrentItem: !!playlist[currentIndex],
        playlistItems: playlist.map((item, index) => ({
          index,
          id: item?.id,
          hasData: !!item?.data,
          hasType: !!item?.type,
          hasTitle: !!item?.title,
          hasContent: !!item?.content
        }))
      });

      // Safety check: if currentIndex is out of bounds, reset to last valid index or show results
      if (currentIndex >= playlist.length) {
        console.error('❌ currentIndex out of bounds!', {
          currentIndex,
          playlistLength: playlist.length,
          playlistIds: playlist.map(p => p?.id || 'no-id')
        });
        
        if (playlist.length > 0) {
          // If we have exercises but index is too high, check if we should show results
          if (currentIndex >= playlist.length) {
            console.log('🏁 Index beyond playlist, showing results');
            setStep('RESULT');
            return null;
          } else {
            // Reset to last valid index
            const lastValidIndex = playlist.length - 1;
            console.log('🔄 Resetting to last valid index:', lastValidIndex);
            setCurrentIndex(lastValidIndex);
            return null; // Re-render with corrected index
          }
        } else {
          // If no exercises at all, show error
          return <div className="p-8 text-center text-red-500">
            Hiba: Nincsenek feladatok a munkamenetben.
            <div className="text-sm mt-2 text-gray-600">
              Debug: playlist üres
            </div>
          </div>;
        }
      }

      const currentItem = playlist[currentIndex];
      
      if (!currentItem) {
          console.error('❌ No current item found!', {
            playlistLength: playlist.length,
            currentIndex,
            playlist: playlist
          });
          return <div className="p-8 text-center text-red-500">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">A feladat nem tölthető be</h3>
            <p className="text-sm text-gray-600 mb-4">
              Hiba történt a feladat betöltésekor. Kérlek próbáld újra!
            </p>
            <button 
              onClick={onExit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Vissza a főoldalra
            </button>
          </div>;
      }

      const exerciseData = getExerciseData(currentItem);
      console.log('📝 Exercise data:', {
        currentIndex,
        itemId: currentItem.id,
        exerciseData,
        hasType: !!exerciseData.type,
        hasTitle: !!exerciseData.title,
        hasContent: !!exerciseData.content
      });

      if (!exerciseData.type || !exerciseData.content) {
          console.error('❌ Invalid exercise data!', {
            exerciseData,
            currentItem
          });
          return <div className="p-8 text-center text-red-500">
            Hiba: A feladat adatai hiányosak.
            <div className="text-sm mt-2 text-gray-600">
              Debug: type={exerciseData.type}, content={!!exerciseData.content}
            </div>
          </div>;
      }

      const progress = ((currentIndex + 1) / playlist.length) * 100;
      const uniqueKey = `${currentItem.id}-${currentIndex}`; // Force re-render on change

      return (
          <div className={`${isStudentMode && !isPreviewMode ? 'h-screen student-fullscreen' : 'h-[calc(100vh-80px)]'} flex flex-col lg:flex-row overflow-hidden relative`}>
              
              {/* Extra Close Button - Always Visible in Top Right Corner */}
              <button
                  onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onExit();
                  }}
                  className="fixed top-4 right-4 z-[100] p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                  title="Bezárás (ESC)"
                  style={{ minWidth: '48px', minHeight: '48px' }}
              >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>

              {/* Left Side: Original Image - Optimized for all screen sizes */}
              <div className="lg:w-2/5 h-[60vh] lg:h-full bg-slate-900 relative border-b lg:border-b-0 lg:border-r border-slate-700 order-1 lg:order-1">
                   {(() => {
                     const imageUrl = getImageUrl(currentItem);
                     console.log('🎯 CRITICAL DEBUG - Image rendering:', {
                       currentItemId: currentItem?.id,
                       hasImageUrl: !!imageUrl,
                       imageUrlLength: imageUrl?.length || 0,
                       imageUrlPreview: imageUrl ? imageUrl.substring(0, 50) + '...' : 'NONE',
                       imageUrlType: typeof imageUrl,
                       willRenderImageViewer: !!imageUrl
                     });
                     
                     if (imageUrl) {
                       console.log('🎯 RENDERING ImageViewer with src length:', imageUrl.length);
                       return (
                         <ImageViewer 
                           key={`${currentItem.id}-${imageRefreshKey}`} // Force re-render on refresh
                           src={imageUrl} 
                           alt="Feladat forrása"
                           studentMode={true}
                           // No onImageUpdate in student mode - students can't edit exercises
                         />
                       );
                     } else {
                       console.log('🎯 CRITICAL DEBUG - No image URL, showing placeholder');
                       return (
                         <div className="w-full h-full flex items-center justify-center text-slate-500">
                           <div className="text-center">
                             <div className="text-4xl mb-2">📷</div>
                             <div className="text-sm font-medium mb-2 text-red-600">⚠️ Kép nem található</div>
                             <div className="text-xs mb-4">
                               A feladat képe nem töltődött be. Próbáld meg újratölteni az oldalt, vagy értesítsd a tanárt.
                             </div>
                             <div className="flex gap-2 justify-center mb-4">
                               <button
                                 onClick={() => {
                                   // Force re-render by updating refresh key
                                   console.log('🔄 Attempting image reload without page refresh...');
                                   setImageRefreshKey(prev => prev + 1);
                                   
                                   // Try to get image again after a short delay
                                   setTimeout(() => {
                                     const newImageUrl = getImageUrl(currentItem);
                                     if (!newImageUrl) {
                                       alert('⚠️ A kép még mindig nem található. Próbáld meg a "Kép keresése" gombot, vagy értesítsd a tanárt!');
                                     }
                                   }, 100);
                                 }}
                                 className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                               >
                                 🔄 Kép újratöltése
                               </button>
                               <button
                                 onClick={() => {
                                   // Try to debug and fix the image
                                   console.log('🔍 Manual image debug for:', currentItem?.id);
                                   const debugUrl = getImageUrl(currentItem);
                                   console.log('🎯 Debug result:', debugUrl ? `${debugUrl.length} chars` : 'still empty');
                                   
                                   if (debugUrl) {
                                     // Force re-render with new image
                                     setImageRefreshKey(prev => prev + 1);
                                     alert('✅ Kép megtalálva! Újratöltés...');
                                   } else {
                                     alert('🔍 Kép keresés eredménye: Nem található érvényes kép.\n\nLehetséges okok:\n• A kép nem lett feltöltve\n• Hálózati probléma\n• Munkamenet lejárt\n\nKérlek értesítsd a tanárt!');
                                   }
                                 }}
                                 className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                               >
                                 🔍 Kép keresése
                               </button>
                             </div>
                             <div className="text-xs mt-2 text-slate-400 bg-slate-100 p-2 rounded">
                               <div>Feladat ID: {currentItem?.id || 'Ismeretlen'}</div>
                               <div>Kép állapot: {imageUrl ? `${imageUrl.length} karakter` : 'Hiányzik'}</div>
                               <div>Fájlnév: {currentItem?.fileName || 'Nincs'}</div>
                             </div>
                           </div>
                         </div>
                       );
                     }
                   })()}
                   <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        Forrás: {currentItem.fileName}
                   </div>
              </div>

              {/* Right Side: Exercise - Optimized for all screen sizes */}
              <div className="lg:w-3/5 h-[40vh] lg:h-full bg-slate-50 order-2 lg:order-2 relative flex flex-col">
                  <div className="max-w-2xl mx-auto flex-1 flex flex-col">
                      {/* Exercise Header - Always Visible */}
                      <div className="flex-shrink-0 bg-white p-2 pb-1 border-b border-slate-200 mb-2 shadow-lg z-50" style={{ position: 'fixed', top: '10px', left: '10px', right: '10px' }}>
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
                                      className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors bg-white shadow-lg border border-gray-200 relative z-50"
                                      title="Bezárás (ESC)"
                                      style={{ minWidth: '40px', minHeight: '40px' }}
                                  >
                                      <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
                                  <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feladat {currentIndex + 1} / {playlist.length}</span>
                                      {completedExercises.has(currentIndex) && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                              ✅ Befejezve
                                          </span>
                                      )}
                                  </div>
                                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{exerciseData.type}</span>
                              </div>
                              <h3 className="text-sm font-bold text-slate-800 mb-2 leading-tight">{exerciseData.title}</h3>
                              {completedExercises.has(currentIndex) && (
                                  <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                      Ez a feladat már be van fejezve. Csak a következő feladatra léphetsz.
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Scrollable Content Container */}
                      <div className="flex-1 overflow-y-auto pt-28">
                          {/* Task Description Block - Separate with Different Background */}
                          <div className="mx-2 mb-3 mt-6">
                              {/* Offline Mode Warning removed - automatic reconnection now works silently */}
                              
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

                          {/* Scrollable Content - More Compact with Bottom Padding for Fixed Buttons */}
                          <div className="p-4 pt-0 pb-24">{/* Added pb-24 (96px) to ensure content is always visible above fixed buttons */}
                          {/* Show "Next Exercise" button if current exercise is completed */}
                          {completedExercises.has(currentIndex) ? (
                              <div className="text-center py-8">
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                                      <div className="text-green-600 text-4xl mb-3">✅</div>
                                      <h3 className="text-lg font-bold text-green-800 mb-2">Feladat befejezve!</h3>
                                      <p className="text-green-700 text-sm mb-4">
                                          Ez a feladat már sikeresen be van fejezve. Az eredményed el van mentve.
                                      </p>
                                      {currentIndex < playlist.length - 1 ? (
                                          <button
                                              onClick={() => setCurrentIndex(prev => prev + 1)}
                                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                          >
                                              ➡️ Következő feladat
                                          </button>
                                      ) : (
                                          <button
                                              onClick={() => setStep('RESULT')}
                                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                          >
                                              🏁 Eredmények megtekintése
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ) : (
                              <>
                                  {/* Render Dynamic Component based on Type - Only if not completed */}
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
                              </>
                          )}
                      </div>
                      </div> {/* End Scrollable Content Container */}
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: RESULT ---
  return (
      <div className="max-w-2xl mx-auto mt-4 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-center relative min-h-[80vh]">
          {/* Complete results overlay with percentage, leaderboard and retry */}
          {showPercentage && finalPercentage !== null && (
              <div className="absolute inset-0 bg-white rounded-2xl flex flex-col z-10 overflow-y-auto">
                  {/* Header with percentage */}
                  <div className="text-center py-6 border-b border-slate-200">
                      <div className={`w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-4 text-6xl font-bold ${
                          finalPercentage >= 80 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                      }`}>
                          {finalPercentage}%
                      </div>
                      
                      <h2 className={`text-xl font-bold mb-2 ${
                          finalPercentage >= 80 
                              ? 'text-green-600' 
                              : 'text-red-600'
                      }`}>
                          {finalPercentage >= 80 ? '🎉 Megfelelt!' : '📚 Próbáld újra!'}
                      </h2>
                      
                      <p className="text-slate-600 text-sm">
                          {finalPercentage >= 80 
                              ? 'Szuper teljesítmény! Gratulálunk!' 
                              : 'Ne add fel! Gyakorolj még egy kicsit!'}
                      </p>
                  </div>

                  {/* Leaderboard Section */}
                  <div className="flex-1 p-4">
                      <div className="mb-4">
                          <button 
                              onClick={() => {
                                  if (!showLeaderboard) {
                                      fetchLeaderboard();
                                  }
                                  setShowLeaderboard(!showLeaderboard);
                              }}
                              className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded-lg font-bold border border-yellow-300 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                              <span className="text-lg">🏆</span>
                              {showLeaderboard ? 'Ranglista elrejtése' : 'Ranglista megtekintése'}
                              {loadingLeaderboard && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>}
                          </button>

                          {showLeaderboard && (
                              <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                                  <h3 className="text-sm font-bold text-slate-800 mb-3 text-center flex items-center justify-center gap-2">
                                      <span className="text-base">🏆</span>
                                      Ranglista
                                  </h3>
                                  
                                  {leaderboard.length === 0 ? (
                                      <p className="text-slate-500 text-center py-3 text-sm">
                                          {loadingLeaderboard ? 'Ranglista betöltése...' : 'Még nincsenek eredmények.'}
                                      </p>
                                  ) : (
                                      <div className="space-y-1">
                                          {leaderboard.slice(0, 10).map((participant, index) => {
                                              const isCurrentStudent = participant.name === student?.name;
                                              return (
                                                  <div 
                                                      key={index}
                                                      className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                                          isCurrentStudent 
                                                              ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' 
                                                              : 'bg-white border-slate-200'
                                                      }`}
                                                  >
                                                      <div className="flex items-center gap-2">
                                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                                              participant.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                                                              participant.rank === 2 ? 'bg-gray-100 text-gray-800' :
                                                              participant.rank === 3 ? 'bg-orange-100 text-orange-800' :
                                                              'bg-slate-100 text-slate-600'
                                                          }`}>
                                                              {participant.rank === 1 ? '🥇' :
                                                               participant.rank === 2 ? '🥈' :
                                                               participant.rank === 3 ? '🥉' :
                                                               participant.rank}
                                                          </div>
                                                          <div>
                                                              <div className={`font-medium ${isCurrentStudent ? 'text-blue-800' : 'text-slate-800'}`}>
                                                                  {participant.name}
                                                                  {isCurrentStudent && <span className="ml-1 text-xs bg-blue-200 text-blue-800 px-1 py-0.5 rounded-full">Te</span>}
                                                              </div>
                                                              <div className="text-xs text-slate-500">
                                                                  {participant.class}
                                                              </div>
                                                          </div>
                                                      </div>
                                                      <div className="text-right">
                                                          <div className={`font-bold text-base ${
                                                              participant.percentage >= 80 ? 'text-green-600' : 'text-red-600'
                                                          }`}>
                                                              {participant.percentage}%
                                                          </div>
                                                          <div className="text-xs text-slate-500">
                                                              {participant.score} pont
                                                          </div>
                                                      </div>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  )}
                                  
                                  {leaderboard.length > 0 && (
                                      <div className="mt-3 pt-2 border-t border-slate-200 text-center">
                                          <p className="text-xs text-slate-500">
                                              {leaderboard.length} résztvevő • {new Date().toLocaleTimeString()}
                                          </p>
                                          {finalPercentage !== null && finalPercentage < 80 && (
                                              <p className="text-xs text-orange-600 mt-1 font-medium">
                                                  💪 Próbáld újra és kerülj feljebb a ranglistán!
                                              </p>
                                          )}
                                          
                                          {/* Download buttons */}
                                          <div className="mt-3 flex gap-2 justify-center">
                                              <button
                                                  onClick={() => downloadLeaderboard('txt')}
                                                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-xs font-medium border border-blue-300 transition-colors flex items-center gap-1"
                                                  title="Ranglista letöltése TXT formátumban"
                                              >
                                                  📄 TXT
                                              </button>
                                              <button
                                                  onClick={() => downloadLeaderboard('csv')}
                                                  className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-xs font-medium border border-green-300 transition-colors flex items-center gap-1"
                                                  title="Ranglista letöltése CSV formátumban (Excel)"
                                              >
                                                  📊 CSV
                                              </button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Action buttons - moved closer with uniform spacing */}
                  <div className="px-3 pb-3 pt-1 space-y-2">
                      {finalPercentage < 80 && (
                          <button 
                              onClick={() => {
                                  // Reset and restart the session
                                  setCurrentIndex(0);
                                  setCompletedCount(0);
                                  setCompletedExercises(new Set());
                                  setShowPercentage(false);
                                  setFinalPercentage(null);
                                  setShowLeaderboard(false);
                                  setCalculatingPercentage(false);
                                  
                                  // CRITICAL: Clear localStorage results to prevent accumulation
                                  if (currentSessionCode) {
                                      const sessionKey = `session_${currentSessionCode}_results`;
                                      localStorage.removeItem(sessionKey);
                                      console.log('🧹 Cleared localStorage results for retry:', currentSessionCode);
                                  }
                                  
                                  setStep('PLAYING');
                              }}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                          >
                              <span className="text-lg">🔄</span>
                              Újrapróbálkozás
                          </button>
                      )}
                      
                      <button 
                          onClick={() => {
                              // For students, go back to login instead of main menu
                              if (isStudentMode && !isPreviewMode) {
                                  setStep('LOGIN');
                                  setStudent(null);
                                  setCurrentSessionCode(null);
                                  setPlaylist([]);
                                  setCurrentIndex(0);
                                  setCompletedCount(0);
                                  setCompletedExercises(new Set());
                                  setShowPercentage(false);
                                  setFinalPercentage(null);
                                  setShowLeaderboard(false);
                                  setCalculatingPercentage(false);
                              } else {
                                  onExit();
                              }
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-bold shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                          <span className="text-lg">🏠</span>
                          {isPreviewMode ? 'Vissza a könyvtárba' : (isStudentMode ? 'Vissza a bejelentkezéshez' : 'Vissza a főoldalra')}
                      </button>
                  </div>
              </div>
          )}
          
          {/* Loading screen during percentage calculation */}
          {calculatingPercentage && (
              <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Eredmények feldolgozása...</h3>
                  <p className="text-slate-500 text-sm">Kérlek várj, amíg kiszámoljuk a végeredményt.</p>
              </div>
          )}
          
          {/* Temporary result screen - only show when not calculating and no percentage overlay */}
          {!showPercentage && finalPercentage === null && !calculatingPercentage && (
              <>
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
                      {isPreviewMode ? '👁️' : '🏆'}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                      {isPreviewMode ? 'Előnézet befejezve!' : `Szép munka, ${student?.name}!`}
                  </h2>
                  <p className="text-slate-500 mb-6 text-sm">
                      {isPreviewMode 
                          ? 'A feladat előnézete véget ért. Szerkesztheted a feladatot a könyvtárban.' 
                          : 'A mai gyakorlás véget ért. Az eredmények automatikusan mentve lettek.'
                      }
                  </p>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
                          {isPreviewMode ? 'Megtekintve' : 'Teljesítve'}
                      </div>
                      <div className="text-3xl font-black text-purple-600">{completedCount} <span className="text-lg text-slate-400 font-medium">/ {playlist.length}</span></div>
                      <div className="text-xs font-medium text-slate-600 mt-1">
                          {isPreviewMode ? 'feladat megtekintve' : 'feladat sikeresen megoldva'}
                      </div>
                      
                      {/* Show final percentage if available and not in preview mode */}
                      {!isPreviewMode && finalPercentage !== null && !showPercentage && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
                                  Végeredmény
                              </div>
                              <div className={`text-2xl font-bold ${
                                  finalPercentage >= 80 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                  {finalPercentage}%
                              </div>
                              <div className={`text-xs font-medium mt-1 ${
                                  finalPercentage >= 80 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                  {finalPercentage >= 80 ? 'Megfelelt' : 'Próbáld újra'}
                              </div>
                          </div>
                      )}
                  </div>

                  {!isPreviewMode && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center justify-center gap-2 text-green-700">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                              </svg>
                              <span className="font-medium text-sm">Eredmények automatikusan mentve</span>
                          </div>
                      </div>
                  )}

                  {/* Leaderboard Section */}
                  {!isPreviewMode && (
                      <div className="mb-4">
                          <button 
                              onClick={() => {
                                  if (!showLeaderboard) {
                                      fetchLeaderboard();
                                  }
                                  setShowLeaderboard(!showLeaderboard);
                              }}
                              className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded-xl font-bold border border-yellow-300 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                              <span className="text-lg">🏆</span>
                              {showLeaderboard ? 'Ranglista elrejtése' : 'Ranglista megtekintése'}
                              {loadingLeaderboard && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>}
                          </button>

                          {showLeaderboard && (
                              <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                          <h3 className="text-sm font-bold text-slate-800 mb-3 text-center flex items-center justify-center gap-2">
                              <span className="text-base">🏆</span>
                              Ranglista
                          </h3>
                          
                          {leaderboard.length === 0 ? (
                              <p className="text-slate-500 text-center py-3 text-sm">
                                  {loadingLeaderboard ? 'Ranglista betöltése...' : 'Még nincsenek eredmények.'}
                              </p>
                          ) : (
                              <div className="space-y-1">
                                  {leaderboard.slice(0, 10).map((participant, index) => {
                                      const isCurrentStudent = participant.name === student?.name;
                                      return (
                                          <div 
                                              key={index}
                                              className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                                  isCurrentStudent 
                                                      ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' 
                                                      : 'bg-slate-50 border-slate-200'
                                              }`}
                                          >
                                              <div className="flex items-center gap-2">
                                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                                      participant.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                                                      participant.rank === 2 ? 'bg-gray-100 text-gray-800' :
                                                      participant.rank === 3 ? 'bg-orange-100 text-orange-800' :
                                                      'bg-slate-100 text-slate-600'
                                                  }`}>
                                                      {participant.rank === 1 ? '🥇' :
                                                       participant.rank === 2 ? '🥈' :
                                                       participant.rank === 3 ? '🥉' :
                                                       participant.rank}
                                                  </div>
                                                  <div>
                                                      <div className={`font-medium ${isCurrentStudent ? 'text-blue-800' : 'text-slate-800'}`}>
                                                          {participant.name}
                                                          {isCurrentStudent && <span className="ml-1 text-xs bg-blue-200 text-blue-800 px-1 py-0.5 rounded-full">Te</span>}
                                                      </div>
                                                      <div className="text-xs text-slate-500">
                                                          {participant.class}
                                                      </div>
                                                  </div>
                                              </div>
                                              <div className="text-right">
                                                  <div className={`font-bold text-base ${
                                                      participant.percentage >= 80 ? 'text-green-600' : 'text-red-600'
                                                  }`}>
                                                      {participant.percentage}%
                                                  </div>
                                                  <div className="text-xs text-slate-500">
                                                      {participant.score} pont
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          )}
                          
                          {leaderboard.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-slate-200 text-center">
                                  <p className="text-xs text-slate-500">
                                      {leaderboard.length} résztvevő • {new Date().toLocaleTimeString()}
                                  </p>
                                  {finalPercentage !== null && finalPercentage < 80 && (
                                      <p className="text-xs text-orange-600 mt-1 font-medium">
                                          💪 Próbáld újra és kerülj feljebb a ranglistán!
                                      </p>
                                  )}
                                  
                                  {/* Download buttons */}
                                  <div className="mt-3 flex gap-2 justify-center">
                                      <button
                                          onClick={() => downloadLeaderboard('txt')}
                                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-xs font-medium border border-blue-300 transition-colors flex items-center gap-1"
                                          title="Ranglista letöltése TXT formátumban"
                                      >
                                          📄 TXT
                                      </button>
                                      <button
                                          onClick={() => downloadLeaderboard('csv')}
                                          className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-xs font-medium border border-green-300 transition-colors flex items-center gap-1"
                                          title="Ranglista letöltése CSV formátumban (Excel)"
                                      >
                                          📊 CSV
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          )}

          <button 
              onClick={() => {
                  // For students, go back to login instead of main menu
                  if (isStudentMode && !isPreviewMode) {
                      setStep('LOGIN');
                      setStudent(null);
                      setCurrentSessionCode(null);
                      setPlaylist([]);
                      setCurrentIndex(0);
                      setCompletedCount(0);
                      setCompletedExercises(new Set());
                      setShowPercentage(false);
                      setFinalPercentage(null);
                      setShowLeaderboard(false);
                      setCalculatingPercentage(false);
                  } else {
                      onExit();
                  }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02]"
          >
              {isPreviewMode ? 'Vissza a könyvtárba' : (isStudentMode ? 'Vissza a bejelentkezéshez' : 'Vissza a főoldalra')}
          </button>
          </>
          )}

      </div>
  );
};

export default DailyChallenge;
