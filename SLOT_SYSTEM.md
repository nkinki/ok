# 🎰 Slot System - Fix Fájlnevek Google Drive-on

## 🎯 Koncepció

**Probléma**: Supabase free tier túl kicsi a nagy JSON fájlokhoz (képekkel).

**Megoldás**: 
- Google Drive-on **fix fájlnevek** (session1.json - session5.json)
- Tanár **felülírja** a kiválasztott slot-ot
- Diák **automatikusan letölti** a slot-ról
- Supabase: **csak eredmények** (kicsi adat)

---

## 📁 Google Drive Setup

### 1. Fix fájlok létrehozása

A Drive mappában (`1tWt9sAMIQT7FdXlFFOTMCCT175nMAti6`):

**Fájlok:**
- `session1.json`
- `session2.json`
- `session3.json`
- `session4.json`
- `session5.json`

**Kezdő tartalom** (mindegyikbe):
```json
{
  "code": "EMPTY",
  "exercises": [],
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### 2. Megosztás

**Service Account** (írás + olvasás):
```
okos-856@integrated-myth-249222.iam.gserviceaccount.com
```
- Jogosultság: **Editor** (írás is kell!)

**Publikus** (diákok számára):
- General access: **Anyone with the link**
- Jogosultság: **Viewer**

---

## 🔄 Működés

### TANÁR:

1. **Slot választás**
   ```
   ┌─────────────────────────────┐
   │  Melyik slot-ot használod?  │
   │                             │
   │  ○ Slot 1  ○ Slot 2         │
   │  ○ Slot 3  ○ Slot 4         │
   │  ○ Slot 5                   │
   └─────────────────────────────┘
   ```

2. **Munkamenet létrehozása**
   - Feladatok kiválasztása
   - Munkamenet kód generálása
   - JSON létrehozása

3. **Automatikus feltöltés**
   - API hívás: `POST /api/drive-upload`
   - Paraméterek: `{ slotNumber: 1, sessionData: {...} }`
   - Drive-on a `session1.json` **felülíródik**

4. **Diákoknak**
   - Slot szám: **1**
   - Munkamenet kód: **ABC123**

### DIÁK:

1. **Bejelentkezés**
   ```
   Név: _____________
   Osztály: _________
   Slot szám: [1] ▼
   Munkamenet kód: _______
   ```

2. **START gomb**
   - API hívás: `GET /api/drive-download?slotNumber=1`
   - JSON automatikusan letöltődik
   - Feladatok betöltődnek

3. **Játék**
   - Feladatok megoldása
   - Eredmények → **Supabase** (csak pontszámok)

---

## 🔧 API Endpoints

### 1. Upload (Tanár)

**Endpoint:** `POST /api/drive-upload`

**Request:**
```json
{
  "slotNumber": 1,
  "sessionData": {
    "code": "ABC123",
    "exercises": [...],
    "createdAt": "2026-02-09T12:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "fileName": "session1.json",
  "fileId": "1Y5ZddqzRuEHNGZU5uO5cweql3TPjQn6U",
  "message": "Session uploaded successfully"
}
```

### 2. Download (Diák)

**Endpoint:** `GET /api/drive-download?slotNumber=1`

**Response:**
```json
{
  "success": true,
  "slotNumber": "1",
  "fileName": "session1.json",
  "fileId": "1Y5ZddqzRuEHNGZU5uO5cweql3TPjQn6U",
  "data": {
    "code": "ABC123",
    "exercises": [...]
  }
}
```

---

## 💾 Supabase - Csak Eredmények

### sessions tábla (metadata):
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  code VARCHAR(10) UNIQUE,
  slot_number INTEGER,
  created_at TIMESTAMP,
  status VARCHAR(20)
);
```

### results tábla (eredmények):
```sql
CREATE TABLE results (
  id UUID PRIMARY KEY,
  session_code VARCHAR(10),
  student_name VARCHAR(100),
  student_class VARCHAR(50),
  total_score INTEGER,
  percentage INTEGER,
  completed_at TIMESTAMP
);
```

**Adat méret**: ~100 bytes / eredmény (vs. ~5 MB / session JSON)

---

## ✅ Előnyök

1. **Supabase free tier elég**
   - Csak eredmények tárolása
   - ~100 bytes vs. ~5 MB / session

2. **Automatikus**
   - Tanár: Slot választás + feltöltés
   - Diák: Slot szám + automatikus letöltés

3. **Egyszerű**
   - Fix fájlnevek
   - Nincs fájl kezelés
   - Nincs manuális letöltés

4. **Gyors**
   - Google Drive CDN
   - Közvetlen letöltés
   - Nincs Supabase limit

---

## 🎓 Használat

### Tanár:
```
1. Válassz slot-ot (1-5)
2. Hozz létre munkamenetet
3. JSON automatikusan feltöltődik
4. Add meg a diákoknak:
   - Slot szám: 1
   - Munkamenet kód: ABC123
```

### Diák:
```
1. Bejelentkezés
2. Slot szám: 1
3. Munkamenet kód: ABC123
4. START → Automatikus letöltés
5. Feladatok indulnak
```

---

## 🔒 Biztonság

- **Service Account**: Csak a megosztott mappához van hozzáférés
- **Publikus fájlok**: Csak olvasás, nincs szerkesztés
- **Slot-ok**: Max 5 párhuzamos munkamenet
- **Eredmények**: Supabase-ben biztonságosan

---

**Verzió:** 4.0 - Slot System  
**Dátum:** 2026-02-09  
**Státusz:** ✅ API kész, Frontend következik
