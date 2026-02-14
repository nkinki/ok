
import React, { useState, useEffect, useRef } from 'react';
import { BulkResultItem } from './BulkProcessor';
import { ExerciseType, MatchingContent, CategorizationContent, QuizContent } from '../types';
import ImageViewer from './ImageViewer';
import MatchingExercise from './MatchingExercise';
import CategorizationExercise from './CategorizationExercise';
import QuizExercise from './QuizExercise';
import StudentLoginForm from './auth/StudentLoginForm';
import { ImageCache } from '../utils/imageCache';
import { fullGoogleDriveService } from '../services/fullGoogleDriveService';
import { driveOnlyService } from '../services/driveOnlyService';

interface Props {
  library: BulkResultItem[];
  onExit: () => void;
  isStudentMode?: boolean;
  sessionCode?: string;
  isPreviewMode?: boolean;
}

type DailyStep = 'LOGIN' | 'ASSIGNMENTS' | 'WAITING_FOR_START' | 'PLAYING' | 'RESULT';

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

  // Helper function to get image URL (with enhanced debugging, fallbacks, and caching)
  const getImageUrl = (item) => {
    console.log('🖼️ getImageUrl called for item:', {
      id: item?.id,
      hasImageUrl: !!item?.imageUrl,
      imageUrlLength: item?.imageUrl?.length || 0,
      imageUrlPreview: item?.imageUrl?.substring(0, 50) || 'none'
    });
    
    // First, try to get from cache to reduce API calls
    const cachedImage = ImageCache.getCachedImage(item?.id);
    if (cachedImage) {
      console.log('📦 Using cached image for item:', item.id);
      return cachedImage;
    }
    
    // If imageUrl is directly available, use it and cache it
    if (item.imageUrl && item.imageUrl.length > 100) { // Minimum length check
      console.log('✅ Direct imageUrl found for item:', item.id);
      console.log('🎯 RETURNING IMAGE URL:', {
        length: item.imageUrl.length,
        isBase64: item.imageUrl.startsWith('data:'),
        isDriveUrl: item.imageUrl.includes('drive.google.com'),
        preview: item.imageUrl.substring(0, 100) + '...'
      });
      
      // Cache the image for future use
      ImageCache.setCachedImage(item.id, item.imageUrl);
      
      return item.imageUrl;
    }
    
    // Try Google Drive service for missing images
    console.log('🔍 Trying Google Drive service for item:', item.id);
    fullGoogleDriveService.getImageUrl(item.id).then(driveUrl => {
      if (driveUrl) {
        console.log('✅ Found image in Google Drive:', item.id);
        ImageCache.setCachedImage(item.id, driveUrl);
        // Force re-render by updating refresh key
        setImageRefreshKey(prev => prev + 1);
      }
    }).catch(error => {
      console.warn('⚠️ Google Drive lookup failed:', error);
    });
    
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
          
          // Cache the found image
          ImageCache.setCachedImage(item.id, foundItem.imageUrl);
          
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
              
              // Cache the found image
              ImageCache.setCachedImage(item.id, foundExercise.imageUrl);
              
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
  const [driveOnlyMode, setDriveOnlyMode] = useState(false);
  
  const [playlist, setPlaylist] = useState<any[]>([]);
  
  // Check Drive-Only mode on component mount
  useEffect(() => {
    const isDriveOnly = driveOnlyService.isDriveOnlyMode();
    setDriveOnlyMode(isDriveOnly);
    
    if (isDriveOnly) {
      console.log('🚀 Drive-Only mód aktív diák oldalon');
    }
  }, []);
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
      
      if (driveOnlyMode) {
        // DRIVE-ONLY MODE: Submit results to Drive-Only service
        console.log('🚀 Drive-Only eredmény küldés');
        
        if (student) {
          try {
            const driveOnlyResult = await driveOnlyService.submitResults(
              student.id,
              [{ exerciseIndex: currentIndex, score: 10, maxScore: 10 }],
              {
                totalScore: 10,
                completedExercises: 1,
                studentName: student.name,
                studentClass: student.className
              }
            );

            if (driveOnlyResult.success) {
              console.log('✅ Drive-Only eredmény mentve');
            } else {
              console.warn('⚠️ Drive-Only eredmény mentési hiba:', driveOnlyResult.error);
            }
          } catch (error) {
            console.error('❌ Drive-Only eredmény hiba:', error);
          }
        }
      } else {
        // ORIGINAL SUPABASE MODE
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

  const handleStudentLogin = async (studentData: Student, code: string, sessionData?: any) => {
    setStudent(studentData);
    setCurrentSessionCode(code);
    setLoading(true);
    setError(null);

    console.log('🎰 SLOT SYSTEM - Automatikus letöltés Google Drive-ról');
    console.log('🎯 Session code:', code.toUpperCase());
    console.log('🎰 Slot number:', sessionData?.slotNumber || 'Nincs megadva');
    console.log('👨‍🎓 Student:', { name: studentData.name, className: studentData.className });

    // If slot number is provided, automatically download from Drive
    if (sessionData?.slotNumber) {
      const slotNumber = sessionData.slotNumber;
      
      try {
        console.log('📥 Automatikus letöltés - Slot:', slotNumber);
        
        // Get Drive link from localStorage or use default for Slot 1
        let driveLink = localStorage.getItem(`slot_${slotNumber}_link`) || '';
        
        // Default link for Slot 1 if not set
        if (!driveLink && slotNumber === 1) {
          driveLink = 'https://drive.google.com/file/d/1bqV8V5O-gbpAftZ9TfaMNse7baeXtt3Z/view?usp=sharing';
          console.log('🔗 Using default Slot 1 link');
        }
        
        if (!driveLink) {
          throw new Error(`Slot ${slotNumber} nincs beállítva. Kérd meg a tanárt, hogy állítsa be a Drive linket a Beállításokban!`);
        }
        
        console.log('🔗 Drive link:', driveLink);
        
        // Now download from the Drive link
        const apiUrl = `/api/drive-download?driveLink=${encodeURIComponent(driveLink)}`;
        console.log('🌐 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: Letöltés sikertelen`);
        }
        
        const result = await response.json();
        console.log('✅ Drive letöltés sikeres:', result);
        
        if (!result.success || !result.data) {
          throw new Error('Érvénytelen válasz a szervertől');
        }
        
        const sessionJson = result.data;
        
        // Validate session data
        if (!sessionJson.exercises || !Array.isArray(sessionJson.exercises)) {
          throw new Error('Érvénytelen munkamenet formátum');
        }
        
        if (sessionJson.exercises.length === 0) {
          throw new Error(`Slot ${slotNumber} üres. A tanár még nem töltötte fel a munkamenetet.`);
        }
        
        // Verify session code matches
        if (sessionJson.code && sessionJson.code.toUpperCase() !== code.toUpperCase()) {
          console.warn('⚠️ Session code mismatch:', {
            expected: code.toUpperCase(),
            received: sessionJson.code.toUpperCase()
          });
          throw new Error(`Hibás munkamenet kód! Elvárt: ${code.toUpperCase()}, Kapott: ${sessionJson.code.toUpperCase()}`);
        }
        
        console.log('✅ Munkamenet validálva:', sessionJson.exercises.length, 'feladat');
        
        // Convert to playlist format
        const exerciseItems = sessionJson.exercises.map((exercise: any) => ({
          id: exercise.id,
          fileName: exercise.fileName || exercise.title,
          imageUrl: exercise.imageUrl || '',
          data: {
            type: exercise.type,
            title: exercise.title,
            instruction: exercise.instruction,
            content: exercise.content
          }
        }));
        
        console.log('🎮 Munkamenet betöltve:', exerciseItems.length, 'feladat');
        
        setPlaylist(exerciseItems);
        setCurrentIndex(0);
        setCompletedCount(0);
        setCompletedExercises(new Set());
        setStep('PLAYING');
        setLoading(false);
        
        console.log('✅ Automatikus betöltés sikeres!');
        
      } catch (error) {
        console.error('❌ Automatikus letöltés hiba:', error);
        setError(`Automatikus letöltés sikertelen: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
        setLoading(false);
        
        // Show WAITING_FOR_START as fallback
        setStep('WAITING_FOR_START');
      }
    } else {
      // No slot number - show manual file picker (old behavior)
      console.log('⚠️ Nincs slot szám - manuális fájl választás');
      setStep('WAITING_FOR_START');
      setLoading(false);
    }
  };

  // NEW: Handle START button click - Direct file picker
  const handleStartExercises = async () => {
    if (!currentSessionCode) return;
    
    console.log('🚀 START button clicked - Opening file picker...');
    
    // Open file picker directly
    fileInputRef.current?.click();
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

  // JSON import for offline sessions - ENHANCED for Google Drive workflow
  const handleJsonImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 JSON fájl betöltése:', file.name);
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        console.log('📊 JSON parsed:', {
          hasExercises: !!parsedData.exercises,
          exerciseCount: parsedData.exercises?.length || 0,
          hasCode: !!parsedData.code,
          hasCreatedAt: !!parsedData.createdAt
        });
        
        // Handle session JSON format (from upload tool)
        if (parsedData.exercises && Array.isArray(parsedData.exercises)) {
          const exercises = parsedData.exercises;
          
          console.log('✅ Session JSON formátum felismerve');
          console.log('📊 Feladatok száma:', exercises.length);
          
          // Validate exercises have required data
          const validExercises = exercises.filter(ex => {
            const hasRequiredFields = ex.id && ex.type && ex.title && ex.content;
            if (!hasRequiredFields) {
              console.warn('⚠️ Érvénytelen feladat:', ex);
            }
            return hasRequiredFields;
          });
          
          if (validExercises.length === 0) {
            setError("A JSON fájl nem tartalmaz érvényes feladatokat.");
            setLoading(false);
            return;
          }
          
          console.log('✅ Érvényes feladatok:', validExercises.length);
          
          // Convert to playlist format
          const exerciseItems = validExercises.map((exercise: any) => ({
            id: exercise.id,
            fileName: exercise.fileName || exercise.title,
            imageUrl: exercise.imageUrl || '', // Base64 image from JSON
            data: {
              type: exercise.type,
              title: exercise.title,
              instruction: exercise.instruction,
              content: exercise.content
            }
          }));
          
          console.log('📁 JSON munkamenet betöltve:', exerciseItems.length, 'feladat');
          console.log('🖼️ Első feladat kép:', exerciseItems[0]?.imageUrl ? `${exerciseItems[0].imageUrl.length} karakter` : 'Nincs');
          
          // Set up offline session with student info from JSON or prompt
          const sessionCode = parsedData.code || 'JSON-' + Date.now().toString(36).toUpperCase();
          
          // Prompt for student name and class if not in preview mode
          let studentName = 'JSON Diák';
          let studentClass = 'JSON Import';
          
          if (!isPreviewMode) {
            studentName = prompt('Add meg a neved:') || 'Névtelen Diák';
            studentClass = prompt('Add meg az osztályodat (pl. 8.a):') || 'Ismeretlen';
          }
          
          setStudent({
            id: 'json-' + Date.now(),
            name: studentName,
            className: studentClass
          });
          
          setCurrentSessionCode(sessionCode);
          setPlaylist(exerciseItems);
          setCurrentIndex(0);
          setCompletedCount(0);
          setCompletedExercises(new Set());
          setStep('PLAYING');
          setLoading(false);
          
          console.log('🎮 JSON munkamenet elindítva!');
          console.log('👤 Diák:', studentName, '-', studentClass);
          console.log('📝 Session kód:', sessionCode);
          
        } else {
          // Try old format (direct array or collection)
          let importedExercises: BulkResultItem[] = [];
          
          if (Array.isArray(parsedData)) {
            if (parsedData.length > 0 && parsedData[0].data) {
              importedExercises = parsedData as BulkResultItem[];
            }
          } else if (parsedData.collection && parsedData.exercises) {
            importedExercises = parsedData.exercises as BulkResultItem[];
          }
          
          if (importedExercises.length > 0) {
            console.log('📁 Régi formátumú JSON betöltve:', importedExercises.length, 'feladat');
            
            setPlaylist(importedExercises);
            setCurrentIndex(0);
            setCompletedCount(0);
            setCompletedExercises(new Set());
            
            setStudent({
              id: 'offline-' + Date.now(),
              name: 'Offline Diák',
              className: 'JSON Import'
            });
            
            setStep('PLAYING');
            setLoading(false);
          } else {
            setError("Hibás fájlformátum. Csak érvényes munkamenet JSON fájlokat lehet importálni.");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('JSON import error:', err);
        setError("Hiba a fájl beolvasásakor. Ellenőrizd, hogy érvényes JSON fájl-e.");
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError("Fájl olvasási hiba");
      setLoading(false);
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

  // --- RENDER: WAITING FOR START ---
  if (step === 'WAITING_FOR_START') {
    // Generate expected filename
    const today = new Date().toISOString().slice(0, 10);
    const expectedFileName = `munkamenet_${currentSessionCode?.toUpperCase()}_${today}.json`;
    
    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".json"
          style={{ display: 'none' }}
        />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
          {/* Student Info */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
              👋
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Üdv, {student?.name}!
            </h2>
            <p className="text-lg text-slate-600">
              {student?.className} osztály
            </p>
          </div>

          {/* Session Info */}
          <div className="mb-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
            <div className="text-sm text-blue-600 font-medium mb-2">Munkamenet kód</div>
            <div className="text-3xl font-mono font-bold text-blue-800">
              {currentSessionCode}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200">
            <div className="text-lg font-bold text-yellow-800 mb-3">
              📁 Fájl neve:
            </div>
            <div className="text-sm font-mono bg-white px-4 py-2 rounded-lg border border-yellow-300 text-slate-800 mb-4">
              {expectedFileName}
            </div>
            <div className="text-sm text-yellow-700 mb-4">
              Töltsd le ezt a fájlt a Google Drive-ról, majd kattints a START gombra!
            </div>
            <a
              href="https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
            >
              📂 Drive mappa megnyitása
            </a>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* START Button - Opens file picker */}
          <button
            onClick={handleStartExercises}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-16 py-6 rounded-2xl text-3xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed mb-6"
          >
            {loading ? (
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span>Betöltés...</span>
              </div>
            ) : (
              <>🚀 START - JSON betöltése</>
            )}
          </button>

          {/* Help text */}
          <p className="text-sm text-slate-500 mb-6">
            Ha még nem töltötted le a JSON fájlt, nyisd meg a{' '}
            <a 
              href="https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Google Drive mappát
            </a>
          </p>

          {/* Back Button */}
          <button
            onClick={onExit}
            className="mt-6 text-slate-500 hover:text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors block mx-auto"
          >
            ← Vissza
          </button>
        </div>
      </div>
      </>
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
      <div className="max-w-2xl mx-auto mt-4 bg-white dark:bg-black p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-emerald-500 text-center relative min-h-[80vh] overflow-hidden">
          {/* Animated Background - Dark Mode Only */}
          <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
            {/* Animated Grid */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                animation: 'grid-move 20s linear infinite'
              }}></div>
            </div>
            
            {/* Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`
                }}
              ></div>
            ))}
          </div>

          {/* Complete results overlay with percentage, leaderboard and retry */}
          {showPercentage && finalPercentage !== null && (
              <div className="absolute inset-0 bg-white dark:bg-black rounded-2xl flex flex-col z-10 overflow-y-auto">
                  {/* Header with percentage */}
                  <div className="text-center py-6 border-b border-slate-200 dark:border-emerald-500/30">
                      <div className={`w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-4 text-6xl font-bold animate-pulse ${
                          finalPercentage >= 80 
                              ? 'bg-green-100 dark:bg-emerald-900/30 text-green-600 dark:text-emerald-400 dark:shadow-neon-green dark:border-2 dark:border-emerald-500' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 dark:shadow-neon-purple dark:border-2 dark:border-purple-500'
                      }`}>
                          {finalPercentage}%
                      </div>
                      
                      <h2 className={`text-xl font-bold mb-2 ${
                          finalPercentage >= 80 
                              ? 'text-green-600 dark:text-emerald-400' 
                              : 'text-red-600 dark:text-red-400'
                      }`}>
                          {finalPercentage >= 80 ? '🎉 Megfelelt!' : '📚 Próbáld újra!'}
                      </h2>
                      
                      <p className="text-slate-600 dark:text-slate-300 text-sm">
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
                              className="w-full bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400 py-2 px-3 rounded-lg font-bold border border-yellow-300 dark:border-yellow-500 transition-colors flex items-center justify-center gap-2 text-sm dark:shadow-lg"
                          >
                              <span className="text-lg">🏆</span>
                              {showLeaderboard ? 'Ranglista elrejtése' : 'Ranglista megtekintése'}
                              {loadingLeaderboard && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 dark:border-yellow-400"></div>}
                          </button>

                          {showLeaderboard && (
                              <div className="mt-3 bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-emerald-500/30 rounded-lg p-3 max-h-48 overflow-y-auto">
                                  <h3 className="text-sm font-bold text-slate-800 dark:text-emerald-400 mb-3 text-center flex items-center justify-center gap-2">
                                      <span className="text-base">🏆</span>
                                      Ranglista
                                  </h3>
                                  
                                  {leaderboard.length === 0 ? (
                                      <p className="text-slate-500 dark:text-slate-400 text-center py-3 text-sm">
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
                                                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-500 ring-1 ring-blue-300 dark:ring-blue-500' 
                                                              : 'bg-white dark:bg-gray-800/50 border-slate-200 dark:border-gray-700'
                                                      } ${
                                                          participant.rank === 1 ? 'dark:shadow-neon-green' :
                                                          participant.rank === 2 ? 'dark:shadow-neon-cyan' :
                                                          participant.rank === 3 ? 'dark:shadow-neon-purple' : ''
                                                      }`}
                                                  >
                                                      <div className="flex items-center gap-2">
                                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                                              participant.rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400 dark:border dark:border-yellow-500' :
                                                              participant.rank === 2 ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 dark:border dark:border-gray-500' :
                                                              participant.rank === 3 ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-400 dark:border dark:border-orange-500' :
                                                              'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                          }`}>
                                                              {participant.rank === 1 ? '🥇' :
                                                               participant.rank === 2 ? '🥈' :
                                                               participant.rank === 3 ? '🥉' :
                                                               participant.rank}
                                                          </div>
                                                          <div>
                                                              <div className={`font-medium ${isCurrentStudent ? 'text-blue-800 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                  {participant.name}
                                                                  {isCurrentStudent && <span className="ml-1 text-xs bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-400 px-1 py-0.5 rounded-full border dark:border-blue-500">Te</span>}
                                                              </div>
                                                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                  {participant.class}
                                                              </div>
                                                          </div>
                                                      </div>
                                                      <div className="text-right">
                                                          <div className={`font-bold text-base ${
                                                              participant.percentage >= 80 ? 'text-green-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                                          }`}>
                                                              {participant.percentage}%
                                                          </div>
                                                          <div className="text-xs text-slate-500 dark:text-slate-400">
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
                                                  className="bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-400 px-3 py-1 rounded text-xs font-medium border border-blue-300 dark:border-blue-500 transition-colors flex items-center gap-1"
                                                  title="Ranglista letöltése TXT formátumban"
                                              >
                                                  📄 TXT
                                              </button>
                                              <button
                                                  onClick={() => downloadLeaderboard('csv')}
                                                  className="bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-400 px-3 py-1 rounded text-xs font-medium border border-green-300 dark:border-green-500 transition-colors flex items-center gap-1"
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
                              onClick={async () => {
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
                                  
                                  // CRITICAL: Create new participant for retry (new attempt)
                                  if (student && currentSessionCode) {
                                      try {
                                          console.log('🔄 Creating new participant for retry...');
                                          const response = await fetch('/api/simple-api/sessions/join', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                  sessionCode: currentSessionCode,
                                                  name: student.name,
                                                  className: student.className
                                              })
                                          });
                                          
                                          if (response.ok) {
                                              const data = await response.json();
                                              console.log('✅ New participant created for retry:', data.student.id);
                                              // Update student with new ID
                                              setStudent({
                                                  ...student,
                                                  id: data.student.id
                                              });
                                          } else {
                                              console.error('❌ Failed to create new participant for retry');
                                          }
                                      } catch (error) {
                                          console.error('❌ Error creating new participant:', error);
                                      }
                                  }
                                  
                                  setStep('PLAYING');
                              }}
                              className="w-full bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-600 text-white py-2.5 rounded-lg font-bold shadow-lg dark:shadow-orange-500/50 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
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
                          className="w-full bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 text-white py-2.5 rounded-lg font-bold shadow-lg dark:shadow-purple-500/50 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                          <span className="text-lg">🏠</span>
                          {isPreviewMode ? 'Vissza a könyvtárba' : (isStudentMode ? 'Vissza a bejelentkezéshez' : 'Vissza a főoldalra')}
                      </button>
                  </div>
              </div>
          )}
          
          {/* Loading screen during percentage calculation */}
          {calculatingPercentage && (
              <div className="flex flex-col items-center justify-center py-12 relative z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-emerald-500 mb-4 dark:shadow-neon-green"></div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-emerald-400 mb-2">Eredmények feldolgozása...</h3>
                  <p className="text-slate-500 dark:text-slate-300 text-sm">Kérlek várj, amíg kiszámoljuk a végeredményt.</p>
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
              className="w-full bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 text-white py-3 rounded-xl font-bold shadow-lg dark:shadow-purple-500/50 transition-transform hover:scale-[1.02] relative z-10"
          >
              {isPreviewMode ? 'Vissza a könyvtárba' : (isStudentMode ? 'Vissza a bejelentkezéshez' : 'Vissza a főoldalra')}
          </button>
          </>
          )}
          
          {/* CSS Animations for Dark Mode */}
          <style>{`
            @keyframes grid-move {
              0% { transform: translate(0, 0); }
              100% { transform: translate(50px, 50px); }
            }
            
            @keyframes float {
              0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
              50% { opacity: 1; }
              100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
            }
          `}</style>
      </div>
  );
};

export default DailyChallenge;
