import React, { useState, useEffect } from 'react';
import { ApiKeyScanner, FoundApiKey } from '../utils/keyScanner';
import { SAMPLE_ENV_FORMAT } from '../utils/testKeys';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiApiKeys, setGeminiApiKeys] = useState(''); // Multiple Gemini keys
  const [teacherEmail, setTeacherEmail] = useState('');
  const [isDebug, setIsDebug] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [envText, setEnvText] = useState('');
  const [foundKeys, setFoundKeys] = useState<FoundApiKey[]>([]);
  const [parseResult, setParseResult] = useState('');

  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('gemini_api_key');
    if (storedGeminiKey) setGeminiApiKey(storedGeminiKey);
    
    const storedGeminiKeys = localStorage.getItem('gemini_api_keys');
    if (storedGeminiKeys) setGeminiApiKeys(storedGeminiKeys);
    
    const storedEmail = localStorage.getItem('teacher_email');
    if (storedEmail) setTeacherEmail(storedEmail);
    
    const debugStored = localStorage.getItem('app_debug_mode');
    setIsDebug(debugStored === 'true');
  }, [isOpen]);

  const handleSave = () => {
    // Clean up old non-Gemini keys first
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('openai_api_keys');
    localStorage.removeItem('anthropic_api_key');
    localStorage.removeItem('anthropic_api_keys');
    localStorage.removeItem('perplexity_api_key');
    localStorage.removeItem('groq_api_key');
    localStorage.removeItem('openrouter_api_key');
    localStorage.removeItem('xai_api_key');
    localStorage.removeItem('perplexity_model');

    // Save Gemini API keys
    if (geminiApiKey.trim()) {
      localStorage.setItem('gemini_api_key', geminiApiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }

    // Save multiple Gemini API keys
    if (geminiApiKeys.trim()) {
      localStorage.setItem('gemini_api_keys', geminiApiKeys.trim());
    } else {
      localStorage.removeItem('gemini_api_keys');
    }

    // Always set provider to gemini
    localStorage.setItem('ai_provider', 'gemini');

    if (teacherEmail.trim()) {
        localStorage.setItem('teacher_email', teacherEmail.trim());
    } else {
        localStorage.removeItem('teacher_email');
    }

    localStorage.setItem('app_debug_mode', isDebug ? 'true' : 'false');

    // Debug logging
    console.log('🔧 Beállítások mentve és régi kulcsok törölve:', {
      selectedProvider: 'gemini',
      geminiKeys: geminiApiKeys ? geminiApiKeys.split('\n').length : 0,
      cleanedOldKeys: true
    });

    setIsSaved(true);
    
    // Notify app immediately without reload
    window.dispatchEvent(new Event('storage')); 

    setTimeout(() => {
      setIsSaved(false);
      onClose();
      
      // Force page reload to ensure settings are applied
      window.location.reload();
    }, 1000);
  };

  const handleParseEnv = () => {
    if (!envText.trim()) {
      setParseResult('❌ Nincs szöveg beillesztve!');
      return;
    }

    try {
      const keys = ApiKeyScanner.parseEnvFormat(envText);
      setFoundKeys(keys);
      
      if (keys.length > 0) {
        // Debug logging
        console.log('🔍 Talált kulcsok:', keys.map(k => `${k.type}: ${k.key.substring(0, 15)}...`));
        
        // Auto-import found keys
        ApiKeyScanner.importKeysToStorage(keys);
        
        // Update UI with found keys
        keys.forEach(keyInfo => {
          switch (keyInfo.type) {
            case 'gemini':
              if (!geminiApiKey) setGeminiApiKey(keyInfo.key); // Only set if empty
              break;
          }
        });
        
        // Update pool displays
        const geminiKeys = keys.filter(k => k.type === 'gemini').map(k => k.key);
        
        console.log(`🔍 Talált kulcsok részletesen:`, {
          gemini: geminiKeys.length,
          geminiKeys: geminiKeys.map(k => k.substring(0, 15) + '...')
        });
        
        if (geminiKeys.length > 0) {
          setGeminiApiKeys(geminiKeys.join('\n'));
          console.log(`📝 Gemini pool: ${geminiKeys.length} kulcs beállítva`);
        }
        
        const summary = ApiKeyScanner.getSummary(keys);
        setParseResult(`✅ ${summary}`);
        
        // Force refresh the page to reload localStorage
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setParseResult('❌ Nem találtam érvényes API kulcsokat!');
      }
    } catch (error) {
      console.error('Env parsing error:', error);
      setParseResult('❌ Hiba történt a feldolgozás során.');
    }
  };

  const handleLoadExample = () => {
    setEnvText(SAMPLE_ENV_FORMAT);
    setParseResult('📝 Példa betöltve - kattints a "Feldolgozás" gombra!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-slate-100 p-4 flex justify-between items-center text-slate-900 border-b border-slate-200">
          <h2 className="text-lg font-bold">Beállítások</h2>
          <button onClick={onClose}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Gemini Only Notice */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">🧠</div>
              <h3 className="font-bold text-blue-700 text-lg">Google Gemini AI</h3>
            </div>
            <p className="text-sm text-blue-600">
              Ez az alkalmazás most már csak a Google Gemini AI-t használja. Ingyenes és megbízható képfelismerés magyar feladatokhoz.
            </p>
          </div>

          {/* ENV Import Section */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-700 text-sm">📋 .env Formátum Import</h3>
                <p className="text-xs text-slate-500">Illeszd be a Gemini API kulcsokat</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadExample}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                >
                  📝 Példa
                </button>
                <button
                  onClick={handleParseEnv}
                  disabled={!envText.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !envText.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  🔄 Feldolgozás
                </button>
              </div>
            </div>
            
            {/* Paste Area */}
            <div className="mb-3">
              <textarea
                value={envText}
                onChange={(e) => setEnvText(e.target.value)}
                placeholder={`Illeszd be ide a Gemini API kulcsokat:

GEMINI_API_KEY="AIza..."
GEMINI_API_KEY_2="AIza..."
GEMINI_API_KEY_3="AIza..."`}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                rows={6}
              />
            </div>
            
            {/* Parse Result */}
            {parseResult && (
              <div className={`p-3 rounded-lg text-xs font-medium ${
                parseResult.startsWith('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : parseResult.startsWith('❌')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                {parseResult}
              </div>
            )}
            
            {/* Found Keys Display */}
            {foundKeys.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-xs font-bold text-green-700 mb-2">🔑 Importált kulcsok:</h4>
                {foundKeys.map((key, index) => (
                  <div key={index} className="text-xs text-green-600 mb-1">
                    <strong>{key.type.toUpperCase()}:</strong> {key.key.substring(0, 15)}... 
                    <span className="text-green-500 ml-2">({key.source})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gemini API Keys */}
          <div className="space-y-4">
            {/* Single Gemini API Key */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Gemini API Kulcs (Egyetlen)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                type="password" 
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">aistudio.google.com</a> - Ingyenes regisztráció
              </p>
            </div>

            {/* Multiple Gemini API Keys */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Gemini API Pool 🔄
                <span className="text-xs font-normal text-slate-500 ml-2">(Automatikus váltás kvóta esetén)</span>
              </label>
              <textarea 
                value={geminiApiKeys}
                onChange={(e) => setGeminiApiKeys(e.target.value)}
                placeholder={`AIzaSy...kulcs1
AIzaSy...kulcs2
AIzaSy...kulcs3`}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                <strong>Soronként 1 kulcs.</strong> Ha az első elfogyott, automatikusan a következőre vált. Több kulcs = nagyobb kapacitás.
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tanár Email</label>
              <input 
                type="email" 
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="tanar@iskola.hu"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">Napi Gyakorlás eredményei</p>
            </div>

            {/* Debug Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-700 block text-sm">Debug Mód</label>
                <span className="text-xs text-slate-500">Kommunikációs napló</span>
              </div>
              <button 
                onClick={() => setIsDebug(!isDebug)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isDebug ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isDebug ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center pt-2 border-t">
             <div className="flex gap-2">
               <button 
                 onClick={() => {
                   if (confirm('⚠️ FIGYELEM!\n\nEz törli az ÖSSZES API kulcsot és beállítást!\n\nBiztosan folytatod?')) {
                     // Clear ALL localStorage keys related to API
                     localStorage.removeItem('gemini_api_key');
                     localStorage.removeItem('gemini_api_keys');
                     localStorage.removeItem('openai_api_key');
                     localStorage.removeItem('openai_api_keys');
                     localStorage.removeItem('anthropic_api_key');
                     localStorage.removeItem('anthropic_api_keys');
                     localStorage.removeItem('perplexity_api_key');
                     localStorage.removeItem('groq_api_key');
                     localStorage.removeItem('openrouter_api_key');
                     localStorage.removeItem('xai_api_key');
                     localStorage.removeItem('perplexity_model');
                     localStorage.removeItem('ai_provider');
                     
                     // Clear UI fields
                     setGeminiApiKey('');
                     setGeminiApiKeys('');
                     setEnvText('');
                     setFoundKeys([]);
                     setParseResult('');
                     
                     alert('🧹 TELJES RESET KÉSZ!\n\n✅ Minden API kulcs törölve\n✅ UI mezők ürítve\n\nMost újra berakhatod a Gemini kulcsokat!');
                   }
                 }}
                 className="px-3 py-2 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors text-sm"
               >
                 🧹 Teljes Reset
               </button>
               <button 
                 onClick={() => {
                   // Clean up old keys immediately
                   localStorage.removeItem('openai_api_key');
                   localStorage.removeItem('openai_api_keys');
                   localStorage.removeItem('anthropic_api_key');
                   localStorage.removeItem('anthropic_api_keys');
                   localStorage.removeItem('perplexity_api_key');
                   localStorage.removeItem('groq_api_key');
                   localStorage.removeItem('openrouter_api_key');
                   localStorage.removeItem('xai_api_key');
                   localStorage.removeItem('perplexity_model');
                   
                   alert('✅ Régi API kulcsok törölve!\n\nMost már csak Gemini kulcsok vannak a rendszerben.');
                   window.location.reload();
                 }}
                 className="px-3 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors text-sm"
               >
                 🗑️ Régi kulcsok
               </button>
               <button 
                 onClick={() => {
                   if (confirm('⚠️ FIGYELEM!\n\nEz eltávolítja az összes hibás, felfüggesztett és kiszivárgott Gemini kulcsot!\n\nFolytatod?')) {
                     const currentSingleKey = localStorage.getItem('gemini_api_key');
                     const currentPoolKeys = localStorage.getItem('gemini_api_keys');
                     let removedCount = 0;
                     
                     // Check single key (basic validation)
                     if (currentSingleKey && (!currentSingleKey.startsWith('AIza') || currentSingleKey.length < 35)) {
                       localStorage.removeItem('gemini_api_key');
                       setGeminiApiKey('');
                       removedCount++;
                     }
                     
                     // Check pool keys
                     if (currentPoolKeys) {
                       const validKeys = currentPoolKeys.split('\n')
                         .map(key => key.trim())
                         .filter(key => key.length > 0 && key.startsWith('AIza') && key.length >= 35);
                       
                       const originalCount = currentPoolKeys.split('\n').filter(k => k.trim().length > 0).length;
                       removedCount += originalCount - validKeys.length;
                       
                       if (validKeys.length > 0) {
                         localStorage.setItem('gemini_api_keys', validKeys.join('\n'));
                         setGeminiApiKeys(validKeys.join('\n'));
                       } else {
                         localStorage.removeItem('gemini_api_keys');
                         setGeminiApiKeys('');
                       }
                     }
                     
                     alert(`🧹 HIBÁS KULCSOK TISZTÍTVA!\n\n✅ ${removedCount} hibás kulcs eltávolítva\n\n💡 Most adj hozzá új, érvényes Gemini kulcsokat!`);
                   }
                 }}
                 className="px-3 py-2 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-white transition-colors text-sm"
               >
                 🧹 Hibás kulcsok
               </button>
               <button 
                 onClick={() => {
                   // Debug current settings with detailed key analysis
                   const singleKey = localStorage.getItem('gemini_api_key');
                   const poolKeys = localStorage.getItem('gemini_api_keys');
                   
                   let geminiAnalysis = '';
                   let totalGemini = 0;
                   
                   if (singleKey) {
                     totalGemini++;
                     const isValid = singleKey.startsWith('AIza') && singleKey.length >= 35;
                     geminiAnalysis += `Egyedi: ${singleKey.substring(0, 10)}... (${isValid ? '✅ Formátum OK' : '❌ Hibás formátum'})\n`;
                   }
                   
                   if (poolKeys) {
                     const keys = poolKeys.split('\n').map(k => k.trim()).filter(k => k.length > 0);
                     totalGemini += keys.length;
                     geminiAnalysis += `Pool: ${keys.length} kulcs\n`;
                     keys.forEach((key, i) => {
                       const isValid = key.startsWith('AIza') && key.length >= 35;
                       geminiAnalysis += `  ${i+1}. ${key.substring(0, 10)}... (${isValid ? '✅' : '❌'})\n`;
                     });
                   }
                   
                   const allKeys = {
                     gemini_total: totalGemini,
                     openai_single: localStorage.getItem('openai_api_key') ? '1' : '0',
                     openai_pool: localStorage.getItem('openai_api_keys')?.split('\n').length || 0,
                     anthropic: localStorage.getItem('anthropic_api_key') ? '1' : '0',
                     perplexity: localStorage.getItem('perplexity_api_key') ? '1' : '0',
                     groq: localStorage.getItem('groq_api_key') ? '1' : '0',
                     openrouter: localStorage.getItem('openrouter_api_key') ? '1' : '0',
                     xai: localStorage.getItem('xai_api_key') ? '1' : '0',
                     provider: localStorage.getItem('ai_provider') || 'nincs'
                   };
                   
                   console.log('🔍 Összes kulcs állapota:', allKeys);
                   console.log('🧠 Gemini kulcsok részletesen:', geminiAnalysis);
                   
                   alert(`KULCSOK ÁLLAPOTA:\n\n🧠 Gemini: ${totalGemini} kulcs\n${geminiAnalysis}\n🤖 OpenAI: ${allKeys.openai_pool} pool + ${allKeys.openai_single} single\n🔶 Anthropic: ${allKeys.anthropic}\n🟣 Perplexity: ${allKeys.perplexity}\n🟢 Groq: ${allKeys.groq}\n🟡 OpenRouter: ${allKeys.openrouter}\n⚫ XAI: ${allKeys.xai}\n\n📋 Provider: ${allKeys.provider}\n\n💡 Hibás formátumú kulcsokat a "🧹 Hibás kulcsok" gombbal távolíthatod el!`);
                 }}
                 className="px-4 py-2 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors text-sm"
               >
                 🔍 Debug
               </button>
             </div>
             <button onClick={handleSave} className={`px-6 py-2 rounded-lg font-bold text-white flex items-center gap-2 transition-colors ${isSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
               {isSaved ? 'Mentve' : 'Mentés'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;