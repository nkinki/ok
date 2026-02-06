# 🌐 Hybrid Mód - Hálózati Használat Útmutató

## 🎯 Mi a Hybrid Mód?

A **Hybrid mód** kombinálja a Supabase adatbázist és a Google Drive-ot:
- **Supabase:** Munkamenet metaadatok, résztvevők, eredmények (központi szinkronizáció)
- **Google Drive:** Képek (korlátlan intézményi tárhely)

### ✅ Előnyök 20 Gép Hálózaton:

| Funkció | Működés |
|---------|---------|
| **Központi adatbázis** | Minden gép ugyanazt az adatbázist látja |
| **Valós idejű szinkronizáció** | Tanár látja a diákok eredményeit azonnal |
| **95% Supabase csökkentés** | Képek Google Drive-on, nem adatbázisban |
| **Korlátlan képtárhely** | Intézményi Google Drive (TB-ok) |
| **Hálózati működés** | 20+ gép egyidejűleg problémamentesen |

---

## 🚀 Lépésről Lépésre - Tanári Oldal

### **1. Lépés: Ellenőrizd a Módot**

```
Tanári Dashboard → Beállítások
  ↓
Tárolási Mód panel
  ↓
Ellenőrizd: "☁️ Supabase Aktív" (NEM "📁 Drive-Only Aktív")
  ↓
Ha Drive-Only aktív → Kattints rá → Átkapcsol Supabase módra
```

### **2. Lépés: Google Drive Beállítás (Egyszeri)**

```
Tanári Dashboard → Beállítások → Google Drive
  ↓
Másold be a Google Drive mappa URL-t:
  - Példa: https://drive.google.com/drive/folders/1ABC...XYZ
  ↓
Mentsd el
  ↓
Rendszer automatikusan használja képek tárolására
```

### **3. Lépés: Munkamenet Létrehozás**

```
Tanári Dashboard → Új Munkamenet
  ↓
Válassz feladatokat a könyvtárból
  - Példa: 5 feladat kiválasztva
  ↓
Add meg az osztály nevét
  - Példa: "8.a"
  ↓
Kattints: "Munkamenet Indítása"
  ↓
Rendszer automatikusan:
  1. Képeket feltölti Google Drive-ra (ha van)
  2. Metaadatokat menti Supabase-be
  3. Generál egy 6 karakteres kódot
  ↓
Megjelenik a kód: Pl. "ABC123"
```

### **4. Lépés: Kód Megosztása Diákokkal**

```
Tanár megosztja a kódot:
  - Írja fel a táblára: "ABC123"
  - Vagy kivetíti a képernyőt
  ↓
Diákok látják a kódot minden gépről
```

---

## 👨‍🎓 Lépésről Lépésre - Diák Oldal

### **1. Lépés: Csatlakozás**

```
Diák gép (bármelyik a 20-ból)
  ↓
Megnyitja az alkalmazást
  ↓
Diák bejelentkezés
  ↓
Beírja a kódot: "ABC123"
  ↓
Beírja a nevét: "Kovács János"
  ↓
Beírja az osztályát: "8.a"
  ↓
Kattints: "Csatlakozás"
```

### **2. Lépés: Automatikus Betöltés**

```
Rendszer automatikusan:
  ↓
1. Ellenőrzi a kódot Supabase-ben (központi!)
  ↓
2. Letölti a munkamenet metaadatait
  ↓
3. Betölti a képeket Google Drive-ról
  ↓
4. Regisztrálja a diákot a résztvevők közé
  ↓
Diák látja a feladatokat és kezdheti a megoldást
```

### **3. Lépés: Feladatok Megoldása**

```
Diák megoldja a feladatokat
  ↓
Minden válasz után:
  - Eredmény mentése Supabase-be (központi!)
  - Tanár azonnal látja az előrehaladást
  ↓
Befejezés után:
  - Teljes eredmény mentése
  - Százalék számítás
  - Rangsor frissítés
```

---

## 📊 Adatfolyam Diagram

### **Munkamenet Létrehozás:**

```
Tanár Gép
    ↓
    ├─→ Képek → Google Drive (korlátlan tárhely)
    │   └─→ URL-ek visszakapása
    │
    └─→ Metaadatok + Kép URL-ek → Supabase (központi DB)
        └─→ Munkamenet kód generálás: "ABC123"
```

### **Diák Csatlakozás (20 gép egyidejűleg):**

```
Diák Gép #1                    Diák Gép #2                    Diák Gép #20
    ↓                              ↓                              ↓
    Kód: "ABC123"                  Kód: "ABC123"                  Kód: "ABC123"
    ↓                              ↓                              ↓
    ├─→ Supabase (központi) ←──────┼──────────────────────────────┤
    │   - Munkamenet ellenőrzés    │                              │
    │   - Résztvevő regisztráció   │                              │
    │                               │                              │
    └─→ Google Drive ←──────────────┼──────────────────────────────┤
        - Képek letöltése           │                              │
                                    │                              │
Minden gép látja ugyanazt az adatbázist!
```

### **Eredmények Mentése:**

