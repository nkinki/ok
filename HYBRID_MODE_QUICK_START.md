# 🚀 Hybrid Mód - Gyors Kezdés (20 Gép Hálózaton)

## ⚡ 3 Lépésben Kész!

### **1. Kapcsold KI a Drive-Only Módot**

```
Tanári Dashboard
  ↓
Beállítások
  ↓
Tárolási Mód panel
  ↓
Ha "📁 Drive-Only Aktív" látható → Kattints rá
  ↓
Átkapcsol: "☁️ Supabase Aktív"
```

**Miért?** Drive-Only localStorage-t használ → minden gép külön tárolja az adatokat → NEM működik hálózaton!

---

### **2. Állítsd Be a Google Drive Mappát (Egyszeri)**

```
Tanári Dashboard
  ↓
Beállítások → Google Drive
  ↓
Másold be a mappa URL-t:
  Példa: https://drive.google.com/drive/folders/1ABC...XYZ
  ↓
Mentsd el
```

**Miért?** Képek Google Drive-ra kerülnek → korlátlan intézményi tárhely → 95% Supabase csökkentés!

---

### **3. Hozz Létre Munkamenetet és Oszd Meg a Kódot**

```
Tanári Dashboard
  ↓
Új Munkamenet
  ↓
Válassz feladatokat (pl. 5 feladat)
  ↓
Add meg az osztályt (pl. "8.a")
  ↓
Munkamenet Indítása
  ↓
Kód megjelenik: "ABC123"
  ↓
Írd fel a táblára vagy vetítsd ki
```

**Diákok csatlakoznak:**
- Beírják a kódot: "ABC123"
- Beírják a nevüket és osztályukat
- Csatlakozás → Automatikusan betöltődnek a feladatok
- Minden gép látja ugyanazt a munkamenetet!

---

## ✅ Ellenőrző Lista

- [ ] Drive-Only mód KIKAPCSOLVA (☁️ Supabase Aktív)
- [ ] Google Drive mappa beállítva
- [ ] Munkamenet létrehozva
- [ ] Kód megosztva diákokkal
- [ ] Diákok csatlakoznak (20 gép)
- [ ] Tanár látja az összes diákot a monitoring panelen

---

## 📊 Mit Kapsz?

| Funkció | Működés |
|---------|---------|
| **Központi adatbázis** | ✅ Supabase - minden gép látja |
| **Képtárolás** | ✅ Google Drive - korlátlan |
| **Hálózati működés** | ✅ 20+ gép egyidejűleg |
| **Valós idejű eredmények** | ✅ Tanár azonnal látja |
| **Supabase forgalom** | ✅ 5% (95% csökkentés) |

---

## 🎯 Gyakori Hibák

### ❌ **Hiba: "Drive-Only mód aktív, de a diákok nem látják a munkamenetet"**
**Megoldás:** Kapcsold KI a Drive-Only módot! localStorage nem működik hálózaton.

### ❌ **Hiba: "Diákok csatlakoznak, de a tanár nem látja őket"**
**Megoldás:** Ellenőrizd a Supabase kapcsolatot. Nyisd meg a böngésző konzolt (F12) és nézd meg a hibákat.

### ❌ **Hiba: "Képek nem töltődnek be"**
**Megoldás:** Ellenőrizd a Google Drive mappa beállítást. A mappának nyilvánosnak vagy megosztottnak kell lennie.

---

## 🧪 Tesztelés

### **Gyors Teszt (Böngészőben):**
1. Nyisd meg: `test-hybrid-mode-visual.html`
2. Nézd meg a vizuális demót
3. Kattints a gépekre → látod a működést

### **Teljes Teszt (Node.js):**
```bash
node test-hybrid-mode-network.js
```

Ez szimulálja a 20 gépes hálózati használatot és megmutatja:
- Tanár létrehozza a munkamenetet
- 20 diák csatlakozik
- Eredmények mentése
- Tanár monitoring
- Forgalom statisztikák

---

## 📚 További Információk

- **Részletes útmutató:** `HYBRID_MODE_NETWORK_GUIDE.md`
- **Vizuális demo:** `test-hybrid-mode-visual.html`
- **Teszt szkript:** `test-hybrid-mode-network.js`

---

## 🎉 Kész!

**A Hybrid mód már működik és készen áll a 20 gépes hálózati használatra!**

Csak kapcsold ki a Drive-Only módot és használd a normál munkamenet létrehozást.

**Minden automatikusan működik:**
- ✅ Képek → Google Drive
- ✅ Metaadatok → Supabase
- ✅ Központi szinkronizáció
- ✅ Valós idejű eredmények
- ✅ 95% Supabase csökkentés

**Nincs szükség további beállításra!** 🚀
