
import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [isDebug, setIsDebug] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
    
    const storedEmail = localStorage.getItem('teacher_email');
    if (storedEmail) setTeacherEmail(storedEmail);
    
    const debugStored = localStorage.getItem('app_debug_mode');
    setIsDebug(debugStored === 'true');
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }

    if (teacherEmail.trim()) {
        localStorage.setItem('teacher_email', teacherEmail.trim());
    } else {
        localStorage.removeItem('teacher_email');
    }

    localStorage.setItem('app_debug_mode', isDebug ? 'true' : 'false');

    setIsSaved(true);
    
    // Notify app immediately without reload
    window.dispatchEvent(new Event('storage')); 

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-100 p-4 flex justify-between items-center text-slate-900 border-b border-slate-200">
          <h2 className="text-lg font-bold">Beállítások</h2>
          <button onClick={onClose}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Google Gemini API Kulcs</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">A képek elemzéséhez szükséges.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tanár Email Címe (Eredményekhez)</label>
            <input 
              type="email" 
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="tanar@iskola.hu"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">Ide küldi a rendszer a Napi Gyakorlás eredményeit.</p>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
              <div>
                  <label className="font-bold text-slate-700 block">Hibakereső Mód (Debug)</label>
                  <span className="text-xs text-slate-500">Látod a kommunikációs naplót a képernyő alján.</span>
              </div>
              <button 
                onClick={() => setIsDebug(!isDebug)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isDebug ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDebug ? 'left-7' : 'left-1'}`}></div>
              </button>
          </div>

          <div className="pt-2 flex justify-end gap-3">
             <button onClick={handleSave} className={`px-6 py-2 rounded-lg font-bold text-white flex items-center gap-2 transition-colors ${isSaved ? 'bg-green-500' : 'bg-purple-600 hover:bg-purple-700'}`}>
               {isSaved ? 'Mentve' : 'Mentés'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