```
Diák Gép #1                    Diák Gép #2                    Diák Gép #20
    ↓                              ↓                              ↓
    Válasz beküldése               Válasz beküldése               Válasz beküldése
    ↓                              ↓                              ↓
    └─→ Supabase (központi) ←──────┼──────────────────────────────┤
        - Eredmény mentése         │                              │
        - Százalék számítás        │                              │
        - Rangsor frissítés        │                              │
                                   ↓                              ↓
                            Tanár Gép
                                   ↓
                            Valós idejű monitoring
                            - Látja mind a 20 diák eredményét
                            - Rangsor frissül automatikusan
```

---

## 🔍 Technikai Részletek

### **Supabase Forgalom Optimalizáció:**

| Adat Típus | Tárolás | Méret | Forgalom |
|-----------|---------|-------|----------|
| **Képek** | Google Drive | ~500 KB/kép | 0% Supabase |
| **Metaadatok** | Supabase | ~5 KB/munkamenet | 5% Supabase |
| **Eredmények** | Supabase | ~2 KB/diák | 5% Supabase |

**Példa számítás 100 munkamenetre:**
- **Régi módszer (csak Supabase):**
  - 100 munkamenet × 5 feladat × 500 KB = 250 GB
  - **Költség:** Túllépés (196%)
  
- **Hybrid mód (Supabase + Google Drive):**
  - Képek: 100 × 5 × 500 KB = 250 GB → **Google Drive (ingyenes)**
  - Metaadatok: 100 × 5 KB = 500 KB → **Supabase (minimális)**
  - **Költség:** 5% használat (95% csökkentés)

### **Hálózati Működés:**

```javascript
// Minden gép ugyanazt a Supabase adatbázist használja
const supabase = createClient(
  'https://your-project.supabase.co',  // Központi URL
  'your-anon-key'                       // Közös kulcs
);

// Tanár létrehozza a munkamenetet
await supabase.from('teacher_sessions').insert({
  session_code: 'ABC123',
  exercises: [...],  // Metaadatok + Google Drive URL-ek
  is_active: true
});

// Diák #1 csatlakozik (Gép #1)
await supabase.from('session_participants').insert({
  session_code: 'ABC123',
  student_name: 'Kovács János'
});

// Diák #2 csatlakozik (Gép #2)
await supabase.from('session_participants').insert({
  session_code: 'ABC123',
  student_name: 'Nagy Péter'
});

// Tanár látja mindkét diákot
const { data } = await supabase
  .from('session_participants')
  .select('*')
  .eq('session_code', 'ABC123');
// → [{ name: 'Kovács János' }, { name: 'Nagy Péter' }]
```

---

## ✅ Ellenőrző Lista

### **Tanár Oldal:**
- [ ] Supabase mód aktív (NEM Drive-Only)
- [ ] Google Drive mappa beállítva
- [ ] Munkamenet létrehozva
- [ ] Kód megosztva diákokkal
- [ ] Monitoring panel nyitva

### **Diák Oldal (minden gép):**
- [ ] Alkalmazás megnyitva
- [ ] Kód beírva
- [ ] Név és osztály megadva
- [ ] Csatlakozás sikeres
- [ ] Feladatok láthatók

### **Rendszer Ellenőrzés:**
- [ ] Supabase kapcsolat működik
- [ ] Google Drive elérhető
- [ ] Minden diák látható a monitoring panelen
- [ ] Eredmények mentődnek
- [ ] Rangsor frissül

---

## 🎯 Gyakori Kérdések

### **Q: Mi történik, ha egy diák elveszti a kapcsolatot?**
A: A rendszer automatikusan újracsatlakozik. Az eredmények mentve maradnak Supabase-ben.

### **Q: Látják egymást a diákok?**
A: Nem, csak a tanár látja az összes diákot. Diákok csak a saját eredményüket látják.

### **Q: Mi van, ha 2 diák ugyanazt a nevet írja be?**
A: A rendszer egyedi ID-t generál minden diáknak, így nincs ütközés.

### **Q: Mennyi ideig él egy munkamenet?**
A: 60 perc. Ezután automatikusan lejár, de az eredmények megmaradnak.

### **Q: Lehet több munkamenetet párhuzamosan futtatni?**
A: Igen! Minden munkamenet egyedi kóddal rendelkezik.

### **Q: Mi történik, ha elfogyott a Supabase kvóta?**
A: A Hybrid mód 95%-kal csökkenti a forgalmat, így ez nem valószínű. Ha mégis, átkapcsolhatsz Drive-Only módra (de csak 1 gépre!).

---

## 🚀 Következő Lépések

1. **Kapcsold ki a Drive-Only módot** (ha aktív)
2. **Állítsd be a Google Drive mappát** (egyszeri)
3. **Hozz létre egy teszt munkamenetet** 2-3 feladattal
4. **Csatlakozz diákként** egy másik böngészőből/gépről
5. **Ellenőrizd a monitoring panelt** - látod a diákot?
6. **Oldd meg a feladatokat** - frissül az eredmény?

Ha minden működik → **Készen állsz a 20 gépes hálózati használatra!**

---

## 📞 Támogatás

Ha bármilyen problémád van:
1. Ellenőrizd a böngésző konzolt (F12)
2. Nézd meg a Supabase kapcsolatot
3. Teszteld a Google Drive elérést
4. Futtasd a teszt szkriptet (lásd alább)

**A Hybrid mód már működik és készen áll a használatra!** 🎉
