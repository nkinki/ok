# 🔧 Google Drive API Setup - Automatikus JSON Letöltés

## 🎯 Cél
A diákok automatikusan letölthessék a JSON fájlokat a Google Drive-ról anélkül, hogy manuálisan kellene kiválasztaniuk.

## ⚙️ Beállítás (FONTOS!)

### 1. Google Drive mappa megosztása a Service Account-tal

A service account-nak hozzáférést kell adni a Drive mappához:

**Service Account Email:**
```
okos-856@integrated-myth-249222.iam.gserviceaccount.com
```

**Lépések:**

1. **Nyisd meg a Google Drive mappát:**
   https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6

2. **Jobb klikk a mappán** → "Megosztás" / "Share"

3. **Add hozzá a service account email címét:**
   ```
   okos-856@integrated-myth-249222.iam.gserviceaccount.com
   ```

4. **Jogosultság:** "Viewer" / "Megtekintő" (elég, nem kell szerkesztési jog)

5. **Kattints "Megosztás" / "Share"**

6. **FONTOS:** Ne küldj értesítést (uncheck "Notify people")

### 2. Ellenőrzés

Teszteld, hogy működik-e:

```bash
# Indítsd el a dev szervert
npm run dev

# Nyisd meg a böngészőben
http://localhost:3001

# Diák módban:
1. Add meg a munkamenet kódot
2. Kattints START
3. A JSON automatikusan letöltődik! 🎉
```

## 🚀 Működés

### Tanár oldal:
1. Munkamenet létrehozása
2. JSON automatikusan letöltődik: `munkamenet_ABC123_2026-02-09.json`
3. **Feltöltés a Drive-ra** (drag & drop)
4. Munkamenet kód megosztása diákokkal

### Diák oldal:
1. Bejelentkezés (név, osztály, kód)
2. **START gomb** → Automatikus letöltés! 🎉
3. Feladatok azonnal indulnak

## 📊 Technikai részletek

### API Endpoint
```
GET /api/drive-download?fileName=munkamenet_ABC123_2026-02-09.json
```

**Válasz:**
```json
{
  "success": true,
  "fileName": "munkamenet_ABC123_2026-02-09.json",
  "fileId": "1abc...",
  "data": {
    "code": "ABC123",
    "exercises": [...]
  }
}
```

### Folyamat

1. **Diák kattint START-ra**
2. **Frontend generálja a fájlnevet:** `munkamenet_${CODE}_${DATE}.json`
3. **API hívás:** `/api/drive-download?fileName=...`
4. **Backend:**
   - Google Drive API auth (service account)
   - Fájl keresése a mappában név alapján
   - Fájl letöltése
   - JSON validálás
   - Visszaküldés a frontend-nek
5. **Frontend:**
   - JSON feldolgozása
   - Feladatok betöltése
   - Játék indítása

### Hibakezelés

Ha az automatikus letöltés nem sikerül:
- **Fallback:** 2 másodperc után megnyílik a manuális fájlválasztó
- **Hibaüzenet:** Megjelenik a képernyőn
- **Diák továbbra is tud manuálisan betölteni**

## 🔒 Biztonság

### Service Account előnyei:
- ✅ Nincs OAuth flow (egyszerűbb)
- ✅ Nincs felhasználói bejelentkezés
- ✅ Csak olvasási jog (viewer)
- ✅ Csak egy konkrét mappához van hozzáférés
- ✅ Private key biztonságosan tárolva (.env.local)

### Korlátok:
- Service account csak a megosztott mappát látja
- Nem tud fájlokat módosítani (csak olvasni)
- API rate limit: 1000 request/100 sec (bőven elég)

## 🧪 Tesztelés

### Teszt forgatókönyv:

1. **Tanár létrehoz munkamenetet:**
   - Kód: `TEST01`
   - Dátum: `2026-02-09`
   - JSON: `munkamenet_TEST01_2026-02-09.json`

2. **Tanár feltölti a Drive-ra:**
   - Drag & drop a mappába
   - **NE változtasd meg a fájlnevet!**

