# Tesztelés Most - Hálózati Használat

## 1. Vercel Deployment Ellenőrzés

Várj 2-3 percet a Vercel deployment befejezésére, majd:

```
https://your-app.vercel.app/upload-localstorage-to-drive.html
```

Ha 404-et kapsz, akkor még nem deployolt. Várj még 1-2 percet.

## 2. Teljes Workflow Teszt

### A. Tanár Oldal (1. Gép)

1. **Munkamenet Létrehozása**
   ```
   - Nyisd meg: https://your-app.vercel.app
   - Válassz tantárgyat (pl. Informatika)
   - Válassz 2-3 feladatot
   - Válaszd ki az osztályt (pl. 8.a)
   - Kattints "Munkamenet indítása"
   - Munkamenet kód: pl. WMLSZK
   ```

2. **Képek Feltöltése Google Drive-ra**
   ```
   - Kattints "Képek feltöltése Google Drive-ra" gombra
   - Új ablak nyílik: upload-localstorage-to-drive.html
   - Írd be a munkamenet kódot: WMLSZK
   - Kattints "📤 Upload to Drive"
   - Letöltődik:
     * session_WMLSZK.json
     * WMLSZK_exercise_1.jpg
     * WMLSZK_exercise_2.jpg
   ```

3. **Manuális Feltöltés Google Drive-ra**
   ```
   - Nyisd meg: https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb
   - Töltsd fel az összes letöltött fájlt
   - Ellenőrizd, hogy minden fájl feltöltődött
   ```

### B. Diák Oldal (2. Gép - MÁSIK SZÁMÍTÓGÉP!)

1. **Csatlakozás**
   ```
   - Nyisd meg: https://your-app.vercel.app
   - Kattints "Diák belépés"
   - Munkamenet kód: WMLSZK
   - Név: Teszt Diák
   - Osztály: 8.a
   - Kattints "Csatlakozás"
   ```

2. **START Gomb**
   ```
   - Kattints "START" gombra
   - Várj 2-3 másodpercet
   - Feladatok betöltődnek
   ```

3. **Ellenőrzés (F12 Console)**
   ```javascript
   // Nézd meg a console log-okat:
   "✅ Session JSON loaded from Supabase (with Google Drive image URLs)"
   "📊 Exercise count: 2"
   "✅ Exercises loaded with Google Drive image URLs"
   "🖼️ First exercise image URL: https://drive.google.com/..."
   "🎮 Exercises ready - starting game!"
   ```

4. **Kép Betöltés Ellenőrzés**
   ```
   - Látod a feladat képét?
   - Ha igen: ✅ MŰKÖDIK!
   - Ha nem: ❌ Probléma van
   ```

## 3. Hibakeresés

### Ha a diák nem látja a képeket:

1. **Console Log Ellenőrzés**
   ```javascript
   // F12 → Console
   // Keress ilyen sorokat:
   "🖼️ First exercise image URL: ..."
   
   // Ha base64-et látsz:
   "data:image/jpeg;base64,/9j/4AAQ..."
   → ❌ Rossz! Nem Google Drive URL!
   
   // Ha Drive URL-t látsz:
   "https://drive.google.com/uc?id=..."
   → ✅ Jó! Google Drive URL!
   ```

2. **Supabase Ellenőrzés**
   ```sql
   -- Nyisd meg Supabase SQL Editor
   SELECT 
     session_code,
     full_session_json->>'exercises'->0->>'imageUrl' as first_image_url
   FROM teacher_sessions
   WHERE session_code = 'WMLSZK';
   
   -- Ha base64-et látsz:
   → ❌ Rossz! A tanár nem töltötte fel Google Drive-ra
   
   -- Ha Drive URL-t látsz:
   → ✅ Jó! Google Drive URL van a DB-ben
   ```

3. **Google Drive Ellenőrzés**
   ```
   - Nyisd meg: https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb
   - Látod a session_WMLSZK.json fájlt?
   - Látod a WMLSZK_exercise_1.jpg fájlt?
   - Ha nem: ❌ A tanár nem töltötte fel!
   ```

