# Tantárgyi Bejelentkezés és Teljesítmény Számítás - Feladatok

## 1. Adatbázis Bővítések

### 1.1 Adatbázis Séma Frissítés
- [x] Teacher sessions tábla bővítése subject és max_possible_score oszlopokkal
- [x] Session participants tábla bővítése percentage és performance_category oszlopokkal  
- [x] Subject statistics tábla létrehozása
- [x] Szükséges indexek létrehozása a teljesítmény optimalizáláshoz

### 1.2 Adatbázis Migráció Script
- [x] SQL migráció script írása
- [x] Meglévő adatok frissítése alapértelmezett értékekkel
- [x] Adatbázis séma validálás

## 2. Backend API Bővítések

### 2.1 Tantárgyi Authentication API
- [x] Subject authentication endpoint létrehozása (/api/simple-api/auth/subject)
- [ ] Tantárgyi jelszavak konfigurációja
- [ ] Session alapú tantárgyi hozzáférés kezelése
- [ ] Tantárgyi token generálás és validálás

### 2.2 Tantárgyi Szűrés API-ban
- [ ] Sessions list endpoint bővítése subject szűréssel
- [ ] Session creation bővítése subject információval
- [ ] Session status endpoint tantárgyi szűrése
- [ ] Statistics endpoint tantárgyi bontása

### 2.3 Teljesítmény Számítási API
- [ ] Performance analytics endpoint létrehozása
- [ ] Százalék számítási logika implementálása
- [ ] Teljesítmény kategória meghatározás
- [ ] Tantárgyi teljesítmény összesítők

## 3. Frontend Komponensek

### 3.1 Tantárgyi Bejelentkezés
- [ ] SubjectLoginForm komponens létrehozása
- [ ] Tantárgyi jelszó beviteli form
- [ ] Tantárgy választó interface
- [ ] Bejelentkezési hiba kezelés

### 3.2 Subject Context Provider
- [x] SubjectContext létrehozása React Context API-val
- [ ] Jelenlegi tantárgy állapot kezelése
- [ ] Tantárgyi témák és színek kezelése
- [ ] Tantárgy váltás funkció

### 3.3 Tantárgyi Dashboard
- [ ] SubjectDashboard komponens
- [ ] Tantárgy-specifikus navigáció
- [ ] Tantárgyi színkódolás alkalmazása
- [ ] Tantárgy információk megjelenítése

## 4. Teljesítmény Számítás és Megjelenítés

### 4.1 Teljesítmény Számítási Logika
- [ ] Százalék számítási függvények
- [ ] Teljesítmény kategória algoritmusok
- [ ] Pontszám alapú teljesítmény számítás
- [ ] Időbeli teljesítmény trend számítás

### 4.2 Teljesítmény Vizualizáció
- [ ] PerformanceChart komponens létrehozása
- [ ] Színkódolt teljesítmény mutatók
- [ ] Progress bar komponensek
- [ ] Teljesítmény kategória ikonok

### 4.3 Továbbfejlesztett SessionMonitor
- [ ] SessionMonitor bővítése teljesítmény adatokkal
- [ ] Százalékos teljesítmény megjelenítése
- [ ] Teljesítmény kategóriák színkódolása
- [ ] Valós idejű teljesítmény frissítés

## 5. Tantárgyi Munkamenet Kezelés

### 5.1 TeacherSessionManager Bővítés
- [ ] Tantárgyi szűrés hozzáadása
- [ ] Subject-specifikus munkamenet létrehozás
- [ ] Tantárgyi előzmények megjelenítése
- [ ] Subject-alapú statisztikák

### 5.2 Munkamenet Létrehozás Bővítés
- [ ] Tantárgy kiválasztás munkamenet létrehozáskor
- [ ] Maximális pontszám megadása
- [ ] Tantárgyi munkamenet validálás
- [ ] Subject információ mentése

## 6. Teljesítmény Riportok és Export

### 6.1 Tantárgyi Riportok
- [ ] Subject-specifikus CSV export
- [ ] Teljesítmény százalékok exportálása
- [ ] Kategóriánkénti bontás exportban
- [ ] Időszakos teljesítmény riportok

