import React, { useState, useEffect } from 'react';
import { useSubject, getThemeClasses, getPerformanceClasses, getPerformanceCategoryLabel } from '../contexts/SubjectContext';

interface SubjectStats {
  totalSessions: number;
  activeSessions: number;
  totalStudents: number;
  averagePerformance: number;
  performanceDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

interface SubjectDashboardProps {
  onCreateSession: () => void;
  onViewHistory: () => void;
  onViewAnalytics: () => void;
}

const SubjectDashboard: React.FC<SubjectDashboardProps> = ({ 
  onCreateSession, 
  onViewHistory, 
  onViewAnalytics 
}) => {
  const { currentSubject, subjectDisplayName, subjectTheme, switchSubject } = useSubject();
  const [stats, setStats] = useState<SubjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const themeClasses = getThemeClasses(subjectTheme);

  // Tantárgyi statisztikák betöltése
  useEffect(() => {
    if (currentSubject) {
      fetchSubjectStats();
    }
  }, [currentSubject]);

  const fetchSubjectStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/simple-api/sessions/list?subject=${currentSubject}`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
        setError(null);
      } else {
        setError('Nem sikerült betölteni a statisztikákat');
      }
    } catch (err) {
      setError('Hálózati hiba történt');
      console.error('Subject stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectIcon = (theme: string) => {
    const icons = {
      blue: '💻',
      green: '🔢', 
      red: '📚',
      purple: '🏛️',
      orange: '🌿'
    };
    return icons[theme as keyof typeof icons] || '📖';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-slate-600">Statisztikák betöltése...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Subject Header */}
      <div className={`${themeClasses.secondary} ${themeClasses.border} border rounded-2xl p-6 mb-8`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`${themeClasses.primary} text-white w-16 h-16 flex items-center justify-center rounded-xl shadow-lg text-2xl`}>
              {getSubjectIcon(subjectTheme)}
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${themeClasses.text}`}>
                {subjectDisplayName}
              </h1>
              <p className="text-slate-600">Tantárgyi munkamenet kezelő</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onCreateSession}
              className={`${themeClasses.primary} ${themeClasses.hover} text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Új Munkamenet
            </button>
            
            <button
              onClick={switchSubject}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium flex items-center gap-2"
              title="Tantárgy váltás"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              Váltás
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button 
            onClick={fetchSubjectStats}
            className="ml-3 text-red-600 hover:text-red-800 underline"
          >
            Újrapróbálás
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Összes Munkamenet</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalSessions}</p>
              </div>
              <div className="bg-blue-100 text-blue-600 w-12 h-12 flex items-center justify-center rounded-lg">
                📊
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Aktív Munkamenetek</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeSessions}</p>
              </div>
              <div className="bg-green-100 text-green-600 w-12 h-12 flex items-center justify-center rounded-lg">
                ⚡
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Összes Diák</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalStudents}</p>
              </div>
              <div className="bg-purple-100 text-purple-600 w-12 h-12 flex items-center justify-center rounded-lg">
                👥
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Átlag Teljesítmény</p>
                <p className="text-3xl font-bold text-orange-600">{stats.averagePerformance}%</p>
              </div>
              <div className="bg-orange-100 text-orange-600 w-12 h-12 flex items-center justify-center rounded-lg">
                🎯
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Distribution */}
      {stats && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Teljesítmény Megoszlás</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.performanceDistribution).map(([category, count]) => {
              const categoryClasses = getPerformanceClasses(category);
              const label = getPerformanceCategoryLabel(category);
              
              return (
                <div key={category} className={`${categoryClasses.bg} ${categoryClasses.border} border rounded-lg p-4`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${categoryClasses.text}`}>
                      {count}
                    </div>
                    <div className={`text-sm font-medium ${categoryClasses.text}`}>
                      {label}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stats.totalStudents > 0 ? Math.round((count / stats.totalStudents) * 100) : 0}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Performance Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Teljesítmény eloszlás</span>
              <span>{stats.totalStudents} diák</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              {stats.totalStudents > 0 && (
                <div className="h-full flex">
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${(stats.performanceDistribution.excellent / stats.totalStudents) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-blue-500" 
                    style={{ width: `${(stats.performanceDistribution.good / stats.totalStudents) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-yellow-500" 
                    style={{ width: `${(stats.performanceDistribution.average / stats.totalStudents) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${(stats.performanceDistribution.poor / stats.totalStudents) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={onViewHistory}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 flex items-center justify-center rounded-lg group-hover:bg-blue-200 transition-colors">
              📋
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Munkamenet Előzmények</h3>
              <p className="text-slate-600 text-sm">Korábbi munkamenetek és eredmények</p>
            </div>
          </div>
        </button>

        <button
          onClick={onViewAnalytics}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 text-purple-600 w-12 h-12 flex items-center justify-center rounded-lg group-hover:bg-purple-200 transition-colors">
              📈
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Teljesítmény Analitika</h3>
              <p className="text-slate-600 text-sm">Részletes teljesítmény riportok</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.open('/api/simple-api', '_blank')}
          className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 text-green-600 w-12 h-12 flex items-center justify-center rounded-lg group-hover:bg-green-200 transition-colors">
              🔧
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">API Állapot</h3>
              <p className="text-slate-600 text-sm">Rendszer állapot ellenőrzése</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SubjectDashboard;