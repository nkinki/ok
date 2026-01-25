import React, { useState, useEffect } from 'react';

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/simple-api/sessions/list');
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
      const response = await fetch('/api/simple-api/sessions/stats');
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
    // Removed auto-refresh interval - only load once when component mounts
  }, []);

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
        <h1 className="text-3xl font-bold">Munkamenet Kezelő</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.overview.totalSessions}</div>
            <div className="text-sm text-blue-800">Összes munkamenet</div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.overview.activeSessions}</div>
            <div className="text-sm text-green-800">Aktív munkamenet</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.overview.todaySessions}</div>
            <div className="text-sm text-yellow-800">Mai munkamenetek</div>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.overview.weekSessions}</div>
            <div className="text-sm text-purple-800">Heti munkamenetek</div>
          </div>
          <div className="bg-indigo-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{stats.overview.totalParticipants}</div>
            <div className="text-sm text-indigo-800">Összes résztvevő</div>
          </div>
          <div className="bg-pink-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">{stats.overview.avgParticipantsPerSession}</div>
            <div className="text-sm text-pink-800">Átlag résztvevő</div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {sessions.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">
                Kiválasztva: {selectedSessions.length} / {sessions.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllSessions}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                >
                  Mind kijelöl
                </button>
                <button
                  onClick={deselectAllSessions}
                  className="text-xs px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded"
                >
                  Kijelölés törlése
                </button>
              </div>
            </div>
            
            {selectedSessions.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={bulkToggleSessions}
                  className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-sm font-medium"
                >
                  Állapot váltás ({selectedSessions.length})
                </button>
                <button
                  onClick={bulkDeleteSessions}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium"
                >
                  Törlés ({selectedSessions.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Munkamenetek</h2>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Még nincsenek munkamenetek
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedSessions.length === sessions.length && sessions.length > 0}
                      onChange={selectedSessions.length === sessions.length ? deselectAllSessions : selectAllSessions}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kód
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Osztály
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feladatok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Résztvevők
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Állapot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Létrehozva
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lejárat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className={selectedSessions.includes(session.code) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.code)}
                        onChange={() => toggleSessionSelection(session.code)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.className || 'Nincs megadva'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.exerciseCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.participantCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.isActive && new Date(session.expiresAt) > new Date()
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {session.isActive && new Date(session.expiresAt) > new Date() ? 'Aktív' : 'Inaktív'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.createdAt).toLocaleString('hu-HU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.expiresAt).toLocaleString('hu-HU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleSession(session.code)}
                        className={`mr-2 px-3 py-1 rounded text-xs ${
                          session.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {session.isActive ? 'Leállít' : 'Aktivál'}
                      </button>
                      <button
                        onClick={() => deleteSession(session.code)}
                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs"
                      >
                        Töröl
                      </button>
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
    </div>
  );
};

export default SessionManager;