### 6.2 Teljesítmény Dashboard
- [ ] Tantárgyi teljesítmény összesítő
- [ ] Diákok teljesítmény rangsor
- [ ] Osztályátlag számítás és megjelenítés
- [ ] Teljesítmény trend grafikonok

## 7. UI/UX Fejlesztések

### 7.1 Tantárgyi Témák
- [ ] Tantárgyi színpaletta implementálása
- [ ] Dinamikus téma váltás
- [ ] Tantárgyi ikonok és logók
- [ ] Konzisztens vizuális identitás

### 7.2 Teljesítmény UI Elemek
- [ ] Teljesítmény kategória badge-ek
- [ ] Animált progress bar-ok
- [ ] Színkódolt százalék megjelenítés
- [ ] Teljesítmény tooltip-ek

### 7.3 Responsive Design
- [ ] Mobil optimalizálás tantárgyi nézetekhez
- [ ] Tablet nézet teljesítmény dashboard-hoz
- [ ] Touch-friendly tantárgy váltás
- [ ] Reszponzív teljesítmény grafikonok

## 8. Biztonsági Fejlesztések

### 8.1 Tantárgyi Hozzáférés Kontroll
- [ ] Tantárgyi session kezelés
- [ ] Automatikus kijelentkezés implementálása
- [ ] Tantárgyak közötti adatelkülönítés
- [ ] Hozzáférési audit log

### 8.2 Jelszó Biztonság
- [ ] Tantárgyi jelszavak hash-elése
- [ ] Brute force védelem
- [ ] Session timeout kezelés
- [ ] Biztonságos jelszó tárolás

## 9. Teljesítmény Optimalizálás

### 9.1 Adatbázis Optimalizálás
- [ ] Teljesítmény lekérdezések optimalizálása
- [ ] Indexek finomhangolása
- [ ] Query cache implementálása
- [ ] Adatbázis kapcsolat pool optimalizálás

### 9.2 Frontend Optimalizálás
- [ ] Teljesítmény számítások cache-elése
- [ ] Lazy loading tantárgyi komponensekhez
- [ ] Memoization teljesítmény számításokhoz
- [ ] Bundle size optimalizálás

## 10. Tesztelés és Validálás

### 10.1 Unit Tesztek
- [ ] Teljesítmény számítási függvények tesztelése
- [ ] Tantárgyi authentication tesztek
- [ ] API endpoint unit tesztek
- [ ] Frontend komponens tesztek

### 10.2 Integrációs Tesztek
- [ ] Teljes tantárgyi bejelentkezési folyamat
- [ ] Adatbázis integráció tesztek
- [ ] API és frontend integráció
- [ ] Teljesítmény számítás end-to-end

### 10.3 Felhasználói Tesztelés
- [ ] Tanári felhasználói élmény tesztelés
- [ ] Tantárgyi váltás használhatóság
- [ ] Teljesítmény megjelenítés érthetőség
- [ ] Mobil használhatóság tesztelés

## 11. Dokumentáció és Képzés

### 11.1 Technikai Dokumentáció
- [ ] API dokumentáció frissítése
- [ ] Adatbázis séma dokumentálása
- [ ] Komponens dokumentáció
- [ ] Deployment útmutató frissítése

### 11.2 Felhasználói Dokumentáció
- [ ] Tanári használati útmutató
- [ ] Tantárgyi bejelentkezés guide
- [ ] Teljesítmény értelmezési segédlet
- [ ] Hibaelhárítási útmutató

## Prioritás és Ütemezés

### Magas Prioritás (1-2 hét)
- Adatbázis bővítések
- Tantárgyi authentication
- Alapvető teljesítmény számítás

### Közepes Prioritás (2-3 hét)
- Frontend komponensek
- Teljesítmény vizualizáció
- UI/UX fejlesztések

### Alacsony Prioritás (3-4 hét)
- Továbbfejlesztett riportok
- Teljesítmény optimalizálás
- Dokumentáció és tesztelés