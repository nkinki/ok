# 🤖 AI Képjavító Rendszer

## Áttekintés

Az AI képjavító rendszer automatikusan optimalizálja a feltöltött képeket a jobb olvashatóság és OCR feldolgozás érdekében. A rendszer különböző algoritmusokat alkalmaz a képminőség javítására.

## Funkciók

### 🔄 Automatikus kiegyenesítés
- **Mit csinál**: Automatikusan felismeri és kijavítja a ferde képeket
- **Algoritmus**: Hough transzformáció alapú éldetektálás
- **Használat**: Dokumentumok, szkennek kiegyenesítése

### ⚫ Fekete-fehér konverzió
- **Mit csinál**: Színes képeket fekete-fehérre alakít
- **Algoritmus**: Súlyozott RGB konverzió (0.299×R + 0.587×G + 0.114×B)
- **Előny**: Jobb OCR pontosság, kisebb fájlméret

### 🔆 Kontraszt fokozás
- **Mit csinál**: Javítja a kép kontrasztját histogram egyenlítéssel
- **Algoritmus**: Hisztogram egyenlítés (histogram equalization)
- **Eredmény**: Élesebb szövegek, jobb olvashatóság

### 💡 Fényerő optimalizálás
- **Mit csinál**: Automatikusan beállítja az optimális fényerőt
- **Algoritmus**: Kontraszt nyújtás (contrast stretching)
- **Használat**: Túl sötét vagy túl világos képek javítása

### 📝 Szöveg élesítés
- **Mit csinál**: Élesíti a szövegeket és éleket
- **Algoritmus**: Unsharp mask szűrő
- **Paraméterek**: 3×3 kernel alkalmazása

### 🧹 Zaj eltávolítás
- **Mit csinál**: Eltávolítja a képzajt és pixelhibákat
- **Algoritmus**: 3×3 medián szűrő
- **Eredmény**: Tisztább, simább képek

## Használat

### Gyors javítások

#### 📄 Dokumentum javítás
```typescript
const result = await imageEnhancementService.enhanceDocument(imageUrl);
```
**Beállítások:**
- ✅ Kiegyenesítés
- ✅ Fekete-fehér konverzió
- ✅ Kontraszt fokozás
- ✅ Fényerő optimalizálás
- ✅ Szöveg élesítés
- ✅ Zaj eltávolítás
- 📊 Minőség: 95%

#### 📸 Fotó javítás
```typescript
const result = await imageEnhancementService.enhancePhoto(imageUrl);
```
**Beállítások:**
- ✅ Kiegyenesítés
- ❌ Fekete-fehér konverzió (színes marad)
- ✅ Kontraszt fokozás
- ✅ Fényerő optimalizálás
- ❌ Szöveg élesítés
- ✅ Zaj eltávolítás
- 📊 Minőség: 90%

### Egyedi beállítások

```typescript
const options = {
  autoStraighten: true,
  enhanceContrast: true,
  convertToGrayscale: false,
  sharpenText: true,
  removeNoise: true,
  adjustBrightness: true,
  quality: 0.85
};

const result = await imageEnhancementService.enhanceImage(imageUrl, options);
```

## Eredmény objektum

```typescript
interface EnhancementResult {
  enhancedImageUrl: string;           // Javított kép URL
  appliedEnhancements: string[];      // Alkalmazott javítások listája
  processingTime: number;             // Feldolgozási idő (ms)
  originalSize: { width: number; height: number };
  enhancedSize: { width: number; height: number };
}
```

## UI Integráció

### ImageViewer komponensben

A képjavító funkciók automatikusan elérhetők az ImageViewer komponensben:

1. **AI Dokumentum** gomb - Gyors dokumentum javítás
2. **AI Fotó** gomb - Gyors fotó javítás  
3. **Egyedi** gomb - Testreszabható beállítások

### Használat tanári módban

