# 🔧 ADATBÁZIS KARBANTARTÁS

## 📊 Adathasználat Ellenőrzése

### Utolsó munkamenetek elemzése
```bash
node check-last-sessions-data.js
```

**Mit mutat:**
- Utolsó 2 munkamenet részletes adatai
- Méret megoszlás (session, résztvevők, eredmények)
- Becsült havi használat
- Supabase free tier limitek

**Kimenet:**
- Konzol riport
- Részletes elemzés a `SUPABASE_ADATHASZNALAT_RIPORT.md` fájlban

---

## 🧹 Régi Munkamenetek Törlése

### Automatikus cleanup
```bash
node cleanup-old-sessions.js
```

**Mit csinál:**
- Megkeresi a 7 napnál régebben lejárt munkameneteket
- Törli a résztvevőket
- Törli a munkameneteket
- Részletes riportot ad

**Mikor futtasd:**
- Hetente egyszer
- Vagy amikor az adatbázis méret közelít a limithez

---

## 📋 MANUÁLIS SQL PARANCSOK

### 1. Régi munkamenetek törlése (7 nap)
```sql
-- Résztvevők törlése először
DELETE FROM session_participants 
WHERE session_id IN (
  SELECT id FROM teacher_sessions 
  WHERE expires_at < NOW() - INTERVAL '7 days'
);

-- Munkamenetek törlése
DELETE FROM teacher_sessions 
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### 2. Inaktív munkamenetek törlése (30 nap)
```sql
DELETE FROM teacher_sessions 
WHERE is_active = false 
  AND created_at < NOW() - INTERVAL '30 days';
```

### 3. Adatbázis méret ellenőrzése
```sql
-- Táblák mérete
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Összes adatbázis méret
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### 4. Munkamenetek statisztikája
```sql
-- Munkamenetek száma státusz szerint
SELECT 
  is_active,
  COUNT(*) as count,
  pg_size_pretty(SUM(pg_column_size(exercises))) as exercises_size
FROM teacher_sessions
GROUP BY is_active;

-- Lejárt munkamenetek
SELECT 
  COUNT(*) as expired_count,
  MIN(expires_at) as oldest_expiry,
  MAX(expires_at) as newest_expiry
FROM teacher_sessions
WHERE expires_at < NOW();
```

---

## 🔄 AUTOMATIZÁLÁS

### Windows Task Scheduler

1. **Hozz létre egy batch fájlt:** `cleanup-weekly.bat`
```batch
@echo off
cd C:\Users\Teacher\okos\okos
node cleanup-old-sessions.js >> cleanup-log.txt 2>&1
```

2. **Task Scheduler beállítása:**
   - Nyisd meg: Task Scheduler
   - Create Basic Task
   - Név: "Okos Gyakorló - Weekly Cleanup"
   - Trigger: Weekly (vasárnap éjjel 2:00)
   - Action: Start a program
   - Program: `C:\Users\Teacher\okos\okos\cleanup-weekly.bat`

### Linux/Mac Cron Job

```bash
# Crontab szerkesztése
crontab -e

# Heti cleanup (vasárnap 2:00)
0 2 * * 0 cd /path/to/okos && node cleanup-old-sessions.js >> cleanup-log.txt 2>&1
```

---

## 📈 MONITORING

### Heti ellenőrzés
```bash
# Futtasd minden héten
node check-last-sessions-data.js > weekly-report-$(date +%Y-%m-%d).txt
```

### Supabase Dashboard
1. Nyisd meg: https://supabase.com/dashboard
2. Válaszd ki a projektet
3. Settings → Database → Database size
4. Ellenőrizd:
   - Database size (max 500 MB)
   - Egress (max 5 GB/hó)
   - API requests (max 500k/hó)

---

## ⚠️ FIGYELMEZTETÉSEK

### Mikor aggódj:
- ❌ Database size > 400 MB (80%)
- ❌ Egress > 4 GB/hó (80%)
- ❌ API requests > 400k/hó (80%)

### Mit tegyél:
1. **Futtasd a cleanup scriptet**
2. **Ellenőrizd a képméreteket** (BASE64 vs URL)
3. **Optimalizáld a feladatokat** (tömörítés)
4. **Fontold meg a Google Drive használatát** képekhez

---

## 💡 OPTIMALIZÁLÁSI TIPPEK

### 1. Képek kezelése
```javascript
// Rossz: BASE64 képek a DB-ben
exercises: [
  {
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // 2 MB!
  }
]

// Jó: Google Drive URL
exercises: [
  {
    image: "https://drive.google.com/uc?id=..." // 100 bytes
  }
]
```

### 2. Feladatok tömörítése
```javascript
// Mentés előtt
const compressed = JSON.stringify(exercises);
// Betöltés után
const exercises = JSON.parse(compressed);
```

### 3. Lazy loading
```javascript
// Ne töltsd le az összes munkamenetet egyszerre
const { data } = await supabase
  .from('teacher_sessions')
  .select('id, session_code, created_at') // Csak a szükséges mezők
  .limit(10);
```

---

## 📞 SEGÍTSÉG

### Problémák esetén:
1. Ellenőrizd a `cleanup-log.txt` fájlt
2. Futtasd manuálisan: `node check-last-sessions-data.js`
3. Nézd meg a Supabase dashboard-ot
4. Ellenőrizd a `.env.local` fájlt

### Hasznos linkek:
- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Docs: https://supabase.com/docs
- Free Tier Limits: https://supabase.com/pricing

---

**Készítette:** Kiro AI  
**Utolsó frissítés:** 2026-02-09  
**Verzió:** 1.0.0
