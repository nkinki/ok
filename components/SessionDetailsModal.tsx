import React, { useState, useEffect } from 'react';

interface SessionParticipant {
  id: string;
  student_name: string;
  student_class: string;
  joined_at: string;
  completed_exercises: number;
  total_score: number;
  percentage?: number;
  performance_category?: string;
  is_online: boolean;
  last_seen?: string;
  results?: any[];
}

interface SessionDetails {
  id: string;
  code: string;
  subject: string;
  className: string;
  exerciseCount: number;
  maxPossibleScore: number;
  participantCount: number;
  averagePercentage: number;
  performanceDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  participants: SessionParticipant[];
}

interface Props {
  sessionCode: string;
  onClose: () => void;
}

const SessionDetailsModal: React.FC<Props> = ({ sessionCode, onClose }) => {
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'results'>('overview');

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      
      // Get session info
      const sessionResponse = await fetch(`/api/simple-api/sessions/${sessionCode}/status`);
      if (!sessionResponse.ok) {
        throw new Error('Munkamenet nem található');
      }
      const sessionData = await sessionResponse.json();
      
      // Get participants
      const participantsResponse = await fetch(`/api/simple-api/sessions/${sessionCode}/participants`);
      let participants: SessionParticipant[] = [];
      
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        participants = participantsData.participants || [];
      }
      
      // Calculate performance stats
      const totalParticipants = participants.length;
      const averagePercentage = totalParticipants > 0 
        ? Math.round(participants.reduce((sum, p) => sum + (p.percentage || 0), 0) / totalParticipants)
        : 0;
        
      const performanceDistribution = {
        excellent: participants.filter(p => (p.percentage || 0) >= 90).length,
        good: participants.filter(p => (p.percentage || 0) >= 75 && (p.percentage || 0) < 90).length,
        average: participants.filter(p => (p.percentage || 0) >= 60 && (p.percentage || 0) < 75).length,
        poor: participants.filter(p => (p.percentage || 0) < 60).length
      };
      
      setSessionDetails({
        id: sessionData.session.id,
        code: sessionData.session.code,
        subject: 'general', // Default, could be enhanced
        className: 'N/A', // Could be enhanced
        exerciseCount: sessionData.session.exerciseCount,
        maxPossibleScore: sessionData.session.exerciseCount * 10, // Assuming 10 points per exercise
        participantCount: totalParticipants,
        averagePercentage,
        performanceDistribution,
        isActive: sessionData.session.isActive,
        createdAt: sessionData.session.createdAt,
        expiresAt: sessionData.session.expiresAt,
        participants
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionCode]);

  const getPerformanceColor = (category: string) => {
    switch (category) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceLabel = (category: string) => {
    switch (category) {
      case 'excellent': return 'Kiváló';
      case 'good': return 'Jó';
      case 'average': return 'Közepes';
      case 'poor': return 'Gyenge';
      default: return 'Ismeretlen';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Munkamenet adatok betöltése...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Hiba történt</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Bezárás
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionDetails) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              📊 {sessionDetails.code} • {sessionDetails.participantCount} résztvevő • {sessionDetails.averagePercentage}% átlag
            </h2>
            <p className="text-sm text-gray-600">
              {sessionDetails.exerciseCount} feladat • {sessionDetails.isActive ? '🟢 Aktív' : '🔴 Inaktív'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
          >
            ×
          </button>
        </div>

        {/* Compact Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-6 px-4">
            {[
              { id: 'overview', label: 'Áttekintés', icon: '📊' },
              { id: 'participants', label: 'Résztvevők', icon: '👥' },
              { id: 'results', label: 'Eredmények', icon: '🏆' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Compact Performance Distribution */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Teljesítmény megoszlás</h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(sessionDetails.performanceDistribution).map(([category, count]) => (
                    <div key={category} className="text-center">
                      <div className={`text-xl font-bold ${getPerformanceColor(category).split(' ')[0]}`}>
                        {count}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${getPerformanceColor(category)}`}>
                        {getPerformanceLabel(category)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact Session Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Munkamenet információk</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium">Létrehozva:</span> {new Date(sessionDetails.createdAt).toLocaleString('hu-HU')}</div>
                  <div><span className="font-medium">Lejárat:</span> {new Date(sessionDetails.expiresAt).toLocaleString('hu-HU')}</div>
                  <div><span className="font-medium">Max pontszám:</span> {sessionDetails.maxPossibleScore}</div>
                  <div><span className="font-medium">Feladatok:</span> {sessionDetails.exerciseCount} db</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Résztvevők ({sessionDetails.participants.length})</h3>
                <button
                  onClick={fetchSessionDetails}
                  className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm"
                >
                  🔄 Frissítés
                </button>
              </div>
              
              {sessionDetails.participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Még nincsenek résztvevők ebben a munkamenetben
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Diák neve</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Osztály</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teljesített</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pontszám</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teljesítmény</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Állapot</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Csatlakozott</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessionDetails.participants.map((participant) => (
                        <tr key={participant.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{participant.student_name}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{participant.student_class}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{participant.completed_exercises} / {sessionDetails.exerciseCount}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{participant.total_score} / {sessionDetails.maxPossibleScore}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{participant.percentage || 0}%</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              getPerformanceColor(participant.performance_category || 'poor')
                            }`}>
                              {getPerformanceLabel(participant.performance_category || 'poor')}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              participant.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {participant.is_online ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                            {new Date(participant.joined_at).toLocaleString('hu-HU', { 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Részletes eredmények</h3>
              <div className="text-center py-8 text-gray-500">
                A részletes eredmények funkció fejlesztés alatt áll.
                <br />
                Jelenleg a résztvevők fülön láthatók az alapvető statisztikák.
              </div>
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div className="flex justify-end gap-3 p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 text-sm"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal;