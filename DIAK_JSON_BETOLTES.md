# Diák JSON Betöltés - Automatikus Fájlnév

## 🎯 Cél
A diákok egyszerűen betölthessék a munkamenet JSON fájlt anélkül, hogy manuálisan kellene keresniük a Drive mappában.

## 📋 Munkafolyamat

### Tanár oldal:
1. **Munkamenet létrehozása** → JSON automatikusan letöltődik
2. **Fájlnév**: `munkamenet_KÓDNÉV_YYYY-MM-DD.json` (NE változtasd meg!)
3. **Feltöltés**: Töltsd fel a JSON-t a Google Drive mappába
4. **Kód megosztása**: Add meg a diákoknak a munkamenet kódját (pl. `3L5ERQ`)

### Diák oldal:
1. **Bejelentkezés**: Add meg a nevedet, osztályodat és a munkamenet kódját
2. **START gomb**: Kattints a START gombra
3. **JSON kiválasztása**: Automatikusan megnyílik a fájlválasztó
4. **Fájl betöltése**: Válaszd ki a letöltött JSON fájlt
5. **Feladatok indítása**: A feladatok automatikusan betöltődnek

## 🔧 Technikai részletek

### Fájlnév generálás
```typescript
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const fileName = `munkamenet_${sessionCode.toUpperCase()}_${today}.json`;
```

**Példa**: Ha a munkamenet kód `3L5ERQ` és a dátum `2026-02-09`, akkor:
```
munkamenet_3L5ERQ_2026-02-09.json
```

### Miért nem lehet teljesen automatikus?

**Technikai korlátok**:
1. **Google Drive API**: Fájlok listázásához és letöltéséhez API kulcs és OAuth szükséges
2. **CORS**: Böngészőből nem lehet közvetlenül hozzáférni a Drive fájlokhoz
3. **Biztonság**: A fájloknak publikusnak kellene lenniük, ami biztonsági kockázat

**Jelenlegi megoldás előnyei**:
- ✅ Egyszerű és biztonságos
- ✅ Nem igényel API kulcsot
- ✅ Nem igényel Google bejelentkezést
- ✅ Offline is működik (ha már letöltötted a JSON-t)
- ✅ A diák látja a pontos fájlnevet

## 🎨 UI változások

### WAITING_FOR_START képernyő
```
┌─────────────────────────────────────┐
│         👋 Üdv, Diák Neve!          │
│           8.a osztály               │
├─────────────────────────────────────┤
│      Munkamenet kód: 3L5ERQ         │
├─────────────────────────────────────┤
│         📁 Fájl neve:               │
│  munkamenet_3L5ERQ_2026-02-09.json  │
│                                     │
│  Töltsd le ezt a fájlt a Google     │
│  Drive-ról, majd kattints START!    │
├─────────────────────────────────────┤
│    🚀 START - JSON betöltése        │
│    📁 Drive mappa megnyitása        │
│           ← Vissza                  │
└─────────────────────────────────────┘
```

### Működés
1. **START gomb**: Megnyitja a fájlválasztót (file picker)
2. **Drive mappa gomb**: Új ablakban megnyitja a Google Drive mappát
3. **Vissza gomb**: Visszalépés a bejelentkezéshez

## 📝 Kód változások

### handleStartExercises
```typescript
const handleStartExercises = async () => {
  if (!currentSessionCode) return;
  
  // Generate expected filename
  const today = new Date().toISOString().slice(0, 10);
  const fileName = `munkamenet_${currentSessionCode.toUpperCase()}_${today}.json`;
  
  console.log('📁 Expected file:', fileName);
  
  // Trigger file import directly
  fileInputRef.current?.click();
};
```

**Előny**: Egyszerű, direkt, nincs felesleges lépés.

## 🚀 Jövőbeli fejlesztési lehetőségek

### 1. Google Drive API integráció
```typescript
// Service account használata
const files = await gapi.client.drive.files.list({
  q: `name='${fileName}' and '${folderId}' in parents`,
  fields: 'files(id, name, webContentLink)'
});

if (files.result.files.length > 0) {
  const fileId = files.result.files[0].id;
  const content = await downloadFile(fileId);
  // Auto-load JSON
}
```

### 2. QR kód alapú betöltés
- Tanár generál QR kódot a JSON-hoz
- Diák beolvassa → automatikus letöltés

### 3. Közvetlen link megosztás
- Tanár generál egyedi linket
- Diák megnyitja → automatikus betöltés

## ✅ Tesztelés

### Teszt lépések:
1. Hozz létre munkamenetet tanári oldalon
2. Ellenőrizd a letöltött JSON fájlnevet
3. Töltsd fel a Drive-ra
4. Diák oldalon add meg a kódot
5. Kattints START-ra
6. Válaszd ki a JSON fájlt
7. Ellenőrizd, hogy a feladatok betöltődnek

### Elvárt eredmény:
- ✅ Fájlnév megjelenik a képernyőn
- ✅ START gomb megnyitja a fájlválasztót
- ✅ JSON betöltődik és a feladatok elindulnak
- ✅ Nincs felesleges lépés vagy ablak

## 📊 Összehasonlítás

### Előző verzió:
1. START gomb → Alert üzenet
2. Confirm dialog → Drive mappa megnyitása
3. Vissza a LOGIN-hoz
4. JSON import gomb → Fájlválasztó
5. Fájl kiválasztása

**Lépések száma**: 5

### Új verzió:
1. START gomb → Fájlválasztó
2. Fájl kiválasztása

**Lépések száma**: 2

**Javulás**: 60% kevesebb lépés! 🎉

## 🎓 Felhasználói élmény

### Diák szemszögéből:
1. "Beírom a kódot" ✅
2. "Látom a fájlnevet" ✅
3. "Kattintok START-ra" ✅
4. "Kiválasztom a fájlt" ✅
5. "Kezdődnek a feladatok" ✅

**Egyszerű, gyors, intuitív!**

---

**Verzió**: 2.0  
**Dátum**: 2026-02-09  
**Státusz**: ✅ Kész és tesztelve
