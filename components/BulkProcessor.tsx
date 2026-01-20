
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService';
import { ExerciseData } from '../types';
import { compressImage } from '../utils/imageUtils';
import { logger } from '../utils/logger';

export interface BulkResultItem {
  id: string;
  fileName: string;
  data: ExerciseData;
  imageUrl: string; 
}

interface ProcessedItem {
  file: File;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR' | 'WAITING' | 'STOPPED';
  data?: ExerciseData;
  croppedImageUrl?: string;
  error?: string;
  retryCount?: number;
}

interface Props {
  onAnalysisComplete: (results: BulkResultItem[]) => void;
  existingLibrary?: BulkResultItem[];
  onLibraryImport?: (items: BulkResultItem[]) => void;
  onExit?: () => void;
}

const BulkProcessor: React.FC<Props> = ({ onAnalysisComplete, existingLibrary = [], onLibraryImport, onExit }) => {
  const [queue, setQueue] = useState<ProcessedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [stopRequested, setStopRequested] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const stopRef = useRef(false);
  const countdownRef = useRef<number | null>(null);

  useEffect(() => { stopRef.current = stopRequested; }, [stopRequested]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files) as File[];
      let skippedCount = 0;
      
      const newFiles = fileList.filter(file => {
          // Check if file exists in current queue
          const inQueue = queue.some(item => item.file.name === file.name);
          // Check if file exists in completed library
          const inLibrary = existingLibrary.some(item => item.fileName === file.name);
          
          if (inQueue || inLibrary) {
              skippedCount++;
              return false;
          }
          return true;
      }).map(file => ({
        file,
        status: 'PENDING' as const,
        retryCount: 0
      }));

      if (skippedCount > 0) {
          alert(`${skippedCount} fájl kihagyva, mert már létezik a könyvtárban vagy a sorban.`);
      }

      if (newFiles.length > 0) {
          setQueue(prev => [...prev, ...newFiles]);
          logger.info(`${newFiles.length} új fájl hozzáadva a sorhoz.`);
      }
    }
  };

  // Import existing JSON for filtering
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onLibraryImport) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const content = ev.target?.result as string;
              const items = JSON.parse(content) as BulkResultItem[];
              
              if (!Array.isArray(items)) {
                  alert("❌ Hibás fájlformátum!\n\nA JSON fájl nem tartalmaz érvényes tömböt.");
                  return;
              }
              
              if (items.length === 0) {
                  alert("⚠️ Üres fájl!\n\nA JSON fájl nem tartalmaz feladatokat.");
                  return;
              }
              
              // Validate structure
              const invalidItems = items.filter(item => 
                  !item.id || !item.fileName || !item.data || !item.imageUrl
              );
              
              if (invalidItems.length > 0) {
                  alert(`❌ Hibás adatstruktúra!\n\n${invalidItems.length} elem hiányos vagy hibás formátumú.\n\nEllenőrizd, hogy minden elem tartalmazza:\n• id\n• fileName\n• data\n• imageUrl`);
                  return;
              }
              
              // Check for processed exercises (should have exercise data)
              const unprocessedItems = items.filter(item => 
                  !item.data.type || !item.data.title || !item.data.instruction
              );
              
              if (unprocessedItems.length > 0) {
                  alert(`⚠️ Feldolgozatlan feladatok!\n\n${unprocessedItems.length} elem még nincs feldolgozva (hiányzik a type, title vagy instruction).\n\nCsak feldolgozott feladatokat lehet importálni.`);
                  return;
              }
              
              // Success - import items
              onLibraryImport(items);
              alert(`✅ Sikeres import!\n\n${items.length} feldolgozott feladat importálva a könyvtárba.`);
              
          } catch (err) {
              console.error("JSON import error:", err);
              alert(`❌ Hiba a JSON betöltésekor!\n\nRészletek: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}\n\nEllenőrizd, hogy érvényes JSON fájlt választottál.`);
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startCountdown = async (seconds: number) => {
      logger.warn(`Pihenő indítása: ${seconds}mp`);
      countdownRef.current = seconds;
      setCountdown(seconds);
      
      while (countdownRef.current !== null && countdownRef.current > 0) {
          if (stopRef.current) return;
          await wait(1000);
          if (countdownRef.current !== null) {
             countdownRef.current--;
             setCountdown(countdownRef.current);
          }
      }
      setCountdown(null);
      countdownRef.current = null;
      logger.info("Pihenő vége, folytatás...");
  };

  const skipWait = () => {
      if (countdown !== null) {
          logger.info("Várakozás megszakítása felhasználói kérésre.");
          countdownRef.current = 0;
          setCountdown(0);
      }
  };

  const processQueue = async (retryErrorsOnly = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStopRequested(false);
    stopRef.current = false;
    
    logger.info("Feldolgozás indítása...");

    let localQueue = [...queue];
    let consecutiveQuotaErrors = 0;

    if (retryErrorsOnly) {
        // Reset ERROR and STOPPED items to PENDING
        localQueue = localQueue.map(item => 
            (item.status === 'ERROR' || item.status === 'STOPPED') 
            ? { ...item, status: 'PENDING', error: undefined, retryCount: 0 } 
            : item
        );
        setQueue(prev => prev.map(item => 
            (item.status === 'ERROR' || item.status === 'STOPPED') 
            ? { ...item, status: 'PENDING', error: undefined, retryCount: 0 } 
            : item
        ));
        await wait(100);
    }

    for (let i = 0; i < localQueue.length; i++) {
        if (stopRef.current) {
            logger.warn("Feldolgozás leállítva a felhasználó által.");
            break;
        }

        if (consecutiveQuotaErrors >= 5) {
             logger.error("STOP: Úgy tűnik, elérted a napi limitet (Daily Quota).");
             alert("Leállítás: Túl sok 'Kvóta' hiba egymás után. Valószínűleg elérted a napi limitet.");
             break;
        }

        const item = localQueue[i];
        if (item.status !== 'PENDING') continue;

        localQueue[i] = { ...item, status: 'PROCESSING' };
        setQueue(prev => {
            const next = [...prev];
            next[i] = { ...next[i], status: 'PROCESSING' };
            return next;
        });

        logger.info(`Feldolgozás: ${item.file.name} (Próbálkozás: ${(item.retryCount || 0) + 1})...`);

        try {
            // 1. Compress (High Quality)
            const base64 = await compressImage(item.file);

            // 2. Analyze
            const result = await analyzeImage(base64);

            // 3. No Auto Crop - Use Full Compressed Image
            const finalImageUrl = `data:image/jpeg;base64,${base64}`;

            // 4. Success
            const doneItem: ProcessedItem = { ...item, status: 'DONE', data: result, croppedImageUrl: finalImageUrl };
            localQueue[i] = doneItem;
            setQueue(prev => {
                const next = [...prev];
                next[i] = doneItem;
                return next;
            });
            setProcessedCount(prev => prev + 1);
            consecutiveQuotaErrors = 0; // Reset error counter on success

            // 5. Speed Optimization: 5s delay
            logger.info("Siker. Biztonsági várakozás (5mp)...");
            await wait(5000);

        } catch (err: any) {
            const errString = typeof err === 'object' ? JSON.stringify(err) : String(err);
            const errorMessage = err?.message || "";
            
            // Check for 429 (Quota) OR 503 (Overloaded/Unavailable)
            const isQuotaError = errorMessage.includes("429") || errString.includes("RESOURCE_EXHAUSTED");
            const isOverloadedError = errorMessage.includes("503") || errString.includes("UNAVAILABLE") || errString.includes("overloaded");

            if (isQuotaError || isOverloadedError) {
                const currentRetries = item.retryCount || 0;
                
                // Max Retries Logic (Skip after 3 attempts)
                if (currentRetries >= 3) {
                    logger.error(`Túl sok sikertelen próbálkozás (${item.file.name}). Átugrás.`);
                    localQueue[i] = { ...item, status: 'ERROR', error: "Túl sok próbálkozás (Limit/Hiba)" };
                    setQueue(prev => { const next = [...prev]; next[i] = localQueue[i]; return next; });
                    if (isQuotaError) consecutiveQuotaErrors++;
                    continue;
                }

                const waitTime = isQuotaError ? 60 : 20; // 60s for quota, 20s for server overload
                const reason = isQuotaError ? "Kvóta betelt (429)" : "Google Szerver Túlterhelt (503)";
                
                logger.warn(`${reason} észlelve! Várakozás és újrapróbálás (${currentRetries + 1}/3)...`);
                
                localQueue[i] = { ...item, status: 'WAITING', error: `${reason} (${waitTime}mp)` };
                setQueue(prev => { const next = [...prev]; next[i] = localQueue[i]; return next; });

                await startCountdown(waitTime);
                
                if (stopRef.current) {
                    // If stopped during wait, mark as STOPPED (so it can be resumed later)
                    localQueue[i] = { ...item, status: 'STOPPED', error: "Megállítva (Folytatható)" };
                    setQueue(prev => { const next = [...prev]; next[i] = localQueue[i]; return next; });
                    break;
                }

                // Retry same index with incremented count
                localQueue[i] = { ...item, status: 'PENDING', retryCount: currentRetries + 1, error: undefined };
                setQueue(prev => { const next = [...prev]; next[i] = localQueue[i]; return next; });
                i--; 
                continue;
            } else {
                // Other errors (e.g. parsing)
                logger.error(`Hiba a fájlnál (${item.file.name}):`, errorMessage);
                localQueue[i] = { ...item, status: 'ERROR', error: "Hiba: " + errorMessage.substring(0, 30) };
                setQueue(prev => { const next = [...prev]; next[i] = localQueue[i]; return next; });
            }
        }
    }

    setIsProcessing(false);
    logger.info("A sor feldolgozása befejeződött.");
  };

  const stopProcessing = () => {
    setStopRequested(true);
    stopRef.current = true; // Immediate effect
    setCountdown(null); // Hide modal immediately
    countdownRef.current = null;
    
    // Do NOT exit to library on stop, stay in bulk view
  };

  const getCompletedItems = (): BulkResultItem[] => {
      return queue
        .filter(q => q.status === 'DONE' && q.data && q.croppedImageUrl)
        .map((q, i) => ({
            id: `bulk-${Date.now()}-${i}`,
            fileName: q.file.name,
            data: q.data!,
            imageUrl: q.croppedImageUrl!
        }));
  };

  const handleSaveToLibrary = () => {
      onAnalysisComplete(getCompletedItems());
  };

  const handleDownloadJSON = () => {
      // 1. Get new items
      const newItems = getCompletedItems();
      
      // 2. Merge with existing library (avoid duplicates by filename)
      const mergedLibrary = [...existingLibrary];
      
      newItems.forEach(newItem => {
          if (!mergedLibrary.some(ex => ex.fileName === newItem.fileName)) {
              mergedLibrary.push(newItem);
          }
      });

      if (mergedLibrary.length === 0) {
          alert("Nincs mit menteni (üres a könyvtár és a sor is).");
          return;
      }

      const dataStr = JSON.stringify(mergedLibrary, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `okosgyakorlo_teljes_mentes_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      logger.success(`Teljes mentés letöltve (${mergedLibrary.length} elem).`);
  };

  const handleClearStorage = () => {
    if (confirm("⚠️ FIGYELEM!\n\nEz törölni fogja az ÖSSZES böngésző adatot ezen az oldalon:\n• Feladat könyvtár\n• Beállítások\n• Minden mentett adat\n\nBiztosan folytatod?")) {
      try {
        // Clear all localStorage for this domain
        localStorage.clear();
        alert("✅ Tárhely sikeresen törölve!\n\nAz oldal újratöltődik...");
        // Reload page to reset everything
        window.location.reload();
      } catch (e) {
        console.error("Error clearing storage:", e);
        alert("❌ Hiba a tárhely törlésekor. Próbáld újra vagy használd a böngésző beállításait.");
      }
    }
  };

  const doneCount = queue.filter(q => q.status === 'DONE').length;
  const errorCount = queue.filter(q => q.status === 'ERROR').length;
  const pendingCount = queue.filter(q => q.status === 'PENDING').length;
  const stoppedCount = queue.filter(q => q.status === 'STOPPED').length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Kezdés - Tömeges Feldolgozó</h2>
          <div className="flex gap-2 items-center">
              {onLibraryImport && (
                  <label className="bg-brand-100 hover:bg-brand-200 text-brand-900 border border-brand-300 px-6 py-3 rounded-lg font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      1. Meglévő JSON betöltése
                      <input type="file" accept=".json" className="hidden" onChange={handleJSONImport} />
                  </label>
              )}
              <span className="text-slate-300">|</span>
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-sm text-brand-600 underline">API beszerzése</a>
              <span className="text-slate-300">|</span>
              <button 
                onClick={handleClearStorage}
                className="text-sm text-red-600 underline hover:text-red-800"
                title="Teljes tárhely törlése"
              >
                Tárhely kiürítése
              </button>
          </div>
        </div>
        <p className="text-slate-600 mb-6">
            A rendszer automatikusan kezeli a hibákat. A már kész fájlokat átugorja.
        </p>

        <div className="flex flex-wrap gap-4 mb-6 items-center">
            <label className={`bg-brand-100 hover:bg-brand-200 text-brand-900 border border-brand-300 px-6 py-3 rounded-lg font-bold cursor-pointer transition-colors shadow-sm ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                + Képek hozzáadása
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} disabled={isProcessing} />
            </label>
            
            {!isProcessing && (pendingCount > 0 || stoppedCount > 0) && (
                <button onClick={() => processQueue(false)} className="bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 px-6 py-3 rounded-lg font-bold shadow-lg flex gap-2">
                    Indítás ({pendingCount + stoppedCount} db)
                </button>
            )}

            {isProcessing && (
                <button onClick={stopProcessing} className="bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 px-6 py-3 rounded-lg font-bold shadow-lg animate-pulse">
                    Megállítás {countdown ? `(${countdown}s)` : ''}
                </button>
            )}

            {!isProcessing && errorCount > 0 && (
                <button onClick={() => processQueue(true)} className="bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 px-6 py-3 rounded-lg font-bold shadow-lg">
                    Hibásak Újrapróbálása
                </button>
            )}

            {/* Save Actions */}
            {!isProcessing && (doneCount > 0 || existingLibrary.length > 0) && (
                <div className="flex gap-2 ml-auto">
                    <button onClick={handleDownloadJSON} className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        Teljes Mentés (Fájlba)
                    </button>
                    {doneCount > 0 && (
                        <button onClick={handleSaveToLibrary} className="bg-green-100 hover:bg-green-200 text-green-900 border border-green-300 px-6 py-3 rounded-lg font-bold shadow-lg">
                            Mentés a Könyvtárba
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Countdown / Hot Swap Overlay */}
      {countdown !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                      {countdown}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Kényszerpihenő (Kvóta)</h3>
                  <p className="text-slate-600 mb-6">
                      A Google API pihenőt kért. Ha van másik kulcsod, cseréld ki a Beállításokban, majd kattints a lenti gombra.
                  </p>
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={skipWait}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg animate-pulse"
                      >
                          Folytatás most (Várakozás átugrása)
                      </button>
                      <button onClick={stopProcessing} className="text-slate-500 hover:text-slate-700 text-sm">
                          Inkább állítsd meg
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queue.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col relative">
                 {item.status === 'PROCESSING' && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>}
                 {item.status === 'WAITING' && <div className="absolute inset-0 bg-orange-50/90 z-10 flex flex-col items-center justify-center text-orange-600 font-bold text-center p-2"><div>Várakozás...</div><div className="text-xs font-normal">{item.error}</div></div>}
                 
                 <div className="h-32 bg-slate-100 relative">
                     {item.croppedImageUrl ? (
                        <img src={item.croppedImageUrl} className="w-full h-full object-contain" alt="" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                             {item.status === 'STOPPED' ? 'Megállítva' : 'Kép betöltése...'}
                        </div>
                     )}
                     <div className={`absolute top-1 right-1 px-2 rounded text-xs font-bold ${item.status === 'ERROR' ? 'bg-red-100 text-red-600' : 'bg-white/90'}`}>
                         {item.status === 'STOPPED' ? 'Megállítva' : item.status}
                         {item.retryCount ? ` (${item.retryCount})` : ''}
                     </div>
                 </div>
                 <div className="p-3 text-xs">
                     <div className="font-bold truncate">{item.file.name}</div>
                     {item.error && <div className="text-red-500 mt-1 break-words">{item.error}</div>}
                 </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default BulkProcessor;
