import React from 'react'
import GoogleLoginButton from './GoogleLoginButton'

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-purple-100 text-purple-900 w-16 h-16 flex items-center justify-center rounded-xl shadow-sm font-bold text-2xl mx-auto mb-4 border border-purple-200">
              OK
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Szent Mihály Iskola
            </h1>
            <h2 className="text-xl font-semibold text-purple-700 mb-2">
              Okos Gyakorló
            </h2>
            <p className="text-slate-600">
              Tanári bejelentkezés
            </p>
          </div>

          {/* Google Login */}
          <GoogleLoginButton />

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Csak az intézményi Google fiókokkal (@szenmihalyatisk.hu) lehet bejelentkezni.
              <br />
              Kérdés esetén forduljon az adminisztrátorhoz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}