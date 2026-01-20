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

export default function TeacherLibrary({ library, setLibrary, onExit, onOpenSingle, isMemoryMode = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingItem, setEditingItem] = useState<BulkResultItem | null>(null)

  const handleExportLibrary = () => {
    if (library.length === 0) return
    const dataStr = JSON.stringify(library, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `okosgyakorlo_mentes_${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearSession = () => {
    if (confirm("Biztosan törölni szeretnéd a teljes munkamenetet? Minden nem exportált adat elveszik!")) {
      setLibrary([])
      localStorage.removeItem('okosgyakorlo_library')
    }
  }

  const handleClearStorage = () => {
    if (confirm("⚠️ FIGYELEM!\n\nEz törölni fogja az ÖSSZES böngésző adatot ezen az oldalon:\n• Feladat könyvtár\n• Beállítások\n• Minden mentett adat\n\nBiztosan folytatod?")) {
      try {
        // Clear all localStorage for this domain
        localStorage.clear()
        setLibrary([])
        alert("✅ Tárhely sikeresen törölve!\n\nAz oldal újratöltődik...")
        // Reload page to reset everything
        window.location.reload()
      } catch (e) {
        console.error("Error clearing storage:", e)
        alert("❌ Hiba a tárhely törlésekor. Próbáld újra vagy használd a böngésző beállításait.")
      }
    }
  }

  const getStorageInfo = () => {
    try {
      // Estimate localStorage usage
      let totalSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }
      
      // Convert to KB/MB
      const sizeKB = (totalSize / 1024).toFixed(1)
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(2)
      
      return {
        totalSize,
        sizeKB: parseFloat(sizeKB),
        sizeMB: parseFloat(sizeMB),
        itemCount: Object.keys(localStorage).length
      }
    } catch (e) {
      return { totalSize: 0, sizeKB: 0, sizeMB: 0, itemCount: 0 }
    }
  }

  const storageInfo = getStorageInfo()

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedData = JSON.parse(content) as BulkResultItem[]
        if (Array.isArray(importedData) && importedData.length > 0 && importedData[0].data) {
          // Filter out duplicates
          const uniqueImported = importedData.filter((newItem: any) => 
            !library.some((existing: any) => existing.id === newItem.id)
          )
          
          if (uniqueImported.length > 0) {
            // Try to update library with storage error handling
            try {
              const updatedLibrary = [...library, ...uniqueImported]
              localStorage.setItem('okosgyakorlo_library', JSON.stringify(updatedLibrary))
              setLibrary(updatedLibrary)
              alert(`${uniqueImported.length} feldolgozott feladat importálva a könyvtárba!`)
            } catch (storageError) {
              if (storageError instanceof DOMException && storageError.code === 22) {
                // Storage quota exceeded
                alert(`⚠️ TÁRHELY MEGTELT!\n\n${uniqueImported.length} feladat importálva, de nem menthetők a böngésző tárhelyre.\n\nJavasolt megoldások:\n• Töröld a régi feladatokat\n• Exportáld a jelenlegi könyvtárat\n• Használj kisebb JSON fájlokat\n\nA feladatok ideiglenesen elérhetők, de újratöltés után elvesznek.`)
                
                // Still update the state temporarily (until page reload)
                setLibrary([...library, ...uniqueImported])
              } else {
                console.error("Storage error:", storageError)
                alert("Hiba a mentés során. Próbáld újra vagy töröld a régi feladatokat.")
              }
            }
          } else {
            alert("Minden feladat már létezik a könyvtárban.")
          }
        } else {
          alert("Hibás fájlformátum. Csak feldolgozott feladat JSON fájlokat lehet importálni.")
        }
      } catch (err) {
        console.error(err)
        alert("Hiba a fájl beolvasásakor. Ellenőrizd, hogy érvényes JSON fájl-e.")
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleOpenFromLibrary = (item: BulkResultItem) => {
    // Pass the selected item to the parent component
    onOpenSingle(item)
  }

  const handleEditExercise = (item: BulkResultItem) => {
    setEditingItem(item)
  }

  const handleSaveEdit = (updatedItem: BulkResultItem) => {
    setLibrary(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
    setEditingItem(null)
  }

  const handleDeleteExercise = (itemId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a feladatot?')) {
      setLibrary(prev => prev.filter(item => item.id !== itemId))
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileImport} />
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-slate-800">Feladat Könyvtár</h2>
          <p className="text-slate-600">A mentett és feldolgozott feladatok gyűjteménye.</p>
          
          {/* Storage info bar */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z"/>
              </svg>
              <span>
                Tárhely: {storageInfo.sizeMB > 1 ? `${storageInfo.sizeMB} MB` : `${storageInfo.sizeKB} KB`}
                {storageInfo.itemCount > 0 && ` (${storageInfo.itemCount} elem)`}
              </span>
            </div>
          </div>
          
          {/* Memory mode warning */}
          {isMemoryMode && (
            <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <span className="text-orange-800 font-bold text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  MEMÓRIA MÓD: A tárhely megtelt
                </span>
                <div className="flex gap-2">
                  <button onClick={handleExportLibrary} className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium shadow hover:bg-orange-700">
                    Mentés most
                  </button>
                  <button 
                    onClick={handleClearStorage} 
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium shadow hover:bg-red-700"
                    title="Teljes tárhely törlése"
                  >
                    Tárhely törlése
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons - simplified */}
        <div className="flex gap-3">
          {/* Primary actions */}
          <button onClick={handleImportClick} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Import
          </button>
          <button onClick={handleExportLibrary} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export
          </button>
          <button onClick={onExit} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium">
            Vissza
          </button>
        </div>
      </div>

      {library.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          <h3 className="text-xl font-medium text-slate-400">A könyvtár üres</h3>
          <p className="text-slate-400 mt-2">Importálj feldolgozott JSON fájlt vagy kezdj el feladatokat generálni az "Egyesével" vagy "Tömeges" menüben!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {library.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
              {/* Image with overlay actions */}
              <div className="h-48 bg-slate-100 relative cursor-pointer" onClick={() => handleOpenFromLibrary(item)}>
                <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.data.title} />
                
                {/* Type badge */}
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm font-medium">
                  {item.data.type}
                </div>
                
                {/* Action buttons - only visible on hover */}
                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditExercise(item)
                    }}
                    className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 rounded-full shadow-lg transition-all"
                    title="Szerkesztés"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteExercise(item.id)
                    }}
                    className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-red-600 rounded-full shadow-lg transition-all"
                    title="Törlés"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
                
                {/* Click to open overlay */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg font-medium text-slate-800">
                    Kattints a megnyitáshoz
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 leading-tight" title={item.data.title}>
                  {item.data.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                  {item.data.instruction}
                </p>
                
                {/* Single action button */}
                <button 
                  onClick={() => handleOpenFromLibrary(item)} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Előnézet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Exercise Modal */}
      {editingItem && (
        <EditExerciseModal
          item={editingItem}
          onSave={handleSaveEdit}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}