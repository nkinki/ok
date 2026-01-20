
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import TeacherSessionManager from './components/TeacherSessionManager';
import TeacherExerciseCreator from './components/TeacherExerciseCreator';
import TeacherLibrary from './components/TeacherLibrary';
import DailyChallenge from './components/DailyChallenge';
import BulkProcessor, { BulkResultItem } from './components/BulkProcessor';
import HelpModal from './components/HelpModal';
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
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-purple-200 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 text-purple-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm font-bold text-lg shrink-0 border border-purple-200">
              OK
            </div>
            <div className="font-bold text-purple-900 text-lg md:text-xl leading-tight">
              Szent Mihály Görögkatolikus Óvoda, Általános Iskola és AMI
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-300">
              ⭐ Diák Mód
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
  const [viewMode, setViewMode] = useState<'BULK' | 'SESSION' | 'SINGLE' | 'LIBRARY'>('SESSION')
  const [library, setLibrary] = useState<BulkResultItem[]>([]);
  const [isMemoryMode, setIsMemoryMode] = useState(false)
  
  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false)
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
            <div className="bg-purple-100 text-purple-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm font-bold text-lg shrink-0 border border-purple-200">
              OK
            </div>
            <div className="font-bold text-purple-900 text-lg md:text-xl leading-tight">
              Szent Mihály Görögkatolikus Óvoda, Általános Iskola és AMI
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-sm font-bold border border-purple-300">
              👨‍🏫 Tanár Mód
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            <button 
              onClick={() => setViewMode('BULK')} 
              className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition-all ${
                viewMode === 'BULK' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'text-slate-600 border-transparent hover:bg-slate-50'
              }`}
            >
              🔄 Tömeges
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
              onClick={() => setViewMode('SINGLE')} 
              className={`hidden sm:block px-3 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'SINGLE' ? 'bg-purple-50 text-purple-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Egyesével
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
              onClick={() => setIsHelpOpen(true)}
              className="text-slate-500 hover:text-purple-700 p-2"
              title="Súgó"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
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
        {viewMode === 'BULK' && (
          <BulkProcessor 
            onAnalysisComplete={handleBulkComplete} 
            existingLibrary={library} 
            onLibraryImport={handleBulkImport} 
            onExit={() => setViewMode('LIBRARY')} 
          />
        )}
        {viewMode === 'SESSION' && (
          <TeacherSessionManager 
            library={library} 
            onExit={onBackToRoleSelect}
            onLibraryUpdate={handleLibraryUpdate}
          />
        )}
        {viewMode === 'SINGLE' && (
          <TeacherExerciseCreator 
            library={library}
            setLibrary={setLibrary}
            onExit={() => setViewMode('BULK')}
          />
        )}
        {viewMode === 'LIBRARY' && (
          <TeacherLibrary 
            library={library}
            setLibrary={setLibrary}
            onExit={() => setViewMode('BULK')}
            onOpenSingle={() => setViewMode('SINGLE')}
            isMemoryMode={isMemoryMode}
          />
        )}
      </main>
      
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

// Main App wrapper with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App;
