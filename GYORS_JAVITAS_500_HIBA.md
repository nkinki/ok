# 🚨 500-as Hiba Gyors Javítás

## ❌ Hiba
```
Failed to load resource: the server responded with a status of 500
❌ Automatikus letöltés hiba: Error: HTTP 500: Letöltés sikertelen
```

## 🔍 Okok

### 1. Vercel Environment Variables Hiányoznak
A legvalószínűbb ok: a Vercel-en nincsenek beállítva a Google Drive API credentials.

### 2. Session1.json Fájl Nem Létezik
A Drive-on még nincs `session1.json` fájl.

## ✅ Megoldás - 3 Lépés

### LÉPÉS 1: Vercel Environment Variables Beállítása

1. **Nyisd meg**: https://vercel.com/dashboard
2. **Válaszd ki a projektet**: `nyirad`
3. **Menj**: Settings → Environment Variables
4. **Add hozzá**:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL = okos-856@integrated-myth-249222.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY = [A teljes private key a service account JSON-ből]
GOOGLE_DRIVE_FOLDER_ID = 1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
```

5. **Redeploy**: Deployments → Redeploy

**Részletes útmutató**: Lásd `VERCEL_ENV_SETUP.md`

### LÉPÉS 2: Session1.json Fájl Létrehozása

#### Opció A: Manuális Feltöltés (Gyors Teszt)

1. **Töltsd le**: `test-session1.json` fájlt ebből a mappából
2. **Nevezd át**: `session1.json`-ra
3. **Töltsd fel** a Google Drive mappába:
   https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
4. **Oszd meg** a service account-tal:
   - Jobb klikk → Share
   - Add hozzá: `okos-856@integrated-myth-249222.iam.gserviceaccount.com`
   - Jogosultság: **Editor**

#### Opció B: Tanár Oldal Használata (Automatikus)

1. **Nyisd meg** a tanár oldalt
2. **Válassz ki** néhány feladatot
3. **Válaszd ki**: Slot 1
4. **Válaszd ki**: Osztály (pl. 8.a)
5. **Kattints**: "Munkamenet indítása"
6. **Ellenőrizd** a Drive-on, hogy létrejött-e a `session1.json`

### LÉPÉS 3: Tesztelés

#### A) API Teszt Böngészőben
Nyisd meg:
```
https://nyirad.vercel.app/api/drive-download?slotNumber=1
```

**Sikeres válasz**:
```json
{
  "success": true,
  "slotNumber": "1",
  "fileName": "session1.json",
  "data": { "code": "TEST01", "exercises": [...] }
}
```

#### B) Diák Oldal Teszt
1. Nyisd meg a diák oldalt
2. Töltsd ki:
   - Név: Teszt Diák
   - Osztály: 8.a
   - **Slot szám: 1**
   - Munkamenet kód: TEST01 (vagy amit a tanár adott)
3. Kattints "Bejelentkezés"
4. **Elvárt**: Automatikus letöltés, feladatok indulnak

## 🔧 Hibakeresés

### Ha még mindig 500-as hiba:

#### 1. Nézd meg a Vercel Logs-ot
```
Vercel Dashboard → Deployments → [Latest] → Functions → /api/drive-download
```

**Keress ilyen üzeneteket:**
- `Missing Google credentials` → Environment variables hiányoznak
- `Access denied` → Service account nincs megosztva
- `File not found` → session1.json nem létezik

#### 2. Ellenőrizd a Service Account Jogosultságokat
1. Nyisd meg a Drive mappát
2. Jobb klikk → Share → Manage access
3. Keresd meg: `okos-856@integrated-myth-249222.iam.gserviceaccount.com`
4. Jogosultság: **Editor** (nem Viewer!)

#### 3. Ellenőrizd a session1.json Fájlt
1. Nyisd meg a Drive mappát
2. Keresd meg: `session1.json`
3. Nyisd meg → Ellenőrizd, hogy valid JSON-e
4. Minimum tartalom:
```json
{
  "code": "TEST01",
  "exercises": [...]
}
```

## 📋 Checklist

- [ ] Vercel environment variables beállítva (3 db)
- [ ] Vercel redeploy végrehajtva
- [ ] `session1.json` létezik a Drive-on
- [ ] Service account megosztva (Editor jogosultság)
- [ ] API teszt sikeres (böngészőben)
- [ ] Diák oldal teszt sikeres

## 🆘 Ha Semmi Sem Működik

### Fallback: Manuális Fájl Betöltés
A diák oldalon van egy "JSON fájl betöltése" gomb:
1. Töltsd le a `munkamenet_XXX.json` fájlt a tanártól
2. Kattints "JSON fájl betöltése"
3. Válaszd ki a fájlt
4. Feladatok indulnak

Ez a régi módszer, de mindig működik, ha az API nem elérhető.

---

**Gyors segítség**: Ha elakadtál, nézd meg a részletes útmutatókat:
- `VERCEL_ENV_SETUP.md` - Environment variables beállítása
- `CREATE_SLOT_FILES.md` - Slot fájlok létrehozása
- `SLOT_SYSTEM_IMPLEMENTATION.md` - Teljes rendszer dokumentáció
