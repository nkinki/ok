import React, { useState, useEffect } from 'react';
import { Download, Upload, Link, Save, RefreshCw, Copy, Check } from 'lucide-react';

interface SlotLinks {
  [key: string]: string;
}

export const SlotLinksManager: React.FC = () => {
  const [slotLinks, setSlotLinks] = useState<SlotLinks>({
    slot1: '',
    slot2: '',
    slot3: '',
    slot4: '',
    slot5: '',
    slot6: '',
    slot7: '',
    slot8: '',
    slot9: '',
    slot10: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedSlot, setCopiedSlot] = useState<string | null>(null);

  useEffect(() => {
    loadSlotLinks();
  }, []);

  const loadSlotLinks = async () => {
    try {
      const response = await fetch('/api/get-slot-links');
      if (response.ok) {
        const data = await response.json();
        setSlotLinks(data);
      } else {
        console.log('API not available yet, using empty slots');
      }
    } catch (error) {
      console.error('Slot linkek betöltése sikertelen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChange = (slot: string, value: string) => {
    setSlotLinks(prev => ({
      ...prev,
      [slot]: value
    }));
  };

  const copyToClipboard = (slot: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlot(slot);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Create a download link
      const jsonContent = JSON.stringify(slotLinks, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'slot-links.json';
      a.click();
      URL.revokeObjectURL(url);
      
      // Also show the environment variables format
      const envVars = Object.entries(slotLinks)
        .map(([key, value]) => `${key.toUpperCase().replace('SLOT', 'SLOT_')}_LINK=${value}`)
        .join('\n');
      
      setMessage(`✅ slot-links.json letöltve!\n\n📋 Vercel Environment Variables:\n\n${envVars}\n\nMásold be ezeket a Vercel Dashboard-ra:\nSettings → Environment Variables`);
    } catch (error) {
      setMessage('❌ Mentés sikertelen: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Betöltés...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Slot Linkek Kezelése</h2>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">📝 Gyors útmutató:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Hozz létre munkamenetet → JSON letöltődik</li>
            <li>Töltsd fel a JSON-t Google Drive-ra</li>
            <li>Állítsd be "Bárki, aki rendelkezik a linkkel" megosztást</li>
            <li>Másold be a linket az alábbi mezőbe</li>
            <li>Kattints a "Mentés és Letöltés" gombra</li>
            <li>Másold be a környezeti változókat a Vercel Dashboard-ra</li>
          </ol>
        </div>

        <div className="space-y-4">
          {Object.keys(slotLinks).sort().map((slot) => {
            const slotNumber = slot.replace('slot', '');
            const envVarName = `SLOT_${slotNumber}_LINK`;
            return (
              <div key={slot} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <label className="w-20 font-semibold text-lg">
                    Slot {slotNumber}:
                  </label>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={slotLinks[slot]}
                      onChange={(e) => handleLinkChange(slot, e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {slotLinks[slot] && (
                      <>
                        <a
                          href={slotLinks[slot]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                          title="Megnyitás"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(slot, slotLinks[slot])}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1"
                          title="Másolás"
                        >
                          {copiedSlot === slot ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-24 text-xs text-gray-600 font-mono bg-white px-3 py-1 rounded border">
                  Vercel: {envVarName} = {slotLinks[slot] || '(üres)'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Mentés...' : 'Mentés és Letöltés'}
          </button>
          
          <button
            onClick={loadSlotLinks}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <RefreshCw className="w-5 h-5" />
            Újratöltés
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg whitespace-pre-wrap font-mono text-xs ${
            message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold mb-2 text-yellow-900">⚠️ Fontos - Vercel beállítás:</h3>
          <p className="text-sm text-yellow-800 mb-2">
            A linkek mentése után másold be a környezeti változókat a Vercel Dashboard-ra:
          </p>
          <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
            <li>Nyisd meg: <a href="https://vercel.com/dashboard" target="_blank" className="underline">vercel.com/dashboard</a></li>
            <li>Válaszd ki a projektet (nyirad)</li>
            <li>Settings → Environment Variables</li>
            <li>Add hozzá: SLOT_1_LINK, SLOT_2_LINK, ... SLOT_10_LINK</li>
            <li>Minden változót állíts be "All Environments"-re</li>
            <li>Mentés után automatikus redeploy</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
