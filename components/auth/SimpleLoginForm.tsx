import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function SimpleLoginForm() {
  const { loginWithCode, loading, error } = useAuth()
  const [loginCode, setLoginCode] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginCode.trim()) return
    
    try {
      await loginWithCode(loginCode.trim().toLowerCase())
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const predefinedCodes = [
    { code: 'infoxxx', subject: 'Informatika', teacher: 'Informatika Tanár' },
    { code: 'torixxx', subject: 'Történelem', teacher: 'Történelem Tanár' },
    { code: 'matekxxx', subject: 'Matematika', teacher: 'Matematika Tanár' },
    { code: 'magyxxx', subject: 'Magyar nyelv', teacher: 'Magyar Tanár' },
    { code: 'angolxxx', subject: 'Angol nyelv', teacher: 'Angol Tanár' },
    { code: 'termxxx', subject: 'Természettudomány', teacher: 'Természettudomány Tanár' }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Tanári bejelentkezés
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Adja meg a tantárgyi bejelentkezési kódot
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="loginCode" className="block text-sm font-medium text-gray-700 mb-2">
            Bejelentkezési kód
          </label>
          <input
            type="text"
            id="loginCode"
            value={loginCode}
            onChange={(e) => setLoginCode(e.target.value)}
            placeholder="Adja meg a tantárgyi kódot"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-center font-mono text-lg"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !loginCode.trim()}
          className="w-full bg-brand-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Elérhető tantárgyak:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {predefinedCodes.map((item) => (
            <div key={item.code} className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="text-gray-600">{item.subject}</span>
              <span className="text-gray-500">{item.teacher}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}