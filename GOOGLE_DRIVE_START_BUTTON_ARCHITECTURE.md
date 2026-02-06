# Google Drive START Button Architecture

## 🎯 Cél: 0% Supabase Egress a Képekre

### Probléma:
- ❌ Supabase kvóta túllépés (196% → 9.7GB / 5GB)
- ❌ Képek Supabase-ben tárolva
- ❌ Minden diák letöltés = Supabase egress

### Megoldás:
- ✅ Képek Google Drive-on (korlátlan tárhely)
- ✅ Diák START gombbal tölti be
- ✅ Csak metadata Supabase-ben
- ✅ 0% Supabase egress a képekre

---

## 📊 Adatáramlás

### Tanár oldal (Munkamenet létrehozás):

```
1. Tanár kiválaszt feladatokat
   ↓
2. Tanár kattint "Munkamenet indítása"
   ↓
3. Képek feltöltése Google Drive-ra
   ↓
4. Session JSON Google Drive-ra (képek linkekkel)
   ↓
5. Csak metadata Supabase-be:
   - Session kód
   - Tantárgy
   - Osztály
   - Google Drive folder ID
   - Feladatok száma
   - Lejárati idő
   ↓
6. Tanár látja a session kódot
```

### Diák oldal (Csatlakozás):

```
1. Diák bejelentkezik session kóddal
   ↓
2. API ellenőrzi session létezését (Supabase)
   ↓
3. Diák lát egy START gombot:
   "Kattints a START gombra a feladatok betöltéséhez"
   ↓
4. Diák kattint START
   ↓
5. Képek letöltése Google Drive-ról
   ↓
6. Feladatok megjelennek képekkel
   ↓
7. Diák megoldja a feladatokat
   ↓
8. Eredmények Supabase-be (minimális adat)
```

---

## 🗄️ Adatstruktúra

### Supabase (teacher_sessions tábla):

```sql
CREATE TABLE teacher_sessions (
  id UUID PRIMARY KEY,
  session_code TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  class_name TEXT NOT NULL,
  
  -- Google Drive info
  drive_folder_id TEXT,
  drive_session_file_id TEXT,
  
  -- Metadata only (NO images!)
  exercise_count INTEGER NOT NULL,
  max_possible_score INTEGER NOT NULL,
  
  -- Session info
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  -- NO full_session_json column!
  -- NO exercises column with images!
);
```

**Méret:** ~200 bytes / session (vs 500KB+ képekkel)

### Google Drive (session JSON):

```json
{
  "sessionCode": "ABC123",
  "subject": "info",
  "className": "8.a",
  "createdAt": "2026-02-06T10:00:00Z",
  "exercises": [
    {
      "id": "ex1",
      "title": "Feladat 1",
      "type": "QUIZ",
      "instruction": "...",
      "imageUrl": "https://drive.google.com/uc?id=FILE_ID_1",
      "content": { ... }
    },
    {
      "id": "ex2",
      "title": "Feladat 2",
      "type": "MATCHING",
      "instruction": "...",
      "imageUrl": "https://drive.google.com/uc?id=FILE_ID_2",
      "content": { ... }
    }
  ]
}
```

**Tárolás:** Google Drive (korlátlan)

---

## 🔧 Implementáció

### 1. Tanár oldal módosítások:

**TeacherSessionManager.tsx:**
```typescript
const handleStartSession = async () => {
  // 1. Upload images to Google Drive
  const driveImageUrls = await uploadImagesToGoogleDrive(selectedExercises);
  
  // 2. Create session JSON with Drive URLs
  const sessionJSON = {
    sessionCode,
    exercises: selectedExercises.map((ex, i) => ({
      ...ex,
      imageUrl: driveImageUrls[i] // Google Drive URL
    }))
  };
  
  // 3. Upload session JSON to Google Drive
  const driveFileId = await uploadSessionJSONToDrive(sessionJSON);
  
  // 4. Save ONLY metadata to Supabase
  await fetch('/api/simple-api/sessions/create-minimal', {
    method: 'POST',
    body: JSON.stringify({
      code: sessionCode,
      subject: currentSubject,
      className: className,
      exerciseCount: selectedExercises.length,
      maxScore: selectedExercises.length * 10,
      driveFolderId: driveFolder.id,
      driveSessionFileId: driveFileId
    })
  });
  
  // 5. Show session code to teacher
  setActiveSession({ code: sessionCode });
};
```

### 2. Diák oldal módosítások:

**DailyChallenge.tsx:**
```typescript
const [showStartButton, setShowStartButton] = useState(true);
const [loadingExercises, setLoadingExercises] = useState(false);

const handleStudentLogin = async (studentData, code) => {
  // 1. Check session exists (Supabase - minimal data)
  const sessionCheck = await fetch(`/api/simple-api/sessions/${code}/check`);
  const sessionInfo = await sessionCheck.json();
  
  if (!sessionInfo.exists) {
    setError('Hibás munkamenet kód');
    return;
  }
  
  // 2. Show START button (don't load exercises yet!)
  setStudent(studentData);
  setCurrentSessionCode(code);
  setShowStartButton(true);
  setStep('WAITING_FOR_START');
};

const handleStartExercises = async () => {
  setLoadingExercises(true);
  
  try {
    // 3. Load session JSON from Google Drive
    const driveResponse = await fetch(
      `/api/simple-api/sessions/${currentSessionCode}/load-from-drive`
    );
    
    const sessionData = await driveResponse.json();
    
    // 4. Load exercises with Google Drive image URLs
    setPlaylist(sessionData.exercises);
    setStep('PLAYING');
    
  } catch (error) {
    setError('Hiba a feladatok betöltésekor');
  } finally {
    setLoadingExercises(false);
  }
};

// UI:
{step === 'WAITING_FOR_START' && (
  <div className="text-center p-12">
    <h2 className="text-3xl font-bold mb-6">
      Készen állsz?
    </h2>
    <p className="text-lg mb-8">
      Kattints a START gombra a feladatok betöltéséhez
    </p>
    <button
      onClick={handleStartExercises}
      disabled={loadingExercises}
      className="bg-green-600 text-white px-12 py-6 rounded-xl text-2xl font-bold"
    >
      {loadingExercises ? 'Betöltés...' : 'START'}
    </button>
  </div>
)}
```

