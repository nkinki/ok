
import React, { useState, useEffect, useRef } from 'react';
import { ExerciseData, ExerciseType, MatchingContent, CategorizationContent, QuizContent } from '../types';
import { BulkResultItem } from './BulkProcessor';
import ImageViewer from './ImageViewer';

interface Props {
  item: BulkResultItem;
  onSave: (updatedItem: BulkResultItem) => void;
  onClose: () => void;
}

const EditExerciseModal: React.FC<Props> = ({ item, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'IMAGE'>('CONTENT');
  const [formData, setFormData] = useState<ExerciseData>(item.data);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(item.imageUrl);
  
  // Crop state
  const [crop, setCrop] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [showCropMode, setShowCropMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setFormData(item.data);
    setCurrentImageUrl(item.imageUrl);
  }, [item]);

  // ESC key handler for closing modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Load image for cropping
  useEffect(() => {
      if (currentImageUrl && showCropMode) {
          const img = new Image();
          img.src = currentImageUrl;
          img.onload = () => {
              setOriginalImage(img);
              // Reset crop
              setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
          };
      }
  }, [currentImageUrl, showCropMode]);

  // Render crop preview
  useEffect(() => {
      if (showCropMode && originalImage && canvasRef.current) {
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
  }, [showCropMode, crop, originalImage]);

  if (!formData) return null;

  const handleSave = () => {
    if (formData) {
        if (showCropMode && originalImage) {
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
                 
                 // Create updated item with new image
                 const updatedItem: BulkResultItem = {
                   ...item,
                   data: formData,
                   imageUrl: newImageUrl
                 };
                 onSave(updatedItem);
             } else {
                 // Create updated item without image change
                 const updatedItem: BulkResultItem = {
                   ...item,
                   data: formData,
                   imageUrl: currentImageUrl
                 };
                 onSave(updatedItem);
             }
        } else {
            // Create updated item with current image (may have been enhanced)
            const updatedItem: BulkResultItem = {
              ...item,
              data: formData,
              imageUrl: currentImageUrl
            };
            onSave(updatedItem);
        }
        onClose();
    }
  };

  const handleImageUpdate = (newImageUrl: string) => {
    setCurrentImageUrl(newImageUrl);
  };

  const applyCrop = () => {
    if (originalImage) {
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
        
        setCurrentImageUrl(newImageUrl);
        setShowCropMode(false);
        setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
      }
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
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* UPDATED: Changed max-h to 80vh to prevent bottom overflow */}
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside modal
      >
        <div className="bg-brand-100 px-4 py-2 text-brand-900 border-b border-brand-200 flex justify-between items-center shrink-0 rounded-t-xl">
          <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('CONTENT')}
                className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-colors ${activeTab === 'CONTENT' ? 'bg-white text-brand-900 border-t-2 border-brand-600 shadow-sm' : 'text-brand-700 hover:bg-brand-200'}`}
              >
                  Tartalom
              </button>
              {currentImageUrl && (
                <button 
                    onClick={() => setActiveTab('IMAGE')}
                    className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-colors ${activeTab === 'IMAGE' ? 'bg-white text-brand-900 border-t-2 border-brand-600 shadow-sm' : 'text-brand-700 hover:bg-brand-200'}`}
                >
                    Kép szerkesztés
                </button>
              )}
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }} 
            className="p-1 hover:bg-brand-200 rounded-full transition-colors"
            title="Bezárás"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {activeTab === 'IMAGE' ? (
                <div className="space-y-4">
                    {/* AI Enhancement and Image Viewer */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Kép szerkesztés és AI javítás
                        </h3>
                        <div className="h-96 bg-slate-900 rounded-lg overflow-hidden">
                            <ImageViewer 
                                src={currentImageUrl}
                                alt="Szerkesztendő kép"
                                onImageUpdate={handleImageUpdate}
                                studentMode={false}
                            />
                        </div>
                        <p className="text-xs text-slate-600 mt-2 bg-blue-50 p-2 rounded border border-blue-200">
                            💡 Használd az AI funkciókat a kép minőségének javítására, majd a vágás funkcióval távolítsd el a felesleges részeket.
                        </p>
                    </div>

                    {/* Crop Controls */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                </svg>
                                Képvágás
                            </h3>
                            <button
                                onClick={() => setShowCropMode(!showCropMode)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                    showCropMode 
                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                }`}
                            >
                                {showCropMode ? 'Vágás bezárása' : 'Vágás megnyitása'}
                            </button>
                        </div>

                        {showCropMode && (
                            <>
                                <p className="text-xs text-slate-600 mb-4 bg-yellow-50 p-2 rounded border border-yellow-200">
                                    ⚠️ Sötétített rész eltávolításra kerül. Állítsd be a csúszkákkal a vágási területet.
                                </p>
                                
                                <canvas ref={canvasRef} className="border border-slate-300 shadow-md max-w-full mb-4 rounded" />
                                
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {['top', 'bottom', 'left', 'right'].map((dir) => (
                                        <div key={dir} className="bg-slate-50 p-2 rounded">
                                            <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                                                {dir === 'top' ? 'Felül' : dir === 'bottom' ? 'Alul' : dir === 'left' ? 'Balról' : 'Jobbról'}: {(crop as any)[dir]}%
                                            </label>
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

                                <div className="flex gap-2">
                                    <button
                                        onClick={applyCrop}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-xs font-medium flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Vágás alkalmazása
                                    </button>
                                    <button
                                        onClick={() => setCrop({ top: 0, bottom: 0, left: 0, right: 0 })}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-xs font-medium"
                                    >
                                        Visszaállítás
                                    </button>
                                </div>
                            </>
                        )}
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

            {/* Header Info - Large Text Blocks */}
            <div className="space-y-4 mb-4 bg-white p-4 rounded-lg border border-slate-200">
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Feladat címe
                    </label>
                    <textarea 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 resize-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-slate-50"
                        rows={3}
                        placeholder="Írd ide a feladat címét..."
                    />
                </div>
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Feladat utasítása
                    </label>
                    <textarea 
                        value={formData.instruction} 
                        onChange={(e) => setFormData({...formData, instruction: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 resize-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-slate-50"
                        rows={4}
                        placeholder="Írd ide a feladat részletes utasítását..."
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
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }} 
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              Mégse
            </button>
            <button onClick={handleSave} className="bg-green-100 text-green-900 border border-green-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-200 shadow-sm">
                Mentés {activeTab === 'IMAGE' ? '& Alkalmazás' : ''}
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditExerciseModal;
