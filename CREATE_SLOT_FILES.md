# 📁 Slot Fájlok Létrehozása Google Drive-on

## 🎯 Cél
Hozd létre a hiányzó slot fájlokat a Google Drive mappában.

## 📍 Drive Mappa
https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6

## ✅ Jelenlegi Állapot
- `session1.json` ✅ Létezik
- `session2.json` ❌ Hiányzik
- `session3.json` ❌ Hiányzik
- `session4.json` ❌ Hiányzik
- `session5.json` ❌ Hiányzik

## 🔧 Lépések

### 1. Nyisd meg a Drive mappát
https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6

### 2. Hozz létre új fájlokat
Minden hiányzó fájlhoz:

1. Kattints "New" → "Google Docs" → "Blank document"
2. Másold be ezt a tartalmat:
```json
{
  "code": "EMPTY",
  "exercises": [],
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```
3. Mentsd el a fájlt:
   - File → Save as → "session2.json" (vagy session3, session4, session5)
   - **FONTOS**: A fájl kiterjesztése legyen `.json`!

### 3. Állítsd be a megosztást
Minden új fájlhoz:

1. Jobb klikk a fájlon → "Share"
2. "General access" → "Anyone with the link"
3. Jogosultság: "Viewer"
4. Kattints "Done"

### 4. Add hozzá a Service Account-ot
Minden új fájlhoz:

1. Jobb klikk a fájlon → "Share"
2. Add hozzá: `okos-856@integrated-myth-249222.iam.gserviceaccount.com`
3. Jogosultság: **Editor** (írás is kell!)
4. Kattints "Send"

## 🎉 Kész!
Most már mind az 5 slot használható:
- Slot 1: `session1.json` ✅
- Slot 2: `session2.json` ✅
- Slot 3: `session3.json` ✅
- Slot 4: `session4.json` ✅
- Slot 5: `session5.json` ✅

## 🧪 Tesztelés
1. Tanár oldalon válassz Slot 2-t
2. Indíts munkamenetet
3. Ellenőrizd, hogy a `session2.json` frissült-e a Drive-on
4. Diák oldalon add meg Slot 2-t
5. Ellenőrizd, hogy automatikusan letöltődik-e

---

**Megjegyzés**: Ha a fájlok már léteznek, de üresek, csak ellenőrizd a jogosultságokat!