### 3. API módosítások:

**api/simple-api.js:**
```javascript
// Minimal session creation (NO images!)
if (method === 'POST' && path.includes('/sessions/create-minimal')) {
  const { code, subject, className, exerciseCount, maxScore, driveFolderId, driveSessionFileId } = req.body;
  
  const { data, error } = await supabase
    .from('teacher_sessions')
    .insert({
      session_code: code.toUpperCase(),
      subject: subject,
      class_name: className,
      exercise_count: exerciseCount,
      max_possible_score: maxScore,
      drive_folder_id: driveFolderId,
      drive_session_file_id: driveSessionFileId,
      is_active: true,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
  
  return res.status(200).json({ success: true, session: data });
}

// Load session from Google Drive
if (method === 'GET' && path.includes('/sessions/') && path.includes('/load-from-drive')) {
  const sessionCode = path.match(/\/sessions\/([^\/]+)\//)[1];
  
  // 1. Get Drive file ID from Supabase
  const { data: session } = await supabase
    .from('teacher_sessions')
    .select('drive_session_file_id')
    .eq('session_code', sessionCode)
    .single();
  
  // 2. Load JSON from Google Drive
  const driveFileId = session.drive_session_file_id;
  const driveUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
  
  const driveResponse = await fetch(driveUrl);
  const sessionJSON = await driveResponse.json();
  
  return res.status(200).json(sessionJSON);
}
```

---

## 📈 Supabase Egress Csökkentés

### Előtte (ROSSZ):
```
Session létrehozás:
- Session JSON Supabase-be: 500KB
- 20 diák letölti: 20 × 500KB = 10MB

Képek:
- 5 kép × 300KB = 1.5MB Supabase-be
- 20 diák letölti: 20 × 1.5MB = 30MB

ÖSSZESEN: 40MB / session
```

### Utána (JÓ):
```
Session létrehozás:
- Metadata Supabase-be: 200 bytes
- 20 diák ellenőrzi: 20 × 200 bytes = 4KB

Képek:
- Google Drive-on (0 Supabase egress)
- 20 diák letölti Google Drive-ról: 0MB Supabase

ÖSSZESEN: 4KB / session (99.99% csökkentés!)
```

---

## 🎨 UI/UX Változások

### Tanár oldal:

**Előtte:**
```
[Munkamenet indítása] → Session aktív
```

**Utána:**
```
[Google Drive beállítása] (ha nincs)
   ↓
[Munkamenet indítása]
   ↓
"Képek feltöltése Google Drive-ra..." (progress bar)
   ↓
"Session JSON feltöltése..." (progress bar)
   ↓
Session aktív + kód megjelenítése
```

### Diák oldal:

**Előtte:**
```
Bejelentkezés → Feladatok automatikusan betöltődnek
```

**Utána:**
```
Bejelentkezés
   ↓
"Készen állsz?" képernyő
   ↓
[START] gomb (nagy, zöld)
   ↓
"Feladatok betöltése..." (progress bar)
   ↓
Feladatok megjelennek
```

---

## ✅ Előnyök

1. **0% Supabase egress képekre** - Minden kép Google Drive-ról
2. **Korlátlan tárhely** - Intézményi Google Drive
3. **Gyorsabb betöltés** - Google CDN
4. **Explicit START** - Diák tudja mikor kezdődik
5. **Minimális Supabase használat** - Csak metadata

---

## 🔒 Biztonság

### Google Drive fájlok:
- **Publikus link** - Bárki letöltheti aki ismeri a linket
- **Nem indexelt** - Google nem indexeli
- **60 perc lejárat** - Session lejárat után törölhető

### Supabase:
- **Csak metadata** - Nincs érzékeny adat
- **Session kód** - 6 karakter random
- **Lejárati idő** - 60 perc

---

## 📝 Teendők

1. ✅ Dokumentáció elkészítése
2. ⏳ Google Drive service módosítása
3. ⏳ TeacherSessionManager módosítása
4. ⏳ DailyChallenge START gomb hozzáadása
5. ⏳ API endpoints módosítása
6. ⏳ Tesztelés
7. ⏳ Deployment

---

## 🧪 Tesztelési Forgatókönyv

### 1. Tanár létrehoz munkamenetet:
- ✅ Google Drive beállítva
- ✅ Képek feltöltődnek Drive-ra
- ✅ Session JSON feltöltődik Drive-ra
- ✅ Metadata Supabase-be kerül
- ✅ Session kód megjelenik

### 2. Diák csatlakozik:
- ✅ Bejelentkezik session kóddal
- ✅ Látja a START gombot
- ✅ Kattint START-ra
- ✅ Képek betöltődnek Google Drive-ról
- ✅ Feladatok megjelennek

### 3. Diák megoldja:
- ✅ Feladatok működnek
- ✅ Képek látszanak
- ✅ Eredmények Supabase-be kerülnek

### 4. Tanár monitorozza:
- ✅ Látja a diákokat
- ✅ Látja az eredményeket
- ✅ Látja a progresst

---

**Status:** 📝 Tervezés kész, implementáció következik