3. **Diák bejelentkezik:**
   - Név: "Teszt Diák"
   - Osztály: "8.a"
   - Kód: "TEST01"

4. **Diák kattint START-ra:**
   - ⏳ "Betöltés..." jelenik meg
   - 📥 JSON automatikusan letöltődik
   - 🎮 Feladatok elindulnak

5. **Elvárt eredmény:**
   - ✅ Nincs manuális fájlválasztó
   - ✅ Nincs Drive mappa megnyitás
   - ✅ Automatikus, gyors, egyszerű

### Debug log:

```
🚀 START button clicked - Auto-downloading JSON from Google Drive...
📁 Auto-downloading file: munkamenet_TEST01_2026-02-09.json
📥 Auto-download request for: munkamenet_TEST01_2026-02-09.json
🔍 Searching for file: munkamenet_TEST01_2026-02-09.json in folder: 1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
✅ File found: munkamenet_TEST01_2026-02-09.json ID: 1abc... Size: 123456
✅ File downloaded successfully, size: 123456
✅ JSON validated: 5 exercises
✅ JSON auto-downloaded successfully: munkamenet_TEST01_2026-02-09.json
📊 Exercises: 5
✅ Session JSON formátum felismerve
📊 Feladatok száma: 5
✅ Érvényes feladatok: 5
🎮 JSON munkamenet automatikusan elindítva!
```

## ❌ Hibaelhárítás

### Hiba: "File not found"
**Ok:** A fájl nincs a Drive mappában vagy rossz a neve.
**Megoldás:**
- Ellenőrizd a fájlnevet: `munkamenet_KÓD_DÁTUM.json`
- Ellenőrizd, hogy a tanár feltöltötte-e
- Ellenőrizd a dátumot (mai nap)

### Hiba: "Access denied" (403)
**Ok:** A service account nincs megosztva a mappával.
**Megoldás:**
- Oszd meg a mappát: `okos-856@integrated-myth-249222.iam.gserviceaccount.com`
- Jogosultság: "Viewer"

### Hiba: "Invalid JSON file"
**Ok:** A fájl nem valid JSON vagy sérült.
**Megoldás:**
- Ellenőrizd a JSON formátumot
- Töltsd le és nyisd meg egy JSON validátorral
- Hozz létre új munkamenetet

### Hiba: "Server configuration error"
**Ok:** Hiányzó környezeti változók.
**Megoldás:**
- Ellenőrizd `.env.local` fájlt
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` és `GOOGLE_PRIVATE_KEY` kötelező

## 📝 Környezeti változók

`.env.local` fájlban:

```env
# Google Drive API Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=okos-856@integrated-myth-249222.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
```

**FONTOS:**
- Private key-ben a `\n` karakterek fontosak!
- Idézőjelek kötelezőek!
- Ne commitold a private key-t a git-be!

## 🎓 Összehasonlítás

### Előző verzió (manuális):
```
1. START gomb
2. Fájlválasztó megnyílik
3. Diák kiválasztja a fájlt
4. JSON betöltődik
5. Feladatok indulnak
```
**Lépések:** 5

### Új verzió (automatikus):
```
1. START gomb
2. JSON automatikusan letöltődik
3. Feladatok indulnak
```
**Lépések:** 3

**Javulás:** 40% kevesebb lépés! 🎉

## ✅ Checklist

Mielőtt élesben használod:

- [ ] Google Drive mappa megosztva a service account-tal
- [ ] `.env.local` fájl helyesen kitöltve
- [ ] `npm install` lefutott (googleapis package)
- [ ] Dev szerver fut: `npm run dev`
- [ ] Teszt munkamenet létrehozva
- [ ] Teszt JSON feltöltve a Drive-ra
- [ ] Teszt diák bejelentkezés működik
- [ ] START gomb automatikusan letölti a JSON-t
- [ ] Feladatok elindulnak

---

**Verzió:** 3.0 - Automatikus  
**Dátum:** 2026-02-09  
**Státusz:** ⚙️ Setup szükséges (Drive megosztás)
