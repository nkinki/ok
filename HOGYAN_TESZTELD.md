# Hogyan Teszteld a Javítást

## Mi volt a probléma?

A munkamenetek **NEM** kerültek mentésre a Supabase adatbázisba, ezért:
- A diákok mindig **mock adatokat** (`drive_only_ex1`, `drive_only_ex2`) láttak
- A hálózati használat nem működött (20 gép)
- Az eredmények nem kerültek mentésre

## Mi a javítás?

Most a munkamenetek **mentésre kerülnek** a Supabase adatbázisba, így:
- ✅ A diákok **valódi feladatokat** látnak
- ✅ Hálózati használat működik (20 gép)
- ✅ Az eredmények mentésre kerülnek

---

## 1. Automatikus Teszt (Gyors)

```bash
node test-session-creation-fix.js
```

**Mit vársz:**
```
✅ Session created successfully!
✅ Session found in Supabase!
✅ REAL DATA LOADED! No mock data!
✅ Student joined successfully!
🎉 ALL TESTS PASSED!
```

**Ha hibát látsz:**
- Ellenőrizd a Vercel deployment státuszt
- Várj 1-2 percet a deployment után
- Próbáld újra

---

## 2. Manuális Teszt (UI-val)

### A) Tanár oldal:

1. **Nyisd meg az alkalmazást:**
   ```
   https://nyirad.vercel.app
   ```

2. **Jelentkezz be tanárként:**
   - Válaszd ki a tantárgyat (pl. Informatika)

3. **Hozz létre munkamenetet:**
   - Válassz ki 1-2 feladatot
   - Válaszd ki az osztályt (pl. 8.a)
   - Kattints "Munkamenet indítása"

4. **Ellenőrizd a konzolt (F12):**
   ```
   ☁️ Supabase mode - creating session in database
   📤 Calling API to create session in Supabase...
   ✅ Session created in Supabase: {...}
   💾 Session data also stored in localStorage as backup
   🎯 Supabase munkamenet aktív: ABC123
   ```

5. **Jegyezd fel a kódot** (pl. `ABC123`)

### B) Diák oldal:

1. **Nyisd meg új böngésző ablakban:**
   ```
   https://nyirad.vercel.app
   ```

2. **Jelentkezz be diákként:**
   - Írd be a nevet (pl. "Teszt Diák")
   - Válaszd ki az osztályt (pl. 8.a)
   - **Írd be a munkamenet kódot** (pl. `ABC123`)

3. **Ellenőrizd a konzolt (F12):**
   ```
   ✅ Session JSON loaded from Supabase
   📊 Exercise count: 2
   🖼️ Image check - Has images: 2 out of 2
   ```

4. **NE lásd ezeket:**
   ```
   ❌ drive_only_ex1
   ❌ drive_only_ex2
   ❌ MOCK DATA
   ```

5. **Lásd a valódi feladatokat:**
   - Valódi feladat címek
   - Valódi képek
   - Valódi tartalom

---

## 3. Ellenőrizd az Adatbázist

```bash
node check-session-in-supabase.js
```

**Írd be a munkamenet kódot** (pl. `ABC123`)

**Mit vársz:**
```
✅ Session found in Supabase!
📊 Session details:
   - Code: ABC123
   - Subject: info
   - Class: 8.a
   - Exercise count: 2
   - Is active: true
```

---

## 4. Hálózati Teszt (20 Gép)

### Előkészítés:
1. Tanár létrehoz egy munkamenetet (pl. kód: `NETWORK123`)
2. Tanár megosztja a kódot a diákokkal

### Teszt:
1. **Minden diák** (20 gép) bejelentkezik ugyanazzal a kóddal
2. **Minden diák** látja ugyanazokat a feladatokat
3. **Minden diák** megoldja a feladatokat
4. **Tanár** látja az összes diák eredményét

### Ellenőrzés:
- ✅ Minden diák ugyanazokat a feladatokat látja
- ✅ Nincs mock adat (`drive_only_ex1`)
- ✅ Az eredmények mentésre kerülnek
- ✅ A tanár látja az összes diákot

---

## 5. Google Drive Státusz

**Fontos:** A Google Drive **NEM kötelező** a Hybrid módhoz!

### Ha nincs beállítva:
- ✅ A munkamenetek **Supabase-ben** vannak
- ✅ A képek **Supabase-ben** vannak (vagy base64)
- ✅ Minden működik, de több Supabase forgalom

### Ha be van állítva:
- ✅ A munkamenetek **Supabase-ben** vannak
- ✅ A képek **Google Drive-on** vannak
- ✅ Kevesebb Supabase forgalom (95% csökkentés)

### Hogyan állítsd be (opcionális):
1. Nyisd meg a tanári felületet
2. Kattints a "Google Drive beállítása" gombra
3. Jelentkezz be Google fiókkal
4. Válaszz egy mappát a képeknek

---

## Gyakori Kérdések

### Q: Még mindig mock adatokat látok?
**A:** 
1. Töröld a böngésző cache-t (Ctrl+Shift+Delete)
2. Töröld a localStorage-t (F12 → Application → Local Storage → Clear)
3. Hozz létre **új** munkamenetet (ne használj régit)
4. Várj 1-2 percet a Vercel deployment után

### Q: A diák nem tud csatlakozni?
**A:**
1. Ellenőrizd, hogy a munkamenet kód helyes-e
2. Ellenőrizd, hogy a munkamenet aktív-e (60 perc lejárat)
3. Ellenőrizd a konzolt hibákért (F12)
4. Próbáld újra létrehozni a munkamenetet

### Q: Hogyan tudom, hogy működik?
**A:**
1. Futtasd: `node test-session-creation-fix.js`
2. Ha `🎉 ALL TESTS PASSED!` → Működik!
3. Ha hiba → Nézd meg a hibaüzenetet

### Q: Mi a különbség Drive-Only és Hybrid mód között?
**A:**

| Mód | Adatbázis | Képek | Hálózat | Használat |
|-----|-----------|-------|---------|-----------|
| **Drive-Only** | localStorage | Google Drive | ❌ NEM | 1 gép |
| **Hybrid** | Supabase | Google Drive | ✅ IGEN | 20+ gép |

**Jelenleg:** Hybrid mód (Supabase + Google Drive)

---

## Sikeres Teszt Jelei

✅ Tanár létrehoz munkamenetet → Konzol: "Session created in Supabase"
✅ Diák csatlakozik → Konzol: "Session JSON loaded from Supabase"
✅ Diák látja a valódi feladatokat (nem mock)
✅ Diák megoldja a feladatokat → Eredmények mentésre kerülnek
✅ Tanár látja a diák eredményét
✅ Több diák csatlakozhat ugyanazzal a kóddal

---

## Következő Lépések

1. ✅ **Teszteld a javítást** (futtasd a teszteket)
2. ✅ **Ellenőrizd a UI-t** (hozz létre munkamenetet)
3. ✅ **Teszteld hálózaton** (több gép)
4. ✅ **Állítsd be a Google Drive-ot** (opcionális, de ajánlott)

---

**Kérdések?** Nézd meg a `FIX_MOCK_DATA_ISSUE.md` fájlt részletekért!
