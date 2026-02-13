# 🔗 Slot Linkek Rendszer - Használati Útmutató

## 📋 Áttekintés

Ez a rendszer lehetővé teszi, hogy a tanár Google Drive publikus linkeken keresztül ossza meg a munkameneteket a diákokkal, **API kulcs és autentikáció nélkül**.

## 🎯 Hogyan működik?

1. **Tanár oldal:**
   - Létrehozza a munkamenetet
   - Letölti a JSON fájlt (pl. `session_ABC123.json`)
   - Feltölti Google Drive-ra
   - Publikusra állítja a fájlt
   - Beállítja a slot linkeket

2. **Diák oldal:**
   - Beírja a slot számot (1-10)
   - Az alkalmazás automatikusan letölti a JSON-t a Drive-ról
   - Elkezdheti a feladatokat

## 📝 Lépésről lépésre

### 1. Munkamenet létrehozása

```
1. Nyisd meg a tanári felületet
2. Hozz létre egy új munkamenetet
3. Add hozzá a feladatokat
4. Kattints a "Letöltés JSON" gombra
5. Mentsd el a fájlt (pl. session_ABC123.json)
```

### 2. Google Drive feltöltés

```
1. Nyisd meg a Google Drive-ot
2. Hozz létre egy mappát (pl. "Okos Munkamenetek")
3. Töltsd fel a JSON fájlt
4. Jobb klikk a fájlra → "Megosztás"
5. Kattints a "Bárki, aki rendelkezik a linkkel" opcióra
6. Másold ki a linket
```

### 3. Slot link beállítása

```
1. Nyisd meg a Slot Linkek Kezelő felületet
2. Válaszd ki a slot számot (pl. Slot 1)
3. Illeszd be a Drive linket
4. Kattints a "Mentés és Letöltés" gombra
5. Töltsd fel a letöltött slot-links.json fájlt a szerverre
```

### 4. Diák használat

```
1. Diák bejelentkezik
2. Beírja a slot számot (pl. 1)
3. Automatikusan letöltődik a munkamenet
4. Elkezdheti a feladatokat
```

## 🔧 Technikai részletek

### Fájlok:

- `slot-links.json` - Slot számok és Drive linkek tárolása
- `api/drive-download.js` - Publikus Drive linkről letöltés
- `components/SlotLinksManager.tsx` - Admin felület
- `components/DailyChallenge.tsx` - Automatikus letöltés

### API endpoint:

```
GET /api/drive-download?driveLink=<DRIVE_LINK>
```

### Slot links formátum:

```json
{
  "slot1": "https://drive.google.com/file/d/...",
  "slot2": "https://drive.google.com/file/d/...",
  ...
}
```

## ✅ Előnyök

- ✅ Nincs szükség API kulcsra
- ✅ Nincs szükség autentikációra
- ✅ Egyszerű használat
- ✅ Korlátlan tárhely (Google Drive)
- ✅ Gyors és megbízható
- ✅ Könnyű frissítés (csak új linket kell beállítani)

## 🚀 Következő lépések

1. Teszteld a rendszert egy slot számmal
2. Hozz létre munkameneteket minden slothoz
3. Oszd meg a slot számokat a diákokkal
4. Élvezd a problémamentes működést!

## 🆘 Hibaelhárítás

### "Slot X nincs beállítva"
- Ellenőrizd, hogy a slot-links.json tartalmazza a linket
- Ellenőrizd, hogy a fájl elérhető a szerveren

### "File not found or not public"
- Ellenőrizd, hogy a Drive fájl publikus-e
- Ellenőrizd, hogy a link helyes-e

### "Invalid JSON file"
- Ellenőrizd, hogy a feltöltött fájl valóban JSON
- Ellenőrizd, hogy a JSON formátum helyes-e

---

**Készítve:** 2026-02-13
**Verzió:** 1.0
