# Google Drive Képtárolási Stratégia

## Probléma
- Supabase Egress: 9,781 GB / 5 GB (196%) - majdnem kétszeres túllépés
- Kevés felhasználóval már túlléptük - tömegesen használva katasztrófa lenne
- Képek base64 formátumban tárolva → óriási adatforgalom

## Megoldás: Google Drive alapú képtárolás

### Előnyök
- ✅ **Korlátlan tárhely** (15 GB ingyenes, bővíthető)
- ✅ **Nincs egress limit** Google Drive-nál
- ✅ **Gyors CDN** - Google infrastruktúra
- ✅ **Már implementált** Google Drive integráció
- ✅ **90%+ egress csökkentés**

### Implementációs terv

#### 1. Képfeltöltés Google Drive-ra
```javascript
// services/googleDriveImageService.ts
export class GoogleDriveImageService {
  
  static async uploadImage(imageBase64, exerciseId, fileName) {
    try {
      // Convert base64 to blob
      const blob = this.base64ToBlob(imageBase64);
      
      // Upload to Google Drive
      const response = await fetch('/api/simple-api/images/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageBase64,
          exerciseId: exerciseId,
          fileName: fileName
        })
      });
      
      const result = await response.json();
      return result.driveUrl; // Public Google Drive URL
      
    } catch (error) {
      console.error('Google Drive upload failed:', error);
      return null;
    }
  }
  
  static async getImageUrl(exerciseId) {
    // Try cache first
    const cached = ImageCache.getCachedImage(exerciseId);
    if (cached) return cached;
    
    // Get from Google Drive
    const response = await fetch(`/api/simple-api/images/${exerciseId}`);
    const data = await response.json();
    
    if (data.driveUrl) {
      // Cache for future use
      ImageCache.setCachedImage(exerciseId, data.driveUrl);
      return data.driveUrl;
    }
    
    return null;
  }
}
```

#### 2. API endpoint képkezeléshez
```javascript
// api/simple-api.js - új endpoint
if (method === 'POST' && path.includes('/images/upload')) {
  const { imageData, exerciseId, fileName } = req.body;
  
  try {
    // Upload to Google Drive
    const driveUrl = await uploadToGoogleDrive(imageData, fileName);
    
    // Store only URL in Supabase (not the image data!)
    await supabase
      .from('exercise_images')
      .insert({
        exercise_id: exerciseId,
        drive_url: driveUrl,
        file_name: fileName,
        uploaded_at: new Date().toISOString()
      });
      
    return res.json({ success: true, driveUrl });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### 3. Adatbázis séma módosítás
```sql
-- Új tábla képek URL-jeinek tárolására
CREATE TABLE exercise_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  file_size INTEGER
);

CREATE INDEX idx_exercise_images_exercise_id ON exercise_images(exercise_id);
```

### 2. **Hibrid megoldás** (Azonnali)

#### A. Képek kiszervezése Supabase-ből
- Supabase: Csak metaadatok (címek, utasítások, típusok)
- Google Drive: Képek tárolása
- **Egress csökkentés: 80-90%**

#### B. Lépcsőzetes migráció
```javascript
// 1. Új feladatok automatikusan Google Drive-ra
// 2. Régi feladatok fokozatos migráció
// 3. Supabase-ből képek törlése

const migrateExerciseImages = async () => {
  const exercises = await supabase
    .from('teacher_sessions')
    .select('full_session_json')
    .not('full_session_json', 'is', null);
    
  for (const session of exercises) {
    const sessionData = session.full_session_json;
    
    for (const exercise of sessionData.exercises) {
      if (exercise.imageUrl && exercise.imageUrl.startsWith('data:')) {
        // Upload to Google Drive
        const driveUrl = await GoogleDriveImageService.uploadImage(
          exercise.imageUrl, 
          exercise.id, 
          exercise.fileName
        );
        
        // Replace base64 with Drive URL
        exercise.imageUrl = driveUrl;
      }
    }
    
    // Update session with Drive URLs
    await supabase
      .from('teacher_sessions')
      .update({ full_session_json: sessionData })
      .eq('id', session.id);
  }
};
```

### 3. **Alternatív megoldások**

#### A. Cloudinary (Képspecialista)
- 25 GB ingyenes tárhely
- Automatikus optimalizálás
- CDN integráció
- $89/hó Pro csomag

#### B. Vercel Blob Storage
- 1 GB ingyenes
- $0.15/GB után
- Vercel integráció

#### C. AWS S3 + CloudFront
- Nagyon olcsó
- Komplex beállítás

### 4. **Azonnali intézkedések**

#### A. Képtömörítés fokozása (Google Drive optimalizált)
```javascript
// Magas minőségű tömörítés Google Drive-hoz
const settings = {
  quality: 0.9,   // 90% minőség (kiváló szövegolvashatóság)
  maxWidth: 1400, // Nagy felbontás
  format: 'png'   // PNG a szövegekhez (élesebb)
};
```

#### B. Lazy loading implementálása
```javascript
// Képek csak akkor töltődnek be, amikor szükséges
const loadImageOnDemand = async (exerciseId) => {
  if (!imageCache.has(exerciseId)) {
    const imageUrl = await GoogleDriveImageService.getImageUrl(exerciseId);
    imageCache.set(exerciseId, imageUrl);
  }
  return imageCache.get(exerciseId);
};
```

### 5. **Költségvetés és skálázhatóság**

#### Jelenlegi helyzet
- Supabase Free: 5 GB egress → **TÚLLÉPVE**
- Pro csomag: $25/hó → 50 GB egress

#### Google Drive megoldással
- Google Drive: 15 GB ingyenes
- Workspace: $6/felhasználó/hó → korlátlan
- **Egress költség: $0**

#### Várható eredmény
- **90% egress csökkentés**
- **Korlátlan skálázhatóság**
- **Gyorsabb betöltés** (Google CDN)

### 6. **Implementációs prioritás**

#### Sürgős (1-2 nap)
1. ✅ Agresszív képtömörítés (kész)
2. 🔄 Google Drive képfeltöltés API
3. 🔄 Új feladatok automatikus Drive feltöltés

#### Rövid távú (1 hét)
1. 🔄 Régi feladatok migrációja
2. 🔄 Supabase képek törlése
3. 🔄 Lazy loading implementálás

#### Hosszú távú (1 hónap)
1. 🔄 Teljes Google Drive integráció
2. 🔄 Backup stratégia
3. 🔄 Monitoring és analytics

## Várható eredmény
- **Jelenlegi**: 9.7 GB egress
- **Google Drive után**: 0.5-1 GB egress
- **Skálázhatóság**: Korlátlan felhasználó
- **Költség**: Minimális