# 👨‍🏫 GOOGLE DRIVE MUNKAMENET ÚTMUTATÓ - TANÁROKNAK

## 🎯 Mi változott?

**RÉGI:** Supabase adatbázis → Sok adat, költséges  
**ÚJ:** Google Drive mappa → Egyszerű, ingyenes, gyors!

---

## 📁 GOOGLE DRIVE MAPPA

**Link:** https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6

**Mit tegyél:**
1. Nyisd meg ezt a mappát
2. Adj hozzáférést a diákoknak (olvasási jog)
3. Ide töltsd fel a munkamenet JSON fájlokat

---

## 🚀 MUNKAMENET LÉTREHOZÁSA (3 perc)

### 1️⃣ Feladatok kiválasztása

1. Nyisd meg a **Tanári Dashboard-ot**
2. Menj a **"Munkamenet"** fülre
3. **Válaszd ki a feladatokat** a könyvtárból (max 10-15 ajánlott)
4. **Válaszd ki az osztályt** (pl. 8.a)

### 2️⃣ Munkamenet indítása

1. Kattints **"Munkamenet indítása"**
2. **Jegyezd fel a kódot** (pl. ABC123)
3. **Automatikusan letöltődik** a JSON fájl:
   - `munkamenet_ABC123_2026-02-09.json`

### 3️⃣ Feltöltés Google Drive-ra

**Opció A: Manuális feltöltés**
1. Nyisd meg a Google Drive mappát
2. Húzd be a letöltött JSON fájlt
3. Várj, amíg feltöltődik (1-2 perc)

**Opció B: Automatikus feltöltés (ha be van állítva)**
1. Kattints a **"Képek feltöltése Google Drive-ra"** gombra
2. A JSON automatikusan feltöltődik

### 4️⃣ Diákoknak közöld

Mondd el a diákoknak:

> "Nyissátok meg a Google Drive mappát, keressétek meg a `munkamenet_ABC123_2026-02-09.json` fájlt, töltsétek le, és töltsétek be a Diák bejelentkezés oldalon!"

**VAGY egyszerűbben:**

> "Kattintsatok a '📁 Drive mappa megnyitása' gombra, töltsétek le a JSON fájlt, és töltsétek be!"

---

## 📊 ELŐNYÖK

### ✅ Tanárnak:
- **Egyszerű:** Csak 3 lépés
- **Gyors:** 3 perc alatt kész
- **Ingyenes:** Nincs Supabase költség
- **Kontroll:** Te döntöd el, mit osztasz meg
- **Hálózat:** Működik 20+ gépen egyidejűleg

### ✅ Diákoknak:
- **Egyszerű:** Drive → Letöltés → Betöltés
- **Gyors:** 2 perc alatt kész
- **Offline:** Működik internet nélkül is
- **Megbízható:** Nincs szerver függőség

### ✅ Rendszernek:
- **0% Supabase egress:** Képek a JSON-ban
- **0% API költség:** Nincs szerver hívás
- **Skálázható:** Korlátlan diák
- **Megbízható:** Google Drive infrastruktúra

---

## 🌐 HÁLÓZATI HASZNÁLAT (20 gép)

### Előkészítés:

1. **Hozz létre munkamenetet** (ABC123)
2. **Töltsd fel a JSON-t** a Google Drive mappába
3. **Oszd meg a mappa linkjét** a diákokkal

### Diákok (minden gépen):

1. **Megnyitják** a Google Drive mappát
2. **Letöltik** a JSON fájlt
3. **Betöltik** a JSON-t a diák felületen
4. **Megoldják** a feladatokat

**Előny:** Minden diák ugyanazt a munkamenetet tölti be, de külön dolgozik!

---

## 💾 OFFLINE HASZNÁLAT

### Ha nincs internet a teremben:

1. **Előkészítés (internettel):**
   - Hozz létre munkamenetet
   - Töltsd le a JSON fájlt
   - Másold át USB-re vagy hálózati meghajtóra

2. **Használat (internet nélkül):**
   - Másold át a JSON fájlt minden gépre
   - Diákok betöltik lokálisan
   - Teljesen offline működik!

---

## 📋 MUNKAMENET KEZELÉS

### Aktív munkamenet

Amikor létrehozol egy munkamenetet:
- **Kód:** ABC123 (6 karakter)
- **Lejárat:** 60 perc (automatikus)
- **JSON fájl:** Automatikusan letöltődik
- **Státusz:** Aktív

### Munkamenet figyelése

1. Kattints **"Munkamenet figyelése"**
2. Látod:
   - Csatlakozott diákok száma
   - Aktuális feladat
   - Pontszámok
   - Ranglista

### Munkamenet leállítása

1. Kattints **"Munkamenet leállítása"**
2. Diákok már nem csatlakozhatnak
3. Eredmények mentve maradnak

---

## 🔧 GOOGLE DRIVE BEÁLLÍTÁS

### Első használat:

1. **Nyisd meg a mappát:**
   ```
   https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
   ```

