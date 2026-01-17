
import React, { useState, useRef, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import MatchingExercise from './components/MatchingExercise';
import CategorizationExercise from './components/CategorizationExercise';
import QuizExercise from './components/QuizExercise';
import ImageViewer from './components/ImageViewer';
import BulkProcessor, { BulkResultItem } from './components/BulkProcessor';
import HelpModal from './components/HelpModal';
import SettingsModal from './components/SettingsModal';
import DebugConsole from './components/DebugConsole';
import EditExerciseModal from './components/EditExerciseModal';
import ReanalyzeModal from './components/ReanalyzeModal';
import DailyChallenge from './components/DailyChallenge';
import { analyzeImage } from './services/geminiService';
import { ExerciseData, ExerciseType } from './types';
import { logger } from './utils/logger';

type ViewMode = 'SINGLE' | 'BULK' | 'LIBRARY' | 'DAILY';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIBRARY');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReanalyzeOpen, setIsReanalyzeOpen] = useState(false);

  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const [isMemoryMode, setIsMemoryMode] = useState(false); 
  
  const [library, setLibrary] = useState<BulkResultItem[]>([]);
  const [currentLibraryIndex, setCurrentLibraryIndex] = useState<number | null>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Load Saved Session on Mount
  useEffect(() => {
      const debugPref = localStorage.getItem('app_debug_mode');
      setIsDebugEnabled(debugPref === 'true');

      const savedLibrary = localStorage.getItem('okosgyakorlo_library');
      if (savedLibrary) {
          try {
              const parsed = JSON.parse(savedLibrary);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  setLibrary(parsed);
                  logger.info(`Helyreállítva ${parsed.length} elem a korábbi munkamenetből.`);
              }
          } catch (e) {
              console.error("Failed to restore library", e);
          }
      }
  }, []);

  // 2. Auto-Save Library Logic
  useEffect(() => {
      if (library.length > 0) {
          try {
            localStorage.setItem('okosgyakorlo_library', JSON.stringify(library));
            if (isMemoryMode) setIsMemoryMode(false); 
          } catch (e) {
              console.error("Storage full", e);
              setIsMemoryMode(true);
          }
      } else {
          if (library.length === 0 && localStorage.getItem('okosgyakorlo_library')) {
            localStorage.removeItem('okosgyakorlo_library');
          }
      }
  }, [library]);

  const handleImageSelected = async (base64: string) => {
    const fullSrc = `data:image/jpeg;base64,${base64}`;
    setImageSrc(fullSrc);
    setExerciseData(null);
    setIsAnalyzing(true);
    setError(null);
    setCurrentLibraryIndex(null); 

    try {
        const data = await analyzeImage(base64);
        setExerciseData(data);
    } catch (e: any) {
        console.error(e);
        setError("Hiba történt. (Részletek a Debug Konzolon)");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleReanalyze = async (hint: string) => {
      if (!imageSrc) return;
      setIsReanalyzeOpen(false);
      
      setExerciseData(null);
      setIsAnalyzing(true);
      setError(null);
      
      try {
          const base64 = imageSrc.split(',')[1];
          const data = await analyzeImage(base64, hint);
          setExerciseData(data);
          
          if (currentLibraryIndex !== null) {
              setLibrary(prev => {
                  const next = [...prev];
                  if (next[currentLibraryIndex]) {
                      next[currentLibraryIndex] = { ...next[currentLibraryIndex], data: data };
                  }
                  return next;
              });
          }
      } catch (e: any) {
          console.error(e);
          setError("Hiba az újraértelmezés során. Ellenőrizd a konzolt.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleBulkComplete = (results: BulkResultItem[]) => {
      setLibrary(prev => {
          const newItems = results.filter(r => !prev.some(p => p.id === r.id));
          return [...prev, ...newItems];
      });
      setViewMode('LIBRARY');
      alert(`${results.length} új elem mentve a Könyvtárba!`);
  };

  const handleBulkImport = (importedData: BulkResultItem[]) => {
      setLibrary(prev => {
          const uniqueImported = importedData.filter(newItem => 
              !prev.some(existing => existing.id === newItem.id)
          );
          return [...prev, ...uniqueImported];
      });
      alert(`${importedData.length} meglévő elem betöltve a szűréshez!`);
  };

  const handleOpenFromLibrary = (item: BulkResultItem) => {
      const index = library.findIndex(i => i.id === item.id);
      setCurrentLibraryIndex(index);
      setImageSrc(item.imageUrl);
      setExerciseData(item.data);
      setViewMode('SINGLE');
  };

  const handleNextExercise = () => {
      if (currentLibraryIndex === null || currentLibraryIndex >= library.length - 1) return;
      const nextIndex = currentLibraryIndex + 1;
      const nextItem = library[nextIndex];
      handleOpenFromLibrary(nextItem);
  };

  const handleReset = () => {
    setImageSrc(null);
    setExerciseData(null);
    setError(null);
    setCurrentLibraryIndex(null);
  };

  const handleExportLibrary = () => {
      if (library.length === 0) return;
      const dataStr = JSON.stringify(library, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `okosgyakorlo_mentes_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleClearSession = () => {
      if (confirm("Biztosan törölni szeretnéd a teljes munkamenetet? Minden nem exportált adat elveszik!")) {
          setLibrary([]);
          localStorage.removeItem('okosgyakorlo_library');
          setViewMode('LIBRARY');
          setIsMemoryMode(false);
      }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const importedData = JSON.parse(content) as BulkResultItem[];
              if (Array.isArray(importedData) && importedData.length > 0 && importedData[0].data) {
                  handleBulkImport(importedData);
                  setViewMode('LIBRARY');
              } else alert("Hibás fájlformátum.");
          } catch (err) { console.error(err); alert("Hiba a fájl beolvasásakor."); }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  const saveEditedData = (newData: ExerciseData, newImageUrl?: string) => {
      setExerciseData(newData);
      if (newImageUrl) {
          setImageSrc(newImageUrl);
      }

      if (currentLibraryIndex !== null) {
          setLibrary(prev => {
              const next = [...prev];
              if (next[currentLibraryIndex]) {
                  next[currentLibraryIndex] = { 
                      ...next[currentLibraryIndex], 
                      data: newData,
                      imageUrl: newImageUrl || next[currentLibraryIndex].imageUrl 
                  };
              }
              return next;
          });
      }
      setIsEditOpen(false);
  };

  const renderSingleMode = () => {
    if (!imageSrc) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Alakítsd át a tankönyvi képeket interaktív játékká!</h2>
                    <p className="text-lg text-slate-600">Tölts fel egy fotót, az AI (OkosGyakorló) elvégzi a többit.</p>
                </div>
                <UploadZone onImageSelected={handleImageSelected} isAnalyzing={isAnalyzing} />
                {error && <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">{error}</div>}
            </div>
        );
    }

    const hasNext = currentLibraryIndex !== null && currentLibraryIndex < library.length - 1;
    const uniqueKey = exerciseData ? `${exerciseData.title}-${currentLibraryIndex ?? 'new'}-${Date.now()}` : 'loading';

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row overflow-hidden">
            <div className="lg:w-1/2 h-1/3 lg:h-full bg-slate-900 relative border-b lg:border-b-0 lg:border-r border-slate-700">
                <div className="absolute top-4 left-4 z-10 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm flex gap-2 items-center">
                    Eredeti feladat
                    {currentLibraryIndex !== null && (
                        <span className="bg-white/20 px-2 rounded text-white/90">
                            {currentLibraryIndex + 1} / {library.length}
                        </span>
                    )}
                </div>
                <ImageViewer src={imageSrc} alt="Eredeti feladat" />
            </div>
            <div className="lg:w-1/2 h-2/3 lg:h-full bg-slate-50 overflow-y-auto p-6 relative">
                <div className="max-w-2xl mx-auto">
                    <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-brand-900 mb-2">{exerciseData?.title || "Betöltés..."}</h1>
                            <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200 text-sm">{exerciseData?.instruction || "Generálás..."}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            {exerciseData && (
                                <>
                                    <button onClick={() => setIsReanalyzeOpen(true)} className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Hibás felismerés? Újraértelmezés...">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                    <button onClick={() => setIsEditOpen(true)} className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Szerkesztés">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                    </button>
                                    {hasNext && (
                                        <button onClick={handleNextExercise} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 ml-2">
                                            Következő feladat
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {!exerciseData ? (
                         <div className="flex flex-col items-center justify-center py-12 space-y-4">
                             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                             <p className="text-brand-600 font-medium animate-pulse">A feladat generálása...</p>
                         </div>
                    ) : (
                        <>
                            {exerciseData.type === ExerciseType.MATCHING && <MatchingExercise key={uniqueKey} content={exerciseData.content as any} onComplete={() => {}} onNext={hasNext ? handleNextExercise : undefined} />}
                            {exerciseData.type === ExerciseType.CATEGORIZATION && <CategorizationExercise key={uniqueKey} content={exerciseData.content as any} onComplete={() => {}} onNext={hasNext ? handleNextExercise : undefined} />}
                            {exerciseData.type === ExerciseType.QUIZ && <QuizExercise key={uniqueKey} content={exerciseData.content as any} onComplete={() => {}} onNext={hasNext ? handleNextExercise : undefined} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => {
            setIsSettingsOpen(false);
            const debugPref = localStorage.getItem('app_debug_mode');
            setIsDebugEnabled(debugPref === 'true');
        }} 
      />
      <EditExerciseModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        exerciseData={exerciseData} 
        imageSrc={imageSrc}
        onSave={saveEditedData} 
      />
      <ReanalyzeModal isOpen={isReanalyzeOpen} onClose={() => setIsReanalyzeOpen(false)} onReanalyze={handleReanalyze} />
      {isDebugEnabled && <DebugConsole />}
      
      <nav className="bg-white border-b border-purple-200 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode('LIBRARY')}>
            <div className="bg-purple-100 text-purple-900 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm font-bold text-lg shrink-0 border border-purple-200">
                OK
            </div>
            <div className="font-bold text-purple-900 text-lg md:text-xl leading-tight">
                Szent Mihály Görögkatolikus Óvoda, Általános Iskola és AMI
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
             <button onClick={() => setViewMode('DAILY')} className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition-all ${viewMode === 'DAILY' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'text-slate-600 border-transparent hover:bg-slate-50'}`}>
                 ⭐ Napi Gyakorlás
             </button>
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             
             <button onClick={() => setViewMode('LIBRARY')} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${viewMode === 'LIBRARY' ? 'bg-purple-50 text-purple-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                 Könyvtár {library.length > 0 && <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full font-bold">{library.length}</span>}
             </button>
             <button onClick={() => setViewMode('BULK')} className={`hidden sm:block px-3 py-2 rounded-lg text-sm font-medium ${viewMode === 'BULK' ? 'bg-purple-50 text-purple-800' : 'text-slate-600 hover:bg-slate-50'}`}>Tömeges</button>
             
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             
             <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-purple-700 p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
             <button onClick={() => setIsHelpOpen(true)} className="text-slate-500 hover:text-purple-700 p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></button>
          </div>
        </div>
      </nav>

      <main>
        {viewMode === 'SINGLE' && renderSingleMode()}
        {viewMode === 'BULK' && <BulkProcessor onAnalysisComplete={handleBulkComplete} existingLibrary={library} onLibraryImport={handleBulkImport} onExit={() => setViewMode('LIBRARY')} />}
        {viewMode === 'DAILY' && <DailyChallenge library={library} onExit={() => setViewMode('LIBRARY')} />}
        {viewMode === 'LIBRARY' && (
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">Feladat Könyvtár</h2>
                        <p className="text-slate-600">A mentett és feldolgozott feladatok gyűjteménye.</p>
                        {isMemoryMode && (
                            <div className="mt-2 p-3 bg-orange-100 border border-orange-300 rounded-lg flex flex-col sm:flex-row gap-3 items-center">
                                <span className="text-orange-800 font-bold text-sm">⚠️ MEMÓRIA MÓD: A tárhely megtelt. Kérlek mentsd le a munkádat fájlba!</span>
                                <button onClick={handleExportLibrary} className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-bold shadow hover:bg-orange-700 whitespace-nowrap">
                                    Mentés fájlba most
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileImport} />
                        <button onClick={handleClearSession} className="bg-white text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg font-medium shadow-sm text-sm flex items-center gap-2">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                             Törlés / Új munkamenet
                        </button>
                        <button onClick={handleImportClick} className="bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                            Betöltés (Import)
                        </button>
                        <button onClick={handleExportLibrary} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Mentés fájlba (Export)
                        </button>
                    </div>
                </div>

                {library.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                        <h3 className="text-xl font-medium text-slate-400">A könyvtár üres</h3>
                        <p className="text-slate-400 mt-2">Kezdj el feladatokat generálni az "Egyesével" vagy "Tömeges" menüben!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {library.map((item, idx) => (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="h-48 bg-slate-100 relative cursor-pointer" onClick={() => handleOpenFromLibrary(item)}>
                                    <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.data.title} />
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                        {item.data.type}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 truncate flex-1" title={item.data.title}>{item.data.title}</h3>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setCurrentLibraryIndex(idx); setExerciseData(item.data); setIsEditOpen(true); }} className="p-1 text-slate-400 hover:text-brand-600 bg-slate-50 rounded border border-slate-200" title="Szerkesztés">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{item.data.instruction}</p>
                                    <button onClick={() => handleOpenFromLibrary(item)} className="w-full bg-purple-50 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-100 transition-colors">
                                        Megnyitás
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
