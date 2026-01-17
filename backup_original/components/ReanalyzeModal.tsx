
import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReanalyze: (hint: string) => void;
}

const ReanalyzeModal: React.FC<Props> = ({ isOpen, onClose, onReanalyze }) => {
  const [hint, setHint] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
      if (!hint.trim()) {
          alert("Kérlek írj be egy rövid utasítást!");
          return;
      }
      onReanalyze(hint);
      setHint('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-brand-100 p-4 text-brand-900 border-b border-brand-200 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Újraértelmezés (Javítás)
          </h2>
          <button onClick={onClose}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Ha az AI rosszul ismerte fel a feladatot (pl. párosító helyett tesztnek hitte, vagy rossz szöveget olvasott), itt adhatsz neki segítséget.
          </p>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mi a hiba? (Utasítás az AI-nak)</label>
            <textarea 
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Pl.: Ez egy párosító feladat. A bal oldali oszlop a fogalom, a jobb oldali a meghatározás. VAGY: Olvasd be a képaláírást is."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg h-32 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
             <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">Mégse</button>
             <button onClick={handleSubmit} className="bg-purple-200 hover:bg-purple-300 text-purple-900 px-6 py-2 rounded-lg font-bold shadow-sm">
               Újraértelmezés
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReanalyzeModal;
