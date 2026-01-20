# Hálózati Munkamenet Használati Útmutató

## Probléma
A diákok más gépekről nem tudnak csatlakozni a munkamenetekhez, mert a feladatok csak a tanár gépén vannak betöltve (localStorage).

## Megoldás

### 1. Helyi Hálózati Szerver (Ajánlott)

#### Tanár Gépe
```bash
# Indítsd el a szervert hálózati hozzáféréssel
npm run dev:network
```

#### IP Cím Megkeresése
**Windows:**
```cmd
ipconfig
```
Keress egy IP címet: `192.168.x.x` vagy `10.x.x.x`

#### Diák Gépek
Nyissák meg ezt a címet:
```
http://[TANÁR_IP_CÍME]:3000
```

### 2. Production Deployment (Vercel)

#### Előnyök
- ✅ Minden gépről elérhető
- ✅ Nincs szükség helyi szerverre
- ✅ Automatikus session szinkronizáció

#### Hátrányok
- ⚠️ Internet kapcsolat szükséges
- ⚠️ Vercel function limitek

## Működési Logika

### Session Létrehozás (Tanár)
1. **API Mentés** (elsődleges) - Hálózati hozzáféréshez
2. **localStorage Mentés** (backup) - Helyi hozzáféréshez

### Session Hozzáférés (Diák)
1. **API Ellenőrzés** (elsődleges) - Hálózati hozzáférés
2. **localStorage Fallback** (másodlagos) - Helyi hozzáférés

## Debug és Tesztelés

### API Tesztelés
Nyisd meg: `http://[SZERVER_CÍME]/test-api-debug.html`

Ez teszteli:
- ✅ API health check
- ✅ Session létrehozás
- ✅ Session ellenőrzés
- ✅ Feladatok lekérése

### Console Üzenetek
Nyisd meg a böngésző Developer Tools (F12) → Console fület:

**Tanár (Session létrehozás):**
```
🌐 Creating session via API...
📊 Session data: {code: "ABC123", exerciseCount: 5}
📡 API create response status: 200
✅ Session created via API for network sharing
```

**Diák (Session csatlakozás):**
```
🌐 Checking API for session...
📡 API check response status: 200
📡 API check data: {exists: true, session: {...}}
📡 API exercises response status: 200
✅ Session loaded from API (network access)
📊 Exercise count: 5
```

## Hibaelhárítás

### "Hibás tanári kód" Hiba

#### 1. Ellenőrizd a Console-t
```javascript
// Ha ezt látod:
❌ Session not found in API
❌ Session not found in localStorage

// Akkor a session nem jött létre megfelelően
```

#### 2. Teszteld az API-t
- Nyisd meg: `/test-api-debug.html`
- Futtasd le a teszteket
- Nézd meg, hogy melyik lépés hibázik

#### 3. Hálózati Problémák
```javascript
// Ha ezt látod:
⚠️ API session check failed: TypeError: Failed to fetch

// Akkor hálózati probléma van
```

**Megoldások:**
- Ellenőrizd az IP címet
- Ellenőrizd a tűzfal beállításokat
- Próbáld meg ugyanazon WiFi hálózaton
- Használj `npm run dev:network` parancsot

### Session Nem Jön Létre

#### 1. API Hiba
```javascript
⚠️ API session creation failed with status: 404
```

**Megoldás:** Ellenőrizd, hogy a szerver fut-e

#### 2. Adatbázis Hiba
```javascript
⚠️ API session creation failed: {...}
```

**Megoldás:** Indítsd újra a szervert

## Legjobb Gyakorlatok

### Tanárok Számára
1. **Mindig teszteld** a session létrehozás után
2. **Ellenőrizd a console üzeneteket** hibák esetén
3. **Használj egyértelmű kódokat** (pl. MATEK1, TORI2)
4. **Indítsd újra a szervert** ha problémák vannak

### Diákok Számára
1. **Ellenőrizd az IP címet** pontosan
2. **Használd ugyanazt a WiFi hálózatot**
3. **Frissítsd az oldalt** ha nem működik
4. **Szólj a tanárnak** ha továbbra sem megy

## Technikai Részletek

### API Endpoints
- `POST /api/simple-api/sessions/create` - Session létrehozás
- `GET /api/simple-api/sessions/{code}/check` - Session ellenőrzés
- `GET /api/simple-api/sessions/{code}/exercises` - Feladatok lekérése

### Adatstruktúra
```javascript
// Session objektum
{
  code: "ABC123",
  exercises: [
    {
      id: "exercise-1",
      imageUrl: "...",
      data: {
        title: "Feladat címe",
        instruction: "Feladat leírása",
        type: "quiz",
        content: {...}
      },
      fileName: "kep.jpg"
    }
  ],
  createdAt: "2024-01-20T10:00:00Z",
  isActive: true,
  students: []
}
```

A session tartalmazza a **teljes feladat adatokat**, így a diákoknak nem kell betölteniük a JSON fájlokat.