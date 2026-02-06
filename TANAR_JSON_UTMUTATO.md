# 👨‍🏫 Tanári Útmutató - JSON Munkamenet Workflow

## 🎯 Mi ez?

Ez a **legegyszerűbb módja** annak, hogy a diákjaid hozzáférjenek a feladatokhoz:
- ✅ Nincs bonyolult beállítás
- ✅ Nincs API kulcs
- ✅ Működik offline is
- ✅ Működik hálózaton is (20 gép egyidejűleg)

---

## 📋 Lépések (5 perc)

### 1. Munkamenet Létrehozása

1. **Nyisd meg a Tanári Dashboard-ot**
2. **Kattints "Munkamenet Indítása"**
3. **Válaszd ki a feladatokat** (max 10-15 ajánlott)
4. **Kattints "Indítás"**
5. **Jegyezd fel a munkamenet kódot** (pl. `UK1S5P`)

### 2. JSON Fájl Letöltése

1. **Kattints a "📤 Google Drive Feltöltés" gombra**
   - Új ablak nyílik meg
2. **Írd be a munkamenet kódot** (pl. `UK1S5P`)
3. **Kattints "📤 Upload to Drive"**
4. **Letöltődik a fájl:**
   - `session_UK1S5P.json` ← **EZ KELL!**
   - Képek is letöltődnek (opcionális)

### 3. Feltöltés Google Drive-ra

1. **Nyisd meg a Google Drive mappádat**
   - Vagy használd ezt: [Megosztott mappa](https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb)
2. **Húzd be a `session_UK1S5P.json` fájlt**
3. **Várj, amíg feltöltődik** (1-2 perc)
4. **Oszd meg a mappát a diákokkal** (olvasási jog)

### 4. Diákoknak Közöld

Mondd el a diákoknak:

> "Nyissátok meg a Google Drive mappát, keressétek meg a `session_UK1S5P.json` fájlt, és töltsétek be a Diák bejelentkezés oldalon a **'JSON fájl betöltése'** gombbal!"

---

## 👨‍🎓 Diák Lépések (30 másodperc)

1. **Nyisd meg az oldalt**: https://okos-gyakorlo.vercel.app
2. **Kattints "Diák Bejelentkezés"**
3. **Kattints "JSON fájl betöltése"** (zöld gomb)
4. **Tallózd be a Google Drive mappát**
5. **Válaszd ki a `session_UK1S5P.json` fájlt**
6. **Add meg a neved és osztályodat**
7. **START!** 🚀

---

## 💡 Tippek

### Hálózati Használat (20 gép)

Ha hálózaton használod:
1. **Oszd meg a Google Drive mappát** a hálózaton
2. **Diákok tallózhatják** a megosztott mappát
3. **Mindenki betölti ugyanazt a JSON-t**
4. **Nincs szükség internet kapcsolatra** (csak a mappa eléréséhez)

### Offline Használat

Ha nincs internet:
1. **Töltsd le a JSON fájlt** USB-re
2. **Másold át a diákok gépére**
3. **Diákok betöltik lokálisan**
4. **Teljesen offline működik**

### Több Munkamenet

Ha több munkamenetet akarsz:
1. **Hozz létre több munkamenetet** (különböző kódokkal)
2. **Töltsd le mindegyiket** (külön JSON fájlok)
3. **Töltsd fel mindegyiket** a Drive-ra
4. **Diákok választhatnak**, melyiket töltik be

---

## 🔧 Hibaelhárítás

### "Hibás fájlformátum" hiba

**Mit csinálj:**
1. Ellenőrizd, hogy `.json` kiterjesztésű-e a fájl
2. Töltsd le újra az upload tool-lal
3. Ne szerkeszd kézzel a JSON-t

### "Nincs érvényes feladat" hiba

**Mit csinálj:**
1. Hozd létre újra a munkamenetet
2. Ellenőrizd, hogy van-e feladat a könyvtárban
3. Használd a BulkProcessor-t képek feltöltéséhez

### Képek nem jelennek meg

