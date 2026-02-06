# 📁 Google Drive Egyszerű JSON Workflow

## 🎯 Áttekintés

Ez a **legegyszerűbb megoldás** a Google Drive integrációra:
- ✅ **Nincs szükség Google Drive API-ra**
- ✅ **Nincs Supabase egress költség**
- ✅ **Offline működés**
- ✅ **Hálózaton is működik** (20 gép egyidejűleg)
- ✅ **Tanár manuálisan tölti fel a fájlokat**
- ✅ **Diák lokálisan betölti a JSON fájlt**

---

## 🔄 Workflow Lépések

### 1️⃣ TANÁR: Munkamenet Létrehozása

1. **Feladatok létrehozása** a Tanári Könyvtárban
2. **Munkamenet indítása** a "Munkamenet Indítása" gombbal
3. **Munkamenet kód** megjelenik (pl. `UK1S5P`)

### 2️⃣ TANÁR: JSON Letöltése

1. **Kattints a "📤 Google Drive Feltöltés" gombra**
   - Ez megnyitja az upload tool-t
2. **Írd be a munkamenet kódot** (pl. `UK1S5P`)
3. **Kattints "📤 Upload to Drive"**
4. **Letöltődik:**
   - `session_UK1S5P.json` - Teljes munkamenet adatok (feladatok + base64 képek)
   - `UK1S5P_exercise_1.jpg` - Első feladat képe
   - `UK1S5P_exercise_2.jpg` - Második feladat képe
   - stb.

### 3️⃣ TANÁR: Feltöltés Google Drive-ra

1. **Nyisd meg a Google Drive mappát:**
   - [https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb](https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb)
2. **Töltsd fel a letöltött fájlokat:**
   - `session_UK1S5P.json` ← **EZ A FONTOS!**
   - Képek opcionálisak (már benne vannak a JSON-ban base64 formátumban)
3. **Oszd meg a mappát a diákokkal** (olvasási jogosultság)

### 4️⃣ DIÁK: JSON Betöltése

#### Opció A: Hálózaton keresztül (20 gép)

1. **Diák bejelentkezés** oldalon kattints **"JSON fájl betöltése"** gombra
2. **Tallózd be a Google Drive mappát** a hálózaton
3. **Válaszd ki a `session_UK1S5P.json` fájlt**
4. **Add meg a neved és osztályodat** (prompt)
5. **Feladatok betöltődnek** base64 képekkel
6. **START!** 🚀

#### Opció B: Offline (letöltött JSON)

1. **Töltsd le a JSON fájlt** a Google Drive-ról
2. **Diák bejelentkezés** oldalon kattints **"JSON fájl betöltése"** gombra
3. **Válaszd ki a letöltött fájlt**
4. **Add meg a neved és osztályodat**
5. **START!** 🚀

---

## 📊 JSON Fájl Formátum

A letöltött JSON fájl tartalmazza:

```json
{
  "code": "UK1S5P",
  "createdAt": "2026-02-06T12:00:00.000Z",
  "exercises": [
    {
      "id": "ex_123456",
      "type": "QUIZ",
      "title": "Jelszavak biztonsága",
      "instruction": "Válaszd ki a helyes választ!",
      "fileName": "teszt_jelszavak.jpg",
      "imageUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "content": {
        "questions": [
          {
            "question": "Melyik a legerősebb jelszó?",
            "options": ["123456", "password", "Tr0ub4dor&3", "qwerty"],
            "correctAnswer": 2
          }
        ]
      }
    }
  ]
}
```

**Fontos:**
- ✅ `imageUrl` tartalmazza a **teljes base64 képet**
- ✅ Minden feladat **önálló**, nincs külső függőség
- ✅ **Offline működik** (nincs hálózati hívás)
- ✅ **Hálózaton is működik** (JSON megosztva)

---

## 🎓 Előnyök

### Tanár számára:
- ✅ **Egyszerű workflow**: Létrehozás → Letöltés → Feltöltés
- ✅ **Nincs API konfiguráció** (Service Account, OAuth, stb.)
- ✅ **Teljes kontroll** a fájlok felett
- ✅ **Gyors** (1-2 perc alatt feltöltve)

### Diák számára:
- ✅ **Egyszerű betöltés**: Tallózás → Kiválasztás → START
- ✅ **Offline működik** (ha letöltötte a JSON-t)
- ✅ **Hálózaton is működik** (megosztott Drive mappa)
- ✅ **Gyors betöltés** (nincs API hívás)

### Rendszer számára:
- ✅ **Nincs Supabase egress** (0% használat!)
- ✅ **Nincs Google Drive API kvóta** (nincs API hívás)
- ✅ **Skálázható** (20+ gép egyidejűleg)
- ✅ **Megbízható** (nincs hálózati függőség)

---

## 🔧 Technikai Részletek

### JSON Betöltés Folyamat

1. **Fájl kiválasztása**: `<input type="file" accept=".json" />`
2. **FileReader API**: `reader.readAsText(file)`
3. **JSON parse**: `JSON.parse(content)`
4. **Validáció**: Ellenőrzi a `exercises` tömböt
5. **Playlist létrehozása**: Konvertálja a feladatokat
6. **Diák info**: Prompt-tal bekéri a nevet és osztályt
7. **Játék indítása**: `setStep('PLAYING')`

### Base64 Képek Kezelése

- **Tárolás**: JSON-ban `imageUrl` mezőben
- **Formátum**: `data:image/jpeg;base64,/9j/4AAQSkZJRg...`
- **Méret**: ~100-500 KB / kép (optimalizált)
- **Betöltés**: Közvetlenül az `<img src={imageUrl} />` tag-be
- **Cache**: Böngésző automatikusan cache-eli

