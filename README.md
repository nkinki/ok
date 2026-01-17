# OkosGyakorló - Telepítési Útmutató

Ez az alkalmazás segít tankönyvi képekből interaktív feladatokat generálni a Google Gemini AI segítségével.

## 1. Előfeltételek
- **Node.js** telepítése (LTS verzió): [https://nodejs.org/](https://nodejs.org/)
- **Google API Kulcs** (ingyenes): [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## 2. Telepítés
Nyiss egy terminált (parancssort) ebben a mappában, és futtasd:

```bash
npm install
```

## 3. Indítás
A fejlesztői szerver indítása:

```bash
npm run dev
```

Ezután nyisd meg a böngészőben a megjelenő linket (általában: `http://localhost:5173`).

## 4. Beállítás
Az első indítás után:
1. Kattints a jobb felső sarokban található **Fogaskerék (Beállítások)** ikonra.
2. Másold be az API kulcsodat.
3. A rendszer automatikusan elmenti, és máris használhatod.

## Funkciók
- **Egyesével:** Képek fotózása/feltöltése és azonnali átalakítása.
- **Tömeges Feldolgozó:** Több tucat kép elemzése egyszerre, biztonságos módban (hogy ne fogyjon el a kvóta).
- **Könyvtár:** Az elkészült feladatok mentése és visszatöltése.

