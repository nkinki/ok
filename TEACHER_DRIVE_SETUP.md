# Tanári Google Drive Beállítás

## 🎯 Miért kell Google Drive?

A Google Drive segítségével a munkamenet fájlok automatikusan megosztásra kerülnek a diákokkal:

- **Tanár**: Munkamenet indítás → automatikus feltöltés a saját Drive mappájába
- **Diák**: Kód beírása → automatikus letöltés a tanár Drive mappájából
- **Eredmény**: Gyors betöltés, nincs várakozás

## 📋 Beállítási Lépések

### 1. Google Drive Mappa Létrehozása

1. **Menj a Google Drive-ra**: https://drive.google.com/
2. **Hozz létre új mappát**:
   - Jobb klikk → "Új mappa"
   - Név: `Okos-Gyakorlo-Informatika` (vagy a tantárgyad neve)
3. **Mappa megosztása**:
   - Jobb klikk a mappán → "Megosztás"
   - Kattints "Hozzáférés módosítása"
   - Válaszd: "Bárki, aki rendelkezik a hivatkozással"
   - Jogosultság: "Megtekintő"
   - Kattints "Kész"

### 2. Mappa URL Másolása

1. **Nyisd meg a mappát** a Google Drive-ban
2. **Másold ki az URL-t** a böngésző címsorából
   ```
   Példa: https://drive.google.com/drive/folders/1ABC123DEF456GHI789JKL
   ```

### 3. Beállítás az Okos Gyakorlóban

1. **Kattints a ⚙️ Beállítások gombra** (jobb felső sarokban)
2. **Görgess le a "Google Drive Mappa" részhez**
3. **Illeszd be a mappa URL-jét**
4. **Kattints "Mentés"-re**

### 4. Teszt

1. **Ellenőrizd a státuszt**: A munkamenet kezelőben látnod kell "📁 Drive beállítva"
2. **Tesztelés**:
   - Indíts egy munkamenetet
   - Nézd meg, hogy létrejött-e a JSON fájl a Drive mappádban
   - Diák módban próbáld ki a kódot

## ✅ Működés Ellenőrzése

### Tanár oldalon:
- Munkamenet indítás után: "✅ JSON uploaded to Google Drive"
- Drive mappában megjelenik: `session_ABC123.json`

### Diák oldalon:
- Kód beírása után: "✅ Session JSON loaded from Google Drive"
- Gyors betöltés (1-2 másodperc)

## 🔧 Hibaelhárítás

### "Drive nincs beállítva"
- Ellenőrizd, hogy beillesztetted-e a mappa URL-jét
- Győződj meg róla, hogy a mappa publikus

### "Session not found"
- Ellenőrizd, hogy a mappa megosztása aktív-e
- Próbáld meg újra létrehozni a munkamenetet

### "Lassú betöltés"
- Ellenőrizd az internet kapcsolatot
- Nézd meg, hogy a Drive mappa elérhető-e

## 💡 Tippek

1. **Mappa szervezés**: Hozz létre almappákat tantárgyak szerint
2. **Takarítás**: Töröld a régi munkamenet fájlokat hetente
3. **Biztonsági mentés**: A Drive automatikusan menti a fájlokat
4. **Megosztás**: Csak a szükséges jogosultságokat add meg

## 🎉 Előnyök

- **Gyorsaság**: Diákok azonnal hozzáférnek a feladatokhoz
- **Megbízhatóság**: Google infrastruktúra
- **Egyszerűség**: Egy beállítás, aztán automatikus
- **Nyomon követés**: Látod, hogy mely munkamenetek aktívak