import React, { useState, useEffect } from 'react';
import { Download, Upload, Link, Save, RefreshCw } from 'lucide-react';

interface SlotLinks {
  [key: string]: string;
}

export const SlotLinksManager: React.FC = () => {
  const [slotLinks, setSlotLinks] = useState<SlotLinks>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSlotLinks();
  }, []);

  const loadSlotLinks = async () => {
    try {
      const response = await fetch('/api/get-slot-links');
      if (response.ok) {
        const data = await response.json();
        setSlotLinks(data);
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

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // In production, this would save to a backend
      // For now, we'll just show the JSON that needs to be saved
      const jsonContent = JSON.stringify(slotLinks, null, 2);
      
      // Create a download link
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'slot-links.json';
      a.click();
      URL.revokeObjectURL(url);
      
      setMessage('✅ Slot linkek JSON letöltve!\n\nKövetkező lépések:\n1. Nyisd meg a Vercel Dashboard-ot\n2. Settings → Environment Variables\n3. Add hozzá: SLOT_1_LINK, SLOT_2_LINK, stb.\n4. Másold be a linkeket a JSON-ból\n5. Deploy újra az alkalmazást');
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
          <h3 className="font-semibold mb-2">📝 Használat:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Hozz létre munkamenetet és töltsd le a JSON fájlt</li>
            <li>Töltsd fel a JSON-t Google Drive-ra</li>
            <li>Állítsd be "Bárki, aki rendelkezik a linkkel" megosztást</li>
            <li>Másold be a linket az alábbi mezőbe</li>
            <li>Kattints a "Mentés" gombra</li>
            <li>A linkek automatikusan mentődnek a Vercel környezeti változókba</li>
          </ol>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>⚠️ Fontos:</strong> A linkek mentéséhez be kell állítanod a Vercel környezeti változókat:
            <br/>SLOT_1_LINK, SLOT_2_LINK, ... SLOT_10_LINK
            <br/>Vercel Dashboard → Settings → Environment Variables
          </div>
        </div>

        <div className="space-y-4">
          {Object.keys(slotLinks).sort().map((slot) => {
            const slotNumber = slot.replace('slot', '');
            return (
              <div key={slot} className="flex items-center gap-3">
                <label className="w-20 font-semibold">
                  Slot {slotNumber}:
                </label>
                <input
                  type="text"
                  value={slotLinks[slot]}
                  onChange={(e) => handleLinkChange(slot, e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {slotLinks[slot] && (
                  <a
                    href={slotLinks[slot]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
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
          <div className={`mt-4 p-4 rounded-lg ${
            message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
