
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubjectProvider } from './contexts/SubjectContext';
import AuthPage from './components/auth/AuthPage';
import TeacherSessionManager from './components/TeacherSessionManager';
// TeacherExerciseCreator removed - not used in current implementation
import TeacherLibrary from './components/TeacherLibrary';
import AdvancedLibraryManager from './components/AdvancedLibraryManager';
import DailyChallenge from './components/DailyChallenge';
import BulkProcessor, { BulkResultItem } from './components/BulkProcessor';
import SettingsModal from './components/SettingsModal';

type AppMode = 'ROLE_SELECT' | 'TEACHER' | 'STUDENT';

// Main App Component (with authentication and routing)
function AppContent() {
  const { isAuthenticated } = useAuth()
  const [appMode, setAppMode] = useState<AppMode>('ROLE_SELECT')
  const [sessionCode, setSessionCode] = useState<string | null>(null)

  // Check URL for player mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    if (mode === 'student') {
      setAppMode('STUDENT')
    }
  }, [])

  // Handle student login with session code
  const handleStudentLogin = (code: string) => {
    setSessionCode(code)
    // Student login is handled in DailyChallenge component
  }

  // Role selection component
  const RoleSelectPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="bg-purple-100 text-purple-900 w-20 h-20 flex items-center justify-center rounded-2xl shadow-lg font-bold text-3xl mx-auto mb-6 border border-purple-200">
            OK
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
            Szent Mihály Görögkatolikus Óvoda, Általános Iskola és AMI
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Tanár gomb */}
          <div 
            onClick={() => setAppMode('TEACHER')}
            className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-all cursor-pointer group hover:scale-105"
          >
            <div className="text-center">
              <div className="bg-purple-100 text-purple-600 w-16 h-16 flex items-center justify-center rounded-xl mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Tanár</h3>
            </div>
          </div>

          {/* Diák gomb */}
          <div 
            onClick={() => setAppMode('STUDENT')}
            className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-all cursor-pointer group hover:scale-105"
          >
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-600 w-16 h-16 flex items-center justify-center rounded-xl mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Diák</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Show role selection first
  if (appMode === 'ROLE_SELECT') {
    return <RoleSelectPage />
  }

  // If not authenticated and in teacher mode, show auth page
  if (!isAuthenticated && appMode === 'TEACHER') {
    return <AuthPage />
  }

  // Student mode - show daily challenge directly
  if (appMode === 'STUDENT') {
    return <StudentApp onBackToRoleSelect={() => setAppMode('ROLE_SELECT')} sessionCode={sessionCode} />
  }

  // Teacher mode - show session manager
  return <TeacherApp onBackToRoleSelect={() => setAppMode('ROLE_SELECT')} />
}

