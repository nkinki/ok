import React, { useState, useEffect } from 'react'
import { BulkResultItem } from './BulkProcessor'
import SessionMonitor from './SessionMonitor'
import StudentProgressDashboard from './StudentProgressDashboard'
import SessionManager from './SessionManager'
import { useSubject } from '../contexts/SubjectContext'
import { SessionTransferService } from '../services/sessionTransferService'
import StorageManager from '../utils/storageUtils'
import SafeStorage from '../utils/safeStorage'

interface Props {
  library: BulkResultItem[]
  onExit: () => void
  onLibraryUpdate?: () => void
}

interface Session {
  code: string
  exercises: BulkResultItem[]
  createdAt: Date
  isActive: boolean
}

export default function TeacherSessionManager({ library, onExit, onLibraryUpdate }: Props) {
  const { currentSubject, subjectDisplayName, subjectTheme, isAuthenticated: isSubjectAuthenticated, login } = useSubject()
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showMonitor, setShowMonitor] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [className, setClassName] = useState<string>('')

  // Class options same as student form
  const classOptions = [
    '1.a', '1.b', '2.a', '2.b', '3.a', '3.b', 
    '4.a', '4.b', '5.a', '5.b', '6.a', '6.b',
    '7.a', '7.b', '8.a', '8.b'
  ]

  // Debug: Monitor activeSession changes
  useEffect(() => {
    console.log('🔍 ActiveSession changed:', activeSession)
  }, [activeSession])

  // Debug: Monitor loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed:', loading)
  }, [loading])

  // Debug: Monitor error state changes
  useEffect(() => {
    console.log('❌ Error state changed:', error)
  }, [error])

  // Show subject login if not authenticated
  if (!isSubjectAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-purple-100 text-purple-900 w-16 h-16 flex items-center justify-center rounded-2xl shadow-lg font-bold text-2xl mx-auto mb-4 border border-purple-200">
              🎯
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tantárgyi Bejelentkezés</h2>
            <p className="text-slate-600">Válaszd ki a tantárgyad a munkamenet kezeléshez</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="space-y-3">
              {[
                { subject: 'info', name: 'Informatika', password: 'infoxxx', color: 'blue' },
                { subject: 'matek', name: 'Matematika', password: 'matekxxx', color: 'green' },
                { subject: 'magy', name: 'Magyar nyelv', password: 'magyxxx', color: 'red' },
                { subject: 'tori', name: 'Történelem', password: 'torixxx', color: 'purple' },
                { subject: 'termeszet', name: 'Természetismeret', password: 'termxxx', color: 'orange' }
              ].map((subj) => (
                <button
                  key={subj.subject}
                  onClick={async () => {
                    // Use the SubjectContext login function
                    try {
                      const success = await login(subj.password);
                      if (!success) {
                        alert(`Bejelentkezési hiba: ${subj.name}`);
                      }
                      // If successful, the component will re-render automatically
                    } catch (error) {
                      console.error('Subject login error:', error);
                      alert('Hálózati hiba történt. Próbáld újra!');
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 hover:shadow-md transition-all text-left bg-${subj.color}-50 border-${subj.color}-200 hover:border-${subj.color}-300`}
                >
                  <div className="font-bold text-slate-800">{subj.name}</div>
                  <div className="text-sm text-slate-600">Kattints a bejelentkezéshez</div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={onExit}
                className="w-full px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                ← Vissza a főoldalra
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // Export selected exercises as JSON for offline use
  const exportSelectedAsJson = () => {
    if (selectedExercises.length === 0) {
      alert('Válassz ki legalább egy feladatot az exportáláshoz!')
      return
    }

    const selectedExerciseData = library.filter(item => selectedExercises.includes(item.id))
    const sessionCode = generateSessionCode()
    
    // Use the same format as AdvancedLibraryManager
    const exportData = {
      sessionCode: sessionCode,
      subject: currentSubject || 'general',
      createdAt: new Date().toISOString(),
      exercises: selectedExerciseData,
      metadata: {
        version: '1.0.0',
        exportedBy: 'Okos Gyakorló Tanári Felület',
        totalExercises: selectedExerciseData.length,
        estimatedTime: selectedExerciseData.length * 3
      }
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `munkamenet_${sessionCode}_${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('📁 JSON munkamenet exportálva:', sessionCode, selectedExerciseData.length, 'feladat')
  }

  const handleStartSession = async () => {
    if (selectedExercises.length === 0) {
      setError('Válassz ki legalább egy feladatot!')
      return
    }

    if (!className || !className.trim()) {
      setError('Az osztály kiválasztása kötelező!')
      return
    }

    setLoading(true)
    setError(null)

    const sessionCode = generateSessionCode()
    const selectedExerciseData = library.filter(item => selectedExercises.includes(item.id))

    try {
      console.log('🗄️ Creating session in database...');
      console.log('📊 Session data:', { 
        code: sessionCode, 
        exerciseCount: selectedExerciseData.length,
        subject: currentSubject || 'general',
        className: className
      });

      // NEW APPROACH: Store full session data locally and only send minimal data to API
      const fullSessionData = {
        sessionCode: sessionCode,
        subject: currentSubject || 'general',
        className: className.trim(),
        createdAt: new Date().toISOString(),
        exercises: selectedExerciseData.map(item => ({
          id: item.id,
          fileName: item.fileName,
          imageUrl: item.imageUrl || '', // CRITICAL: Preserve the base64 image data
          title: item.data.title,
          instruction: item.data.instruction,
          type: item.data.type,
          content: item.data.content
        })),
        metadata: {
          version: '1.0.0',
          exportedBy: 'Okos Gyakorló Tanári Felület',
          totalExercises: selectedExerciseData.length,
          estimatedTime: selectedExerciseData.length * 3
        }
      }

      console.log('🖼️ Teacher session creation - Image check:');
      console.log('📊 Total exercises:', selectedExerciseData.length);
      console.log('🖼️ Exercises with images:', selectedExerciseData.filter(item => item.imageUrl && item.imageUrl.length > 0).length);
      console.log('🖼️ First exercise imageUrl length:', selectedExerciseData[0]?.imageUrl?.length || 0);
      console.log('🖼️ Sample imageUrl preview:', selectedExerciseData[0]?.imageUrl?.substring(0, 50) || 'No image');

      // Try to store session data safely (with fallback)
      const sessionKey = `session_${sessionCode}`;
      const fullSessionJson = JSON.stringify(fullSessionData);
      
      console.log('💾 Attempting to store session data:', Math.round(fullSessionJson.length / 1024), 'KB');
      
      // Check if localStorage is available and has reasonable space
      if (SafeStorage.isAvailable()) {
        const usage = SafeStorage.getUsage();
        console.log('📊 Storage usage:', `${Math.round(usage.used / 1024)}KB (${usage.percentage}%)`);
        
        if (usage.percentage < 80) {
          // Try to store full data
          if (SafeStorage.setItem(sessionKey, fullSessionJson)) {
            console.log('✅ Full session data stored successfully');
          } else {
            console.warn('⚠️ Failed to store full data, trying compact version...');
            
            // Create compact version
            const compactData = {
              sessionCode: sessionCode,
              subject: currentSubject || 'general',
              className: className.trim(),
              createdAt: new Date().toISOString(),
              exercises: selectedExerciseData.map(item => ({
                id: item.id,
                title: item.data.title,
                type: item.data.type,
                content: item.data.content
              })),
              metadata: { totalExercises: selectedExerciseData.length, isCompact: true }
            };
            
            SafeStorage.setItem(sessionKey, JSON.stringify(compactData));
            console.log('✅ Compact session data stored as fallback');
          }
        } else {
          console.warn('⚠️ Storage nearly full, skipping localStorage and using API-only approach');
        }
      } else {
        console.warn('⚠️ localStorage not available, using API-only approach');
      }

      // ALWAYS send minimal data to API - NO IMAGES to prevent Vercel limits
      const compactExercisesForStudents = selectedExerciseData.map(item => ({
        id: item.id,
        title: item.data.title,
        instruction: item.data.instruction,
        type: item.data.type,
        content: (() => {
          const content = item.data.content;
          if (typeof content === 'string') {
            const str = content as string;
            // Truncate long text content to keep payload small
            return str.length > 200 ? str.substring(0, 200) + '...' : str;
          }
          return content;
        })()
        // NO imageUrl - images will come from database JSON
      }));
      
      const minimalData = {
        code: sessionCode,
        exercises: [], // Keep empty for compatibility
        subject: currentSubject || 'general',
        className: className.trim(),
        maxScore: selectedExerciseData.length * 10,
        fullExercises: compactExercisesForStudents // Compact exercises WITHOUT images
      };
      
      const payloadSize = JSON.stringify(minimalData).length;
      console.log('📤 Sending minimal data to API with', compactExercisesForStudents.length, 'compact exercises (NO IMAGES):', payloadSize, 'bytes');
      
      // Safety check for Vercel limits
      if (payloadSize > 1000000) { // 1MB safety limit
        console.warn('⚠️ Payload still too large, creating ultra-minimal version...');
        
        // Ultra-minimal: only essential data
        minimalData.fullExercises = selectedExerciseData.slice(0, 5).map(item => ({
          id: item.id,
          title: item.data.title.substring(0, 30),
          instruction: '',
          type: item.data.type,
          content: ''
        }));
        
        console.log('📤 Using ultra-minimal payload:', JSON.stringify(minimalData).length, 'bytes');
      }
      
      // If localStorage is full, force cleanup before proceeding
      if (SafeStorage.getUsage().percentage >= 80) {
        console.warn('⚠️ Storage nearly full, performing cleanup...');
        SafeStorage.emergencyCleanup();
        
        // Try to store after cleanup
        const usageAfterCleanup = SafeStorage.getUsage();
        console.log('📊 Storage after cleanup:', `${Math.round(usageAfterCleanup.used / 1024)}KB (${usageAfterCleanup.percentage}%)`);
        
        if (usageAfterCleanup.percentage < 70) {
          // Now we have space, try to store
          if (SafeStorage.setItem(sessionKey, fullSessionJson)) {
            console.log('✅ Session data stored after cleanup');
          } else {
            console.warn('⚠️ Still cannot store after cleanup - will rely on Google Drive only');
          }
        } else {
          console.warn('⚠️ Cleanup insufficient - will rely on Google Drive only');
          setError('⚠️ Tárhely majdnem tele! A munkamenet csak Google Drive-on keresztül lesz elérhető. Töröld a régi adatokat a Beállításokban.');
        }
      }
      
      const response = await fetch('/api/simple-api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minimalData)
      })

      console.log('📡 API create response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ismeretlen hiba' }))
        console.error('❌ API Error:', errorData)
        
        // Show specific error messages
        if (errorData.sqlFile) {
          setError(`Adatbázis hiba: ${errorData.error}. Futtasd le a ${errorData.sqlFile} fájlt a Supabase SQL Editor-ban.`)
        } else {
          setError(`Hiba a munkamenet létrehozásakor: ${errorData.error || 'Ismeretlen hiba'}`)
        }
        return
      }

      const apiResult = await response.json()
      console.log('✅ Session created in database:', apiResult)

      // Verify we got the expected response structure
      if (!apiResult.success) {
        console.error('❌ Invalid API response structure:', apiResult)
        setError('Hibás API válasz struktúra')
        return
      }

      console.log('✅ Session created in database:', apiResult)

      // Create session object for UI FIRST (before any other operations)
      const session: Session = {
        code: sessionCode,
        exercises: selectedExerciseData, // Keep full data for local use
        createdAt: new Date(),
        isActive: true
      }

      // Set active session immediately
      setActiveSession(session)
      console.log('🚀 Session created successfully with code:', sessionCode)
      console.log('🎯 Active session set:', session)

      // CRITICAL: Upload JSON to Google Drive for students to download (ALWAYS with images)
      console.log('📤 Uploading session JSON to Google Drive...');
      console.log('🖼️ Uploading with images:', fullSessionData.exercises.filter(ex => ex.imageUrl && ex.imageUrl.length > 0).length, 'out of', fullSessionData.exercises.length);
      
      try {
        // Check payload size and compress if needed
        const originalSize = JSON.stringify(fullSessionData).length;
        const originalSizeMB = Math.round((originalSize / (1024 * 1024)) * 100) / 100;
        console.log('📊 Original payload size:', Math.round(originalSize / 1024), 'KB (', originalSizeMB, 'MB)');
        
        let uploadData = fullSessionData;
        
        // If payload is too large, compress images (optimized for text readability)
        if (originalSizeMB > 4.0) { // 4MB threshold for compression
          console.log('🗜️ Payload too large, compressing images (preserving text readability)...');
          
          // Import compression utility dynamically
          const { ImageCompressor } = await import('../utils/imageCompression');
          
          // Get intelligent compression settings (assuming text-heavy content)
          const settings = ImageCompressor.getRecommendedSettings(originalSizeMB, true);
          console.log(`🔧 Using ${settings.description}: ${Math.round(settings.quality * 100)}% quality, ${settings.maxWidth}px max width`);
          
          uploadData = await ImageCompressor.compressSessionImages(fullSessionData, settings.quality, settings.maxWidth);
          
          const compressedSize = JSON.stringify(uploadData).length;
          const compressedSizeMB = Math.round((compressedSize / (1024 * 1024)) * 100) / 100;
          const savings = Math.round((1 - compressedSize / originalSize) * 100);
          
          console.log('✅ Compression complete:', Math.round(compressedSize / 1024), 'KB (', compressedSizeMB, 'MB) -', savings, '% savings');
          console.log('📖 Text readability optimized with intelligent compression');
          
          // If still too large after conservative compression, show warning but try anyway
          if (compressedSizeMB > 4.5) {
            console.warn('⚠️ Payload still large after compression:', compressedSizeMB, 'MB');
            setError(`⚠️ Nagy munkamenet (${compressedSizeMB}MB)! A feltöltés sikertelen lehet. Próbáld kevesebb feladattal!`);
          }
        }
        
        const uploadResponse = await fetch('/api/simple-api/sessions/upload-drive', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: sessionCode,
            sessionJson: uploadData
          })
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          console.log('✅ JSON uploaded to Google Drive with images:', uploadResult.downloadUrl);
          console.log('🖼️ Upload successful - students will see images!');
          
          // Store download info for later use
          localStorage.setItem(`session_${sessionCode}_drive`, JSON.stringify({
            fileId: uploadResult.fileId,
            downloadUrl: uploadResult.downloadUrl,
            uploadedAt: new Date().toISOString(),
            hasImages: true,
            compressed: uploadData !== fullSessionData
          }));
          
          // Clear any previous error if upload succeeded
          if (error && error.includes('Képek feltöltése sikertelen')) {
            setError(null);
          }
        } else {
          const errorData = await uploadResponse.json().catch(() => ({}));
          console.error('❌ Google Drive upload failed:', errorData.error || 'Unknown error');
          console.error('❌ Students will NOT see images!');
          
          // Show specific error message based on error type
          if (uploadResponse.status === 413 || errorData.error?.includes('too large')) {
            const sizeMB = errorData.payloadSizeKB ? Math.round(errorData.payloadSizeKB / 1024 * 100) / 100 : 'ismeretlen';
            setError(`⚠️ Munkamenet túl nagy (${sizeMB}MB)! Próbáld kevesebb feladattal vagy kisebb képekkel. A diákok nem fogják látni a képeket.`);
          } else {
            setError('⚠️ Képek feltöltése sikertelen! A diákok nem fogják látni a képeket. Próbáld újra!');
          }
        }
      } catch (uploadError) {
        console.error('❌ Google Drive upload error:', uploadError);
        console.error('❌ Students will NOT see images!');
        setError('⚠️ Hálózati hiba a képek feltöltésekor! A diákok nem fogják látni a képeket. Ellenőrizd a kapcsolatot és próbáld újra!');
      }
      
      // Auto-download JSON file for sharing with students
      const dataStr = JSON.stringify(fullSessionData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `munkamenet_${sessionCode}_${new Date().toISOString().slice(0,10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('📁 JSON fájl automatikusan letöltve a diákok számára')
      
      // Force a small delay to ensure state is set
      setTimeout(() => {
        console.log('🔍 Checking activeSession after timeout:', activeSession)
      }, 100)

    } catch (error) {
      console.error('❌ Session creation error:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      setError(`Hálózati hiba: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`)
    } finally {
      console.log('🔄 Session creation finally block - setting loading to false')
      setLoading(false)
    }
  }

  // Show session monitor if active session exists
  if (activeSession && showMonitor) {
    return (
      <SessionMonitor 
        sessionCode={activeSession.code}
        onClose={() => setShowMonitor(false)}
      />
    )
  }



  // Show session history
  if (showHistory) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Munkamenet előzmények</h2>
            <p className="text-slate-600">
              {currentSubject ? `${subjectDisplayName} tantárgy munkamenetei` : 'Korábbi munkamenetek és eredmények kezelése'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(false)}
              className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg font-medium"
            >
              Vissza
            </button>
          </div>
        </div>

        <SessionManager />
      </div>
    )
  }

  // Main session management interface
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-bold text-slate-800">Tanári munkamenet</h2>
            {currentSubject && (
              <div className={`px-4 py-2 rounded-lg border-2 font-bold text-sm ${
                subjectTheme === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                subjectTheme === 'green' ? 'bg-green-50 text-green-800 border-green-200' :
                subjectTheme === 'red' ? 'bg-red-50 text-red-800 border-red-200' :
                subjectTheme === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                'bg-orange-50 text-orange-800 border-orange-200'
              }`}>
                {subjectTheme === 'blue' ? '💻' :
                 subjectTheme === 'green' ? '🔢' :
                 subjectTheme === 'red' ? '📚' :
                 subjectTheme === 'purple' ? '🏛️' : '🌿'} {subjectDisplayName}
              </div>
            )}
          </div>
          <p className="text-slate-600">Válassz ki feladatokat a könyvtárból és indíts munkamenetet a diákoknak</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Munkamenet előzmények
          </button>
          
          {/* Google Drive Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/>
            </svg>
            <span className="text-sm font-medium text-green-700">
              {(() => {
                const driveFolder = localStorage.getItem('google_drive_folder');
                return driveFolder ? '📁 Drive beállítva' : '⚠️ Drive nincs beállítva';
              })()}
            </span>
          </div>
          
          {/* Storage Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
            </svg>
            <span className="text-sm font-medium text-yellow-700">
              {(() => {
                const usage = SafeStorage.getUsage();
                const color = usage.percentage > 80 ? 'text-red-700' : usage.percentage > 60 ? 'text-yellow-700' : 'text-green-700';
                return (
                  <span className={color}>
                    💾 {usage.percentage}% ({Math.round(usage.used / 1024)}KB)
                  </span>
                );
              })()}
            </span>
            {(() => {
              const usage = SafeStorage.getUsage();
              if (usage.percentage > 70) {
                return (
                  <button
                    onClick={() => {
                      if (confirm('🗑️ TÁRHELY TISZTÍTÁS\n\nEz törli az ÖSSZES régi munkamenet adatot és felszabadítja a tárhelyet.\n\nFolytatod?')) {
                        // Perform aggressive cleanup
                        SafeStorage.emergencyCleanup();
                        
                        // Show results
                        const newUsage = SafeStorage.getUsage();
                        alert(`✅ TÁRHELY TISZTÍTVA!\n\n📊 Új tárhely: ${newUsage.percentage}% (${Math.round(newUsage.used / 1024)}KB)\n\nMost újra tudsz munkameneteket létrehozni!`);
                        
                        // Force page reload to update UI
                        window.location.reload();
                      }
                    }}
                    className="ml-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-medium"
                  >
                    🗑️ Tisztítás
                  </button>
                );
              }
              return null;
            })()}
          </div>
          
          <button
            onClick={onExit}
            className="text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg font-medium"
          >
            Vissza
          </button>
        </div>
      </div>

      {/* Storage Warning */}
      {(() => {
        const usage = SafeStorage.getUsage();
        if (usage.percentage > 80) {
          const cleanupEstimate = StorageManager.getCleanupEstimate();
          return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="bg-red-100 text-red-800 w-16 h-16 flex items-center justify-center rounded-xl shadow-sm font-bold text-2xl border border-red-200">
                  ⚠️
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-red-800">Tárhely majdnem tele!</h3>
                  <p className="text-red-700">Használat: {usage.percentage}% ({Math.round(usage.used / 1024)}KB)</p>
                  <p className="text-red-600 text-sm">Törölhető: {cleanupEstimate.itemCount} elem ({cleanupEstimate.sizeKB}KB)</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <p className="text-red-700">
                  A böngésző tárhelye majdnem tele van. Ez megakadályozza a munkamenet létrehozást.
                </p>
                <p className="text-red-600 font-medium">
                  💡 Megoldás: Kattints a "🗑️ Tárhely Tisztítás" gombra {cleanupEstimate.sizeKB}KB felszabadításához.
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    if (confirm(`🗑️ TÁRHELY TISZTÍTÁS\n\nEz törli ${cleanupEstimate.itemCount} elemet és felszabadít ${cleanupEstimate.sizeKB}KB tárhelyet.\n\nFolytatod?`)) {
                      SafeStorage.emergencyCleanup();
                      const newUsage = SafeStorage.getUsage();
                      alert(`✅ TÁRHELY TISZTÍTVA!\n\n📊 Új tárhely: ${newUsage.percentage}% (${Math.round(newUsage.used / 1024)}KB)\n\nMost újra tudsz munkameneteket létrehozni!`);
                      window.location.reload();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  🗑️ Tárhely Tisztítás ({cleanupEstimate.sizeKB}KB)
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}
      {activeSession && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-green-100 text-green-800 w-16 h-16 flex items-center justify-center rounded-xl shadow-sm font-bold text-2xl border border-green-200">
              🎯
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-bold text-green-800">Aktív munkamenet</h3>
              <p className="text-green-700">Kód: <span className="font-mono text-xl font-bold">{activeSession.code}</span></p>
              <p className="text-sm text-orange-600 font-medium">⏰ Automatikus leállítás: 60 perc múlva</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-800">{activeSession.exercises.length}</div>
              <div className="text-sm text-green-600">Feladat</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-800">0</div>
              <div className="text-sm text-green-600">Csatlakozott diák</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-800">Aktív</div>
              <div className="text-sm text-green-600">Állapot</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowMonitor(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Munkamenet figyelése
            </button>
            
            <button
              onClick={() => {
                // Re-download JSON file for students
                const sessionKey = `session_${activeSession.code}`;
                const sessionData = localStorage.getItem(sessionKey);
                if (sessionData) {
                  const dataStr = sessionData;
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `munkamenet_${activeSession.code}_${new Date().toISOString().slice(0,10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  console.log('📁 JSON fájl újra letöltve');
                } else {
                  alert('Nincs elérhető munkamenet adat a letöltéshez');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              JSON letöltése diákoknak
            </button>
            
            <button
              onClick={() => setActiveSession(null)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
              </svg>
              Munkamenet leállítása
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Exercise Selection */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            Kiválasztott feladatok ({selectedExercises.length}/{library.length})
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1">
                Osztály neve <span className="text-red-500">*</span>
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Válassz osztályt...</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            
            {/* Debug button */}
            <button
              onClick={() => {
                console.log('🧪 Debug - Current state:', {
                  activeSession,
                  loading,
                  error,
                  selectedExercises: selectedExercises.length,
                  className
                })
                
                // Check localStorage for recent sessions
                const recentSessions: Array<{key: string, code: string, created: string}> = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key.startsWith('session_')) {
                    try {
                      const data = JSON.parse(localStorage.getItem(key) || '{}');
                      recentSessions.push({ key, code: data.sessionCode || 'UNKNOWN', created: data.createdAt || 'UNKNOWN' });
                    } catch (e) {
                      // ignore
                    }
                  }
                }
                console.log('🗄️ Recent sessions in localStorage:', recentSessions);
                
                // Test setting activeSession manually
                if (!activeSession && recentSessions.length > 0) {
                  const latestSession = recentSessions[recentSessions.length - 1];
                  const testSession: Session = {
                    code: latestSession.code || 'TEST123',
                    exercises: library.filter(item => selectedExercises.includes(item.id)),
                    createdAt: new Date(),
                    isActive: true
                  }
                  setActiveSession(testSession)
                  console.log('🧪 Debug - Set test session:', testSession)
                }
              }}
              className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs"
            >
              🧪 Debug
            </button>
            
            <button
              onClick={handleStartSession}
              disabled={selectedExercises.length === 0 || !className.trim() || loading}
              className={`px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white ${
                subjectTheme === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                subjectTheme === 'green' ? 'bg-green-600 hover:bg-green-700' :
                subjectTheme === 'red' ? 'bg-red-600 hover:bg-red-700' :
                subjectTheme === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Indítás...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 016 0v2M5 12a7 7 0 1114 0v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5z"/>
                  </svg>
                  Munkamenet indítása
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          {/* JSON Export Button */}
          <button
            onClick={() => exportSelectedAsJson()}
            disabled={selectedExercises.length === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              subjectTheme === 'blue' ? 'bg-green-600 hover:bg-green-700' :
              subjectTheme === 'green' ? 'bg-green-600 hover:bg-green-700' :
              subjectTheme === 'red' ? 'bg-green-600 hover:bg-green-700' :
              subjectTheme === 'purple' ? 'bg-green-600 hover:bg-green-700' :
              'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            JSON Export ({selectedExercises.length})
          </button>
        </div>
        
        {/* Session expiration info */}
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="text-sm font-medium">A munkamenet automatikusan leáll 60 perc múlva</span>
          </div>
        </div>

        {selectedExercises.length > 0 && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600 mb-2">Kiválasztott feladatok:</div>
            <div className="flex flex-wrap gap-2">
              {selectedExercises.map(id => {
                const exercise = library.find(item => item.id === id)
                return exercise ? (
                  <span key={id} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {exercise.data.title}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>

      {/* Library Display */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Feladat könyvtár</h3>
          <p className="text-slate-600">Válassz ki feladatokat a munkamenethez</p>
        </div>

        {library.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <h4 className="text-xl font-bold text-slate-400 mb-2">Üres könyvtár</h4>
            <p className="text-slate-500">Menj a "Kezdés" fülre és hozz létre feladatokat!</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid gap-4">
              {library.map((item) => (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedExercises.includes(item.id)
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  onClick={() => toggleExerciseSelection(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 mb-1">{item.data.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">{item.data.instruction}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Típus: {item.data.type}</span>
                        <span>Fájl: {item.fileName}</span>
                        <span>ID: {item.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}