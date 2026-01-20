import React, { useState, useRef } from 'react'
import { BulkResultItem } from './BulkProcessor'
import UploadZone from './UploadZone'
import MatchingExercise from './MatchingExercise'
import CategorizationExercise from './CategorizationExercise'
import QuizExercise from './QuizExercise'
import ImageViewer from './ImageViewer'
import HelpModal from './HelpModal'
import SettingsModal from './SettingsModal'
import EditExerciseModal from './EditExerciseModal'
import ReanalyzeModal from './ReanalyzeModal'
import { analyzeImage } from '../services/geminiService'
import { ExerciseData, ExerciseType } from '../types'

interface Props {
  library: BulkResultItem[]
  setLibrary: React.Dispatch<React.SetStateAction<BulkResultItem[]>>
  onExit: () => void
}

export default function TeacherExerciseCreator({ library, setLibrary, onExit }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLibraryIndex, setCurrentLibraryIndex] = useState<number | null>(null)
  
  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isReanalyzeOpen, setIsReanalyzeOpen] = useState(false)

  const handleImageSelected = async (base64: string) => {
    const fullSrc = `data:image/jpeg;base64,${base64}`
    setImageSrc(fullSrc)
    setExerciseData(null)
    setIsAnalyzing(true)
    setError(null)
    setCurrentLibraryIndex(null)

    try {
      // Check if API keys are available
      const geminiKey = localStorage.getItem('gemini_api_key')
      const geminiKeys = localStorage.getItem('gemini_api_keys')
      const openaiKey = localStorage.getItem('openai_api_key')
      const openaiKeys = localStorage.getItem('openai_api_keys')
      const anthropicKey = localStorage.getItem('anthropic_api_key')
      const anthropicKeys = localStorage.getItem('anthropic_api_keys')
      const perplexityKey = localStorage.getItem('perplexity_api_key')
      const groqKey = localStorage.getItem('groq_api_key')
      const openrouterKey = localStorage.getItem('openrouter_api_key')
      const xaiKey = localStorage.getItem('xai_api_key')
      
      // Build key pools
      let geminiKeyPool: string[] = []
      if (geminiKeys) {
        geminiKeyPool = geminiKeys.split('\n')
          .map(key => key.trim())
          .filter(key => key.length > 0 && key.startsWith('AIza'))
      }
      if (geminiKey && geminiKey.startsWith('AIza') && geminiKey !== 'PLACEHOLDER_API_KEY') {
        geminiKeyPool.unshift(geminiKey)
      }
      
      let openaiKeyPool: string[] = []
      if (openaiKeys) {
        openaiKeyPool = openaiKeys.split('\n')
          .map(key => key.trim())
          .filter(key => key.length > 0 && key.startsWith('sk-'))
      }
      if (openaiKey && openaiKey.startsWith('sk-') && openaiKey !== 'PLACEHOLDER_API_KEY') {
        openaiKeyPool.unshift(openaiKey)
      }
      
      let anthropicKeyPool: string[] = []
      if (anthropicKeys) {
        anthropicKeyPool = anthropicKeys.split('\n')
          .map(key => key.trim())
          .filter(key => key.length > 0 && key.startsWith('sk-ant-'))
      }
      if (anthropicKey && anthropicKey.startsWith('sk-ant-') && anthropicKey !== 'PLACEHOLDER_API_KEY') {
        anthropicKeyPool.unshift(anthropicKey)
      }
      
      // Check if we have any valid API keys
      const hasAnyKey = geminiKeyPool.length > 0 || 
                       openaiKeyPool.length > 0 || 
                       anthropicKeyPool.length > 0 ||
                       (perplexityKey && perplexityKey !== 'PLACEHOLDER_API_KEY' && perplexityKey.startsWith('pplx-')) ||
                       (groqKey && groqKey !== 'PLACEHOLDER_API_KEY' && groqKey.startsWith('gsk_')) ||
                       (openrouterKey && openrouterKey !== 'PLACEHOLDER_API_KEY' && openrouterKey.startsWith('sk-or-')) ||
                       (xaiKey && xaiKey !== 'PLACEHOLDER_API_KEY' && xaiKey.startsWith('xai-'))
      
      if (hasAnyKey) {
        // Use AI API
        const data = await analyzeImage(base64)
        setExerciseData(data)
      } else {
        // No valid API key - create editable placeholder
        setIsAnalyzing(false)
        const placeholderData: ExerciseData = {
          title: "API kulcs szükséges",
          instruction: `Kérlek állítsd be legalább egy AI szolgáltató API kulcsát a beállításokban, vagy szerkeszd meg ezt a feladatot a ceruza gombbal.`,
          type: ExerciseType.QUIZ,
          content: {
            questions: [{
              id: 'placeholder',
              question: 'Írd be a kérdést a képről',
              options: ['Válasz A', 'Válasz B', 'Válasz C', 'Válasz D'],
              correctIndex: 0,
              multiSelect: false,
              correctIndices: [0]
            }]
          }
        }
        setExerciseData(placeholderData)
      }
    } catch (e: any) {
      console.error(e)
      setError("API hiba történt. Szerkeszd meg manuálisan a ceruza gombbal!")
      
      // Create editable placeholder on API error
      const placeholderData: ExerciseData = {
        title: "API hiba - Manuális szerkesztés",
        instruction: "Az API nem elérhető. Kérlek szerkeszd meg ezt a feladatot a ceruza gombbal.",
        type: ExerciseType.QUIZ,
        content: {
          questions: [{
            id: 'error-placeholder',
            question: 'Írd be a kérdést a képről',
            options: ['Válasz A', 'Válasz B', 'Válasz C', 'Válasz D'],
            correctIndex: 0,
            multiSelect: false,
            correctIndices: [0]
          }]
        }
      }
      setExerciseData(placeholderData)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReanalyze = async (hint: string) => {
    if (!imageSrc) return
    setIsReanalyzeOpen(false)
    
    setExerciseData(null)
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const base64 = imageSrc.split(',')[1]
      const data = await analyzeImage(base64, hint)
      setExerciseData(data)
      
      if (currentLibraryIndex !== null) {
        setLibrary((prev: any[]) => {
          const next = [...prev]
          if (next[currentLibraryIndex]) {
            next[currentLibraryIndex] = { ...next[currentLibraryIndex], data: data }
          }
          return next
        })
      }
    } catch (e: any) {
      console.error(e)
      setError("Hiba az újraértelmezés során. Ellenőrizd a konzolt.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleOpenFromLibrary = (item: BulkResultItem) => {
    const index = library.findIndex((i: any) => i.id === item.id)
    setCurrentLibraryIndex(index)
    setImageSrc(item.imageUrl)
    setExerciseData(item.data)
  }

  const handleNextExercise = () => {
    if (currentLibraryIndex === null || currentLibraryIndex >= library.length - 1) return
    const nextIndex = currentLibraryIndex + 1
    const nextItem = library[nextIndex]
    handleOpenFromLibrary(nextItem)
  }

  const saveEditedData = (newData: ExerciseData, newImageUrl?: string) => {
    setExerciseData(newData)
    if (newImageUrl) {
      setImageSrc(newImageUrl)
    }

    if (currentLibraryIndex !== null) {
      setLibrary(prev => {
        const next = [...prev]
        if (next[currentLibraryIndex]) {
          next[currentLibraryIndex] = { 
            ...next[currentLibraryIndex], 
            data: newData,
            imageUrl: newImageUrl || next[currentLibraryIndex].imageUrl 
          }
        }
        return next
      })
    }
    setIsEditOpen(false)
  }

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
      )
    }

    const hasNext = currentLibraryIndex !== null && currentLibraryIndex < library.length - 1
    const uniqueKey = exerciseData ? `${exerciseData.title}-${currentLibraryIndex ?? 'new'}-${Date.now()}` : 'loading'

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
          
          {/* Action Buttons - Top Right */}
          {exerciseData && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button onClick={() => setIsReanalyzeOpen(true)} className="p-2 bg-black/50 text-white hover:bg-orange-600 rounded-lg transition-colors backdrop-blur-sm" title="Újraértelmezés">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
              <button onClick={() => setIsEditOpen(true)} className="p-2 bg-black/50 text-white hover:bg-brand-600 rounded-lg transition-colors backdrop-blur-sm" title="Szerkesztés">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
            </div>
          )}
          
          {/* Next Button - Bottom Right */}
          {hasNext && (
            <div className="absolute bottom-4 right-4 z-10">
              <button onClick={handleNextExercise} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg backdrop-blur-sm flex items-center gap-2">
                Következő
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
            </div>
          )}
          
          <ImageViewer 
            src={imageSrc} 
            alt="Eredeti feladat" 
            onImageUpdate={(newSrc) => setImageSrc(newSrc)}
          />
        </div>
        <div className="lg:w-1/2 h-2/3 lg:h-full bg-slate-50 overflow-y-auto p-4 relative">
          <div className="max-w-none mx-auto">
            <div className="space-y-1 mb-3">
              {/* Context Block - No label */}
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <h1 className="text-sm font-medium text-blue-900 leading-tight">{exerciseData?.title || "Betöltés..."}</h1>
              </div>
              
              {/* Task Instruction Block */}
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 text-xs uppercase font-medium">Feladat</span>
                </div>
                <p className="text-xs font-medium text-green-800 leading-tight line-clamp-3">{exerciseData?.instruction || "Generálás..."}</p>
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
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <EditExerciseModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        exerciseData={exerciseData} 
        imageSrc={imageSrc}
        onSave={saveEditedData} 
      />
      <ReanalyzeModal isOpen={isReanalyzeOpen} onClose={() => setIsReanalyzeOpen(false)} onReanalyze={handleReanalyze} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Feladat készítő</h2>
            <p className="text-slate-600">Tölts fel képet és hozz létre interaktív feladatokat</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-purple-700 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
            <button onClick={() => setIsHelpOpen(true)} className="text-slate-500 hover:text-purple-700 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            <button onClick={onExit} className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg font-medium">
              Vissza
            </button>
          </div>
        </div>
        
        {renderSingleMode()}
      </div>
    </div>
  )
}