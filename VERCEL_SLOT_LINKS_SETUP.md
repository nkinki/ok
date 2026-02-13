# 🔗 Vercel Slot Links Beállítás

## 📋 Áttekintés

A slot linkek a Vercel környezeti változókban tárolódnak, így nem kell külön fájlt feltölteni.

## 🚀 Beállítás lépései

### 1. Munkamenet létrehozása és Drive feltöltés

```
1. Nyisd meg a tanári felületet: https://nyirad.vercel.app
2. Kattints a "🎯 Munkamenet" gombra
3. Válaszd ki a feladatokat
4. Válaszd ki a Slot számot (1-10)
5. Kattints a "Munkamenet Létrehozása" gombra
6. A JSON automatikusan letöltődik
```

### 2. Google Drive feltöltés

```
1. Nyisd meg a Google Drive-ot
2. Hozz létre egy mappát: "Okos Munkamenetek"
3. Töltsd fel a letöltött JSON fájlt
4. Jobb klikk a fájlra → "Megosztás"
5. Kattints a "Bárki, aki rendelkezik a linkkel" opcióra
6. Másold ki a linket (pl. https://drive.google.com/file/d/1ABC...)
```

### 3. Vercel környezeti változók beállítása

```
1. Nyisd meg: https://vercel.com/dashboard
2. Válaszd ki a projektet (nyirad)
3. Settings → Environment Variables
4. Add hozzá az alábbi változókat:
```

**Környezeti változók:**

| Változó neve | Érték | Példa |
|-------------|-------|-------|
| `SLOT_1_LINK` | Google Drive link | `https://drive.google.com/file/d/1ABC...` |
| `SLOT_2_LINK` | Google Drive link | `https://drive.google.com/file/d/2DEF...` |
| `SLOT_3_LINK` | Google Drive link | `https://drive.google.com/file/d/3GHI...` |
| ... | ... | ... |
| `SLOT_10_LINK` | Google Drive link | `https://drive.google.com/file/d/10XYZ...` |

**Fontos:**
- Minden változót állíts be "Production", "Preview" és "Development" környezetekre is
- Ha egy slot üres, hagyd üresen a változót

### 4. Deploy újra

```
1. Vercel automatikusan újra deploy-ol, amikor változót adsz hozzá
2. Vagy manuálisan: Deployments → Redeploy
3. Várj 1-2 percet a deploy befejezésére
```

### 5. Tesztelés

```
1. Diák bejelentkezik
2. Beírja a slot számot (pl. 1)
3. Automatikusan letöltődik a munkamenet
4. Elkezdheti a feladatokat
```

## 🔧 Slot Links Manager használata

A tanári felületen van egy "🔗 Slot Linkek" menüpont:

```
1. Kattints a "🔗 Slot Linkek" gombra
2. Látod az aktuális slot linkeket
3. Beillesztheted az új linkeket
4. Kattints a "Mentés és Letöltés" gombra
5. Letöltődik egy JSON fájl az összes linkkel
6. Másold be a linkeket a Vercel környezeti változókba
```

## 📝 Példa környezeti változó beállítás

**Vercel Dashboard:**

```
SLOT_1_LINK = https://drive.google.com/file/d/1ABC123.../view?usp=sharing
SLOT_2_LINK = https://drive.google.com/file/d/2DEF456.../view?usp=sharing
SLOT_3_LINK = 
SLOT_4_LINK = 
...
```

## ✅ Előnyök

- ✅ Nincs szükség fájl feltöltésre
- ✅ Egyszerű frissítés (csak a környezeti változót kell módosítani)
- ✅ Biztonságos (csak a Vercel Dashboard-on keresztül módosítható)
- ✅ Automatikus deploy minden változtatás után
- ✅ Nincs API kulcs vagy autentikáció szükséges

## 🆘 Hibaelhárítás

### "Slot X nincs beállítva"
- Ellenőrizd, hogy a `SLOT_X_LINK` környezeti változó be van-e állítva
- Ellenőrizd, hogy a változó nem üres-e
- Várj 1-2 percet a deploy után

### "File not found or not public"
- Ellenőrizd, hogy a Drive fájl publikus-e
- Ellenőrizd, hogy a link helyes-e
- Próbáld meg megnyitni a linket inkognitó módban

### "Slot linkek betöltése sikertelen"
- Ellenőrizd, hogy a `/api/get-slot-links` endpoint elérhető-e
- Ellenőrizd a Vercel logs-ot: Deployments → View Function Logs

## 🔄 Frissítés folyamata

Ha új munkamenetet szeretnél feltölteni:

```
1. Hozz létre új munkamenetet
2. Töltsd fel Drive-ra
3. Másold ki az új linket
4. Vercel Dashboard → Environment Variables
5. Módosítsd a megfelelő SLOT_X_LINK változót
6. Mentsd el → Automatikus redeploy
7. Várj 1-2 percet
8. Kész!
```

---

**Készítve:** 2026-02-13
**Verzió:** 2.0 (Vercel Environment Variables)
