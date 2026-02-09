# 📊 SUPABASE ADATHASZNÁLAT RIPORT

**Dátum:** 2026-02-09  
**Elemzett munkamenetek:** Utolsó 2 munkamenet

---

## 📈 MUNKAMENET RÉSZLETEK

### 🎯 Munkamenet #1
- **Session Code:** J3EFXI
- **Létrehozva:** 2026. 02. 09. 10:25:48
- **Lejár:** 2026. 02. 09. 11:25:47
- **Státusz:** ✅ Aktív
- **Feladatok száma:** 2
- **Résztvevők száma:** 2

**Adatméret:**
- Session rekord: **2.1 MB**
- Résztvevők: **2.04 KB**
- Eredmények: **1.33 KB**
- Feladatok: **1.05 MB**
- **ÖSSZESEN: 2.1 MB**

---

### 🎯 Munkamenet #2
- **Session Code:** ODLGGX
- **Létrehozva:** 2026. 02. 09. 10:11:37
- **Lejár:** 2026. 02. 09. 11:11:36
- **Státusz:** ✅ Aktív
- **Feladatok száma:** 5
- **Résztvevők száma:** 2

**Adatméret:**
- Session rekord: **5.31 MB**
- Résztvevők: **2.84 KB**
- Eredmények: **2.13 KB**
- Feladatok: **2.66 MB**
- **ÖSSZESEN: 5.32 MB**

---

## 💾 ÖSSZESÍTÉS

| Metrika | Érték |
|---------|-------|
| **Utolsó 2 munkamenet összes adata** | **7.42 MB** |
| **Átlagos munkamenet méret** | **3.71 MB** |
| **Átlagos feladat/munkamenet** | 3.5 feladat |
| **Átlagos résztvevő/munkamenet** | 2 fő |

---

## 🔮 BECSÜLT HAVI HASZNÁLAT

### Forgatókönyv: 30 munkamenet/hó

| Kategória | Becsült használat |
|-----------|-------------------|
| **Adattárolás** | **111.25 MB** |
| **Egress (letöltés)** | **222.5 MB** |
| **API kérések** | ~15,000 kérés |

---

## 📋 SUPABASE FREE TIER LIMITEK

| Limit | Érték | Használat (becsült) | Státusz |
|-------|-------|---------------------|---------|
| **Adatbázis méret** | 500 MB | 111.25 MB (22%) | ✅ Bőven elég |
| **Egress (letöltés)** | 5 GB/hó | 222.5 MB (4.5%) | ✅ Bőven elég |
| **API kérések** | 500,000/hó | ~15,000 (3%) | ✅ Bőven elég |

---

## 🎯 KÖVETKEZTETÉSEK

### ✅ Pozitívumok
1. **Alacsony adathasználat:** Az átlagos munkamenet csak 3.71 MB
2. **Bőven a limiten belül:** Még 30 munkamenet/hó esetén is csak 22%-ot használunk
3. **Skálázható:** Akár 100+ munkamenet/hó is belefér a free tier-be

### ⚠️ Figyelendő
1. **Feladatok mérete:** A feladatok (exercises) teszik ki a méret nagy részét
2. **Képek:** Ha BASE64 képeket tárolsz, azok növelik a méretet
3. **Lejárat:** A munkamenetek 24 óra után lejárnak, de nem törlődnek automatikusan

---

## 💡 OPTIMALIZÁLÁSI JAVASLATOK

### 1. Automatikus törlés
```sql
-- Töröld a 7 napnál régebbi munkameneteket
DELETE FROM teacher_sessions 
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### 2. Képek optimalizálása
- **Google Drive használata:** Képek tárolása Drive-on, csak URL-t tárolni DB-ben
- **Képtömörítés:** BASE64 képek tömörítése mentés előtt
- **Lazy loading:** Képek csak szükség esetén töltődjenek le

### 3. Adatbázis karbantartás
```sql
-- Inaktív munkamenetek törlése
DELETE FROM teacher_sessions 
WHERE is_active = false AND created_at < NOW() - INTERVAL '30 days';

-- Résztvevők törlése régi munkamenetekből
DELETE FROM session_participants 
WHERE session_id IN (
  SELECT id FROM teacher_sessions 
  WHERE expires_at < NOW() - INTERVAL '7 days'
);
```

---

## 📊 RÉSZLETES ADATMEGOSZLÁS

### Munkamenet #1 (2.1 MB)
```
Session rekord:  2.1 MB  (99.9%)
├─ Feladatok:    1.05 MB (50%)
├─ Metadata:     1.05 MB (50%)
└─ Résztvevők:   2.04 KB (0.1%)
   └─ Eredmények: 1.33 KB
```

### Munkamenet #2 (5.32 MB)
```
Session rekord:  5.31 MB (99.9%)
├─ Feladatok:    2.66 MB (50%)
├─ Metadata:     2.65 MB (50%)
└─ Résztvevők:   2.84 KB (0.1%)
   └─ Eredmények: 2.13 KB
```

---

## 🚀 KÖVETKEZŐ LÉPÉSEK

1. **Monitoring beállítása:**
   - Heti riport futtatása: `node check-last-sessions-data.js`
   - Supabase dashboard ellenőrzése

2. **Automatikus cleanup:**
   - Cron job beállítása régi munkamenetek törlésére
   - Vagy manuális törlés havonta

3. **Képkezelés optimalizálása:**
   - Google Drive integráció használata
   - BASE64 képek helyett URL-ek tárolása

---

**Készítette:** Kiro AI  
**Utolsó frissítés:** 2026-02-09  
**Script:** `check-last-sessions-data.js`
