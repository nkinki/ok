
import React, { useState, useEffect } from 'react';
import { CategorizationContent } from '../types';

interface Props {
  content: CategorizationContent;
  onComplete: () => void;
  onNext?: () => void;
  onAnswer?: (isCorrect: boolean, responseTime: number) => void;
  startTime?: Date;
}

const CategorizationExercise: React.FC<Props> = ({ content, onComplete, onNext, onAnswer, startTime }) => {
  const [items, setItems] = useState(() => [...content.items].sort(() => Math.random() - 0.5));
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // itemId -> categoryId
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // For click-to-place
  const [exerciseStartTime] = useState<Date>(startTime || new Date());

  // Don't re-shuffle on every render, only on mount
  // useEffect(() => {
  //   setItems([...content.items].sort(() => Math.random() - 0.5));
  // }, [content]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
    setSelectedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: string | null) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId || isSubmitted) return;

    if (targetCategoryId) {
        // Assign to category
        setAssignments(prev => ({ ...prev, [itemId]: targetCategoryId }));
    } else {
        // Remove assignment (dropped back to bank)
        const newAssignments = { ...assignments };
        delete newAssignments[itemId];
        setAssignments(newAssignments);
    }
    setSelectedItemId(null);
  };

  // Click Handlers (Fallback)
  const handleItemClick = (itemId: string) => {
      if (isSubmitted) return;
      setSelectedItemId(prev => prev === itemId ? null : itemId);
  };

  const handleCategoryClick = (targetCategoryId: string | null) => {
      if (isSubmitted) return;
      if (selectedItemId) {
          if (targetCategoryId) {
              setAssignments(prev => ({ ...prev, [selectedItemId]: targetCategoryId }));
          } else {
              const newAssignments = { ...assignments };
              delete newAssignments[selectedItemId];
              setAssignments(newAssignments);
          }
          setSelectedItemId(null);
      }
  };

  const checkAnswers = () => {
    const newResults: Record<string, boolean> = {};
    let allCorrect = true;

    items.forEach(item => {
      const assignedCat = assignments[item.id];
      const isCorrect = assignedCat === item.categoryId;
      newResults[item.id] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setResults(newResults);
    setIsSubmitted(true);
    
    // Calculate response time and call onAnswer callback
    if (onAnswer) {
      const responseTime = Math.floor((new Date().getTime() - exerciseStartTime.getTime()) / 1000);
      onAnswer(allCorrect, responseTime);
    }
    
    if (allCorrect) {
        onComplete();
    }
  };

  const unassignedItems = items.filter(i => !assignments[i.id]);

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Unassigned Items (Word Bank) */}
      <div 
        className={`
            bg-white p-4 rounded-xl border-2 border-brand-100 shadow-lg mb-6 transition-all
            ${isSubmitted ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
        onClick={() => handleCategoryClick(null)}
      >
         <h3 className="text-xs font-bold text-brand-600 uppercase mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            Besorolandó elemek (Húzd a kategóriákba)
         </h3>
         <div className="flex flex-wrap gap-2 min-h-[50px]">
            {unassignedItems.length === 0 && !isSubmitted && (
                <div className="text-slate-800 text-sm font-medium italic w-full text-center py-2">
                    Minden elemet besoroltál. Ellenőrizd a megoldást!
                </div>
            )}
            {unassignedItems.map(item => (
                <div
                    key={item.id}
                    draggable={!isSubmitted}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onClick={(e) => { e.stopPropagation(); handleItemClick(item.id); }}
                    className={`
                        px-3 py-2 rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none border transition-all font-medium
                        ${selectedItemId === item.id ? 'bg-brand-600 text-white border-brand-600 ring-2 ring-brand-300' : 'bg-white text-brand-900 border-brand-300 hover:bg-brand-50 hover:border-brand-500'}
                    `}
                >
                    {item.text}
                </div>
            ))}
         </div>
      </div>

      {/* Categories (Drop Zones) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-24">
        {content.categories.map(cat => {
             const catItems = items.filter(i => assignments[i.id] === cat.id);
             const isTarget = selectedItemId && !assignments[selectedItemId] && !isSubmitted;

             return (
              <div key={cat.id} className="flex flex-col h-full">
                <div className="bg-brand-600 text-white p-2 rounded-t-lg font-bold text-center shadow-sm text-sm">
                  {cat.name}
                </div>
                <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, cat.id)}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`
                        flex-1 bg-brand-50 border-2 border-t-0 p-3 rounded-b-xl min-h-[200px] flex flex-col gap-2 transition-colors
                        ${isTarget ? 'border-brand-500 bg-brand-100 cursor-pointer ring-1 ring-brand-300' : 'border-brand-200'}
                    `}
                >
                  {catItems.map(item => {
                     const isCorrect = results[item.id];
                     const isWrong = isSubmitted && !isCorrect;
                     
                     return (
                        <div 
                            key={item.id}
                            draggable={!isSubmitted}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={(e) => { e.stopPropagation(); handleItemClick(item.id); }}
                            className={`
                                p-3 rounded-lg text-sm font-bold shadow-sm flex flex-col bg-white cursor-grab active:cursor-grabbing border
                                ${selectedItemId === item.id ? 'ring-2 ring-brand-500 border-brand-700' : 'border-transparent'}
                                ${isSubmitted && isCorrect ? 'border-green-400 bg-green-50 text-green-900' : ''}
                                ${isWrong ? 'border-red-400 bg-red-50 text-red-900' : 'text-slate-800'}
                                ${!isSubmitted && !selectedItemId ? 'hover:border-brand-300' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span>{item.text}</span>
                            </div>
                            
                            {isWrong && (
                                <div className="mt-2 text-xs text-slate-600 border-t border-red-200 pt-1 font-normal">
                                    Helyesen: <strong className="text-brand-700">{content.categories.find(c => c.id === item.categoryId)?.name}</strong>
                                </div>
                            )}
                        </div>
                     );
                  })}
                  
                  {catItems.length === 0 && (
                     <div className={`text-center text-sm font-bold mt-8 pointer-events-none uppercase ${isTarget ? 'text-brand-600 opacity-100 animate-pulse' : 'text-brand-800 opacity-40'}`}>
                         Húzd ide az elemeket
                     </div>
                  )}
                </div>
              </div>
            );
        })}
      </div>

      {/* Check Button */}
      {!isSubmitted && (
         <div className="fixed bottom-6 left-0 w-full flex justify-center pointer-events-none z-30">
            <button 
                onClick={checkAnswers}
                disabled={!items.every(i => assignments[i.id])}
                className={`
                    pointer-events-auto px-8 py-3 rounded-full font-bold text-white shadow-xl border-2 border-white/20 backdrop-blur-sm transition-all transform
                    ${items.every(i => assignments[i.id]) ? 'bg-brand-600 hover:bg-brand-700 hover:scale-105' : 'bg-gray-500 cursor-not-allowed opacity-90'}
                `}
            >
                Ellenőrzés
            </button>
         </div>
      )}

      {/* Next / Restart Buttons (After Submit) */}
      {isSubmitted && (
         <div className="fixed bottom-6 left-0 w-full flex justify-center pointer-events-none z-30 gap-4">
             <button 
                onClick={() => window.location.reload()}
                className="pointer-events-auto bg-white text-brand-600 border-2 border-brand-200 px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-50 transition-colors text-sm"
             >
                Újra
             </button>
             {onNext && (
                <button 
                    onClick={onNext}
                    className="pointer-events-auto bg-brand-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-brand-700 transition-colors flex items-center gap-2 text-sm"
                >
                    Következő
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </button>
             )}
         </div>
      )}

    </div>
  );
};

export default CategorizationExercise;