```tsx
<ImageViewer 
  src={imageUrl}
  alt="Kép leírás"
  onImageUpdate={(newUrl) => setImageUrl(newUrl)}
  studentMode={false} // Tanári mód - javító funkciók engedélyezve
/>
```

### Használat diák módban

```tsx
<ImageViewer 
  src={imageUrl}
  alt="Kép leírás"
  studentMode={true} // Diák mód - csak zoom funkciók
/>
```

## Teljesítmény

### Feldolgozási idők (átlagos)
- **Kis kép** (800×600): ~500-1000ms
- **Közepes kép** (1920×1080): ~1000-2000ms
- **Nagy kép** (3000×2000): ~2000-4000ms

### Memóriahasználat
- A feldolgozás a böngésző memóriájában történik
- Canvas API használata
- Automatikus memória felszabadítás

## Algoritmusok részletesen

### Skew Detection (Ferdeség felismerés)
1. **Éldetektálás**: Sobel operátor alkalmazása
2. **Gradiens számítás**: Él irányok meghatározása
3. **Hisztogram**: Domináns szögek gyűjtése
4. **Korrekció**: Fordított forgatás alkalmazása

### Kontraszt javítás
1. **Hisztogram számítás**: Pixel értékek eloszlása
2. **CDF számítás**: Kumulatív eloszlás függvény
3. **Normalizálás**: Egyenletes eloszlás létrehozása
4. **Alkalmazás**: Új pixel értékek beállítása

### Zaj eltávolítás
1. **Környezet gyűjtés**: 3×3 pixel mátrix
2. **Rendezés**: Pixel értékek sorba rendezése
3. **Medián**: Középső érték kiválasztása
4. **Csere**: Eredeti pixel cseréje mediánra

## Hibakezelés

```typescript
try {
  const result = await imageEnhancementService.enhanceDocument(imageUrl);
  console.log('Sikeres javítás:', result.appliedEnhancements);
} catch (error) {
  console.error('Javítási hiba:', error.message);
  // Felhasználói hibaüzenet megjelenítése
}
```

## Tesztelés

### Teszt oldal
Nyisd meg a `test-image-enhancement.html` fájlt a böngészőben a funkciók teszteléséhez.

### Ajánlott teszt képek
- **Dokumentumok**: Szkennek, fényképezett szövegek
- **Ferde képek**: Telefonnal készült dokumentum fotók
- **Rossz megvilágítás**: Sötét vagy túl világos képek
- **Zajos képek**: Régi szkennek, rossz minőségű fotók

## Optimalizálás tippek

### Jobb eredményekhez
1. **Megfelelő felbontás**: Min. 300 DPI dokumentumokhoz
2. **Jó megvilágítás**: Egyenletes fény a fotózáskor
3. **Stabil tartás**: Kevesebb mozgáselmosódás
4. **Tiszta háttér**: Egyszínű háttér használata

### Teljesítmény optimalizálás
1. **Képméret**: Nagyobb képek lassabb feldolgozás
2. **Minőség beállítás**: Alacsonyabb minőség = gyorsabb
3. **Szelektív javítás**: Csak szükséges funkciók engedélyezése

## Jövőbeli fejlesztések

### Tervezett funkciók
- 🔍 **OCR integráció**: Szövegfelismerés pontosság mérése
- 📐 **Perspektíva korrekció**: 3D torzítások javítása
- 🎨 **Színkorrekció**: Fehéregyensúly automatikus beállítása
- 🤖 **ML alapú javítás**: Neurális hálózat használata
- 📊 **Batch feldolgozás**: Több kép egyszerre

### API bővítések
- Előnézet generálás
- Undo/Redo funkciók
- Javítási profilok mentése
- Teljesítmény metrikák

## Támogatás

### Böngésző kompatibilitás
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Fájlformátumok
- ✅ JPEG/JPG
- ✅ PNG
- ✅ WebP
- ❌ GIF (animált)
- ❌ SVG

---

*Az AI képjavító rendszer folyamatosan fejlődik. Visszajelzések és javaslatok várhatók!* 🚀