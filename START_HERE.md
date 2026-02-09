# 🚀 OKOS GYAKORLÓ - GYORS START

## ✅ TELEPÍTÉS KÉSZ!

A projekt sikeresen telepítve és konfigurálva van ezen a gépen.

---

## 🎯 GYORS INDÍTÁS

### 1. Szerver indítása
```bash
npm run dev
```

**Vagy használd a gyors indító scriptet:**
```bash
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

### 2. Böngésző megnyitása
```
http://localhost:3001/
```

---

## 📁 GOOGLE DRIVE INTEGRÁCIÓ

**A rendszer most már Google Drive-ot használ a munkamenetek kezeléséhez!**

### Tanárnak:
1. Hozz létre munkamenetet
2. JSON automatikusan letöltődik
3. Töltsd fel a Google Drive mappába
4. Oszd meg a linket a diákokkal

### Diáknak:
1. Kattints a "📁 Drive mappa megnyitása" gombra
2. Töltsd le a JSON fájlt
3. Kattints a "JSON fájl betöltése" gombra
4. Válaszd ki a letöltött fájlt
5. START!

**Google Drive mappa:**  
https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6

---

## 📚 DOKUMENTÁCIÓK

### Használati útmutatók:
- **Tanár:** `GOOGLE_DRIVE_TANAR_UTMUTATO.md`
- **Diák:** `GOOGLE_DRIVE_DIAK_UTMUTATO.md`
- **Integráció:** `GOOGLE_DRIVE_INTEGRACIO_KESZ.md`

### Telepítés és karbantartás:
- **Telepítés:** `MASIK_GEPRE_TELEPITES.md`
- **Indítás:** `INDITAS.txt`
- **Adatbázis:** `ADATBAZIS_KARBANTARTAS.md`
- **Supabase riport:** `SUPABASE_ADATHASZNALAT_RIPORT.md`

### Régi dokumentációk (referencia):
- `KESZ_JSON_MEGOLDAS.md`
- `TANAR_JSON_UTMUTATO.md`
- `README.md`

---

## 🔧 HASZNOS PARANCSOK

```bash
# Fejlesztői szerver indítása
npm run dev

# Hálózati mód (más gépekről is elérhető)
npm run dev:network

# Production build
npm run build

# Tesztek futtatása
npm run test

# Adatbázis ellenőrzése
node check-last-sessions-data.js

# Régi munkamenetek törlése
node cleanup-old-sessions.js
```

---

## 📊 RENDSZER ÁLLAPOT

### ✅ Telepítve:
- Node.js v24.13.0
- npm 11.6.2
- 445 csomag
- Fejlesztői szerver fut: http://localhost:3001/

### ✅ Konfigurálva:
- Supabase kapcsolat
- Google Drive API
- Környezeti változók (.env.local)

### ✅ Működik:
- Tanári felület
- Diák felület
- JSON import/export
- Google Drive integráció
- Offline mód
- Hálózati mód

---

## 🎯 KÖVETKEZŐ LÉPÉSEK

1. **Nyisd meg az alkalmazást:** http://localhost:3001/
2. **Teszteld a tanári felületet:**
   - Hozz létre munkamenetet
   - Töltsd le a JSON-t
   - Töltsd fel a Google Drive-ra
3. **Teszteld a diák felületet:**
   - Nyisd meg a Drive mappát
   - Töltsd le a JSON-t
   - Töltsd be a JSON-t
4. **Oszd meg a diákokkal:**
   - Google Drive mappa link
   - Alkalmazás URL

---

## 🆘 PROBLÉMÁK?

### Szerver nem indul:
```bash
# Ellenőrizd a Node.js-t
node --version

# Telepítsd újra a csomagokat
npm install

# Indítsd újra
npm run dev
```

### Port foglalt:
- Vite automatikusan másik portot választ (3001, 3002, stb.)
- Nézd meg a konzol kimenetét

### Környezeti változók:
- Ellenőrizd a `.env.local` fájlt
- Győződj meg róla, hogy minden kulcs ki van töltve

---

## 📞 GYORS REFERENCIA

```
TANÁR:
1. Munkamenet létrehozása → Kód: ABC123
2. JSON letöltése → Automatikus
3. Feltöltés Drive-ra → Húzd be
4. Link megosztása → Diákoknak

DIÁK:
1. Drive mappa → Gomb vagy link
2. JSON letöltése → Jobb klikk
3. JSON betöltése → Zöld gomb
4. Név + Osztály → Prompt
5. START → Feladatok
```

---

## 🎉 KÉSZ!

**A rendszer működik és használatra kész!**

Jó munkát! 🚀

---

**Készítette:** Kiro AI  
**Dátum:** 2026-02-09  
**Verzió:** 1.0.0
