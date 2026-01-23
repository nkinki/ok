# Tantárgyi Bejelentkezés és Teljesítmény Számítás - Követelmények

## Áttekintés
A rendszer bővítése tantárgyi alapú bejelentkezéssel és részletes teljesítmény számítással a diákok eredményeinek jobb követéséhez.

## 1. Tantárgyi Bejelentkezési Rendszer

### 1.1 Tantárgyi Jelszavak
**Mint tanár, szeretnék tantárgy-specifikus jelszavakkal bejelentkezni, hogy csak a saját tantárgyam munkameneteit lássam.**

**Elfogadási kritériumok:**
- A rendszer támogatja a tantárgyi jelszavakat (pl. infoxxx, matekxxx, magyxxx, stb.)
- Minden tantárgyhoz egyedi jelszó tartozik
- A jelszavak egyszerűek és könnyen megjegyezhetők
- A bejelentkezés után csak az adott tantárgy munkamenetei láthatók

### 1.2 Tantárgyi Szűrés
**Mint tanár, szeretném látni csak a saját tantárgyamhoz tartozó munkameneteket és eredményeket.**

**Elfogadási kritériumok:**
- A munkamenetek tantárgy szerint vannak csoportosítva
- A tanár csak a saját tantárgyának adatait látja
- A statisztikák tantárgy-specifikusak
- Az előzmények szűrve vannak tantárgy szerint

### 1.3 Tantárgyi Profilok
**Mint tanár, szeretnék látni, hogy melyik tantárgyba vagyok bejelentkezve.**

**Elfogadási kritériumok:**
- A felületen látható a jelenlegi tantárgy neve
- Egyszerű váltás lehetséges tantárgyak között
- Minden tantárgynak saját színkódja van
- A navigációban jelzett a tantárgy

## 2. Teljesítmény Számítási Rendszer

### 2.1 Százalékos Teljesítmény
**Mint tanár, szeretném látni a diákok teljesítményét százalékban az elért pontok alapján.**

**Elfogadási kritériumok:**
- Minden diákhoz kiszámolt százalékos teljesítmény
- A számítás az elért pontok / maximális pontok alapján történik
- A százalékok vizuálisan megjelenítve (színkódolva)
- Átlagos teljesítmény számítás munkamenetenként

### 2.2 Teljesítmény Kategóriák
**Mint tanár, szeretném látni a diákok teljesítményét kategóriákban.**

**Elfogadási kritériumok:**
- Kiváló (90-100%)
- Jó (75-89%)
- Közepes (60-74%)
- Gyenge (0-59%)
- Színkódolt megjelenítés
- Kategóriánkénti statisztikák

### 2.3 Részletes Teljesítmény Analitika
**Mint tanár, szeretnék részletes analitikát látni a diákok teljesítményéről.**

**Elfogadási kritériumok:**
- Diákonkénti teljesítmény trend
- Feladattípusonkénti teljesítmény
- Időbeli teljesítmény változás
- Osztályátlag összehasonlítás
- Exportálható jelentések

## 3. Továbbfejlesztett Monitoring

### 3.1 Tantárgyi Dashboard
**Mint tanár, szeretnék egy tantárgy-specifikus dashboardot látni.**

**Elfogadási kritériumok:**
- Tantárgy neve és statisztikái
- Aktív munkamenetek száma
- Diákok teljesítménye százalékban
- Legutóbbi eredmények
- Gyors munkamenet indítás

### 3.2 Teljesítmény Riportok
**Mint tanár, szeretnék részletes riportokat generálni.**

**Elfogadási kritériumok:**
- CSV export tantárgyankénti bontásban
- Diákok teljesítménye százalékban
- Időszakos összesítők
- Grafikus megjelenítés lehetősége

## 4. Technikai Követelmények

### 4.1 Adatbázis Bővítések
- Tantárgyi kategóriák tárolása
- Munkamenetek tantárgyhoz rendelése
- Teljesítmény számítások tárolása

### 4.2 Biztonsági Követelmények
- Tantárgyi jelszavak biztonságos tárolása
- Tantárgyak közötti adatok elkülönítése
- Session alapú tantárgyi hozzáférés

### 4.3 Teljesítmény Követelmények
- Gyors százalék számítások
- Valós idejű teljesítmény frissítés
- Optimalizált adatbázis lekérdezések

## 5. Felhasználói Élmény

### 5.1 Egyszerű Bejelentkezés
- Tantárgyi jelszavak egyszerű bevitele
- Gyors tantárgy váltás
- Emlékeztető a jelenlegi tantárgyra

### 5.2 Vizuális Teljesítmény
- Színkódolt százalékok
- Progress bar-ok
- Grafikus teljesítmény mutatók
- Intuitív kategória jelzések

## Prioritás
**Magas prioritás** - Ezek a funkciók jelentősen javítják a tanári élményt és a diákok nyomon követését.

## Függőségek
- Meglévő munkamenet rendszer
- Supabase adatbázis
- Jelenlegi authentication rendszer