# Requirements Document

## Introduction

A Kahoot-szerű valós idejű versenyrendszer fejlesztése az Okos Gyakorló alkalmazáshoz, amely lehetővé teszi tanárok számára, hogy osztálytermi versenyeket szervezzenek a meglévő feladatokkal. A rendszer támogatja a GitHub-Vercel-Domain deployment pipeline-t és valós idejű multiplayer funkcionalitást.

## Glossary

- **Teacher**: Regisztrált tanár saját profillal és jelszóval
- **Game_Host**: A bejelentkezett tanár, aki létrehozza és vezeti a versenyt
- **Player**: Diák, aki csatlakozik a versenyhez
- **Game_Room**: Virtuális szoba, ahol a verseny zajlik
- **Exercise_Pool**: A versenyhez kiválasztott feladatok gyűjteménye
- **Leaderboard**: Valós idejű eredménytábla
- **Game_Session**: Egy teljes verseny kezdetétől a végéig
- **Real_Time_System**: WebSocket alapú kommunikációs rendszer
- **Teacher_Profile**: Tanári fiók személyes beállításokkal és game history-val
- **Authentication_System**: Biztonságos bejelentkezési rendszer tanárok számára

## Requirements

### Requirement 1: Teacher Authentication System

**User Story:** Mint tanár, szeretnék saját profillal bejelentkezni, hogy személyre szabott versenyeket hozhassak létre és követhessem az eredményeimet.

#### Acceptance Criteria

1. WHEN tanár megnyitja az alkalmazást, THEN egy tiszta bejelentkezési oldalt lát (csak username + password mezők)
2. THE Authentication_System SHALL támogatni tanári regisztrációt és bejelentkezést
3. WHEN tanár helyes adatokat ad meg, THEN bejelentkezik és eléri a dashboard-ot
4. WHEN tanár hibás adatokat ad meg, THEN hibaüzenetet kap és a bejelentkezési oldalon marad
5. THE System SHALL tárolni a tanár személyes beállításait és game history-ját

### Requirement 2: Teacher Profile Management

**User Story:** Mint tanár, szeretném kezelni a profilomat és látni a korábbi versenyeimet, hogy nyomon követhessem a tanítási aktivitásomat.

#### Acceptance Criteria

1. THE Teacher_Profile SHALL tárolni a tanár nevét, email címét és személyes beállításait
2. WHEN tanár bejelentkezik, THEN látja a saját dashboard-ját a korábbi versenyekkel
3. THE System SHALL megjeleníteni a tanár által létrehozott összes game room-ot
4. WHEN tanár módosítja a profilját, THEN a változások mentésre kerülnek
5. THE System SHALL támogatni jelszó változtatást biztonságos módon

### Requirement 3: Deployment Infrastructure

**User Story:** Mint fejlesztő, szeretném az alkalmazást automatikusan telepíteni GitHub-ról Vercel-re custom domain-nel, hogy bárhonnan elérhető legyen.

#### Acceptance Criteria

1. WHEN kód push történik a GitHub main branch-re, THEN a Vercel automatikusan újratelepíti az alkalmazást
2. THE Deployment_System SHALL támogatni custom domain konfigurációt
3. WHEN telepítés sikeres, THEN az alkalmazás elérhető a custom domain-en keresztül
4. THE System SHALL támogatni environment változók kezelését a Vercel-en
5. WHEN build hiba történik, THEN a Vercel értesítést küld és a korábbi verzió marad aktív

### Requirement 4: Database és Backend Infrastructure

**User Story:** Mint rendszergazda, szeretnék egy skálázható backend infrastruktúrát, hogy a valós idejű versenyeket és tanári profilokat támogassa.

#### Acceptance Criteria

1. THE Backend_System SHALL használni Vercel serverless functions-t
2. THE Database SHALL támogatni tanári authentication és profil adatokat
3. WHEN több száz diák csatlakozik egyszerre, THEN a rendszer stabil marad
4. THE System SHALL támogatni WebSocket kapcsolatokat
5. THE Database SHALL tárolni teachers, game sessions, players, és results adatokat

### Requirement 5: Game Room Management

**User Story:** Mint bejelentkezett tanár, szeretnék versenyeket létrehozni és kezelni, hogy osztálytermi aktivitásokat szervezhessek.

#### Acceptance Criteria

1. WHEN bejelentkezett tanár létrehoz egy game room-ot, THEN a rendszer generál egy egyedi room code-ot
2. THE Teacher SHALL kiválaszthatni feladatokat a saját Exercise_Pool-jából
3. WHEN room létrejön, THEN a tanár megoszthatja a room code-ot a diákokkal
4. THE Teacher SHALL beállíthatni a verseny paramétereit (időlimit, pontszám, stb.)
5. WHEN verseny aktív, THEN csak a room tulajdonos Teacher irányíthatja a játékmenetet

