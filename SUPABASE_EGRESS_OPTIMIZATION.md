# Supabase Egress Optimalizálás

## Probléma
- Egress: 9,781 GB / 5 GB (196%) - majdnem kétszeres túllépés
- Fő ok: Nagy képfájlok és gyakori adatletöltések

## Azonnali megoldások

### 1. Képtömörítés implementálása
```javascript
// utils/imageCompression.ts - már létezik, de optimalizálni kell
const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  // Agresszívebb tömörítés
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Kisebb méret és alacsonyabb minőség
  canvas.width = Math.min(maxWidth, img.width);
  canvas.height = (canvas.width / img.width) * img.height;
  
  return canvas.toDataURL('image/jpeg', quality); // JPEG helyett PNG
}
```

### 2. Képek külső tárolása (Google Drive)
- Képek Google Drive-ra feltöltése
- Csak URL-ek tárolása Supabase-ben
- Jelentős Egress csökkentés

### 3. Caching implementálása
```javascript
// localStorage cache a képekhez
const getCachedImage = (imageId) => {
  const cached = localStorage.getItem(`img_${imageId}`);
  if (cached) return cached;
  
  // Csak akkor töltse le, ha nincs cache-elve
  return fetchImageFromSupabase(imageId);
}
```

### 4. Lazy loading
- Képek csak akkor töltődjenek be, amikor szükséges
- Előnézeti képek kisebb felbontásban

### 5. Batch lekérdezések
- Több adat egy lekérdezésben
- Kevesebb API hívás

## Hosszú távú megoldások

### 1. Pro csomag ($25/hó)
- 50 GB Egress
- 8 GB Database
- Több funkció

### 2. Hibrid megoldás
- Kritikus adatok: Supabase
- Képek: Google Drive/Cloudinary
- Statikus tartalom: Vercel

### 3. Adatoptimalizálás
- JSON tömörítés
- Felesleges mezők eltávolítása
- Delta sync (csak változások)

## Monitoring
- Supabase Usage Dashboard rendszeres ellenőrzése
- Egress tracking implementálása
- Automatikus riasztások