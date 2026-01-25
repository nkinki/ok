# Google Drive Gyors Beállítás

## 1. Google Cloud Console

### Lépés 1: Projekt létrehozása
1. Menj ide: https://console.cloud.google.com/
2. Kattints "Select a project" → "New Project"
3. Név: "Okos Gyakorló"
4. Kattints "Create"

### Lépés 2: Drive API engedélyezése
1. Menj: APIs & Services → Library
2. Keress: "Google Drive API"
3. Kattints "Enable"

### Lépés 3: API Key létrehozása
1. Menj: APIs & Services → Credentials
2. Kattints "Create Credentials" → "API Key"
3. Másold ki az API key-t
4. Kattints "Restrict Key":
   - Application restrictions: "HTTP referrers"
   - Website restrictions: `*.vercel.app/*` és `nyirad.vercel.app/*`
   - API restrictions: "Google Drive API"
5. Kattints "Save"

## 2. Google Drive Mappa

### Lépés 1: Mappa létrehozása
1. Menj: https://drive.google.com/
2. Jobb klikk → "New folder"
3. Név: "Okos-Gyakorlo-Sessions"

### Lépés 2: Mappa megosztása
1. Jobb klikk a mappán → "Share"
2. Kattints "Change to anyone with the link"
3. Állítsd "Viewer"-re
4. Kattints "Copy link"
5. Az URL-ből másold ki a Folder ID-t:
   ```
   https://drive.google.com/drive/folders/1ABC123DEF456GHI789
                                        ↑ Ez a Folder ID
   ```

## 3. Vercel Beállítás

1. Menj: https://vercel.com/dashboard
2. Projekt → Settings → Environment Variables
3. Add hozzá:
   ```
   GOOGLE_DRIVE_API_KEY = AIzaSyC...your_api_key
   GOOGLE_DRIVE_FOLDER_ID = 1ABC123DEF456GHI789
   ```
4. Kattints "Save"
5. Redeploy a projektet

## 4. Tesztelés

1. **Tanár**: Fejlett Könyvtár → Gyűjtemény exportálása
2. **Diák**: Másik eszközön írd be a kódot
3. Console-ban látnod kell: "✅ Session JSON loaded from Google Drive"

## Hibaelhárítás

### "API key not configured"
- Ellenőrizd a Vercel environment variables-t
- Redeploy után próbáld újra

### "Drive upload failed"
- Ellenőrizd az API key restrictions-t
- Győződj meg róla, hogy a mappa publikus

### "Session not found"
- Ellenőrizd a Folder ID-t
- Nézd meg, hogy létrejött-e a fájl a Drive-ban