**Mit csinálj:**
1. Ellenőrizd, hogy a feladatokhoz van-e kép
2. Hozd létre újra a munkamenetet
3. Töltsd le újra a JSON-t

### Lassú betöltés

**Mit csinálj:**
1. Csökkentsd a feladatok számát (max 10-15)
2. Optimalizáld a képeket (max 500 KB / kép)
3. Használj gyorsabb hálózatot

---

## 📊 Statisztikák

### Fájl Méretek

- **1 feladat**: ~100-200 KB
- **5 feladat**: ~500 KB - 1 MB
- **10 feladat**: ~1-2 MB
- **15 feladat**: ~2-3 MB

**Ajánlás:** Max 10-15 feladat / munkamenet

### Időigény

- **Munkamenet létrehozása**: 2-3 perc
- **JSON letöltése**: 30 másodperc
- **Feltöltés Drive-ra**: 1-2 perc
- **Diák betöltés**: 30 másodperc
- **Teljes folyamat**: ~5 perc

---

## ✅ Előnyök

### Neked (Tanár):
- ✅ **Egyszerű**: Csak 3 lépés
- ✅ **Gyors**: 5 perc alatt kész
- ✅ **Megbízható**: Nincs hálózati függőség
- ✅ **Kontroll**: Te döntöd el, mit osztasz meg

### Diákoknak:
- ✅ **Egyszerű**: Csak tallózás + betöltés
- ✅ **Gyors**: 30 másodperc alatt kész
- ✅ **Offline**: Működik internet nélkül is
- ✅ **Hálózat**: Működik 20+ gépen egyidejűleg

### Rendszernek:
- ✅ **Nincs költség**: 0% Supabase egress
- ✅ **Nincs API**: Nincs Google Drive API használat
- ✅ **Skálázható**: Korlátlan diák
- ✅ **Megbízható**: Nincs szerver függőség

---

## 🎓 Példa Workflow

### Reggel 8:00 - Óra Előtt

1. **Létrehozod a munkamenetet**: `UK1S5P`
2. **Letöltöd a JSON-t**: `session_UK1S5P.json`
3. **Feltöltöd a Drive-ra**: 2 perc
4. **Megosztod a diákokkal**: Link vagy hálózat

### Óra Kezdete 8:15

1. **Diákok bejelentkeznek**
2. **Betöltik a JSON-t**: 30 másodperc
3. **Megadják a nevüket**: 10 másodperc
4. **Kezdik a feladatokat**: 8:16

### Óra Vége 9:00

1. **Diákok befejezik**
2. **Eredmények megjelennek**
3. **Ranglista megtekintése**
4. **Letöltés TXT/CSV formátumban**

---

## 📞 Kérdések?

Ha bármilyen kérdésed van:
1. Olvasd el ezt az útmutatót
2. Próbáld ki a `test-json-import.html` tool-t
3. Ellenőrizd a JSON fájl formátumát
4. Nézd meg a `GOOGLE_DRIVE_SIMPLE_JSON_WORKFLOW.md` fájlt

**Sikeres tanítást!** 🎓✨

---

## 🔗 Hasznos Linkek

- **Alkalmazás**: https://okos-gyakorlo.vercel.app
- **Upload Tool**: https://okos-gyakorlo.vercel.app/upload-localstorage-to-drive.html
- **JSON Teszt**: Nyisd meg a `test-json-import.html` fájlt
- **Részletes Útmutató**: `GOOGLE_DRIVE_SIMPLE_JSON_WORKFLOW.md`

---

## 📝 Gyors Referencia

```
TANÁR WORKFLOW:
1. Munkamenet létrehozása → Kód: UK1S5P
2. JSON letöltése → session_UK1S5P.json
3. Feltöltés Drive-ra → 2 perc
4. Megosztás diákokkal → Link/Hálózat

DIÁK WORKFLOW:
1. Bejelentkezés → Diák mód
2. JSON betöltése → Tallózás
3. Név + Osztály → Prompt
4. START → Feladatok
```

**Ennyi!** 🎉
