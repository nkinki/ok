import React, { useState } from 'react'

interface StudentLoginFormProps {
  onLoginSuccess: (student: { id: string; name: string; className: string }, sessionCode: string) => void
  onBack: () => void
}

export default function StudentLoginForm({ onLoginSuccess, onBack }: StudentLoginFormProps) {
  const [studentName, setStudentName] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentName.trim() || !studentClass.trim() || !sessionCode.trim()) {
      setError('Név, osztály és tanári kód megadása kötelező')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Create student object and pass to parent
      const student = {
        id: `student_${Date.now()}`,
        name: studentName.trim(),
        className: studentClass.trim()
      }
      
      // Pass student data and session code to parent
      onLoginSuccess(student, sessionCode.trim().toUpperCase())
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
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          👨‍🎓
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Diák bejelentkezés</h2>
        <p className="text-slate-500">Add meg a neved, osztályodat és a tanári kódot</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
            Teljes név
          </label>
          <input
            type="text"
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Pl: Kiss Péter"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="studentClass" className="block text-sm font-medium text-gray-700 mb-2">
            Osztály
          </label>
          <select
            id="studentClass"
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Válassz osztályt...</option>
            {classOptions.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700 mb-2">
            Tanári kód
          </label>
          <input
            type="text"
            id="sessionCode"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            placeholder="Pl: ABC123"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg"
            disabled={loading}
            maxLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !studentName.trim() || !studentClass.trim() || !sessionCode.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          Vissza a főoldalra
        </button>
      </div>
    </div>
  )
}