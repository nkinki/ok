# Google Drive Mappa Beállítás

## 📁 Állandó Google Drive Mappa

**Mappa URL:** https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb?usp=sharing

**Folder ID:** `1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb`

## ✅ Beállítva a Kódban

A Google Drive mappa ID **állandóan be van állítva** a `services/fullGoogleDriveService.ts` fájlban:

```typescript
class FullGoogleDriveService {
  // Default Google Drive folder ID (állandó beállítás)
  private readonly DEFAULT_FOLDER_ID = '1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb';
  
  private getTeacherDriveConfig(): DriveConfig {
    // Use localStorage if available, otherwise use default folder
    const teacherFolderId = mainFolder ? this.extractFolderId(mainFolder) : this.DEFAULT_FOLDER_ID;
    // ...
    return {
      teacherFolderId: teacherFolderId,
      imagesFolderId: imagesFolderId,
      sessionsFolderId: sessionsFolderId,
      isConfigured: true // Always configured with default folder
    };
  }
}
```

## 🎯 Működés

### Automatikus Használat:

1. **Nincs beállítás szükséges** - A mappa ID már be van égetve a kódba
2. **Tanár létrehoz munkamenetet** → Képek automatikusan a megadott Drive mappába kerülnek
3. **Diák csatlakozik** → Képek automatikusan a Drive mappából töltődnek be

### Opcionális Felülírás:

Ha a tanár más mappát szeretne használni:
1. Tanári felület → "Google Drive beállítása"
2. Bejelentkezés Google fiókkal
3. Másik mappa kiválasztása
4. Ez felülírja az alapértelmezett mappát (localStorage-ban tárolva)

## 📊 Mappa Struktúra

```
1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb/
├── images/                    (képek)
│   ├── ABC123_exercise_1.jpg
│   ├── ABC123_exercise_2.jpg
│   └── ...
└── sessions/                  (session JSON-ok)
    ├── session_ABC123.json
    ├── session_XYZ789.json
    └── ...
```

## 🔒 Jogosultságok

### Mappa Megosztás:

- **Publikus link** - Bárki aki ismeri a linket
- **Olvasási jog** - Diákok letölthetik a képeket
- **Írási jog** - Csak a tanár (aki létrehozta a mappát)

### Biztonság:

- ✅ Mappa nem indexelt (Google nem találja meg kereséskor)
- ✅ Csak a link ismeretében elérhető
- ✅ 60 perc után a session lejár (képek maradhatnak)
- ✅ Korlátlan tárhely (intézményi Google Drive)

## 🚀 Előnyök

1. **0% Supabase egress** - Minden kép Google Drive-ról
2. **Korlátlan tárhely** - Intézményi Google Drive
3. **Gyors betöltés** - Google CDN
4. **Automatikus** - Nincs beállítás szükséges
5. **Felülírható** - Ha más mappát szeretnél

## 📝 Használat

### Tanár:

```
1. Hozz létre munkamenetet
   ↓
2. Képek automatikusan feltöltődnek a Drive mappába
   ↓
3. Session JSON automatikusan feltöltődik
   ↓
4. Csak metadata kerül Supabase-be (~200 bytes)
```

### Diák:

```
1. Bejelentkezés session kóddal
   ↓
2. START gomb megjelenik
   ↓
3. Kattints START
   ↓
4. Képek automatikusan betöltődnek a Drive mappából
```

## 🔧 Technikai Részletek

### Kód Helye:

- **Service:** `services/fullGoogleDriveService.ts`
- **Konstans:** `DEFAULT_FOLDER_ID = '1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb'`
- **Használat:** Automatikus fallback ha nincs localStorage beállítás

### API Hívások:

```typescript
// Kép feltöltés
const uploadResult = await fullGoogleDriveService.uploadImage(
  imageBase64,
  `${sessionCode}_exercise_${i}.jpg`
);

// Session JSON feltöltés
const sessionResult = await fullGoogleDriveService.uploadSessionJSON(
  sessionCode,
  sessionData
);

// Kép letöltés (diák oldal)
const imageUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;
```

## ⚙️ Konfiguráció Módosítása

Ha más mappát szeretnél használni alapértelmezettként:

1. Nyisd meg: `services/fullGoogleDriveService.ts`
2. Módosítsd: `DEFAULT_FOLDER_ID = 'ÚJ_FOLDER_ID'`
3. Commit és push
4. Vercel auto-deploy

## 📊 Monitoring

### Ellenőrzés:

```bash
# Konzol kimenet tanár oldalon:
📤 Uploading image to Google Drive: ABC123_exercise_1
📁 Images folder ID: 1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb
✅ Image uploaded to Google Drive: ABC123_exercise_1.jpg
🔗 Public URL: https://drive.google.com/uc?id=...

# Konzol kimenet diák oldalon:
🚀 START button clicked - Loading exercises from Google Drive...
✅ Session JSON loaded from Google Drive
📊 Exercise count: 5
🖼️ First exercise image URL: https://drive.google.com/uc?id=...
```

## 🎉 Összefoglalás

- ✅ **Állandó mappa beállítva** - `1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb`
- ✅ **Automatikus használat** - Nincs beállítás szükséges
- ✅ **0% Supabase egress** - Minden kép Drive-ról
- ✅ **Korlátlan tárhely** - Intézményi Google Drive
- ✅ **Felülírható** - Ha más mappát szeretnél

---

**Status:** ✅ Beállítva és működik
**Mappa:** https://drive.google.com/drive/folders/1JlBYWIetXER_k0BSrM6A0rrRES8CCtKb
**Kód:** `services/fullGoogleDriveService.ts`
