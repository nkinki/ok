import React, { useState, useEffect } from 'react';
import { driveOnlyService } from '../services/driveOnlyService';

interface Props {
  onModeChange?: (isDriveOnly: boolean) => void;
}

export default function DriveOnlyToggle({ onModeChange }: Props) {
  const [driveOnlyMode, setDriveOnlyMode] = useState(false);
  const [stats, setStats] = useState({
    isDriveOnlyMode: false,
    activeSessions: 0,
    totalParticipants: 0,
    onlineParticipants: 0
  });

  useEffect(() => {
    // Check current mode
    const isDriveOnly = driveOnlyService.isDriveOnlyMode();
    setDriveOnlyMode(isDriveOnly);
    
    // Get statistics
    const currentStats = driveOnlyService.getStatistics();
    setStats(currentStats);
    
    // Notify parent component
    if (onModeChange) {
      onModeChange(isDriveOnly);
    }
  }, [onModeChange]);

  const toggleMode = () => {
    if (driveOnlyMode) {
      // Disable Drive-Only mode
      driveOnlyService.disableDriveOnlyMode();
      setDriveOnlyMode(false);
      console.log('☁️ Supabase mód visszakapcsolva');
    } else {
      // Enable Drive-Only mode
      driveOnlyService.enableDriveOnlyMode();
      setDriveOnlyMode(true);
      console.log('🚀 Drive-Only mód aktiválva');
    }
    
    // Update statistics
    const newStats = driveOnlyService.getStatistics();
    setStats(newStats);
    
    // Notify parent component
    if (onModeChange) {
      onModeChange(!driveOnlyMode);
    }
  };

  const cleanupExpired = () => {
    driveOnlyService.cleanupExpiredSessions();
    const newStats = driveOnlyService.getStatistics();
    setStats(newStats);
    console.log('🧹 Lejárt munkamenetek törölve');
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Tárolási Mód</h3>
          <p className="text-slate-600">
            {driveOnlyMode 
              ? 'Drive-Only mód: Csak Google Drive és localStorage' 
              : 'Supabase mód: Adatbázis + Google Drive'
            }
          </p>
        </div>
        
        <button
          onClick={toggleMode}
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            driveOnlyMode
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          {driveOnlyMode ? '📁 Drive-Only Aktív' : '☁️ Supabase Aktív'}
        </button>
      </div>

      {/* Mode Description */}
      <div className={`p-4 rounded-lg border-2 ${
        driveOnlyMode 
          ? 'bg-purple-50 border-purple-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            driveOnlyMode ? 'bg-purple-500' : 'bg-blue-500'
          }`}></div>
          <span className={`font-bold ${
            driveOnlyMode ? 'text-purple-800' : 'text-blue-800'
          }`}>
            {driveOnlyMode ? 'Drive-Only Mód' : 'Supabase Mód'}
          </span>
        </div>
        
        <div className={`text-sm ${
          driveOnlyMode ? 'text-purple-700' : 'text-blue-700'
        }`}>
          {driveOnlyMode ? (
            <>
              <div className="mb-2">✅ <strong>Előnyök:</strong></div>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Nulla Supabase forgalom (0% egress)</li>
                <li>Korlátlan intézményi Google Drive</li>
                <li>Gyorsabb működés</li>
                <li>Nincs adatbázis függőség</li>
              </ul>
              <div className="mt-2">⚠️ <strong>Figyelem:</strong> Csak localStorage és Google Drive</div>
            </>
          ) : (
            <>
              <div className="mb-2">✅ <strong>Előnyök:</strong></div>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Teljes adatbázis funkciók</li>
                <li>Részletes statisztikák</li>
                <li>Hosszú távú adattárolás</li>
                <li>Fejlett monitoring</li>
              </ul>
              <div className="mt-2">⚠️ <strong>Figyelem:</strong> Supabase forgalom használat</div>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      {driveOnlyMode && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-800">{stats.activeSessions}</div>
            <div className="text-sm text-purple-600">Aktív munkamenet</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-800">{stats.totalParticipants}</div>
            <div className="text-sm text-purple-600">Összes résztvevő</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-800">{stats.onlineParticipants}</div>
            <div className="text-sm text-purple-600">Online résztvevő</div>
          </div>
        </div>
      )}

      {/* Actions */}
      {driveOnlyMode && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={cleanupExpired}
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg font-medium transition-colors"
          >
            🧹 Lejárt munkamenetek törlése
          </button>
          
          <button
            onClick={() => {
              const newStats = driveOnlyService.getStatistics();
              setStats(newStats);
            }}
            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg font-medium transition-colors"
          >
            🔄 Statisztikák frissítése
          </button>
        </div>
      )}

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <span className="font-bold">Fontos:</span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          {driveOnlyMode 
            ? 'Drive-Only módban minden adat localStorage-ban és Google Drive-on tárolódik. Böngésző adatok törlése esetén helyi adatok elvesznek.'
            : 'Supabase módban figyelj a forgalmi korlátokra. Drive-Only mód használata javasolt nagy forgalom esetén.'
          }
        </p>
      </div>
    </div>
  );
}