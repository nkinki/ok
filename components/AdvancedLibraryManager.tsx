import React, { useState, useRef } from 'react'
import { BulkResultItem } from './BulkProcessor'
import EditExerciseModal from './EditExerciseModal'

interface Props {
  library: BulkResultItem[]
  setLibrary: React.Dispatch<React.SetStateAction<BulkResultItem[]>>
  onExit: () => void
  onOpenSingle: (item: BulkResultItem) => void
  isMemoryMode?: boolean
}

interface ExerciseCollection {
  id: string
  name: string
  description: string
  exercises: string[] // exercise IDs
  createdAt: string
  subject?: string
}

export default function AdvancedLibraryManager({ library, setLibrary, onExit, onOpenSingle, isMemoryMode = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingItem, setEditingItem] = useState<BulkResultItem | null>(null)
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [collections, setCollections] = useState<ExerciseCollection[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'MATCHING' | 'CATEGORIZATION' | 'QUIZ'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Load collections from localStorage on mount
  React.useEffect(() => {
    try {
      const savedCollections = localStorage.getItem('okosgyakorlo_collections')
      if (savedCollections) {
        setCollections(JSON.parse(savedCollections))
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }, [])

  // Save collections to localStorage
  const saveCollections = (newCollections: ExerciseCollection[]) => {
    try {
      localStorage.setItem('okosgyakorlo_collections', JSON.stringify(newCollections))
      setCollections(newCollections)
    } catch (error) {
      console.error('Error saving collections:', error)
      alert('Hiba a gyűjtemény mentésekor!')
    }
  }

  // Toggle exercise selection
  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  // Select all exercises
  const selectAllExercises = () => {
    const filteredExercises = getFilteredExercises()
    setSelectedExercises(filteredExercises.map(item => item.id))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedExercises([])
  }

  // Delete selected exercises
  const deleteSelectedExercises = () => {
    if (selectedExercises.length === 0) return
    
    if (confirm(`Biztosan törölni szeretnéd a kiválasztott ${selectedExercises.length} feladatot?`)) {
      const updatedLibrary = library.filter(item => !selectedExercises.includes(item.id))
      setLibrary(updatedLibrary)
      setSelectedExercises([])
      
      // Update localStorage
      try {
        localStorage.setItem('okosgyakorlo_library', JSON.stringify(updatedLibrary))
      } catch (error) {
        console.warn('Could not save to localStorage:', error)
      }
    }
  }

  // Export selected exercises
  const exportSelectedExercises = () => {
    if (selectedExercises.length === 0) {
      alert('Válassz ki legalább egy feladatot az exportáláshoz!')
      return
    }

    const selectedItems = library.filter(item => selectedExercises.includes(item.id))
    const dataStr = JSON.stringify(selectedItems, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kivalasztott_feladatok_${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Create collection from selected exercises
  const createCollection = (name: string, description: string) => {
    if (selectedExercises.length === 0) {
      alert('Válassz ki legalább egy feladatot a gyűjteményhez!')
      return
    }

    const newCollection: ExerciseCollection = {
      id: Date.now().toString(),
      name,
      description,
      exercises: [...selectedExercises],
      createdAt: new Date().toISOString(),
      subject: 'general' // TODO: get from context
    }

    const updatedCollections = [...collections, newCollection]
    saveCollections(updatedCollections)
    setShowCollectionModal(false)
    setSelectedExercises([])
    alert(`Gyűjtemény "${name}" sikeresen létrehozva ${selectedExercises.length} feladattal!`)
  }

  // Load collection (select all exercises in collection)
  const loadCollection = (collection: ExerciseCollection) => {
    const availableExercises = collection.exercises.filter(id => 
      library.some(item => item.id === id)
    )
    setSelectedExercises(availableExercises)
    
    if (availableExercises.length < collection.exercises.length) {
      alert(`Figyelem: ${collection.exercises.length - availableExercises.length} feladat már nem elérhető a könyvtárban.`)
    }
  }

  // Delete collection
  const deleteCollection = (collectionId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a gyűjteményt?')) {
      const updatedCollections = collections.filter(c => c.id !== collectionId)
      saveCollections(updatedCollections)
    }
  }

  // Export collection as JSON (with Google Drive upload)
  const exportCollection = async (collection: ExerciseCollection) => {
    const collectionExercises = library.filter(item => collection.exercises.includes(item.id))
    
    // Create session-compatible format for Google Drive
    const sessionCode = generateSessionCode()
    const sessionData = {
      sessionCode: sessionCode,
      subject: collection.subject || 'general',
      className: 'Gyűjtemény Export',
      createdAt: new Date().toISOString(),
      exercises: collectionExercises.map(item => ({
        id: item.id,
        fileName: item.fileName,
        imageUrl: item.imageUrl || '',
        title: item.data.title,
        instruction: item.data.instruction,
        type: item.data.type,
        content: item.data.content
      })),
      metadata: {
        version: '1.0.0',
        exportedBy: 'Okos Gyakorló Fejlett Könyvtár',
        collectionName: collection.name,
        collectionDescription: collection.description,
        totalExercises: collectionExercises.length,
        estimatedTime: collectionExercises.length * 3
      }
    }
    
    // Try to upload to Google Drive first
    let driveUploadSuccess = false
    try {
      console.log('📤 Uploading collection to Google Drive...')
      const uploadResponse = await fetch('/api/simple-api/sessions/upload-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: sessionCode,
          sessionJson: sessionData
        })
      })

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json()
        console.log('✅ Collection uploaded to Google Drive:', uploadResult.downloadUrl)
        
        // Show success message with session code
        alert(`✅ Gyűjtemény sikeresen feltöltve Google Drive-ra!\n\n🔑 Munkamenet kód: ${sessionCode}\n\nA diákok ezzel a kóddal tudják betölteni a feladatokat.`)
        driveUploadSuccess = true
      } else {
        console.warn('⚠️ Google Drive upload failed')
      }
    } catch (uploadError) {
      console.warn('⚠️ Google Drive upload error:', uploadError)
    }

    // Always create local download as backup
    const exportData = {
      collection: {
        name: collection.name,
        description: collection.description,
        createdAt: collection.createdAt,
        subject: collection.subject
      },
      exercises: collectionExercises,
      sessionCode: driveUploadSuccess ? sessionCode : undefined
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gyujtemeny_${collection.name.replace(/[^a-zA-Z0-9]/g, '_')}_${sessionCode || new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    if (!driveUploadSuccess) {
      alert('⚠️ Google Drive feltöltés sikertelen. A JSON fájl helyileg letöltve.')
    }
  }

  // Generate session code (same as TeacherSessionManager)
  const generateSessionCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Import JSON file
  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedData = JSON.parse(content)
        
        let importedData: BulkResultItem[] = []
        
        // Handle different JSON formats
        if (Array.isArray(parsedData)) {
          // Direct array of BulkResultItem
          if (parsedData.length > 0 && parsedData[0].data) {
            importedData = parsedData as BulkResultItem[]
          }
        } else if (parsedData.exercises && Array.isArray(parsedData.exercises)) {
          // Collection format
          importedData = parsedData.exercises as BulkResultItem[]
        } else if (parsedData.collection && parsedData.exercises) {
          // Full collection export format
          importedData = parsedData.exercises as BulkResultItem[]
        }
        
        if (importedData.length > 0) {
          // Filter out duplicates
          const uniqueImported = importedData.filter((newItem: any) => 
            !library.some((existing: any) => existing.id === newItem.id)
          )
          
          if (uniqueImported.length > 0) {
            try {
              const updatedLibrary = [...library, ...uniqueImported]
              localStorage.setItem('okosgyakorlo_library', JSON.stringify(updatedLibrary))
              setLibrary(updatedLibrary)
              alert(`${uniqueImported.length} feladat sikeresen importálva!`)
            } catch (storageError) {
              console.error("Storage error:", storageError)
              alert("Hiba a mentés során. Próbáld újra vagy töröld a régi feladatokat.")
            }
          } else {
            alert("Minden feladat már létezik a könyvtárban.")
          }
        } else {
          alert("Hibás fájlformátum. Csak érvényes feladat JSON fájlokat lehet importálni.")
        }
      } catch (err) {
        console.error(err)
        alert("Hiba a fájl beolvasásakor. Ellenőrizd, hogy érvényes JSON fájl-e.")
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  // Filter exercises based on search and type
  const getFilteredExercises = () => {
    return library.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.data.instruction.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = filterType === 'all' || item.data.type === filterType
      
      return matchesSearch && matchesType
    })
  }

  const filteredExercises = getFilteredExercises()

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Fejlett Könyvtár Kezelő</h2>
          <p className="text-slate-600">Szerkeszd, válaszd ki és mentsd a feladatokat gyűjteményekbe</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg font-medium"
          >
            Vissza
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Keresés</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Feladat címe, leírása..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filter by type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Típus szűrő</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Összes típus</option>
              <option value="MATCHING">Párosítás</option>
              <option value="CATEGORIZATION">Kategorizálás</option>
              <option value="QUIZ">Kvíz</option>
            </select>
          </div>

          {/* View mode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nézet</label>
            <div className="flex rounded-lg border border-slate-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-lg ${
                  viewMode === 'grid' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Rács
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-lg ${
                  viewMode === 'list' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Lista
              </button>
            </div>
          </div>

          {/* Selection info */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Kiválasztva</label>
            <div className="text-lg font-bold text-purple-800">
              {selectedExercises.length} / {filteredExercises.length}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleImportClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
            </svg>
            JSON Import
          </button>

          <button
            onClick={selectAllExercises}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Összes kiválasztása
          </button>
          
          <button
            onClick={clearSelection}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Kiválasztás törlése
          </button>

          <button
            onClick={exportSelectedExercises}
            disabled={selectedExercises.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            JSON Export ({selectedExercises.length})
          </button>

          <button
            onClick={() => setShowCollectionModal(true)}
            disabled={selectedExercises.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            Gyűjtemény létrehozása ({selectedExercises.length})
          </button>

          <button
            onClick={deleteSelectedExercises}
            disabled={selectedExercises.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Törlés ({selectedExercises.length})
          </button>
        </div>
      </div>

      {/* Collections */}
      {collections.length > 0 && (
        <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Mentett Gyűjtemények</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <div key={collection.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">{collection.name}</h4>
                  <div className="flex gap-1">
                    <button
                      onClick={() => loadCollection(collection)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Gyűjtemény betöltése"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => exportCollection(collection)}
                      className="text-green-600 hover:text-green-700 p-1"
                      title="Gyűjtemény exportálása"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteCollection(collection.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Gyűjtemény törlése"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">{collection.description}</p>
                <div className="text-xs text-slate-500">
                  <div>{collection.exercises.length} feladat</div>
                  <div>{new Date(collection.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Library */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">
            Feladat Könyvtár ({filteredExercises.length} / {library.length})
          </h3>
          <p className="text-slate-600">Kattints a feladatokra a kiválasztáshoz</p>
        </div>

        {filteredExercises.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {library.length === 0 ? (
              <>
                <h4 className="text-xl font-bold text-slate-400 mb-2">Még nincsenek feladatok a könyvtárban</h4>
                <p className="text-slate-500">Tölts fel feladatokat a "Fájl feltöltés" gombbal vagy hozz létre újakat!</p>
              </>
            ) : (
              <>
                <h4 className="text-xl font-bold text-slate-400 mb-2">Nincs találat</h4>
                <p className="text-slate-500">Próbálj más keresési feltételekkel!</p>
              </>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {filteredExercises.map((item) => (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedExercises.includes(item.id)
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  onClick={() => toggleExerciseSelection(item.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 mb-1">{item.data.title}</h4>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">{item.data.instruction}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 ${
                      selectedExercises.includes(item.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-slate-300'
                    }`}>
                      {selectedExercises.includes(item.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.data.type === 'MATCHING' ? 'bg-blue-100 text-blue-800' :
                        item.data.type === 'CATEGORIZATION' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.data.type === 'MATCHING' ? 'Párosítás' :
                         item.data.type === 'CATEGORIZATION' ? 'Kategorizálás' : 'Kvíz'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingItem(item)
                        }}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Szerkesztés"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenSingle(item)
                        }}
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Előnézet"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collection Creation Modal */}
      {showCollectionModal && (
        <CollectionModal
          onClose={() => setShowCollectionModal(false)}
          onCreate={createCollection}
          selectedCount={selectedExercises.length}
        />
      )}

      {/* Edit Exercise Modal */}
      {editingItem && (
        <EditExerciseModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updatedItem) => {
            const updatedLibrary = library.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            )
            setLibrary(updatedLibrary)
            
            // Update localStorage
            try {
              localStorage.setItem('okosgyakorlo_library', JSON.stringify(updatedLibrary))
            } catch (error) {
              console.warn('Could not save to localStorage:', error)
            }
            
            setEditingItem(null)
          }}
        />
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </div>
  )
}

// Collection Creation Modal Component
interface CollectionModalProps {
  onClose: () => void
  onCreate: (name: string, description: string) => void
  selectedCount: number
}

function CollectionModal({ onClose, onCreate, selectedCount }: CollectionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim(), description.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Új Gyűjtemény Létrehozása</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Gyűjtemény neve *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="pl. Matematika dolgozat, 8. osztály teszt..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Leírás
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rövid leírás a gyűjteményről..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-800">
              <strong>{selectedCount} feladat</strong> kerül a gyűjteménybe
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold"
            >
              Gyűjtemény létrehozása
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
            >
              Mégse
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}