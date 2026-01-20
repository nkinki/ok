
import React, { useState, useEffect } from 'react';
import { MatchingContent } from '../types';

interface Props {
  content: MatchingContent;
  onComplete: () => void;
  onNext?: (isCorrect?: boolean, score?: number, timeSpent?: number, answer?: any) => void;
}

const MatchingExercise: React.FC<Props> = ({ content, onComplete, onNext }) => {
  const [matches, setMatches] = useState<Record<string, string>>({}); // leftId (pair.id) -> rightId (pair.id)
  const [rightItems, setRightItems] = useState<Array<{id: string, text: string}>>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null); // For click-to-place
  const [startTime] = useState<Date>(new Date());

  useEffect(() => {
    setRightItems(content.pairs.map(p => ({ id: p.id, text: p.right })).sort(() => Math.random() - 0.5));
  }, [content]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setSelectedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLeftId: string) => {
    e.preventDefault();
    const rightId = e.dataTransfer.getData('text/plain');
    if (!rightId || isSubmitted) return;
    placeItem(targetLeftId, rightId);
  };

  // Click Handlers (Fallback)
  const handleItemClick = (id: string) => {
      if (isSubmitted) return;
      setSelectedId(prev => prev === id ? null : id);
  };

  const handleZoneClick = (targetLeftId: string) => {
      if (isSubmitted) return;
      if (selectedId) {
          placeItem(targetLeftId, selectedId);
      }
  };

  const placeItem = (leftId: string, rightId: string) => {
      // Remove rightId from any other existing match (1-to-1 logic)
      const newMatches = { ...matches };
      Object.keys(newMatches).forEach(key => {
          if (newMatches[key] === rightId) delete newMatches[key];
      });
      newMatches[leftId] = rightId;
      setMatches(newMatches);
      setSelectedId(null);
  };

  const checkAnswers = () => {
    setIsSubmitted(true);
    const correctCount = content.pairs.filter(p => matches[p.id] === p.id).length;
    if (correctCount === content.pairs.length) {
        onComplete();
    }
  };

  const handleNext = () => {
    if (onNext) {
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const correctCount = content.pairs.filter(p => matches[p.id] === p.id).length;
      const isCorrect = correctCount === content.pairs.length;
      
      const matchingAnswer = {
        pairs: content.pairs.map(pair => ({
          left: pair.left,
          right: pair.right,
          userMatch: rightItems.find(r => r.id === matches[pair.id])?.text || 'Nincs válasz',
          isCorrect: matches[pair.id] === pair.id
        })),
        totalPairs: content.pairs.length,
        correctPairs: correctCount
      };
      
      onNext(isCorrect, correctCount, timeSpent, matchingAnswer);
    }
  };

  const reset = () => {
      setMatches({});
      setIsSubmitted(false);
      setSelectedId(null);
  };

  // Filter items still in bank
  const placedRightIds = Object.values(matches);
  const bankItems = rightItems.filter(i => !placedRightIds.includes(i.id));

  return (
    <div className="flex flex-col gap-8 relative">
      
      {/* Word Bank (Sticky) */}
      <div className={`
        bg-white p-4 rounded-xl border-2 border-brand-100 shadow-lg sticky top-0 z-20 transition-all
        ${isSubmitted ? 'opacity-50 pointer-events-none' : ''}
      `}>
        <h3 className="text-xs font-bold text-brand-600 uppercase mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"/></svg>
            Választható elemek (Húzd a helyére)
        </h3>
        <div className="flex flex-wrap gap-2 min-h-[50px]">
            {bankItems.length === 0 && !isSubmitted && (
                <div className="text-slate-800 font-medium text-sm italic w-full text-center py-2">
                    Minden elemet elhelyeztél. Ellenőrizd a megoldást!
                </div>
            )}
            {bankItems.map(item => (
                <div
                    key={item.id}
                    draggable={!isSubmitted}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onClick={() => handleItemClick(item.id)}
                    className={`
                        px-3 py-2 rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none border transition-all
                        ${selectedId === item.id ? 'bg-brand-600 text-white border-brand-600 ring-2 ring-brand-300' : 'bg-white text-brand-800 border-brand-200 hover:bg-brand-50'}
                    `}
                >
                    {item.text}
                </div>
            ))}
        </div>
      </div>

      {/* Pairs List */}
      <div className="space-y-3 pb-24">
         {content.pairs.map(pair => {
             const matchedRightId = matches[pair.id];
             const matchedItem = rightItems.find(i => i.id === matchedRightId);
             
             let statusClass = "border-gray-300 bg-gray-50";
             let textStatusClass = "text-slate-900 font-bold"; // HIGH CONTRAST

             if (isSubmitted) {
                 if (matchedRightId === pair.id) {
                     statusClass = "border-green-500 bg-green-50";
                     textStatusClass = "text-green-800";
                 } else {
                     statusClass = "border-red-300 bg-red-50";
                     textStatusClass = "text-red-800";
                 }
             } else if (matchedRightId) {
                 statusClass = "border-brand-200 bg-white";
                 textStatusClass = "text-brand-900";
             } else if (selectedId) {
                 // Highlight drop zone if item is selected
                 statusClass = "border-brand-500 border-dashed bg-brand-50 animate-pulse shadow-inner ring-1 ring-brand-300";
                 textStatusClass = "text-brand-800 font-bold";
             }

             return (
                 <div key={pair.id} className="flex flex-col md:flex-row md:items-stretch gap-0 md:gap-4 group">
                     {/* Question / Left */}
                     <div className="flex-1 bg-white border border-gray-300 p-4 rounded-t-xl md:rounded-xl flex items-center font-bold text-slate-900 shadow-sm">
                         {pair.left}
                     </div>

                     {/* Connector (Visual) */}
                     <div className="hidden md:flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                     </div>

                     {/* Drop Zone / Right */}
                     <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, pair.id)}
                        onClick={() => handleZoneClick(pair.id)}
                        className={`
                            flex-1 p-2 rounded-b-xl md:rounded-xl border-2 min-h-[60px] flex items-center justify-center relative transition-colors
                            ${statusClass}
                            ${!isSubmitted && !matchedRightId ? 'cursor-pointer hover:border-brand-400' : ''}
                        `}
                     >
                         {matchedItem ? (
                             <div 
                                draggable={!isSubmitted}
                                onDragStart={(e) => handleDragStart(e, matchedItem.id)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(!isSubmitted) handleItemClick(matchedItem.id);
                                }}
                                className={`
                                    w-full text-center px-3 py-2 rounded-lg bg-white border shadow-sm cursor-grab select-none relative z-10 font-medium
                                    ${isSubmitted ? (matchedRightId === pair.id ? 'text-green-900 border-green-300 bg-green-50' : 'text-red-900 border-red-300 bg-red-50') : 'border-brand-300 text-brand-900 hover:border-brand-500'}
                                    ${selectedId === matchedItem.id ? 'ring-2 ring-brand-500 border-brand-700' : ''}
                                `}
                             >
                                 {matchedItem.text}
                             </div>
                         ) : (
                             <span className={`text-sm pointer-events-none select-none ${textStatusClass}`}>
                                 {selectedId ? 'KATTINTS VAGY HÚZD IDE' : 'HÚZD IDE A VÁLASZT'}
                             </span>
                         )}
                         
                         {/* Remove Button */}
                         {!isSubmitted && matchedItem && (
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newM = {...matches};
                                    delete newM[pair.id];
                                    setMatches(newM);
                                }}
                                className="absolute -top-2 -right-2 bg-white rounded-full shadow border border-gray-300 p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 z-10"
                             >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                             </button>
                         )}
                     </div>
                 </div>
             );
         })}
      </div>

      {/* Solution Key */}
      {isSubmitted && (
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-xl border border-slate-700 mt-4 mb-20">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Helyes megoldás
            </h4>
             <div className="grid gap-3 text-sm">
                {content.pairs.map((pair, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center bg-slate-800 p-3 rounded-lg border border-slate-600">
                        <span className="font-bold text-slate-100 flex-1">{pair.left}</span>
                        <span className="hidden sm:block text-slate-400 mx-2">→</span>
                        <span className="font-bold text-green-400 flex-1">{pair.right}</span>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                <button 
                    onClick={reset}
                    className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors border-2 border-transparent"
                >
                    Újrakezdés
                </button>
                {onNext && (
                    <button 
                        onClick={handleNext}
                        className="bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        Következő feladat
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Check Button */}
      {!isSubmitted && (
         <div className="fixed bottom-6 left-0 w-full flex justify-center pointer-events-none z-30">
            <button 
                onClick={checkAnswers}
                disabled={Object.keys(matches).length !== content.pairs.length}
                className={`
                    pointer-events-auto px-8 py-3 rounded-full font-bold text-white shadow-xl border-2 border-white/20 backdrop-blur-sm transition-all transform
                    ${Object.keys(matches).length === content.pairs.length ? 'bg-brand-600 hover:bg-brand-700 hover:scale-105' : 'bg-gray-500 cursor-not-allowed opacity-90'}
                `}
            >
                Ellenőrzés
            </button>
         </div>
      )}
    </div>
  );
};

export default MatchingExercise;
