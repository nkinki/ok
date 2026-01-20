# Hálózati Munkamenet Beállítási Útmutató

## Probléma
A diákok más gépekről nem tudnak csatlakozni a tanári munkamenetekhez, csak ugyanabban a böngészőben működik.

## Megoldás
A rendszer most már támogatja a hálózati hozzáférést API-n keresztül.

## Beállítás Lépései

### 1. Szerver Indítása
A tanár gépén indítsd el a szervert:

```bash
# Fejlesztési környezetben
npm run dev

# Vagy production build-del
npm run build
npm run preview
```

### 2. Hálózati IP Cím Meghatározása
A tanár gépén nézd meg a helyi IP címet:

**Windows:**
```cmd
ipconfig
```

**Mac/Linux:**
```bash
ifconfig
```

Keress egy IP címet, ami valószínűleg 192.168.x.x vagy 10.x.x.x formátumú.

### 3. Tűzfal Beállítások
Győződj meg róla, hogy a tűzfal engedi a 3000-es portot (vagy amelyiken a szerver fut).

**Windows Defender Tűzfal:**
1. Vezérlőpult → Rendszer és biztonság → Windows Defender tűzfal
2. Speciális beállítások
3. Bejövő szabályok → Új szabály
4. Port → TCP → 3000
5. Kapcsolat engedélyezése

### 4. Diák Hozzáférés
A diákok a következő URL-en érhetik el az alkalmazást:

```
http://[TANÁR_IP_CÍME]:3000
```

Például:
```
http://192.168.1.100:3000
```

### 5. Munkamenet Létrehozása
1. Tanár: Bejelentkezés → Munkamenet → Feladatok kiválasztása → Munkamenet indítása
2. A rendszer létrehoz egy 6 karakteres kódot (pl. ABC123)
3. Ez a kód most már elérhető a hálózaton keresztül is

### 6. Diák Csatlakozás
1. Diák: Megnyitja a http://[TANÁR_IP]:3000 címet
2. Diák mód választása
3. Név, osztály megadása
4. Tanári kód beírása (ABC123)
5. Feladatok megkezdése

## Hibaelhárítás

### "Hibás tanári kód" hiba
- Ellenőrizd, hogy a tanár valóban elindította-e a munkamenetet
- Győződj meg róla, hogy a kód helyesen van beírva (6 karakter, nagybetűk)
- Próbáld újra létrehozni a munkamenetet

### Hálózati kapcsolat problémák
- Ellenőrizd, hogy mindkét gép ugyanazon a hálózaton van-e
- Próbáld ki a ping parancsot: `ping [TANÁR_IP_CÍME]`
- Ellenőrizd a tűzfal beállításokat

### Szerver nem elérhető
- Győződj meg róla, hogy a szerver fut a tanár gépén
- Ellenőrizd a port számot (alapértelmezetten 3000)
- Próbáld meg a localhost:3000 címet a tanár gépén

## Technikai Részletek

### API Endpoints
- `POST /api/simple-api/sessions/create` - Munkamenet létrehozása
- `GET /api/simple-api/sessions/{code}/check` - Munkamenet ellenőrzése
- `GET /api/simple-api/sessions/{code}/exercises` - Feladatok lekérése
- `POST /api/simple-api/sessions/{code}/stop` - Munkamenet leállítása

### Adattárolás
- **API (hálózati)**: A munkamenetek a szerver memóriájában tárolódnak
- **localStorage (helyi)**: Backup tárolás ugyanabban a böngészőben
- **Hibrid megközelítés**: Először API-t próbál, majd localStorage fallback

### Biztonsági Megfontolások
- A munkamenetek csak a helyi hálózaton érhetők el
- Nincs külső internet hozzáférés szükséges
- A munkamenetek automatikusan lejárnak szerver újraindításkor

## Tesztelés

Futtasd a hálózati tesztet:
```bash
node test-network-session.js
```

Ez ellenőrzi, hogy az API megfelelően működik-e.