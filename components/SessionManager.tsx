import React, { useState, useEffect } from 'react';

interface Session {
  id: string;
  code: string;
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(), fetchStats()]);
      setLoading(false);
    };

    loadData();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
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
      <h1 className="text-3xl font-bold mb-6">Munkamenet Kezelő</h1>
      
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
                    Kód
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
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.code}</div>
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