
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-800">Hogyan mentsd le az Appot?</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6 text-slate-700 leading-relaxed">
          <p>
            Ez az alkalmazás webes technológiákkal készült. Ahhoz, hogy a saját számítógépeden futtasd (internetkapcsolat a Geminihez továbbra is kell), kövesd az alábbi lépéseket:
          </p>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-brand-600 mb-2">1. Node.js Telepítése</h3>
            <p className="text-sm mb-2">
              Töltsd le és telepítsd a <a href="https://nodejs.org/" target="_blank" className="text-blue-600 underline">Node.js</a> (LTS verzió) szoftvert a gépedre.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-brand-600 mb-2">2. Fájlok Létrehozása</h3>
            <p className="text-sm mb-2">Hozz létre egy mappát (pl. <code>okos-gyakorlo</code>), és másold bele a kódokat az alábbi szerkezetben:</p>
            <pre className="bg-slate-800 text-slate-200 p-3 rounded text-xs overflow-x-auto">
{`/okos-gyakorlo
  ├── package.json      (amit letöltöttél)
  ├── vite.config.ts    (amit letöltöttél)
  ├── index.html
  ├── src/
  │    ├── index.tsx
  │    ├── App.tsx
  │    ├── types.ts
  │    ├── services/
  │    │     └── geminiService.ts
  │    └── components/
  │          ├── BulkProcessor.tsx
  │          ├── MatchingExercise.tsx
  │          ├── SettingsModal.tsx
  │          ├── ... (többi komponens)
`}
            </pre>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-brand-600 mb-2">3. Indítás</h3>
            <p className="text-sm mb-2">Nyiss egy parancssort (terminált) a mappában, és futtasd:</p>
            <div className="font-mono text-sm bg-black text-green-400 p-3 rounded">
              npm install<br/>
              npm run dev
            </div>
            <p className="text-sm mt-2">Ezután megnyílik a böngészőben a program.</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
             <h3 className="font-bold text-green-800 mb-1">Beállítás otthoni indítás után</h3>
             <p className="text-sm text-green-900 mb-2">
                Ha elindult a program a böngésződben, kattints a jobb felső sarokban lévő <strong>Fogaskerék ikonra</strong>.
             </p>
             <p className="text-sm text-green-900">
                Itt tudod megadni az ingyenes Gemini API kulcsot, amit a <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline font-bold">Google AI Studio</a> oldalon hozhatsz létre. (Nem kell .env fájlokkal bajlódnod).
             </p>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 font-medium">
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
