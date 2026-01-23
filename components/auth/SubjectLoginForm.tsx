import React, { useState } from 'react';
import { useSubject } from '../../contexts/SubjectContext';

interface SubjectLoginFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const SubjectLoginForm: React.FC<SubjectLoginFormProps> = ({ onSuccess, onCancel }) => {
  const { login, availableSubjects } = useSubject();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Kérlek add meg a tantárgyi jelszót!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await login(password.trim());
      
      if (success) {
        onSuccess();
      } else {
        setError('Hibás jelszó! Ellenőrizd a tantárgyi jelszót.');
        setShowHint(true);
      }
    } catch (err) {
      setError('Hálózati hiba történt. Próbáld újra!');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (subjectPassword: string) => {
    setPassword(subjectPassword);
    setError(null);
    setLoading(true);

    try {
      const success = await login(subjectPassword);
      
      if (success) {
        onSuccess();
      } else {
        setError('Bejelentkezési hiba történt.');
      }
    } catch (err) {
      setError('Hálózati hiba történt. Próbáld újra!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-purple-100 text-purple-900 w-16 h-16 flex items-center justify-center rounded-xl shadow-sm font-bold text-2xl mx-auto mb-4 border border-purple-200">
              🎓
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tantárgyi Bejelentkezés</h2>
            <p className="text-slate-600">Add meg a tantárgyi jelszót a folytatáshoz</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Tantárgyi Jelszó
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Pl: infoxxx, matekxxx..."
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Bejelentkezés...
                  </>
                ) : (
                  'Bejelentkezés'
                )}
              </button>
              
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Mégse
                </button>
              )}
            </div>
          </form>

          {/* Quick Login Buttons */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">Gyors bejelentkezés:</span>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {showHint ? 'Elrejtés' : 'Segítség'}
              </button>
            </div>

            {showHint && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Tantárgyi jelszavak:</strong>
                </p>
                <div className="text-xs text-blue-700 space-y-1">
                  {availableSubjects.map((subject) => (
                    <div key={subject.subject} className="flex justify-between">
                      <span>{subject.displayName}:</span>
                      <code className="bg-blue-100 px-1 rounded">{subject.password}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {availableSubjects.map((subject) => (
                <button
                  key={subject.subject}
                  onClick={() => handleQuickLogin(subject.password)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 ${
                    subject.theme === 'blue' ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100' :
                    subject.theme === 'green' ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100' :
                    subject.theme === 'red' ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100' :
                    subject.theme === 'purple' ? 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100' :
                    'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100'
                  }`}
                >
                  <div className="text-lg mb-1">
                    {subject.theme === 'blue' ? '💻' :
                     subject.theme === 'green' ? '🔢' :
                     subject.theme === 'red' ? '📚' :
                     subject.theme === 'purple' ? '🏛️' : '🌿'}
                  </div>
                  <div className="font-bold">{subject.displayName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-slate-400 text-lg">ℹ️</div>
              <div className="text-sm text-slate-600">
                <p className="font-medium mb-1">Tantárgyi hozzáférés</p>
                <p>A bejelentkezés után csak a kiválasztott tantárgy munkameneteit és eredményeit látod.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectLoginForm;