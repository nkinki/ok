
import React, { useEffect, useState, useRef } from 'react';
import { logger, LogMessage } from '../utils/logger';

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLog) => {
      setLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100 logs
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isVisible]);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-black/80 text-green-400 p-2 rounded-md font-mono text-xs z-[100] shadow-lg border border-green-900"
      >
        Show Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full h-64 bg-slate-900 border-t-2 border-brand-500 z-[100] font-mono text-xs flex flex-col shadow-2xl">
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
        <span className="text-white font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Rendszernapló (Debug Console)
        </span>
        <div className="flex gap-2">
            <button onClick={() => setLogs([])} className="text-slate-400 hover:text-white px-2">Törlés</button>
            <button onClick={() => setIsVisible(false)} className="text-slate-400 hover:text-white px-2">Elrejtés</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-black/90">
        {logs.length === 0 && <span className="text-slate-600 italic">Nincs bejegyzés...</span>}
        {logs.map(log => (
          <div key={log.id} className="break-words border-b border-slate-800/50 pb-1 mb-1 last:border-0">
            <span className="text-slate-500 mr-2">[{log.timestamp.toLocaleTimeString()}]</span>
            <span className={`font-bold mr-2 ${
              log.type === 'ERROR' ? 'text-red-500' :
              log.type === 'WARNING' ? 'text-orange-400' :
              log.type === 'SUCCESS' ? 'text-green-400' :
              'text-blue-300'
            }`}>
              {log.type}
            </span>
            <span className="text-slate-300">{log.message}</span>
            {log.details && (
                <pre className="mt-1 text-[10px] text-slate-500 bg-slate-800/30 p-1 rounded overflow-x-auto">
                    {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                </pre>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default DebugConsole;