## 4. Várható Eredmények

### ✅ Sikeres Teszt
```
1. Tanár létrehozza a munkamenetet
2. Tanár letölti a fájlokat (JSON + képek)
3. Tanár feltölti Google Drive-ra
4. Diák (másik gépen) csatlakozik
5. Diák START gombbal betölti a feladatokat
6. Diák látja a képeket
7. Console log: "Google Drive image URLs"
```

### ❌ Sikertelen Teszt
```
1. Tanár létrehozza a munkamenetet
2. Tanár NEM tölti fel Google Drive-ra
3. Diák (másik gépen) csatlakozik
4. Diák START gombbal betölti a feladatokat
5. Diák NEM látja a képeket (base64 nem érhető el)
6. Console log: "data:image/jpeg;base64,..."
```

## 5. Supabase Egress Ellenőrzés

```
1. Nyisd meg Supabase Dashboard
2. Settings → Usage
3. Nézd meg az Egress értéket
4. Várható:
   - Előtte: 196% (túllépés!)
   - Utána: 5-10% (normál)
```

## 6. Következő Lépések

Ha minden működik:
1. ✅ localStorage quota fix MŰKÖDIK
2. ✅ Upload tool MŰKÖDIK
3. ✅ Network usage MŰKÖDIK
4. ✅ Google Drive integration MŰKÖDIK
5. ✅ Supabase egress CSÖKKENT

Ha valami nem működik:
1. Nézd meg a console log-okat
2. Ellenőrizd a Supabase adatokat
3. Ellenőrizd a Google Drive fájlokat
4. Kérdezz!

## 7. Ismert Problémák

### Upload Tool 404
**Probléma**: `/upload-localstorage-to-drive.html` nem érhető el
**Megoldás**: Várj a Vercel deployment befejezésére (2-3 perc)

### Képek Nem Látszanak
**Probléma**: Diák nem látja a képeket
**Megoldás**: Tanár nem töltötte fel Google Drive-ra - ismételd meg a 2.A.3 lépést

### "Session not found in localStorage"
**Probléma**: Upload tool nem találja a session-t
**Megoldás**: 
- Ellenőrizd a munkamenet kódot
- Lehet, hogy másik gépen hoztad létre
- Próbáld meg ugyanazon a gépen, ahol létrehoztad

## 8. Sikeres Teszt Checklist

- [ ] Vercel deployment befejezve
- [ ] Upload tool elérhető (`/upload-localstorage-to-drive.html`)
- [ ] Tanár létrehozta a munkamenetet
- [ ] Tanár letöltötte a fájlokat
- [ ] Tanár feltöltötte Google Drive-ra
- [ ] Diák (másik gépen) csatlakozott
- [ ] Diák START gombbal betöltötte a feladatokat
- [ ] Diák látja a képeket
- [ ] Console log: "Google Drive image URLs"
- [ ] Supabase egress csökkent

## 9. Deployment URL

Ellenőrizd a Vercel deployment URL-t:
```
https://your-app.vercel.app
```

Ha nem tudod az URL-t, nézd meg:
```
https://vercel.com/dashboard
```

## 10. Gyors Teszt (1 Gép)

Ha nincs 2 géped, teszteld így:

1. **Inkognito/Private Window**
   ```
   - Tanár: Normál ablak
   - Diák: Inkognito ablak
   - Ez szimulálja a 2 különböző gépet
   ```

2. **localStorage Törlés**
   ```javascript
   // Diák ablakban (F12 Console):
   localStorage.clear();
   // Ez szimulálja, hogy másik gépen vagy
   ```

3. **Teszt**
   ```
   - Tanár: Létrehozza a munkamenetet
   - Tanár: Feltölti Google Drive-ra
   - Diák (inkognito): Csatlakozik
   - Diák: START gomb
   - Ellenőrzés: Látja-e a képeket?
   ```

## Kész!

Ha minden működik, akkor a hálózati használat KÉSZ! 🎉
