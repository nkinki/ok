# 🔧 Vercel Environment Variables Beállítása

## ❌ Probléma
A Drive API 500-as hibát ad, mert hiányoznak a Vercel environment variables.

## ✅ Megoldás

### 1. Nyisd meg a Vercel Dashboard-ot
https://vercel.com/dashboard

### 2. Válaszd ki a projektet
- Projekt neve: `nyirad` (vagy ahogy nevezted)

### 3. Menj a Settings → Environment Variables
https://vercel.com/[your-username]/nyirad/settings/environment-variables

### 4. Add hozzá a következő változókat

#### A) GOOGLE_SERVICE_ACCOUNT_EMAIL
- **Name**: `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- **Value**: `okos-856@integrated-myth-249222.iam.gserviceaccount.com`
- **Environment**: Production, Preview, Development (mind a 3)

#### B) GOOGLE_PRIVATE_KEY
- **Name**: `GOOGLE_PRIVATE_KEY`
- **Value**: A service account private key (JSON fájlból)
- **Environment**: Production, Preview, Development (mind a 3)

**Hogyan szerezd meg a private key-t:**
1. Google Cloud Console: https://console.cloud.google.com/
2. IAM & Admin → Service Accounts
3. Válaszd ki: `okos-856@integrated-myth-249222.iam.gserviceaccount.com`
4. Keys → Add Key → Create new key → JSON
5. Letöltődik egy JSON fájl
6. Nyisd meg a JSON fájlt
7. Másold ki a `private_key` értékét (az egész stringet, beleértve a `-----BEGIN PRIVATE KEY-----` és `-----END PRIVATE KEY-----` részeket is)
8. Illeszd be a Vercel-be

**FONTOS**: A private key több soros, így a Vercel-ben így kell beilleszteni:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
(több sor)
...
-----END PRIVATE KEY-----
```

#### C) GOOGLE_DRIVE_FOLDER_ID
- **Name**: `GOOGLE_DRIVE_FOLDER_ID`
- **Value**: `1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6`
- **Environment**: Production, Preview, Development (mind a 3)

### 5. Redeploy a projektet
Miután hozzáadtad a változókat:
1. Menj a Deployments tab-ra
2. Kattints a legutóbbi deployment-re
3. Kattints "Redeploy" gombra
4. Vagy push-olj egy új commit-ot a Git-re (automatikus redeploy)

## 🧪 Tesztelés

### 1. Ellenőrizd az API-t
Nyisd meg böngészőben:
```
https://nyirad.vercel.app/api/drive-download?slotNumber=1
```

**Elvárt válasz** (ha a fájl létezik):
```json
{
  "success": true,
  "slotNumber": "1",
  "fileName": "session1.json",
  "fileId": "...",
  "data": { ... }
}
```

**Vagy** (ha a fájl nem létezik):
```json
{
  "error": "File not found",
  "fileName": "session1.json",
  "message": "Slot 1 még nincs létrehozva vagy üres."
}
```

### 2. Ha még mindig 500-as hiba
Nézd meg a Vercel logs-ot:
1. Vercel Dashboard → Deployments
2. Kattints a legutóbbi deployment-re
3. Functions tab → Kattints a `/api/drive-download` funkcióra
4. Nézd meg a logs-ot

**Gyakori hibák:**
- `Missing Google credentials` → Environment variables hiányoznak
- `Access denied` → Service account nincs megosztva a Drive mappával
- `File not found` → A `session1.json` fájl nem létezik a Drive-on

## 📝 Checklist

- [ ] GOOGLE_SERVICE_ACCOUNT_EMAIL hozzáadva
- [ ] GOOGLE_PRIVATE_KEY hozzáadva (teljes private key, több soros)
- [ ] GOOGLE_DRIVE_FOLDER_ID hozzáadva
- [ ] Redeploy végrehajtva
- [ ] API teszt sikeres
- [ ] Service account megosztva a Drive mappával (Editor jogosultság)
- [ ] `session1.json` fájl létezik a Drive-on

---

**Megjegyzés**: Ha a service account JSON fájlt nem találod, új key-t kell generálni a Google Cloud Console-ban.