### Offline Mód

- **Student ID**: `json-{timestamp}` formátum
- **Session Code**: `JSON-{timestamp}` vagy eredeti kód
- **Eredmények**: Csak localStorage-ban (nincs API hívás)
- **Működés**: Teljes funkcionalitás offline

---

## 📝 Használati Útmutató

### Tanár Lépések (Részletes)

1. **Munkamenet létrehozása:**
   ```
   Tanári Dashboard → Munkamenet Indítása
   → Válassz feladatokat → Indítás
   → Munkamenet kód: UK1S5P
   ```

2. **JSON letöltése:**
   ```
   Kattints "📤 Google Drive Feltöltés" gombra
   → Új ablak nyílik: upload-localstorage-to-drive.html
   → Írd be: UK1S5P
   → Kattints "📤 Upload to Drive"
   → Letöltődik: session_UK1S5P.json + képek
   ```

3. **Feltöltés Google Drive-ra:**
   ```
   Nyisd meg: https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb
   → Drag & Drop: session_UK1S5P.json
   → Várj a feltöltésre (1-2 perc)
   → Oszd meg a mappát a diákokkal
   ```

4. **Diákoknak közöld:**
   ```
   "Nyissátok meg a Google Drive mappát,
   keressétek meg a session_UK1S5P.json fájlt,
   és töltsétek be a Diák bejelentkezés oldalon!"
   ```

### Diák Lépések (Részletes)

1. **Bejelentkezés:**
   ```
   Nyisd meg: https://okos-gyakorlo.vercel.app
   → Kattints "Diák Bejelentkezés"
   → Kattints "JSON fájl betöltése" (zöld gomb)
   ```

2. **JSON kiválasztása:**
   ```
   Tallózás → Google Drive mappa
   → Válaszd ki: session_UK1S5P.json
   → Kattints "Megnyitás"
   ```

3. **Adatok megadása:**
   ```
   Prompt: "Add meg a neved:"
   → Írd be: Kiss Péter
   Prompt: "Add meg az osztályodat:"
   → Írd be: 8.a
   ```

4. **Játék:**
   ```
   Feladatok betöltődnek
   → Képek megjelennek (base64)
   → Válaszolj a kérdésekre
   → Következő feladat
   → Eredmények
   ```

---

## 🚨 Hibaelhárítás

### "Hibás fájlformátum" hiba

**Ok:** Nem érvényes JSON fájl
**Megoldás:**
1. Ellenőrizd, hogy `.json` kiterjesztésű-e
2. Nyisd meg Notepad-ban, nézd meg a tartalmat
3. Töltsd le újra a tanártól

### "Nincs érvényes feladat" hiba

**Ok:** JSON nem tartalmaz `exercises` tömböt
**Megoldás:**
1. Ellenőrizd a JSON struktúrát
2. Tanár töltse le újra a munkamenetet
3. Használd az upload tool-t (ne manuálisan mentsd)

### Képek nem jelennek meg

**Ok:** `imageUrl` hiányzik vagy üres
**Megoldás:**
1. Ellenőrizd a JSON-ban az `imageUrl` mezőt
2. Tanár hozza létre újra a munkamenetet
3. Használd a BulkProcessor-t képek feltöltéséhez

### Lassú betöltés

**Ok:** Nagy JSON fájl (sok feladat, nagy képek)
**Megoldás:**
1. Csökkentsd a feladatok számát (max 10-15)
2. Optimalizáld a képeket (max 500 KB / kép)
3. Használj gyorsabb hálózatot

---

## 📈 Teljesítmény

### JSON Fájl Méret

- **1 feladat**: ~100-200 KB (kép + adat)
- **5 feladat**: ~500 KB - 1 MB
- **10 feladat**: ~1-2 MB
- **15 feladat**: ~2-3 MB

**Ajánlás:** Max 10-15 feladat / munkamenet

### Betöltési Idő

- **Fájl kiválasztás**: 1-2 másodperc
- **JSON parse**: < 100 ms
- **Validáció**: < 50 ms
- **Playlist létrehozás**: < 50 ms
- **Teljes betöltés**: ~2-3 másodperc

### Hálózati Használat

- **Supabase egress**: **0%** (nincs API hívás!)
- **Google Drive API**: **0 request** (nincs API használat!)
- **Hálózati forgalom**: Csak a JSON fájl letöltése (1-3 MB)

---

## 🎉 Összefoglalás

Ez a **legegyszerűbb és legmegbízhatóbb** megoldás:

1. ✅ **Tanár**: Létrehozás → Letöltés → Feltöltés (5 perc)
2. ✅ **Diák**: Tallózás → Kiválasztás → START (30 másodperc)
3. ✅ **Rendszer**: Nincs API, nincs egress, nincs költség
4. ✅ **Működés**: Offline + Online, 20+ gép egyidejűleg

**Nincs szükség:**
- ❌ Google Cloud Console
- ❌ Service Account
- ❌ OAuth konfiguráció
- ❌ API kulcsok
- ❌ Supabase egress
- ❌ Hálózati kapcsolat (offline mód)

**Csak kell:**
- ✅ Google Drive mappa (megosztva)
- ✅ JSON fájl (tanártól)
- ✅ Böngésző (Chrome, Firefox, Edge)

---

## 📞 Támogatás

Ha bármilyen kérdésed van:
1. Olvasd el ezt az útmutatót
2. Ellenőrizd a JSON fájl formátumát
3. Próbáld ki offline módban (letöltött JSON)
4. Kérdezd meg a tanárt

**Sikeres gyakorlást!** 🎓✨
