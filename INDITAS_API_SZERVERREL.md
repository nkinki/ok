# 🚀 Indítás API Szerverrel - Automatikus JSON Letöltés

## ⚙️ Szükséges szerverek

Az automatikus JSON letöltéshez **2 szerver** kell futnia:

1. **Vite Dev Server** (frontend) - Port 3001
2. **Express API Server** (Google Drive) - Port 3002

## 📋 Indítási lépések

### Opció 1: Külön terminálok (ajánlott fejlesztéshez)

**1. terminál - Frontend:**
```bash
cd okos
npm run dev
```
→ http://localhost:3001

**2. terminál - API Server:**
```bash
cd okos
node server.js
```
→ http://localhost:3002

### Opció 2: Egy parancs (concurrently)

```bash
cd okos
npm run dev:full
```

Ez egyszerre indítja:
- Vite (port 3001)
- Simple API (port 3000)
- Dev API (port 3003)
- **Drive API (port 3002)** ← ÚJ!

## ✅ Ellenőrzés

### 1. API Server fut?
Nyisd meg: http://localhost:3002/health

**Elvárt válasz:**
```json
{
  "status": "ok",
  "message": "API server running"
}
```

### 2. Frontend fut?
Nyisd meg: http://localhost:3001

### 3. Teszt letöltés
```bash
curl "http://localhost:3002/api/drive-download?fileName=munkamenet_TEST01_2026-02-09.json"
```

## 🔧 Hibaelhárítás

### Hiba: "Server configuration error"

**Ok:** Hiányzó környezeti változók

**Megoldás:**
1. Ellenőrizd `.env.local` fájlt
2. Kötelező változók:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=okos-856@integrated-myth-249222.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_DRIVE_FOLDER_ID=1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
   ```

### Hiba: "Access denied" (403)

**Ok:** Service account nincs megosztva a Drive mappával

**Megoldás:**
1. Nyisd meg: https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
2. Jobb klikk → Megosztás
3. Add hozzá: `okos-856@integrated-myth-249222.iam.gserviceaccount.com`
4. Jogosultság: "Viewer"

### Hiba: "File not found" (404)

**Ok:** A JSON fájl nincs a Drive mappában vagy rossz a neve

**Megoldás:**
1. Ellenőrizd a fájlnevet: `munkamenet_KÓD_DÁTUM.json`
2. Ellenőrizd, hogy feltöltötted-e a Drive-ra
3. Ellenőrizd a dátumot (mai nap)

### Hiba: Port már használatban

**Hiba üzenet:** `Error: listen EADDRINUSE: address already in use :::3002`

**Megoldás:**
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Vagy változtasd meg a portot
# .env.local fájlban:
API_PORT=3004
```

## 📊 Működés ellenőrzése

### Console log (API Server):

```
🚀 API Server running on http://localhost:3002
📁 Google Drive Folder ID: 1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
📧 Service Account: okos-856@integrated-myth-249222.iam.gserviceaccount.com
```

### Console log (Diák START gomb):

```
🚀 START button clicked - Auto-downloading JSON from Google Drive...
📁 Auto-downloading file: munkamenet_ABC123_2026-02-09.json
📥 Auto-download request for: munkamenet_ABC123_2026-02-09.json
🔍 Searching for file: munkamenet_ABC123_2026-02-09.json in folder: 1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
✅ File found: munkamenet_ABC123_2026-02-09.json ID: 1abc...
✅ File downloaded successfully
✅ JSON validated: 5 exercises
🎮 JSON munkamenet automatikusan elindítva!
```

## 🎯 Teljes munkafolyamat

### Tanár:
1. Munkamenet létrehozása → JSON letöltődik
2. JSON feltöltése Drive-ra (drag & drop)
3. Munkamenet kód megosztása

### Diák:
1. Bejelentkezés (név, osztály, kód)
2. **START gomb** → Automatikus letöltés! 🎉
3. Feladatok azonnal indulnak

## 📝 Fontos megjegyzések

1. **API Server kötelező** az automatikus letöltéshez
2. **Fallback mechanizmus:** Ha az API nem elérhető, 2 mp után megnyílik a manuális fájlválasztó
3. **Fejlesztés:** Mindig indítsd el mindkét szervert
4. **Production:** Vercel automatikusan kezeli az API route-okat

## 🔄 Újraindítás

Ha változtatsz a kódban:

**Frontend változás:**
- Vite automatikusan újratölti (HMR)

**API változás:**
- Állítsd le: Ctrl+C
- Indítsd újra: `node server.js`

---

**Verzió:** 3.1 - Express API  
**Dátum:** 2026-02-09  
**Státusz:** ✅ Működik (API szerver szükséges)