2. **Adj hozzáférést a diákoknak:**
   - Jobb klikk a mappán → "Megosztás"
   - Add meg a diákok email címét
   - VAGY: "Bárki, akinek megvan a link" → "Megtekintő"

3. **Oszd meg a linket:**
   - Másold ki a link-et
   - Küldd el a diákoknak (email, Teams, stb.)
   - VAGY: Mondd meg nekik, hogy kattintsanak a "📁 Drive mappa megnyitása" gombra

---

## 📊 FÁJL MÉRETEK ÉS LIMITEK

### Fájl méretek:

| Feladatok száma | JSON méret | Feltöltési idő |
|-----------------|------------|----------------|
| 1-3 feladat     | 500 KB - 1 MB | 10-20 mp |
| 4-7 feladat     | 1-2 MB | 20-30 mp |
| 8-10 feladat    | 2-3 MB | 30-60 mp |
| 11-15 feladat   | 3-5 MB | 1-2 perc |

**Ajánlás:** Max 10-15 feladat / munkamenet

### Google Drive limitek:

- **Tárhely:** 15 GB ingyenes
- **Fájl méret:** Max 5 TB / fájl
- **Letöltés:** Korlátlan
- **Megosztás:** Korlátlan felhasználó

**Következtetés:** Bőven elég! 🎉

---

## 🆘 HIBAELHÁRÍTÁS

### ❌ "JSON fájl nem töltődik le"

**Megoldás:**
1. Ellenőrizd a böngésző letöltési mappáját
2. Engedélyezd a letöltéseket a böngészőben
3. Próbáld újra létrehozni a munkamenetet

### ❌ "Diákok nem látják a fájlt a Drive-on"

**Megoldás:**
1. Ellenőrizd a mappa megosztási beállításait
2. Adj "Megtekintő" jogot a diákoknak
3. Oszd meg újra a linket

### ❌ "Képek nem jelennek meg a diákoknál"

**Megoldás:**
1. Hozz létre **ÚJ** munkamenetet (ne régi munkamenetet használj!)
2. Ellenőrizd, hogy a JSON fájl 1-5 MB méretű (nem 10-50 KB!)
3. Töltsd le újra a JSON-t és oszd meg

### ❌ "Lassú feltöltés"

**Megoldás:**
1. Csökkentsd a feladatok számát (max 10-15)
2. Optimalizáld a képeket (max 500 KB / kép)
3. Használj gyorsabb internet kapcsolatot

---

## 📞 GYORS REFERENCIA

```
TANÁR WORKFLOW:
1. Feladatok kiválasztása → Könyvtár
2. Munkamenet indítása → Kód: ABC123
3. JSON letöltése → Automatikus
4. Feltöltés Drive-ra → Húzd be a fájlt
5. Link megosztása → Diákoknak

DIÁK WORKFLOW:
1. Drive mappa megnyitása → Link vagy gomb
2. JSON letöltése → Jobb klikk → Letöltés
3. JSON betöltése → Diák felület
4. Név + Osztály → Prompt
5. START → Feladatok
```

---

## ✅ ELLENŐRZŐ LISTA

- [ ] Google Drive mappa megnyitva
- [ ] Mappa megosztva a diákokkal
- [ ] Munkamenet létrehozva (kód felírva)
- [ ] JSON fájl letöltve
- [ ] JSON fájl feltöltve a Drive-ra
- [ ] Link megosztva a diákokkal
- [ ] Diákok tudják letölteni a fájlt
- [ ] Diákok tudják betölteni a JSON-t
- [ ] Feladatok működnek

---

## 🎓 PÉLDA WORKFLOW

### Reggel 8:00 - Óra Előtt

1. **Létrehozod a munkamenetet:** ABC123
2. **Letöltöd a JSON-t:** `munkamenet_ABC123_2026-02-09.json`
3. **Feltöltöd a Drive-ra:** 1-2 perc
4. **Megosztod a linket:** Email vagy Teams

### Óra Kezdete 8:15

1. **Diákok bejelentkeznek**
2. **Megnyitják a Drive mappát:** Gomb vagy link
3. **Letöltik a JSON-t:** 30 másodperc
4. **Betöltik a JSON-t:** 30 másodperc
5. **Kezdik a feladatokat:** 8:16

### Óra Vége 9:00

1. **Diákok befejezik**
2. **Eredmények megjelennek**
3. **Ranglista megtekintése**
4. **Letöltés TXT/CSV formátumban**

---

## 🔗 HASZNOS LINKEK

- **Google Drive mappa:** https://drive.google.com/drive/folders/1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6
- **Alkalmazás:** https://okos-gyakorlo.vercel.app
- **Diák útmutató:** `GOOGLE_DRIVE_DIAK_UTMUTATO.md`

---

**Készítette:** Kiro AI  
**Utolsó frissítés:** 2026-02-09  
**Verzió:** 1.0.0

**Sikeres tanítást!** 🎓✨