### Requirement 6: Player Registration és Authentication

**User Story:** Mint diák, szeretnék egyszerűen csatlakozni versenyekhez a nevemmel, hogy részt vehessek az osztálytermi aktivitásokban.

#### Acceptance Criteria

1. WHEN diák megad egy room code-ot és nevet, THEN csatlakozhat a versenyhez
2. THE System SHALL ellenőrizni, hogy a név egyedi a room-on belül
3. WHEN név már foglalt, THEN a rendszer alternatívát javasol
4. THE Player SHALL láthatni a room információkat csatlakozás után
5. WHEN Game_Host elindítja a versenyt, THEN minden Player automatikusan átirányítódik

### Requirement 5: Real-Time Gameplay

**User Story:** Mint résztvevő, szeretnék valós időben versenyezni társaimmal, hogy élvezetes legyen a tanulás.

#### Acceptance Criteria

1. WHEN Game_Host elindít egy kérdést, THEN minden Player egyidejűleg látja
2. THE Real_Time_System SHALL szinkronizálni a válaszokat minden Player között
3. WHEN Player válaszol, THEN a válasz azonnal megjelenik a Leaderboard-on
4. THE System SHALL számolni a válaszidőt és pontokat
5. WHEN kérdés véget ér, THEN minden Player látja az eredményeket

### Requirement 6: Leaderboard és Scoring

**User Story:** Mint résztvevő, szeretném látni a valós idejű eredményeket, hogy tudjam, hogyan állok a versenyben.

#### Acceptance Criteria

1. THE Leaderboard SHALL valós időben frissülni minden válasz után
2. WHEN Player helyesen válaszol, THEN pontot kap a válaszidő alapján
3. THE Scoring_System SHALL támogatni különböző pontszámítási módokat
4. WHEN verseny véget ér, THEN a végső eredmények mentésre kerülnek
5. THE System SHALL megjeleníteni részletes statisztikákat minden Player-nek

### Requirement 7: Exercise Integration

**User Story:** Mint tanár, szeretném használni a meglévő feladatokat versenyekben, hogy ne kelljen újakat létrehoznom.

#### Acceptance Criteria

1. THE System SHALL importálni feladatokat a meglévő Exercise_Pool-ból
2. WHEN tanár kiválaszt feladatokat, THEN azok automatikusan verseny formátumra konvertálódnak
3. THE System SHALL támogatni MATCHING, CATEGORIZATION és QUIZ típusú feladatokat
4. WHEN feladat nem kompatibilis, THEN a rendszer figyelmeztetést ad
5. THE Game_Host SHALL szerkesztheti a feladatokat verseny előtt

### Requirement 8: Mobile Responsiveness

**User Story:** Mint diák, szeretném használni a rendszert mobilon és tableten, hogy bárhol részt vehessek a versenyekben.

#### Acceptance Criteria

1. THE User_Interface SHALL reszponzív lenni minden eszközön
2. WHEN diák mobilt használ, THEN a UI automatikusan alkalmazkodik
3. THE Touch_Interface SHALL támogatni swipe és tap gesztusokat
4. WHEN képernyő kicsi, THEN a UI elemek átrendeződnek
5. THE System SHALL gyors lenni lassabb mobilhálózatokon is

### Requirement 9: Analytics és Reporting

**User Story:** Mint tanár, szeretnék részletes jelentéseket a versenyekről, hogy értékeljem a diákok teljesítményét.

#### Acceptance Criteria

1. THE System SHALL tárolni minden Game_Session részletes adatait
2. WHEN verseny véget ér, THEN automatikus jelentés generálódik
3. THE Analytics_System SHALL mutatni válaszidőket, pontszámokat és hibákat
4. THE Game_Host SHALL exportálhatja az eredményeket CSV formátumban
5. THE System SHALL támogatni hosszú távú teljesítmény követést

### Requirement 10: Performance és Scalability

**User Story:** Mint rendszergazda, szeretném, hogy a rendszer stabil legyen nagy terhelés alatt is.

#### Acceptance Criteria

1. THE System SHALL támogatni minimum 100 egyidejű Player-t room-onként
2. WHEN nagy terhelés van, THEN a válaszidő maradjon 2 másodperc alatt
3. THE Real_Time_System SHALL automatikusan skálázódni Vercel-en
4. WHEN hálózati hiba történik, THEN a rendszer automatikusan újracsatlakozik
5. THE Database SHALL optimalizált lenni gyors lekérdezésekre