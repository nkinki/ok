import React, { useState, useEffect } from 'react';
import SessionDetailsModal from './SessionDetailsModal';
import { useSubject } from '../contexts/SubjectContext';

interface Session {
  id: string;
  code: string;
  className?: string;
  exerciseCount: number;
  participantCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
}

interface SessionStats {
  overview: {
    totalSessions: number;
    activeSessions: number;
    todaySessions: number;
    weekSessions: number;
    totalParticipants: number;
    avgParticipantsPerSession: number;
  };
  recentSessions: Array<{
    code: string;
    exerciseCount: number;
    isActive: boolean;
    createdAt: string;
  }>;
}

const SessionManager: React.FC = () => {
  const { currentSubject } = useSubject();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      // Add subject filter to the API call
      const subjectParam = currentSubject ? `?subject=${currentSubject}` : '';
      const response = await fetch(`/api/simple-api/sessions/list${subjectParam}`);
      const data = await response.json();
      
      if (response.ok) {
        setSessions(data.sessions);
      } else {
        setError(data.error || 'Hiba a munkamenetek betöltésekor');
      }
    } catch (err) {
      setError('Hálózati hiba');
    }
  };

  const fetchStats = async () => {
    try {
      // Add subject filter to stats as well
      const subjectParam = currentSubject ? `?subject=${currentSubject}` : '';
      const response = await fetch(`/api/simple-api/sessions/stats${subjectParam}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const toggleSession = async (code: string) => {
    try {
      const response = await fetch(`/api/simple-api/sessions/${code}/toggle`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await fetchSessions(); // Refresh list
      } else {
        setError(data.error || 'Hiba a munkamenet módosításakor');
      }
    } catch (err) {
      setError('Hálózati hiba');
    }
  };

  const deleteSession = async (code: string) => {
    if (!confirm(`Biztosan törölni szeretnéd a ${code} munkamenetet?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/simple-api/sessions/${code}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await fetchSessions(); // Refresh list
      } else {
        setError(data.error || 'Hiba a munkamenet törlésekor');
      }
    } catch (err) {
      setError('Hálózati hiba');
    }
  };

  // Bulk operations
  const toggleSessionSelection = (code: string) => {
    setSelectedSessions(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const selectAllSessions = () => {
    setSelectedSessions(sessions.map(s => s.code));
  };

  const deselectAllSessions = () => {
    setSelectedSessions([]);
  };

  const bulkToggleSessions = async () => {
    if (selectedSessions.length === 0) return;
    
    if (!confirm(`Biztosan módosítani szeretnéd ${selectedSessions.length} munkamenet állapotát?`)) {
      return;
    }

    try {
      for (const code of selectedSessions) {
        await fetch(`/api/simple-api/sessions/${code}/toggle`, {
          method: 'PUT'
        });
      }
      await fetchSessions();
      setSelectedSessions([]);
    } catch (err) {
      setError('Hiba a csoportos módosításkor');
    }
  };

  const enterSession = async (code: string) => {
    // Open session details for evaluation instead of student interface
    setSelectedSessionForDetails(code);
  };

  const bulkDeleteSessions = async () => {
    if (selectedSessions.length === 0) return;
    
    if (!confirm(`Biztosan törölni szeretnéd ${selectedSessions.length} munkamenetet?`)) {
      return;
    }

    try {
      for (const code of selectedSessions) {
        await fetch(`/api/simple-api/sessions/${code}`, {
          method: 'DELETE'
        });
      }
      await fetchSessions();
      setSelectedSessions([]);
    } catch (err) {
      setError('Hiba a csoportos törléskor');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(), fetchStats()]);
      setLoading(false);
    };

    loadData();
    
    // Set up auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(async () => {
      // Only refresh if not loading to avoid conflicts
      if (!loading) {
        await Promise.all([fetchSessions(), fetchStats()]);
      }
    }, 10000); // 10 seconds

    // Cleanup interval on unmount or subject change
    return () => clearInterval(interval);
    
    // Reload data when subject changes
  }, [currentSubject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Munkamenet Kezelő</h1>
          <p className="text-sm text-gray-600 mt-1">
            🔄 Automatikus frissítés 10 másodpercenként • 
            <span className="text-green-600">● Élő adatok</span>
          </p>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            await Promise.all([fetchSessions(), fetchStats()]);
            setLoading(false);
          }}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Frissítés...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Frissítés
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          <div className="bg-blue-100 p-2 rounded text-center">
            <div className="text-lg font-bold text-blue-600">{stats.overview.totalSessions}</div>
            <div className="text-xs text-blue-800">📊 Összes</div>
          </div>
          <div className="bg-green-100 p-2 rounded text-center">
            <div className="text-lg font-bold text-green-600">{stats.overview.activeSessions}</div>
            <div className="text-xs text-green-800">🟢 Aktív</div>
          </div>
          <div className="bg-yellow-100 p-2 rounded text-center">
            <div className="text-lg font-bold text-yellow-600">{stats.overview.todaySessions}</div>
            <div className="text-xs text-yellow-800">📅 Mai</div>
          </div>
          <div className="bg-purple-100 p-2 rounded text-center">
            <div className="text-lg font-bold text-purple-600">{stats.overview.weekSessions}</div>
            <div className="text-xs text-purple-800">📆 Heti</div>
          </div>
          <div className="bg-indigo-100 p-2 rounded text-center">
            <div className="text-lg font-bold text-indigo-600">{stats.overview.totalParticipants}</div>
            <div className="text-xs text-indigo-800">👥 Résztvevő</div>
          </div>
          <div className="bg-pink-100 p-2 rounded text-center">
            <div className="text-lg font-bold text-pink-600">{stats.overview.avgParticipantsPerSession}</div>
            <div className="text-xs text-pink-800">📈 Átlag</div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {sessions.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded p-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              Kiválasztva: {selectedSessions.length} / {sessions.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={selectAllSessions}
                className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs"
              >
                ✅ Kijelöl mindet
              </button>
              <button
                onClick={deselectAllSessions}
                className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs"
              >
                ❌ Kijelölés törlése
              </button>
              {selectedSessions.length > 0 && (
                <>
                  <button
                    onClick={bulkToggleSessions}
                    className="px-2 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-xs"
                  >
                    ⚡ Kikapcs
                  </button>
                  <button
                    onClick={bulkDeleteSessions}
                    className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs"
                  >
                    🗑️ Törlés
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Munkamenetek</h2>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Még nincsenek munkamenetek
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedSessions.length === sessions.length && sessions.length > 0}
                      onChange={selectedSessions.length === sessions.length ? deselectAllSessions : selectAllSessions}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                    Kód
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                    Osztály
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                    📝
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500" title="Résztvevők">
                    👥
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                    Állapot
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500" title="Létrehozva">
                    📅
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500" title="Lejárat">
                    ⏰
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className={selectedSessions.includes(session.code) ? 'bg-blue-50' : ''}>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.code)}
                        onChange={() => toggleSessionSelection(session.code)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">{session.code}</div>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{session.className || '-'}</div>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{session.exerciseCount}</div>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{session.participantCount}</div>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <span className={`text-xs ${
                        session.isActive && new Date(session.expiresAt) > new Date()
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {session.isActive && new Date(session.expiresAt) > new Date() ? '🟢' : '🔴'}
                      </span>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500">
                      {new Date(session.createdAt).toLocaleString('hu-HU', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500">
                      {new Date(session.expiresAt).toLocaleString('hu-HU', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-xs font-medium">
                      <div className="flex gap-1">
                        <button
                          onClick={() => enterSession(session.code)}
                          className="px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded text-xs"
                        >
                          📊 Értékelés
                        </button>
                        <button
                          onClick={() => setSelectedSessionForDetails(session.code)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs"
                        >
                          📊 Részletek
                        </button>
                        <button
                          onClick={() => toggleSession(session.code)}
                          className={`px-2 py-1 rounded text-xs ${
                            session.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {session.isActive ? '⏹️ Leállít' : '▶️ Aktivál'}
                        </button>
                        <button
                          onClick={() => deleteSession(session.code)}
                          className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs"
                        >
                          🗑️ Töröl
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      {stats && stats.recentSessions.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Legutóbbi munkamenetek</h3>
          <div className="space-y-2">
            {stats.recentSessions.map((session, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{session.code}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {session.exerciseCount} feladat
                  </span>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.isActive ? 'Aktív' : 'Inaktív'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(session.createdAt).toLocaleString('hu-HU')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSessionForDetails && (
        <SessionDetailsModal
          sessionCode={selectedSessionForDetails}
          onClose={() => setSelectedSessionForDetails(null)}
        />
      )}
    </div>
  );
};

export default SessionManager;