# Tanári Útmutató - Hálózati Munkamenet

## Gyors Indítás

### 1. Szerver Indítása (Tanár Gépe)
```bash
npm run dev:network
```

Ez elindítja a szervert úgy, hogy a hálózaton is elérhető legyen.

### 2. IP Cím Megkeresése
**Windows:**
- Nyisd meg a Parancssort (cmd)
- Írd be: `ipconfig`
- Keresd meg a "IPv4 Address" sort (pl. 192.168.1.100)

**Mac:**
- Nyisd meg a Terminált
- Írd be: `ifconfig | grep inet`

### 3. Diákoknak Add Meg
A diákok ezt a címet használják:
```
http://[TE_IP_CÍMED]:3000
```

Például: `http://192.168.1.100:3000`

### 4. Munkamenet Létrehozása
1. Bejelentkezés a tanári felületre
2. "Munkamenet" fül
3. Feladatok kiválasztása
4. "Munkamenet indítása" gomb
5. Megjelenik a 6 karakteres kód (pl. ABC123)

### 5. Diákok Csatlakozása
1. Diák megnyitja a http://[TE_IP]:3000 címet
2. "Diák" gombot választja
3. Név és osztály megadása
4. Tanári kód beírása (ABC123)
5. Feladatok megkezdése

## Hibaelhárítás

### "Nem érhető el a szerver"
- Ellenőrizd, hogy fut-e a `npm run dev:network` parancs
- Próbáld ki a localhost:3000 címet a saját gépeden
- Ellenőrizd a tűzfal beállításokat

### "Hibás tanári kód"
- Győződj meg róla, hogy létrehoztad a munkamenetet
- A kód 6 karakter hosszú és nagybetűkből áll
- Próbáld újra létrehozni a munkamenetet

### Lassú kapcsolat
- Ellenőrizd a WiFi kapcsolatot
- Próbáld ethernet kábellel
- Zárj be felesleges programokat

## Tippek

### Stabil Kapcsolat
- Használj ethernet kábelt WiFi helyett
- Győződj meg róla, hogy minden eszköz ugyanazon a hálózaton van
- Kerüld a nagy fájlok letöltését munkamenet közben

### Több Osztály
- Minden osztálynak külön munkamenetet hozz létre
- Használj egyértelmű kódokat
- Írd fel a kódokat, hogy ne keveredjenek

### Eredmények Mentése
- A diák eredmények automatikusan mentődnek
- A "Eredmények megtekintése" gombbal láthatod őket
- Exportálhatod őket fájlba a későbbi elemzéshez

## Technikai Segítség

Ha problémád van:
1. Indítsd újra a szervert: Ctrl+C, majd `npm run dev:network`
2. Ellenőrizd a konzol üzeneteket
3. Próbáld ki a `npm run test:network` parancsot
4. Nézd meg a NETWORK_SETUP_GUIDE.md fájlt részletesebb információkért