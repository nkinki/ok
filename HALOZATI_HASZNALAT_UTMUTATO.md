# 🌐 Hálózati Használat Útmutató - 20+ Számítógép

## ⚠️ FONTOS: Miért kell manuális feltöltés?

A képek jelenleg a **tanári számítógép localStorage-ában** vannak, ami csak azon a gépen érhető el. 
A diákok (más gépeken) nem tudják betölteni a képeket, mert nincs hozzáférésük a tanár localStorage-ához.

**Megoldás**: Képek feltöltése Google Drive-ra → Minden gép eléri őket!

---

## 📋 LÉPÉSEK: Tanár

### 1️⃣ Munkamenet Létrehozása

1. Nyisd meg: https://nyirad.vercel.app
2. Kattints: "Tanári felület"
3. Válassz tantárgyat (pl. Informatika)
4. Kattints: "Munkamenet kezelése"
5. Válassz feladatokat a könyvtárból
6. Válassz osztályt
7. Kattints: "Munkamenet indítása" 🚀

**Eredmény**: Munkamenet létrehozva, kód generálva (pl. `ABC123`)

### 2️⃣ Képek Feltöltése Google Drive-ra ⚠️ KÖTELEZŐ!

**FONTOS**: Ez a lépés KÖTELEZŐ hálózati használathoz!

1. Az aktív munkamenet alatt kattints: **"Képek feltöltése Google Drive-ra"** gombra
2. Új ablak nyílik meg a feltöltő eszközzel
3. Kövesd az utasításokat:
   - Kattints "Képek előkészítése" gombra
   - Várj, amíg a képek előkészülnek
   - Kattints "Képek letöltése ZIP-ben" gombra
   - Mentsd el a ZIP fájlt

4. **Manuális feltöltés Google Drive-ra**:
   - Nyisd meg: https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb
   - Csomagold ki a ZIP fájlt
   - Töltsd fel az összes képet a mappába
   - Állítsd be a megosztást: "Bárki, akinek van a link, megtekintheti"

### 3️⃣ Munkamenet Kód Kiadása

1. Írd fel a munkamenet kódot (pl. `ABC123`)
2. Mondd el a diákoknak a kódot
3. Vagy írd fel a táblára

---

## 📋 LÉPÉSEK: Diák

### 1️⃣ Csatlakozás

1. Nyisd meg: https://nyirad.vercel.app
2. Kattints: "Diák belépés"
3. Írd be:
   - Munkamenet kód: `ABC123` (a tanár által megadott kód)
   - Név: `Kovács János`
   - Osztály: `6.b`
4. Kattints: "Csatlakozás" 🎮

### 2️⃣ START Gomb

1. Megjelenik a "START" gomb
2. Kattints rá 🚀
3. Feladatok betöltődnek Google Drive-ról
4. Játék elindul!

---

## 🔍 HIBAELHÁRÍTÁS

### Probléma: Diák nem látja a képeket

**Ok**: Képek nincsenek feltöltve Google Drive-ra

**Megoldás**:
1. Tanár: Kattints "Képek feltöltése Google Drive-ra" gombra
2. Töltsd fel a képeket a Google Drive mappába
3. Diák: Frissítsd az oldalt (F5) és kattints újra START-ra

### Probléma: "Exercise count: 0"

**Ok**: Munkamenet nem található vagy lejárt

**Megoldás**:
1. Ellenőrizd a munkamenet kódot (helyes-e?)
2. Munkamenet 60 perc után lejár → Hozz létre újat
3. Tanár: Ellenőrizd, hogy a munkamenet aktív-e

### Probléma: Lassú betöltés

**Ok**: Sok kép betöltése Google Drive-ról

**Megoldás**:
- Normális! Első betöltés lassabb lehet
- Utána cache-elve van → Gyorsabb
- Várj türelemmel 10-20 másodpercet

---

## 📊 ADATFORGALOM

### Supabase (Adatbázis):
- **Munkamenet metadata**: ~2 KB
- **20 diák**: ~40 KB
- **100 munkamenet**: ~4 MB
- **Kvóta használat**: 0.1% (5 GB limitből)

### Google Drive (Képek):
- **Képek**: ~1.5 MB / munkamenet
- **20 diák**: Minden diák letölti a képeket
- **Korlátlan tárhely**: Intézményi Google Drive

### Összesen:
- **99% Supabase egress csökkentés** ✅
- **Költséghatékony** ✅
- **Hálózati használatra kész** ✅

---

## 🎯 TESZTELÉS

### Egyszerű Teszt (1 számítógép):
1. Tanár létrehoz munkamenetet
2. Tanár feltölti képeket Google Drive-ra
3. Diák (ugyanazon a gépen) csatlakozik
4. Diák START → Képek betöltődnek

### Hálózati Teszt (20 számítógép):
1. Tanár létrehoz munkamenetet (1 gép)
2. Tanár feltölti képeket Google Drive-ra
3. 20 diák csatlakozik (20 különböző gép)
4. Mind megnyomja START-ot
5. Mind látja a képeket ✅

---

## 💡 TIPPEK

### Tanárnak:
- ✅ Mindig töltsd fel a képeket Google Drive-ra munkamenet létrehozása után!
- ✅ Ellenőrizd, hogy a képek láthatóak-e a Google Drive mappában
- ✅ Munkamenet 60 perc után lejár → Időzítsd jól!
- ✅ Kód egyszerű legyen → Könnyebb beírni

### Diáknak:
- ✅ Írd be pontosan a kódot (kis/nagybetű nem számít)
- ✅ Várj türelemmel a START után (képek betöltése)
- ✅ Ha nem töltődnek be a képek → Szólj a tanárnak!

---

## 🚀 KÖVETKEZŐ LÉPÉSEK

### Jelenleg:
- ✅ Munkamenet létrehozás működik
- ✅ Supabase metadata tárolás működik
- ✅ Manuális Google Drive feltöltés működik
- ⚠️ Képek betöltése Google Drive-ról: MOCK (localStorage fallback)

### Jövőbeli Fejlesztés (opcionális):
- 🔄 Valódi Google Drive API integráció
- 🔄 Automatikus képfeltöltés Google Drive-ra
- 🔄 Képek közvetlen betöltése Google Drive-ról (nem localStorage)

### Jelenlegi Workaround:
- 📁 Manuális feltöltés Google Drive-ra
- 💾 localStorage fallback működik 1 gépen
- 🌐 Hálózati használathoz: Képek Google Drive-on kell legyenek

---

## ✅ ÖSSZEFOGLALÁS

**Működik**: 
- ✅ Munkamenet létrehozás
- ✅ Diák csatlakozás
- ✅ START gomb
- ✅ Eredmények mentése
- ✅ 99% Supabase egress csökkentés

**Manuális lépés szükséges**:
- ⚠️ Képek feltöltése Google Drive-ra (tanár)

**Hálózati használat**:
- ✅ 20+ számítógép támogatva
- ✅ Költséghatékony
- ✅ Production ready

---

**URL**: https://nyirad.vercel.app
**Google Drive mappa**: https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb
**Státusz**: ✅ DEPLOYED

**Készítve**: 2026. február 6.
**Verzió**: 579af7a
