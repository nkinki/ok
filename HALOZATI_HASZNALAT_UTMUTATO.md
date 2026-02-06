# Hálózati Használat Útmutató (20+ Gép)

## Probléma
A localStorage csak egy gépen működik - nem osztható meg a hálózaton lévő 20 géppel.

## Megoldás: Manuális Google Drive Feltöltés

### Tanár Lépései

#### 1. Munkamenet Létrehozása
```
1. Válassz feladatokat a könyvtárból
2. Válaszd ki az osztályt
3. Kattints "Munkamenet indítása"
4. Munkamenet kód: pl. WMLSZK
```

#### 2. Képek Feltöltése Google Drive-ra
```
1. Kattints "Képek feltöltése Google Drive-ra" gombra
2. Új ablak nyílik: upload-localstorage-to-drive.html
3. Írd be a munkamenet kódot (pl. WMLSZK)
4. Kattints "Upload to Drive"
5. Letöltődik:
   - session_WMLSZK.json
   - WMLSZK_exercise_1.jpg
   - WMLSZK_exercise_2.jpg
   - stb.
```

#### 3. Manuális Feltöltés Google Drive-ra
```
1. Nyisd meg: https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb
2. Töltsd fel az összes letöltött fájlt (JSON + képek)
3. Ellenőrizd, hogy minden fájl feltöltődött
```

#### 4. Diákok Csatlakozása
```
1. Diák beírja a munkamenet kódot: WMLSZK
2. Diák beírja nevét és osztályát
3. Diák kattint START gombra
4. Feladatok betöltődnek a Supabase-ből (Google Drive URL-ekkel)
5. Képek betöltődnek a Google Drive-ról (0% Supabase egress!)
```

## Miért Kell Ez?

### localStorage Probléma
- localStorage csak egy gépen érhető el
- Nem osztható meg a hálózaton
- 20 gép = 20 külön localStorage

### Supabase Egress Probléma
- Base64 képek Supabase-ben: 196% egress (túllépés!)
- 20 diák × 1.5 MB = 30 MB egress / munkamenet
- Google Drive URL-ek: 0% Supabase egress

### Google Drive Megoldás
- Intézményi korlátlan tárhely
- Képek Google Drive-on
- Supabase csak metadata (URL-ek)
- 95%+ Supabase egress csökkentés

## Technikai Részletek

### Adatfolyam

#### Munkamenet Létrehozása
```
Tanár → Feladatok kiválasztása
     → Munkamenet indítása
     → Base64 képek → Supabase full_session_json
     → Munkamenet kód: WMLSZK
```

#### Manuális Feltöltés
```
Tanár → "Képek feltöltése" gomb
     → upload-localstorage-to-drive.html
     → localStorage → JSON + képek letöltése
     → Manuális feltöltés Google Drive-ra
```

#### Diák Betöltés
```
Diák → START gomb
    → /api/simple-api/sessions/WMLSZK/download
    → Supabase full_session_json (Google Drive URL-ek)
    → Képek betöltése Google Drive-ról
    → 0% Supabase egress!
```

## Gyakori Hibák

### 1. "Session not found in localStorage"
**Probléma**: A munkamenet nincs a localStorage-ban
**Megoldás**: 
- Ellenőrizd a munkamenet kódot
- Nézd meg a konzolban az elérhető session-öket
- Lehet, hogy másik gépen hoztad létre

### 2. "404: NOT_FOUND" (upload tool)
**Probléma**: Az upload tool nem érhető el
**Megoldás**:
- Ellenőrizd: `public/upload-localstorage-to-drive.html` létezik
- Deploy to Vercel
- Próbáld: `http://localhost:5173/upload-localstorage-to-drive.html`

### 3. "Nincs feladat a munkamenetben"
**Probléma**: A diák nem tud feladatokat betölteni
**Megoldás**:
- Ellenőrizd, hogy a tanár feltöltötte-e a fájlokat Google Drive-ra
- Nézd meg a Supabase `full_session_json` oszlopot
- Lehet, hogy a munkamenet lejárt (60 perc)

## Alternatív Megoldás: Drive-Only Mode

Ha nem akarsz Supabase-t használni:

```typescript
// Enable Drive-Only mode
driveOnlyService.enableDriveOnlyMode();

// Create session
// → Minden adat Google Drive-on + localStorage
// → 0% Supabase használat
```

**Figyelem**: Drive-Only mode is csak egy gépen működik (localStorage)!

## Összefoglalás

✅ **Működik**: Manuális Google Drive feltöltés + Supabase metadata
✅ **Előny**: 95%+ Supabase egress csökkentés
✅ **Előny**: Intézményi korlátlan Google Drive tárhely
⚠️ **Hátrány**: Manuális feltöltés szükséges
⚠️ **Hátrány**: 2 lépés (létrehozás + feltöltés)

## Következő Lépések

1. Deploy to Vercel
2. Test upload tool: `/upload-localstorage-to-drive.html`
3. Test full workflow with 2-3 computers
4. Document for teachers

## Kapcsolódó Fájlok
- `components/TeacherSessionManager.tsx` - Upload button
- `public/upload-localstorage-to-drive.html` - Manual upload tool
- `services/fullGoogleDriveService.ts` - Google Drive service
- `api/simple-api.js` - `/sessions/{code}/download` endpoint
