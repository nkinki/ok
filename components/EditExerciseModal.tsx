
import React, { useState, useEffect, useRef } from 'react';
import { ExerciseData, ExerciseType, MatchingContent, CategorizationContent, QuizContent } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  exerciseData: ExerciseData | null;
  imageSrc?: string | null;
  onSave: (data: ExerciseData, newImage?: string) => void;
}

const EditExerciseModal: React.FC<Props> = ({ isOpen, onClose, exerciseData, imageSrc, onSave }) => {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'IMAGE'>('CONTENT');
  const [formData, setFormData] = useState<ExerciseData | null>(null);
  
  // Crop state
  const [crop, setCrop] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (exerciseData) {
      setFormData(JSON.parse(JSON.stringify(exerciseData))); // Deep copy
    }
  }, [exerciseData, isOpen]);

  // Load image for cropping
  useEffect(() => {
      if (imageSrc && isOpen) {
          const img = new Image();
          img.src = imageSrc;
          img.onload = () => {
              setOriginalImage(img);
              // Reset crop
              setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
          };
      }
  }, [imageSrc, isOpen]);

  // Render crop preview
  useEffect(() => {
      if (activeTab === 'IMAGE' && originalImage && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Fit canvas to container width, maintain aspect ratio
          const containerWidth = Math.min(600, window.innerWidth - 64);
          const scale = containerWidth / originalImage.width;
          canvas.width = containerWidth;
          canvas.height = originalImage.height * scale;

          // Draw image
          ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

          // Draw dark overlay for cropped areas
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          
          // Top
          const topH = (crop.top / 100) * canvas.height;
          ctx.fillRect(0, 0, canvas.width, topH);
          
          // Bottom
          const bottomH = (crop.bottom / 100) * canvas.height;
          ctx.fillRect(0, canvas.height - bottomH, canvas.width, bottomH);

          // Left
          const leftW = (crop.left / 100) * canvas.width;
          ctx.fillRect(0, topH, leftW, canvas.height - topH - bottomH);

          // Right
          const rightW = (crop.right / 100) * canvas.width;
          ctx.fillRect(canvas.width - rightW, topH, rightW, canvas.height - topH - bottomH);

          // Draw boundary lines
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(leftW, topH, canvas.width - leftW - rightW, canvas.height - topH - bottomH);
      }
  }, [activeTab, crop, originalImage]);

  if (!isOpen || !formData) return null;

  const handleSave = () => {
    if (formData) {
        if (activeTab === 'IMAGE' && originalImage) {
            // Apply crop and save
             const canvas = document.createElement('canvas');
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 const finalX = (crop.left / 100) * originalImage.width;
                 const finalY = (crop.top / 100) * originalImage.height;
                 const finalW = originalImage.width * (1 - (crop.left + crop.right) / 100);
                 const finalH = originalImage.height * (1 - (crop.top + crop.bottom) / 100);

                 canvas.width = finalW;
                 canvas.height = finalH;
                 
                 ctx.drawImage(originalImage, finalX, finalY, finalW, finalH, 0, 0, finalW, finalH);
                 const newImageUrl = canvas.toDataURL('image/jpeg', 0.9);
                 onSave(formData, newImageUrl);
             } else {
                 onSave(formData);
             }
        } else {
            onSave(formData);
        }
        onClose();
    }
  };

  // --- TYPE CHANGE HANDLER ---
  const handleTypeChange = (newType: ExerciseType) => {
      if (!formData) return;
      
      if (confirm("A típus váltása törli a jelenlegi tartalom szerkezetét. Biztosan váltasz?")) {
          let newContent: any = {};
          
          // Initialize empty content for the new type
          if (newType === ExerciseType.MATCHING) {
              newContent = { pairs: [{ id: 'p1', left: '', right: '' }] };
          } else if (newType === ExerciseType.CATEGORIZATION) {
              newContent = { 
                  categories: [{ id: 'c1', name: 'Kategória 1' }, { id: 'c2', name: 'Kategória 2' }], 
                  items: [{ id: 'i1', text: 'Elem 1', categoryId: 'c1' }] 
              };
          } else if (newType === ExerciseType.QUIZ) {
              newContent = { 
                  questions: [{ 
                      id: 'q1', 
                      question: 'Írd ide a kérdést...', 
                      options: ['Válasz A', 'Válasz B'], 
                      correctIndex: 0,
                      multiSelect: false,
                      correctIndices: [0]
                  }] 
              };
          }

          setFormData({
              ...formData,
              type: newType,
              content: newContent
          });
      }
  };

  // --- MATCHING EDITORS ---
  const updateMatchingPair = (index: number, field: 'left' | 'right', value: string) => {
      const content = formData.content as MatchingContent;
      const newPairs = [...content.pairs];
      newPairs[index] = { ...newPairs[index], [field]: value };
      setFormData({ ...formData, content: { ...content, pairs: newPairs } });
  };

  const addMatchingPair = () => {
      const content = formData.content as MatchingContent;
      const newId = `pair-${Date.now()}`;
      setFormData({
          ...formData,
          content: { ...content, pairs: [...content.pairs, { id: newId, left: '', right: '' }] }
      });
  };

  const removeMatchingPair = (index: number) => {
      const content = formData.content as MatchingContent;
      const newPairs = content.pairs.filter((_, i) => i !== index);
      setFormData({ ...formData, content: { ...content, pairs: newPairs } });
  };

  // --- CATEGORIZATION EDITORS ---
  const updateCategory = (index: number, name: string) => {
      const content = formData.content as CategorizationContent;
      const newCats = [...content.categories];
      newCats[index] = { ...newCats[index], name };
      setFormData({ ...formData, content: { ...content, categories: newCats } });
  };

  const addCategory = () => {
      const content = formData.content as CategorizationContent;
      const newId = `cat-${Date.now()}`;
      setFormData({
          ...formData,
          content: { ...content, categories: [...content.categories, { id: newId, name: 'Új kategória' }] }
      });
  };

  const removeCategory = (index: number) => {
      const content = formData.content as CategorizationContent;
      const catId = content.categories[index].id;
      const newCats = content.categories.filter((_, i) => i !== index);
      const newItems = content.items.filter(i => i.categoryId !== catId);
      setFormData({ ...formData, content: { ...content, categories: newCats, items: newItems } });
  };

  const updateCatItem = (index: number, field: 'text' | 'categoryId', value: string) => {
      const content = formData.content as CategorizationContent;
      const newItems = [...content.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData({ ...formData, content: { ...content, items: newItems } });
  };

  const addCatItem = () => {
      const content = formData.content as CategorizationContent;
      if (content.categories.length === 0) return alert("Előbb hozz létre kategóriát!");
      const newId = `item-${Date.now()}`;
      setFormData({
          ...formData,
          content: { ...content, items: [...content.items, { id: newId, text: '', categoryId: content.categories[0].id }] }
      });
  };

  const removeCatItem = (index: number) => {
      const content = formData.content as CategorizationContent;
      const newItems = content.items.filter((_, i) => i !== index);
      setFormData({ ...formData, content: { ...content, items: newItems } });
  };

  // --- QUIZ EDITORS ---
  const updateQuestion = (qIndex: number, field: 'question' | 'multiSelect', value: any) => {
      const content = formData.content as QuizContent;
      const newQs = [...content.questions];
      
      if (field === 'multiSelect') {
          newQs[qIndex] = { 
              ...newQs[qIndex], 
              multiSelect: value,
              correctIndices: value ? [newQs[qIndex].correctIndex] : undefined 
          };
      } else {
          newQs[qIndex] = { ...newQs[qIndex], [field]: value };
      }
      
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
      const content = formData.content as QuizContent;
      const newQs = [...content.questions];
      const newOpts = [...newQs[qIndex].options];
      newOpts[oIndex] = value;
      newQs[qIndex] = { ...newQs[qIndex], options: newOpts };
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  const toggleCorrectOption = (qIndex: number, oIndex: number) => {
      const content = formData.content as QuizContent;
      const newQs = [...content.questions];
      const question = newQs[qIndex];

      if (question.multiSelect) {
          let newIndices = question.correctIndices ? [...question.correctIndices] : [];
          if (newIndices.includes(oIndex)) {
              newIndices = newIndices.filter(i => i !== oIndex);
          } else {
              newIndices.push(oIndex);
          }
          newQs[qIndex] = { ...question, correctIndices: newIndices };
      } else {
          newQs[qIndex] = { ...question, correctIndex: oIndex };
      }
      
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  const addQuestion = () => {
      const content = formData.content as QuizContent;
      const newId = `q-${Date.now()}`;
      setFormData({
          ...formData,
          content: { ...content, questions: [...content.questions, { id: newId, question: 'Új kérdés', options: ['Válasz 1', 'Válasz 2'], correctIndex: 0, multiSelect: false, correctIndices: [0] }] }
      });
  };

  const removeQuestion = (index: number) => {
      const content = formData.content as QuizContent;
      const newQs = content.questions.filter((_, i) => i !== index);
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  return (
    // UPDATED: Added pt-24 (top padding) and items-start to push it down.
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      {/* UPDATED: Changed max-h to 80vh to prevent bottom overflow */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col relative">
        <div className="bg-brand-100 px-4 py-2 text-brand-900 border-b border-brand-200 flex justify-between items-center shrink-0 rounded-t-xl">
          <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('CONTENT')}
                className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-colors ${activeTab === 'CONTENT' ? 'bg-white text-brand-900 border-t-2 border-brand-600 shadow-sm' : 'text-brand-700 hover:bg-brand-200'}`}
              >
                  Tartalom
              </button>
              {imageSrc && (
                <button 
                    onClick={() => setActiveTab('IMAGE')}
                    className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-colors ${activeTab === 'IMAGE' ? 'bg-white text-brand-900 border-t-2 border-brand-600 shadow-sm' : 'text-brand-700 hover:bg-brand-200'}`}
                >
                    Képvágás
                </button>
              )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-brand-200 rounded-full"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {activeTab === 'IMAGE' ? (
                <div className="flex flex-col items-center">
                    <p className="text-xs text-slate-600 mb-4 bg-yellow-50 p-2 rounded border border-yellow-200 w-full text-center">
                        Sötétített rész eltávolításra kerül.
                    </p>
                    <canvas ref={canvasRef} className="border border-slate-300 shadow-md max-w-full" />
                    
                    <div className="grid grid-cols-2 gap-2 w-full max-w-lg mt-4 bg-white p-3 rounded-xl border border-slate-200">
                        {['top', 'bottom', 'left', 'right'].map((dir) => (
                            <div key={dir}>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">{dir}</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="45" 
                                    value={(crop as any)[dir]} 
                                    onChange={(e) => setCrop({...crop, [dir]: Number(e.target.value)})} 
                                    className="w-full accent-brand-600 h-2"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
            <>
            {/* Type Selector - Compact */}
            <div className="mb-4 flex items-center gap-2 bg-orange-50 p-2 rounded-lg border border-orange-100">
                 <label className="text-xs font-bold text-orange-800 uppercase shrink-0">Típus:</label>
                 <select 
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as ExerciseType)}
                    className="flex-1 px-2 py-1 rounded border border-orange-300 text-xs font-bold text-orange-900 bg-white"
                 >
                     <option value={ExerciseType.MATCHING}>Párosító</option>
                     <option value={ExerciseType.CATEGORIZATION}>Csoportosító</option>
                     <option value={ExerciseType.QUIZ}>Kvíz / Teszt</option>
                 </select>
            </div>

            {/* Header Info - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cím</label>
                    <input 
                        type="text" 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Utasítás</label>
                    <input 
                        value={formData.instruction} 
                        onChange={(e) => setFormData({...formData, instruction: e.target.value})}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                    />
                </div>
            </div>

            {/* Dynamic Content Editor */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                
                {formData.type === ExerciseType.MATCHING && (
                    <div className="space-y-2">
                        {(formData.content as MatchingContent).pairs.map((pair, idx) => (
                            <div key={pair.id} className="flex gap-2 items-center">
                                <span className="text-slate-400 font-mono text-[10px] w-4">{idx+1}</span>
                                <input 
                                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                                    value={pair.left}
                                    onChange={(e) => updateMatchingPair(idx, 'left', e.target.value)}
                                    placeholder="Bal"
                                />
                                <span className="text-slate-300 text-xs">↔</span>
                                <input 
                                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                                    value={pair.right}
                                    onChange={(e) => updateMatchingPair(idx, 'right', e.target.value)}
                                    placeholder="Jobb"
                                />
                                <button onClick={() => removeMatchingPair(idx)} className="text-slate-300 hover:text-red-500">×</button>
                            </div>
                        ))}
                        <button onClick={addMatchingPair} className="mt-1 text-brand-600 text-xs font-bold hover:underline">+ Pár</button>
                    </div>
                )}

                {formData.type === ExerciseType.CATEGORIZATION && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            {(formData.content as CategorizationContent).categories.map((cat, idx) => (
                                <div key={cat.id} className="flex gap-2 items-center">
                                    <span className="text-[10px] text-slate-400">Kat.</span>
                                    <input 
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                                        value={cat.name}
                                        onChange={(e) => updateCategory(idx, e.target.value)}
                                    />
                                    <button onClick={() => removeCategory(idx)} className="text-slate-300 hover:text-red-500">×</button>
                                </div>
                            ))}
                            <button onClick={addCategory} className="text-brand-600 text-xs font-bold">+ Kategória</button>
                        </div>
                        <div className="space-y-1">
                            {(formData.content as CategorizationContent).items.map((item, idx) => (
                                <div key={item.id} className="flex gap-2 items-center">
                                    <input 
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                                        value={item.text}
                                        onChange={(e) => updateCatItem(idx, 'text', e.target.value)}
                                        placeholder="Elem"
                                    />
                                    <select 
                                        className="px-2 py-1 border border-slate-300 rounded text-xs w-24"
                                        value={item.categoryId}
                                        onChange={(e) => updateCatItem(idx, 'categoryId', e.target.value)}
                                    >
                                        {(formData.content as CategorizationContent).categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => removeCatItem(idx)} className="text-slate-300 hover:text-red-500">×</button>
                                </div>
                            ))}
                            <button onClick={addCatItem} className="text-brand-600 text-xs font-bold">+ Elem</button>
                        </div>
                    </div>
                )}

                {formData.type === ExerciseType.QUIZ && (
                    <div className="space-y-2">
                         {(formData.content as QuizContent).questions.map((q, qIdx) => (
                             <div key={q.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                 <div className="flex justify-between items-center mb-1">
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">#{qIdx+1}</span>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={q.multiSelect || false}
                                                onChange={(e) => updateQuestion(qIdx, 'multiSelect', e.target.checked)}
                                                className="w-3 h-3 text-brand-600 rounded"
                                            />
                                            <span className="text-[10px] text-slate-600">Multi</span>
                                        </label>
                                     </div>
                                     <button onClick={() => removeQuestion(qIdx)} className="text-slate-300 hover:text-red-500 text-[10px]">Törlés</button>
                                 </div>
                                 <input 
                                     className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-bold mb-1"
                                     value={q.question}
                                     onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                                     placeholder="Kérdés..."
                                 />
                                 
                                 <div className="space-y-1 pl-2 border-l-2 border-slate-200">
                                     {q.options.map((opt, oIdx) => {
                                         const isSelected = q.multiSelect 
                                            ? q.correctIndices?.includes(oIdx) 
                                            : q.correctIndex === oIdx;
                                         
                                         return (
                                             <div key={oIdx} className="flex items-center gap-1">
                                                 <input 
                                                    type={q.multiSelect ? "checkbox" : "radio"} 
                                                    name={`q-${q.id}-correct`}
                                                    checked={isSelected || false}
                                                    onChange={() => toggleCorrectOption(qIdx, oIdx)}
                                                    className="cursor-pointer w-3 h-3 text-brand-600 shrink-0"
                                                 />
                                                 <input 
                                                     className="flex-1 px-1.5 py-0.5 border border-slate-300 rounded text-xs"
                                                     value={opt}
                                                     onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                 />
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                         ))}
                         <button onClick={addQuestion} className="text-brand-600 text-xs font-bold">+ Kérdés</button>
                    </div>
                )}
            </div>
            </>
            )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-white flex justify-end gap-2 shrink-0 rounded-b-xl">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-medium">Mégse</button>
            <button onClick={handleSave} className="bg-green-100 text-green-900 border border-green-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-200 shadow-sm">
                Mentés {activeTab === 'IMAGE' ? '& Vágás' : ''}
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditExerciseModal;
