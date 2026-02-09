# 🚀 TELEPÍTÉSI ÚTMUTATÓ - MÁSIK GÉP

## ⚠️ FONTOS - OLVASD EL ELŐSZÖR!

Ez a projekt ZIP fájlból lett kicsomagolva. Néhány lépést végre kell hajtanod a működéshez.

---

## 📋 LÉPÉSEK

### 1️⃣ Csomagold ki a ZIP fájlt

```
Jobb klikk a ZIP fájlon → "Kibontás ide" vagy "Extract here"
```

### 2️⃣ Nyisd meg a projekt mappát terminálban

```bash
# Windows PowerShell vagy CMD
cd C:\path\to\okos

# Vagy nyisd meg VS Code-ban és használd a beépített terminált
```

### 3️⃣ Telepítsd a függőségeket (node_modules)

```bash
npm install
```

**Ez 2-5 percet vesz igénybe!** ☕

**Mit csinál ez?**
- Letölti az összes szükséges package-et (React, Vite, Tailwind, stb.)
- Létrehozza a `node_modules` mappát (~300 MB)

### 4️⃣ Ellenőrizd a .env.local fájlt

```bash
# Nézd meg, hogy létezik-e
type .env.local
```

**Ha NINCS .env.local fájl:**

1. Másold át a régi gépről a `.env.local` fájlt
2. VAGY hozd létre kézzel:

```bash
# Hozd létre a fájlt
notepad .env.local
```

**Tartalom (FONTOS - töltsd ki a saját adataiddal!):**

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini AI
VITE_GEMINI_API_KEY=your-gemini-api-key

# Google OAuth (opcionális)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Honnan szerezd meg ezeket?**
- Supabase: https://supabase.com → Project Settings → API
- Gemini: https://makersuite.google.com/app/apikey
- Google OAuth: https://console.cloud.google.com

### 5️⃣ Indítsd el a fejlesztői szervert

```bash
npm run dev
```

**Sikeres indítás:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6️⃣ Nyisd meg a böngészőben

```
http://localhost:5173
```

---

## ✅ ELLENŐRZŐ LISTA

- [ ] ZIP fájl kicsomagolva
- [ ] Terminál megnyitva a projekt mappában
- [ ] `npm install` lefutott (node_modules létrejött)
- [ ] `.env.local` fájl létezik és kitöltve
- [ ] `npm run dev` elindul hiba nélkül
- [ ] Böngészőben megnyílik: http://localhost:5173
- [ ] Tanári felület elérhető
- [ ] Diák felület elérhető

---

## 🆘 GYAKORI HIBÁK ÉS MEGOLDÁSOK

### ❌ "npm: command not found"

**Probléma:** Node.js nincs telepítve

**Megoldás:**
1. Töltsd le: https://nodejs.org (LTS verzió)
2. Telepítsd
3. Indítsd újra a terminált
4. Ellenőrizd: `node --version` és `npm --version`

---

### ❌ "Cannot find module..."

**Probléma:** node_modules hiányzik vagy sérült

**Megoldás:**
```bash
# Töröld a node_modules-t
rmdir /s /q node_modules

# Töröld a package-lock.json-t
del package-lock.json

# Telepítsd újra
npm install
```

---

### ❌ "Supabase connection failed"

**Probléma:** Hibás vagy hiányzó .env.local

**Megoldás:**
1. Ellenőrizd, hogy létezik-e: `type .env.local`
2. Ellenőrizd a Supabase URL-t és kulcsot
3. Győződj meg róla, hogy nincs extra szóköz vagy sortörés
4. Indítsd újra a dev szervert: `npm run dev`

---

### ❌ "Port 5173 already in use"

**Probléma:** A port már használatban van

**Megoldás:**
- Vite automatikusan másik portot választ (5174, 5175, stb.)
- Vagy állítsd le a másik folyamatot:
  ```bash
  # Windows
  netstat -ano | findstr :5173
  taskkill /PID <PID> /F
  ```

---

### ❌ "EACCES: permission denied"

**Probléma:** Nincs jogosultságod

**Megoldás:**
```bash
# Futtasd adminisztrátorként a terminált
# Vagy változtasd meg a mappa jogosultságait
```

---

## 🔧 HASZNOS PARANCSOK

```bash
# Fejlesztői szerver indítása
npm run dev

# Production build készítése
npm run build

# Production build előnézete
npm run preview

# Függőségek frissítése
npm update

# Projekt tisztítása
rmdir /s /q node_modules dist
npm install
```

---

## 📊 PROJEKT STRUKTÚRA

```
okos/
├── api/                    # Backend API endpoints
├── components/             # React komponensek
├── contexts/              # React Context (Auth, Subject)
├── database/              # Supabase SQL fájlok
├── docs/                  # Dokumentációk
├── public/                # Statikus fájlok
├── scripts/               # Segédscriptek
├── services/              # API szolgáltatások
├── tests/                 # Tesztek
├── types/                 # TypeScript típusok
├── utils/                 # Segédfüggvények
├── .env.local            # Környezeti változók (FONTOS!)
├── package.json          # Függőségek
├── vite.config.ts        # Vite konfiguráció
└── README.md             # Projekt leírás
```

---

## 🎯 KÖVETKEZŐ LÉPÉSEK

1. **Ellenőrizd a működést:**
   - Tanári bejelentkezés
   - Feladat létrehozás
   - Munkamenet indítás
   - Diák csatlakozás

2. **Teszteld az új funkciókat:**
   - JSON import (KESZ_JSON_MEGOLDAS.md)
   - BASE64 képek (verify-session-base64.html)
   - Upload tool (upload-localstorage-to-drive.html)

3. **Olvasd el a dokumentációkat:**
   - `KESZ_JSON_MEGOLDAS.md` - JSON import útmutató
   - `TANAR_JSON_UTMUTATO.md` - Tanári útmutató
   - `README.md` - Projekt áttekintés

---

## 📞 SEGÍTSÉG

Ha bármi probléma van:

1. Ellenőrizd a konzol hibákat (F12 a böngészőben)
2. Nézd meg a terminál kimenetét
3. Olvasd el a hibaüzenetet
4. Keresd meg a megoldást a "GYAKORI HIBÁK" szekcióban

---

## ✅ SIKERES TELEPÍTÉS JELE

Ha mindent jól csináltál:

✅ `npm run dev` elindul hiba nélkül
✅ Böngészőben megnyílik az app
✅ Tanári felület működik
✅ Diák felület működik
✅ Supabase kapcsolat működik
✅ Feladatok létrehozhatók

**🎉 GRATULÁLOK! A projekt működik!**

---

## 🔄 FRISSÍTÉSEK ÁTVITELE

Ha később újabb változtatásokat szeretnél átvinni:

1. **Régi gépen:**
   - Töröld a `node_modules` és `dist` mappákat
   - Csomagold ZIP-be
   - Vidd át az új gépre

2. **Új gépen:**
   - Csomagold ki
   - `npm install`
   - `npm run dev`

**VAGY használj Git-et (ajánlott hosszú távon):**
```bash
git init
git add -A
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

**Készítve:** 2026-02-08
**Verzió:** JSON Import Ready
**Utolsó frissítés:** BASE64 képek + verification tools
