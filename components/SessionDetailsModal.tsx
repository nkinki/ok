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
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              📊 {sessionDetails.code} • {sessionDetails.participantCount} résztvevő • {sessionDetails.averagePercentage}% átlag
            </h2>
            <p className="text-xs text-gray-600">
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
          <nav className="flex space-x-4 px-3">
            {[
              { id: 'participants', label: 'Résztvevők', icon: '👥' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
        <div className="flex-1 overflow-y-auto p-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">👥 Résztvevők ({sessionDetails.participants.length})</h3>
              <button
                onClick={fetchSessionDetails}
                className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs"
              >
                🔄
              </button>
            </div>
            
            {sessionDetails.participants.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                Még nincsenek résztvevők ebben a munkamenetben
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Név">👤</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Osztály">🏫</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Feladatok">📝</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Résztvevők">👥</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Állapot">⚡</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Létrehozva">📅</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Lejárat">⏰</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessionDetails.participants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-gray-50">
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{participant.student_name}</div>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{participant.student_class}</div>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{participant.completed_exercises}</div>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <div className="text-xs text-gray-900">1</div>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <span className={`text-xs ${participant.is_online ? 'text-green-600' : 'text-gray-400'}`}>
                            {participant.is_online ? '🟢' : '⚫'}
                          </span>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500">
                          {new Date(participant.joined_at).toLocaleString('hu-HU', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500">
                          {new Date(sessionDetails.expiresAt).toLocaleString('hu-HU', { 
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
        </div>

        {/* Compact Footer */}
        <div className="flex justify-end gap-2 p-2 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-300 text-xs"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal;