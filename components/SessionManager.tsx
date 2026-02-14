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
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Munkamenetek</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            🔄 Automatikus frissítés • <span className="text-green-600">● Élő</span>
          </p>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            await Promise.all([fetchSessions(), fetchStats()]);
            setLoading(false);
          }}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 text-sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              Frissítés...
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Frissítés
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Compact Statistics */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
          <div className="bg-blue-50 p-2 rounded text-center border border-blue-100">
            <div className="text-xl font-bold text-blue-600">{stats.overview.totalSessions}</div>
            <div className="text-[10px] text-blue-700">📊 Összes</div>
          </div>
          <div className="bg-green-50 p-2 rounded text-center border border-green-100">
            <div className="text-xl font-bold text-green-600">{stats.overview.activeSessions}</div>
            <div className="text-[10px] text-green-700">🟢 Aktív</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded text-center border border-yellow-100">
            <div className="text-xl font-bold text-yellow-600">{stats.overview.todaySessions}</div>
            <div className="text-[10px] text-yellow-700">📅 Mai</div>
          </div>
          <div className="bg-purple-50 p-2 rounded text-center border border-purple-100">
            <div className="text-xl font-bold text-purple-600">{stats.overview.weekSessions}</div>
            <div className="text-[10px] text-purple-700">📆 Heti</div>
          </div>
          <div className="bg-indigo-50 p-2 rounded text-center border border-indigo-100">
            <div className="text-xl font-bold text-indigo-600">{stats.overview.totalParticipants}</div>
            <div className="text-[10px] text-indigo-700">👥 Diák</div>
          </div>
          <div className="bg-pink-50 p-2 rounded text-center border border-pink-100">
            <div className="text-xl font-bold text-pink-600">{stats.overview.avgParticipantsPerSession}</div>
            <div className="text-[10px] text-pink-700">📈 Átlag</div>
          </div>
        </div>
      )}

      {/* Compact Bulk Actions */}
      {sessions.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={selectedSessions.length === sessions.length && sessions.length > 0}
              onChange={selectedSessions.length === sessions.length ? deselectAllSessions : selectAllSessions}
              className="rounded border-gray-300"
            />
            <span className="text-gray-600">
              {selectedSessions.length > 0 ? `${selectedSessions.length} kiválasztva` : 'Kijelölés'}
            </span>
          </div>
          {selectedSessions.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={bulkToggleSessions}
                className="px-2 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-xs"
                title="Állapot váltás"
              >
                ⚡
              </button>
              <button
                onClick={bulkDeleteSessions}
                className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs"
                title="Törlés"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compact Sessions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Még nincsenek munkamenetek
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left w-8"></th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Kód</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Osztály</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600" title="Feladatok">📝</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600" title="Diákok">👥</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600">Állapot</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600">Létrehozva</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600">Műveletek</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr 
                    key={session.id} 
                    className={`hover:bg-gray-50 ${selectedSessions.includes(session.code) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.code)}
                        onChange={() => toggleSessionSelection(session.code)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-sm font-semibold text-gray-900">{session.code}</div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-sm text-gray-700">{session.className || '-'}</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="text-sm text-gray-700">{session.exerciseCount}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="text-sm font-medium text-gray-900">{session.participantCount}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="text-lg">
                        {session.isActive && new Date(session.expiresAt) > new Date() ? '🟢' : '🔴'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-xs text-gray-500">
                        {new Date(session.createdAt).toLocaleString('hu-HU', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setSelectedSessionForDetails(session.code)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium"
                          title="Részletek és értékelés"
                        >
                          📊
                        </button>
                        <button
                          onClick={() => toggleSession(session.code)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            session.isActive
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={session.isActive ? 'Leállítás' : 'Aktiválás'}
                        >
                          {session.isActive ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => deleteSession(session.code)}
                          className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium"
                          title="Törlés"
                        >
                          🗑
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