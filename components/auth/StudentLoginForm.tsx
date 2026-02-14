import React, { useState } from 'react'

interface StudentLoginFormProps {
  onLoginSuccess: (student: { id: string; name: string; className: string }, sessionCode: string, sessionData?: any) => void
  onBack: () => void
  onJsonImport?: () => void // New optional prop for JSON import
}

export default function StudentLoginForm({ onLoginSuccess, onBack, onJsonImport }: StudentLoginFormProps) {
  const [studentName, setStudentName] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [slotNumber, setSlotNumber] = useState<number>(1) // NEW: Slot number
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingJson, setDownloadingJson] = useState(false)
  const [sessionFound, setSessionFound] = useState<any>(null) // Store session info for download

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentName.trim() || !studentClass.trim() || !sessionCode.trim()) {
      setError('Név, osztály és tanári kód megadása kötelező')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Create student object with slot number
      const student = {
        id: `student_${Date.now()}`,
        name: studentName.trim(),
        className: studentClass.trim()
      }
      
      // Pass student data, session code, and slot number to parent
      // The parent will handle automatic download from Drive
      onLoginSuccess(student, sessionCode.trim().toUpperCase(), { slotNumber })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ismeretlen hiba')
    } finally {
      setLoading(false)
    }
  }

  const classOptions = [
    '1.a', '1.b', '2.a', '2.b', '3.a', '3.b', 
    '4.a', '4.b', '5.a', '5.b', '6.a', '6.b',
    '7.a', '7.b', '8.a', '8.b'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background - Dark Mode Only */}
      <div className="hidden dark:block absolute inset-0 overflow-hidden">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}></div>
        </div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating Particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-float opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>
      
      <div className="max-w-md w-full bg-white dark:bg-black p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-emerald-500 relative z-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border dark:border-cyan-500">
          👨‍🎓
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-emerald-300">Diák bejelentkezés</h2>
        <p className="text-slate-500 dark:text-slate-200">Add meg a neved, osztályodat és a tanári kódot</p>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
        }
      `}</style>

      {!sessionFound ? (
        // Login form
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Teljes név
            </label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Pl: Kiss Péter"
              className="w-full px-4 py-3 border border-gray-300 dark:border-emerald-500 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500 focus:border-blue-500 dark:focus:border-emerald-500"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="studentClass" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Osztály
            </label>
            <select
              id="studentClass"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-emerald-500 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500 focus:border-blue-500 dark:focus:border-emerald-500"
              disabled={loading}
            >
              <option value="">Válassz osztályt...</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="slotNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Slot szám <span className="text-purple-600 dark:text-purple-400 font-bold">🎰</span>
            </label>
            <select
              id="slotNumber"
              value={slotNumber}
              onChange={(e) => setSlotNumber(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-purple-500 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 font-mono text-center text-lg"
              disabled={loading}
            >
              <option value={1}>🎰 Slot 1</option>
              <option value={2}>🎰 Slot 2</option>
              <option value={3}>🎰 Slot 3</option>
              <option value={4}>🎰 Slot 4</option>
              <option value={5}>🎰 Slot 5</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              A tanár által megadott slot számot válaszd ki
            </p>
          </div>

          <div>
            <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Munkamenet kód
            </label>
            <input
              type="text"
              id="sessionCode"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="Pl: ABC123"
              className="w-full px-4 py-3 border border-gray-300 dark:border-emerald-500 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-emerald-500 focus:border-blue-500 dark:focus:border-emerald-500 font-mono text-center text-lg"
              disabled={loading}
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !studentName.trim() || !studentClass.trim() || !sessionCode.trim()}
            className="w-full bg-blue-600 dark:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:shadow-emerald-500/50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Bejelentkezés...
              </div>
            ) : (
              'Bejelentkezés'
            )}
          </button>
        </form>
      ) : (
        // This section is not used in simple mode
        <div className="text-center text-slate-500">
          Átirányítás...
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* JSON Import Option */}
      {onJsonImport && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">vagy</span>
            </div>
          </div>
          
          {/* Google Drive Folder Button */}
          <button
            onClick={() => {
              const driveUrl = 'https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6';
              window.open(driveUrl, '_blank');
            }}
            className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            📁 Drive mappa megnyitása
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Töltsd le a munkamenet JSON fájlt a Drive mappából
          </p>
          
          <button
            onClick={onJsonImport}
            className="mt-3 w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
            </svg>
            JSON fájl betöltése
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Válaszd ki a letöltött JSON fájlt a gépedről
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-emerald-300 underline"
        >
          Vissza a főoldalra
        </button>
      </div>
    </div>
    </div>
  )
}