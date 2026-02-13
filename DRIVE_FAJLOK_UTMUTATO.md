# 📁 Google Drive Fájlok Rendszere

## 🎯 Egyszerű szabály:

**Minden slot-hoz 1 fix fájl a Drive-on!**

```
Slot 1 → SLOT_1_MUNKAMENET.json
Slot 2 → SLOT_2_MUNKAMENET.json
Slot 3 → SLOT_3_MUNKAMENET.json
Slot 4 → SLOT_4_MUNKAMENET.json
Slot 5 → SLOT_5_MUNKAMENET.json
```

## 📝 Első beállítás (egyszer):

### 1. Hozd létre a fix fájlokat a Drive-on

```
1. Nyisd meg a Google Drive-ot
2. Hozz létre egy mappát: "Okos Munkamenetek"
3. Hozz létre 5 üres JSON fájlt:
   - SLOT_1_MUNKAMENET.json
   - SLOT_2_MUNKAMENET.json
   - SLOT_3_MUNKAMENET.json
   - SLOT_4_MUNKAMENET.json
   - SLOT_5_MUNKAMENET.json
```

### 2. Állítsd be publikusra

```
Minden fájlra:
1. Jobb klikk → "Megosztás"
2. "Bárki, aki rendelkezik a linkkel"
3. Másold ki a linket
```

### 3. Állítsd be a linkeket

```
Beállítások (⚙️) → Slot Linkek szekció:
- Slot 1: https://drive.google.com/file/d/...
- Slot 2: https://drive.google.com/file/d/...
- Slot 3: https://drive.google.com/file/d/...
- Slot 4: https://drive.google.com/file/d/...
- Slot 5: https://drive.google.com/file/d/...
```

## 🔄 Napi használat:

### Tanár létrehoz munkamenetet:

```
1. Munkamenet → Feladatok kiválasztása
2. Slot szám: 1 (vagy 2, 3, 4, 5)
3. Indít
4. Letöltődik: SLOT_1_MUNKAMENET.json
```

### Tanár feltölti Drive-ra:

```
1. Megkeresi a Drive-on: SLOT_1_MUNKAMENET.json
2. Jobb klikk → "Manage versions" vagy egyszerűen húzd rá
3. Felülírja az új tartalommal
4. A link UGYANAZ marad!
5. Kész!
```

### Diák betölti:

```
1. Bejelentkezik
2. Slot szám: 1
3. Automatikusan letöltődik a SLOT_1_MUNKAMENET.json
4. Elkezdi a feladatokat
```

## ✅ Előnyök:

- ✅ Egyértelmű fájlnevek
- ✅ Nincs kavarodás
- ✅ Link nem változik
- ✅ Gyors frissítés
- ✅ Egyszerű rendszer

## 🔍 Példa:

**Hétfő reggel:**
- Tanár: Slot 1 → Matematika feladatok
- Letöltődik: `SLOT_1_MUNKAMENET.json`
- Feltölti Drive-ra (felülírja)
- Diákok: Slot 1 → Matematika betöltődik

**Hétfő délután:**
- Tanár: Slot 2 → Magyar feladatok
- Letöltődik: `SLOT_2_MUNKAMENET.json`
- Feltölti Drive-ra (felülírja)
- Diákok: Slot 2 → Magyar betöltődik

**Kedd reggel:**
- Tanár: Slot 1 → Új matematika feladatok
- Letöltődik: `SLOT_1_MUNKAMENET.json`
- Feltölti Drive-ra (felülírja a hétfői matematikát)
- Diákok: Slot 1 → Új matematika betöltődik

## 🆘 Hibaelhárítás:

### "Melyik fájlt írjam felül?"
- Slot 1 → `SLOT_1_MUNKAMENET.json`
- Slot 2 → `SLOT_2_MUNKAMENET.json`
- stb.

### "Új fájlt kell létrehoznom?"
- NEM! Mindig ugyanazt a fájlt írd felül!
- A link így nem változik

### "Mi van, ha új linket kapok?"
- Ellenőrizd, hogy ugyanazt a fájlt írtad-e felül
- Ha új fájlt hoztál létre, töröld és használd a régit

---

**Készítve:** 2026-02-13
**Verzió:** 1.0 - Egyszerűsített rendszer
