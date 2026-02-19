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
  totalPossibleQuestions?: number; // Add this field
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
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'rankings'>('participants');
  const [selectedParticipant, setSelectedParticipant] = useState<SessionParticipant | null>(null);

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
      
      // Calculate performance stats with new scoring system
      const totalParticipants = participants.length;
      
      // CRITICAL FIX: Use max_possible_score from session instead of recalculating
      // This ensures consistency with the API percentage calculation
      const maxPossibleScore = sessionData.session.maxPossibleScore || 0;
      
      console.log('📊 SessionDetailsModal - Using max_possible_score:', maxPossibleScore);
      
      if (maxPossibleScore === 0) {
        console.error('❌ CRITICAL: max_possible_score is 0 in SessionDetailsModal!');
      }
      
      // Calculate total possible questions across all exercises (for display only)
      const totalPossibleQuestions = sessionData.session.exercises.reduce((total, exercise) => {
        if (exercise.type === 'QUIZ') {
          return total + (exercise.content?.questions?.length || 0);
        } else if (exercise.type === 'MATCHING') {
          return total + (exercise.content?.pairs?.length || 0);
        } else if (exercise.type === 'CATEGORIZATION') {
          return total + (exercise.content?.items?.length || 0);
        }
        return total;
      }, 0);
      
      const averagePercentage = totalParticipants > 0 
        ? Math.round(participants.reduce((sum, p) => {
            // FIXED: Use max_possible_score from session, not recalculated value
            const percentage = maxPossibleScore > 0 
              ? Math.round((p.total_score / maxPossibleScore) * 100)
              : 0;
            return sum + percentage;
          }, 0) / totalParticipants)
        : 0;
        
      // FIXED: Calculate percentage for each participant using session's max_possible_score
      const participantsWithPercentage = participants.map(p => {
        let percentage = maxPossibleScore > 0 
          ? Math.round((p.total_score / maxPossibleScore) * 100) 
          : 0;
        
        // SAFETY FIX: Cap percentage at 100% maximum
        if (percentage > 100) {
          console.warn(`⚠️ Participant ${p.student_name} percentage over 100%: ${percentage}% - capping at 100%`);
          percentage = 100;
        }
        
        return {
          ...p,
          percentage
        };
      });
        
      const performanceDistribution = {
        excellent: participantsWithPercentage.filter(p => (p.percentage || 0) >= 90).length,
        good: participantsWithPercentage.filter(p => (p.percentage || 0) >= 75 && (p.percentage || 0) < 90).length,
        average: participantsWithPercentage.filter(p => (p.percentage || 0) >= 60 && (p.percentage || 0) < 75).length,
        poor: participantsWithPercentage.filter(p => (p.percentage || 0) < 60).length
      };
      
      setSessionDetails({
        id: sessionData.session.id,
        code: sessionData.session.code,
        subject: 'general', // Default, could be enhanced
        className: 'N/A', // Could be enhanced
        exerciseCount: sessionData.session.exerciseCount,
        maxPossibleScore: maxPossibleScore, // Use session's max_possible_score
        participantCount: totalParticipants,
        averagePercentage,
        totalPossibleQuestions, // Add this for display
        performanceDistribution,
        isActive: sessionData.session.isActive,
        createdAt: sessionData.session.createdAt,
        expiresAt: sessionData.session.expiresAt,
        participants: participantsWithPercentage
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionDetails();
    
    // Set up auto-refresh every 5 seconds for session details (more frequent for real-time monitoring)
    const interval = setInterval(() => {
      if (!loading) {
        fetchSessionDetails();
      }
    }, 5000); // 5 seconds

    // Cleanup interval on unmount or session change
    return () => clearInterval(interval);
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
              {sessionDetails.totalPossibleQuestions ? 
                `${sessionDetails.totalPossibleQuestions} kérdés • ${sessionDetails.exerciseCount} feladat • ${sessionDetails.isActive ? '🟢 Aktív' : '🔴 Inaktív'}` :
                `${sessionDetails.exerciseCount} feladat • ${sessionDetails.isActive ? '🟢 Aktív' : '🔴 Inaktív'}`
              } • 
              <span className="text-green-600">🔄 Élő frissítés (5s)</span>
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
              { id: 'participants', label: 'Résztvevők', icon: '👥' },
              { id: 'rankings', label: 'Ranglista', icon: '🏆' }
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
          {activeTab === 'participants' && (
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
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Név">👤 Név</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Osztály">🏫 Osztály</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Feladatok">📝 Feladatok</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Pontszám">🎯 Pontszám</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Százalék">📊 %</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Állapot">⚡ Állapot</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Csatlakozott">📅 Csatlakozott</th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500" title="Műveletek">⚙️ Műveletek</th>
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
                            <div className="text-xs text-gray-900">{participant.completed_exercises}/{sessionDetails.exerciseCount}</div>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900">{participant.total_score}</div>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            <div className={`text-xs font-medium ${
                              (participant.percentage || 0) >= 90 ? 'text-green-600' :
                              (participant.percentage || 0) >= 75 ? 'text-blue-600' :
                              (participant.percentage || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {participant.percentage || 0}%
                            </div>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            <span className={`text-xs ${participant.is_online ? 'text-green-600' : 'text-gray-400'}`}>
                              {participant.is_online ? '🟢 Online' : '⚫ Offline'}
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
                          <td className="px-2 py-1 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedParticipant(participant)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs"
                            >
                              📊 Eredmények
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rankings' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">🏆 Csoport ranglista</h3>
                <div className="text-xs text-gray-500">
                  Átlag: {sessionDetails.averagePercentage}% • {sessionDetails.participants.length} résztvevő
                </div>
              </div>

              {sessionDetails.participants.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Még nincsenek résztvevők a ranglistán
                </div>
              ) : (
                <div className="space-y-2">
                  {sessionDetails.participants
                    .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
                    .map((participant, index) => {
                      const percentage = participant.percentage || 0;
                      const isTop3 = index < 3;
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                      
                      return (
                        <div
                          key={participant.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isTop3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-bold ${isTop3 ? 'text-orange-600' : 'text-gray-600'}`}>
                              {medal || `${index + 1}.`}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {participant.student_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {participant.student_class} • {participant.completed_exercises}/{sessionDetails.exerciseCount} feladat
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              percentage >= 90 ? 'text-green-600' :
                              percentage >= 75 ? 'text-blue-600' :
                              percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {percentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {participant.total_score} pont
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Performance Distribution */}
              {sessionDetails.participants.length > 0 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-semibold mb-3">📈 Teljesítmény megoszlás</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-green-100 rounded">
                      <div className="text-lg font-bold text-green-600">{sessionDetails.performanceDistribution.excellent}</div>
                      <div className="text-xs text-green-800">Kiváló (90%+)</div>
                    </div>
                    <div className="text-center p-2 bg-blue-100 rounded">
                      <div className="text-lg font-bold text-blue-600">{sessionDetails.performanceDistribution.good}</div>
                      <div className="text-xs text-blue-800">Jó (75-89%)</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-100 rounded">
                      <div className="text-lg font-bold text-yellow-600">{sessionDetails.performanceDistribution.average}</div>
                      <div className="text-xs text-yellow-800">Közepes (60-74%)</div>
                    </div>
                    <div className="text-center p-2 bg-red-100 rounded">
                      <div className="text-lg font-bold text-red-600">{sessionDetails.performanceDistribution.poor}</div>
                      <div className="text-xs text-red-800">Gyenge (&lt;60%)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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

      {/* Participant Results Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-2">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  📊 {selectedParticipant.student_name} eredményei
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedParticipant.student_class} • {selectedParticipant.completed_exercises}/{sessionDetails.exerciseCount} feladat • {selectedParticipant.total_score} pont ({selectedParticipant.percentage || 0}%)
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedParticipant.results && selectedParticipant.results.length > 0 ? (
                <div className="space-y-4">
                  {selectedParticipant.results.map((result: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {index + 1}. feladat: {result.title || 'Névtelen feladat'}
                        </h4>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.isCorrect ? '✅ Helyes' : '❌ Helytelen'}
                        </div>
                      </div>
                      
                      {result.question && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-700 font-medium">Kérdés:</p>
                          <p className="text-sm text-gray-600">{result.question}</p>
                        </div>
                      )}
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Diák válasza:</p>
                          <p className={`${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {result.studentAnswer || 'Nincs válasz'}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Helyes válasz:</p>
                          <p className="text-green-600">{result.correctAnswer || 'Nincs megadva'}</p>
                        </div>
                      </div>
                      
                      {result.timeSpent && (
                        <div className="mt-2 text-xs text-gray-500">
                          ⏱️ Időtartam: {Math.round(result.timeSpent / 1000)}s
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <h4 className="text-lg font-medium mb-2">Nincsenek részletes eredmények</h4>
                  <p className="text-sm">
                    A diák még nem küldte be a részletes eredményeket, vagy azok nem érhetők el.
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                    <p className="text-sm text-blue-800 font-medium">Elérhető információk:</p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Befejezett feladatok: {selectedParticipant.completed_exercises}</li>
                      <li>• Összpontszám: {selectedParticipant.total_score}</li>
                      <li>• Teljesítmény: {selectedParticipant.percentage || 0}%</li>
                      <li>• Utolsó aktivitás: {selectedParticipant.last_seen ? new Date(selectedParticipant.last_seen).toLocaleString('hu-HU') : 'Ismeretlen'}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedParticipant(null)}
                className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-300 text-sm"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetailsModal;