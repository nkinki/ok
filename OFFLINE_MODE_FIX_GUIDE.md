# Offline Mód Javítás - Útmutató

## 🎯 Probléma
A diákok kidolgozás közben látják a pontokat, de az eredmények nem kerülnek mentésre a tanári felületen.

## ✅ Megoldás
Az alkalmazás most automatikusan felismeri és javítja az offline módot.

---

## 👨‍🎓 Diákoknak

### 🔍 Hogyan ismered fel az offline módot?
- **⚠️ Offline** jelző a neved mellett
- **Narancssárga figyelmeztetés** az oldal tetején
- "Az eredményeid nem kerülnek mentésre" üzenet

### 🔧 Mit tehetsz?
1. **Automatikus javítás**: A rendszer automatikusan próbálja újracsatlakoztatni
2. **Kézi javítás**: Kattints az **"🔄 Újracsatlakozás"** gombra
3. **Frissítés**: Ha semmi sem működik, frissítsd az oldalt (F5) és csatlakozz újra

### ✅ Hogyan tudod, hogy online vagy?
- **✅ Online** jelző a neved mellett
- **Nincs narancssárga figyelmeztetés**
- Az eredményeid mentésre kerülnek

---

## 👨‍🏫 Tanároknak

### 🔍 Hogyan ismered fel az offline diákokat?
- **Munkamenet előzményekben**: 0 pont, 0% átlag
- **Részletes nézetben**: "Nincsenek részletes eredmények"
- **Valós idejű frissítés**: 10 másodpercenként frissül

### 🔧 Mit tehetsz?
1. **Figyelmeztess a diákokat**: Mondd meg nekik, hogy nézzék meg az offline/online jelzőt
2. **Újracsatlakozás**: Kérd meg őket, hogy kattintsanak az "Újracsatlakozás" gombra
3. **Új munkamenet**: Ha szükséges, hozz létre új munkamenetet

### 📊 Monitoring
- A tanári felület **automatikusan frissül** 10 másodpercenként
- A részletes nézet **5 másodpercenként** frissül
- **Élő adatok** jelző mutatja, hogy a frissítés működik

---

## 🔧 Technikai Részletek

### Automatikus Javítás
- **Offline ID felismerés**: `student_*` vagy `offline-*` ID-k
- **Automatikus újracsatlakozás**: Eredmény beküldéskor próbálkozik
- **Student ID frissítés**: Sikeres csatlakozás után frissíti az ID-t

### Hibakeresés
- **Konzol logok**: F12 → Console → részletes hibainformációk
- **Hálózati problémák**: Ellenőrizd az internetkapcsolatot
- **Session kódok**: Győződj meg róla, hogy a helyes kódot használod

### Gyakori Okok
1. **Hálózati problémák**: Gyenge internetkapcsolat
2. **Lejárt munkamenetek**: 60 perc után automatikusan lejárnak
3. **Böngésző problémák**: Régi cache vagy cookies
4. **JavaScript hibák**: Böngésző kompatibilitási problémák

---

## 🎯 Gyors Megoldások

### Diákoknak
```
1. Nézd meg: ⚠️ Offline vagy ✅ Online?
2. Ha offline: Kattints "🔄 Újracsatlakozás"
3. Ha nem működik: F5 → újra csatlakozás
```

### Tanároknak
```
1. Ellenőrizd: Frissül-e a résztvevők száma?
2. Ha nem: Kérd meg a diákokat az újracsatlakozásra
3. Monitoring: Figyeld az "Élő adatok" jelzőt
```

---

## ✅ Sikeres Javítás Jelei

### Diákoknál
- ✅ **Online** jelző látható
- **Nincs** narancssárga figyelmeztetés
- **Pontok mentésre kerülnek** minden feladat után

### Tanároknál
- **Résztvevők száma növekszik**
- **Eredmények megjelennek** a részletes nézetben
- **Százalékok kiszámolódnak** automatikusan

---

**Utolsó frissítés**: 2026. január 29.  
**Státusz**: ✅ Javítás implementálva és tesztelve