// Student App Component (simplified interface for students)
function StudentApp({ onBackToRoleSelect, sessionCode }: { onBackToRoleSelect: () => void, sessionCode: string | null }) {
  const [library, setLibrary] = useState<BulkResultItem[]>([]);
  
  // Mouse movement tracking for auto-hiding header
  const [showHeader, setShowHeader] = useState(true);
  const headerTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load manual exercises on mount with error handling
  useEffect(() => {
    // Only load from localStorage, no manual exercises file
    try {
      const savedLibrary = localStorage.getItem('okosgyakorlo_library');
      if (savedLibrary) {
        const parsed = JSON.parse(savedLibrary);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLibrary(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to restore library from localStorage:", e);
      // If localStorage is corrupted, start with empty library
      setLibrary([]);
    }
  }, []);

  // Mouse movement handler for auto-hiding header
  useEffect(() => {
    const handleMouseMove = () => {
      setShowHeader(true);
      
      // Clear existing timeout
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
      
      // Set new timeout to hide header after 3 seconds of inactivity
      headerTimeoutRef.current = setTimeout(() => {
        setShowHeader(false);
      }, 3000);
    };

    const handleMouseLeave = () => {
      // Hide header immediately when mouse leaves the window
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
      headerTimeoutRef.current = setTimeout(() => {
        setShowHeader(false);
      }, 1000);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initial timer
    headerTimeoutRef.current = setTimeout(() => {
      setShowHeader(false);
    }, 3000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className={`
        bg-white border-b border-purple-200 sticky top-0 z-50 shadow-md transition-all duration-300
        ${showHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}
      `}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={onBackToRoleSelect}
              className="bg-purple-100 text-purple-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm font-bold text-lg shrink-0 border border-purple-200 cursor-pointer hover:bg-purple-200 transition-colors"
              title="Vissza a főoldalra"
            >
              OK
            </div>
            <div className="font-bold text-purple-900 text-xs md:text-sm leading-tight">
              Szent Mihály Görögkatolikus Óvoda, Általános Iskola és AMI
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
              Diák Mód
            </div>
            <button 
              onClick={onBackToRoleSelect}
              className="text-slate-500 hover:text-purple-700 p-2"
              title="Vissza a szerepkör választáshoz"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main>
        <DailyChallenge 
          library={library} 
          onExit={onBackToRoleSelect}
          isStudentMode={true}
          sessionCode={sessionCode || undefined}
        />
      </main>
    </div>
  );
}

// Teacher App Component (full functionality with session manager first to show history)
function TeacherApp({ onBackToRoleSelect }: { onBackToRoleSelect: () => void }) {
  const [viewMode, setViewMode] = useState<'BULK' | 'SESSION' | 'LIBRARY' | 'ADVANCED_LIBRARY'>('BULK')
  const [library, setLibrary] = useState<BulkResultItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<BulkResultItem | null>(null);
  const [isMemoryMode, setIsMemoryMode] = useState(false)
  const [showPreview, setShowPreview] = useState(false);
  
  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Load saved library on mount with error handling
  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem('okosgyakorlo_library');
      if (savedLibrary) {
        const parsed = JSON.parse(savedLibrary);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLibrary(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to restore library from localStorage:", e);
      // If localStorage is corrupted, start with empty library
      setLibrary([]);
    }
  }, []);

  // Auto-save library with improved error handling
  useEffect(() => {
    if (library.length > 0) {
      try {
        localStorage.setItem('okosgyakorlo_library', JSON.stringify(library));
        if (isMemoryMode) setIsMemoryMode(false);
      } catch (e) {
        if (e instanceof DOMException && e.code === 22) {
          // Storage quota exceeded
          console.warn("Storage quota exceeded, switching to memory mode");
          setIsMemoryMode(true);
        } else {
          console.error("Storage error:", e);
        }
      }
    } else {
      // Clean up empty library
      if (library.length === 0 && localStorage.getItem('okosgyakorlo_library')) {
        try {
          localStorage.removeItem('okosgyakorlo_library');
        } catch (e) {
          console.error("Error removing empty library:", e);
        }
      }
    }
  }, [library, isMemoryMode]);

  const handleBulkComplete = (results: BulkResultItem[]) => {
    setLibrary((prev: any[]) => {
      const newItems = results.filter((r: any) => !prev.some((p: any) => p.id === r.id));
      return [...prev, ...newItems];
    });
    setViewMode('LIBRARY');
    alert(`${results.length} új elem mentve a Könyvtárba!`);
  };

  const handleLibraryUpdate = () => {
    // Reload library from localStorage with error handling
    try {
      const savedLibrary = localStorage.getItem('okosgyakorlo_library');
      if (savedLibrary) {
        const parsed = JSON.parse(savedLibrary);
        if (Array.isArray(parsed)) {
          setLibrary(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to reload library from localStorage:", e);
      // If localStorage is corrupted or inaccessible, keep current state
    }
  };
  const handleBulkImport = (importedData: BulkResultItem[]) => {
    setLibrary((prev: any[]) => {
      const uniqueImported = importedData.filter((newItem: any) => 
        !prev.some((existing: any) => existing.id === newItem.id)
      );
      return [...prev, ...uniqueImported];
    });
    alert(`${importedData.length} meglévő elem betöltve!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-purple-200 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={onBackToRoleSelect}
              className="bg-purple-100 text-purple-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm font-bold text-lg shrink-0 border border-purple-200 cursor-pointer hover:bg-purple-200 transition-colors"
              title="Vissza a főoldalra"
            >
              OK
            </div>
            <div className="font-bold text-purple-900 text-sm md:text-base leading-tight">
              Szent Mihály Görögkatolikus Óvoda, Általános Iskola és AMI
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-sm font-bold border border-purple-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Tanár Mód
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            <button 
              onClick={() => setViewMode('BULK')} 
              className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition-all ${
                viewMode === 'BULK' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'text-slate-600 border-transparent hover:bg-slate-50'
              }`}
            >
              🔄 Kezdés
            </button>
            
            <button 
              onClick={() => setViewMode('SESSION')} 
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                viewMode === 'SESSION' ? 'bg-green-100 text-green-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🎯 Munkamenet
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            <button 
              onClick={() => setViewMode('LIBRARY')} 
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                viewMode === 'LIBRARY' ? 'bg-purple-50 text-purple-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Könyvtár {library.length > 0 && <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full font-bold">{library.length}</span>}
            </button>
            
            <button 
              onClick={() => setViewMode('ADVANCED_LIBRARY')} 
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                viewMode === 'ADVANCED_LIBRARY' ? 'bg-green-50 text-green-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              📚 Fejlett Könyvtár
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-500 hover:text-purple-700 p-2"
              title="Beállítások"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
            
            <button 
              onClick={onBackToRoleSelect}
              className="text-slate-500 hover:text-purple-700 p-2"
              title="Vissza a szerepkör választáshoz"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main>
        {showPreview && selectedExercise && (
          <DailyChallenge 
            library={[selectedExercise]}
            onExit={() => {
              setShowPreview(false);
              setSelectedExercise(null);
            }}
            isStudentMode={false}
            isPreviewMode={true}
          />
        )}
        {!showPreview && viewMode === 'BULK' && (
          <BulkProcessor 
            onAnalysisComplete={handleBulkComplete} 
            existingLibrary={library} 
            onLibraryImport={handleBulkImport} 
            onExit={() => setViewMode('LIBRARY')} 
          />
        )}
        {!showPreview && viewMode === 'SESSION' && (
          <TeacherSessionManager 
            library={library} 
            onExit={onBackToRoleSelect}
            onLibraryUpdate={handleLibraryUpdate}
          />
        )}
        {!showPreview && viewMode === 'LIBRARY' && (
          <TeacherLibrary 
            library={library}
            setLibrary={setLibrary}
            onExit={() => setViewMode('BULK')}
            onOpenSingle={(item) => {
              setSelectedExercise(item);
              setShowPreview(true);
            }}
            isMemoryMode={isMemoryMode}
          />
        )}
        {!showPreview && viewMode === 'ADVANCED_LIBRARY' && (
          <AdvancedLibraryManager 
            library={library}
            setLibrary={setLibrary}
            onExit={() => setViewMode('BULK')}
            onOpenSingle={(item) => {
              setSelectedExercise(item);
              setShowPreview(true);
            }}
            isMemoryMode={isMemoryMode}
          />
        )}
      </main>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

// Main App wrapper with AuthProvider and SubjectProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <SubjectProvider>
        <AppContent />
      </SubjectProvider>
    </AuthProvider>
  )
}

export default App;
