# Deployment Útmutató - Kahoot Multiplayer System

Ez az útmutató végigvezeti a teljes deployment folyamaton új fiókokkal.

## 🚀 Deployment Lépések

### 1. GitHub Repository Létrehozása

1. **Új GitHub fiók létrehozása** (ha nincs még)
   - Menj a https://github.com oldalra
   - Regisztrálj új fiókot
   - Erősítsd meg az email címed

2. **Repository létrehozása**
   ```bash
   # Helyi git inicializálás
   git init
   git add .
   git commit -m "Initial commit - Kahoot Multiplayer System"
   
   # GitHub repository létrehozása (a GitHub webes felületen)
   # Repository neve: okos-gyakorlo-kahoot
   # Public vagy Private (ajánlott: Private)
   
   # Remote hozzáadása és push
   git remote add origin https://github.com/YOUR_USERNAME/okos-gyakorlo-kahoot.git
   git branch -M main
   git push -u origin main
   ```

### 2. Neon DB Setup

1. **Neon fiók létrehozása**
   - Menj a https://neon.tech oldalra
   - Regisztrálj GitHub fiókkal (egyszerűbb)
   - Válaszd a Free tier-t

2. **Database projekt létrehozása**
   - Project név: `okos-gyakorlo-kahoot`
   - Region: `Europe (Frankfurt)` (legközelebbi)
   - PostgreSQL version: `16` (latest)

3. **Connection string másolása**
   - A dashboard-on kattints a "Connect" gombra
   - Másold ki a connection string-et
   - Formátum: `postgresql://username:password@host/database?sslmode=require`

4. **Database schema telepítése**
   ```bash
   # Telepítsd a psql client-et (ha nincs még)
   # Windows: https://www.postgresql.org/download/windows/
   # macOS: brew install postgresql
   # Linux: sudo apt-get install postgresql-client
   
   # Csatlakozás és schema futtatása
   psql "postgresql://username:password@host/database?sslmode=require" -f database/schema.sql
   ```

### 3. Google OAuth Setup

1. **Google Cloud Console**
   - Menj a https://console.cloud.google.com oldalra
   - Hozz létre új projektet: `okos-gyakorlo-kahoot`

2. **OAuth Consent Screen beállítása**
   - APIs & Services > OAuth consent screen
   - User Type: `External`
   - App name: `Okos Gyakorló - Szent Mihály Iskola`
   - User support email: `your-email@szenmihalyatisk.hu`
   - Developer contact: `your-email@szenmihalyatisk.hu`

3. **OAuth Credentials létrehozása**
   - APIs & Services > Credentials
   - Create Credentials > OAuth 2.0 Client IDs
   - Application type: `Web application`
   - Name: `Okos Gyakorló Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-app.vercel.app` (production - később)
   - Authorized redirect URIs:
     - `http://localhost:3000` (development)
     - `https://your-app.vercel.app` (production - később)

4. **Client ID és Secret másolása**
   - Másold ki a `Client ID`-t és `Client Secret`-et
   - Ezeket a Vercel environment variables-ben fogjuk használni

### 4. Vercel Deployment

1. **Vercel fiók létrehozása**
   - Menj a https://vercel.com oldalra
   - Regisztrálj GitHub fiókkal
   - Kapcsold össze a GitHub fiókod

2. **Projekt importálása**
   - Dashboard > New Project
   - Import Git Repository
   - Válaszd ki a `okos-gyakorlo-kahoot` repository-t
   - Framework Preset: `Vite`
   - Root Directory: `./` (default)

3. **Environment Variables beállítása**
   - A deployment előtt kattints a "Environment Variables" fülre
   - Add hozzá az alábbi változókat:

   ```
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   NEON_DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
   NODE_ENV=production
   ALLOWED_EMAIL_DOMAIN=szenmihalyatisk.hu
   ```

4. **Deploy**
   - Kattints a "Deploy" gombra
   - Várd meg, amíg a build befejezik (2-3 perc)

### 5. Domain és OAuth Frissítés

1. **Vercel domain másolása**
   - A deployment után másold ki a Vercel domain-t
   - Formátum: `https://okos-gyakorlo-kahoot-xyz.vercel.app`

2. **Google OAuth frissítése**
   - Menj vissza a Google Cloud Console-ba
   - APIs & Services > Credentials
   - Szerkeszd az OAuth Client-et
   - Add hozzá a production URL-eket:
     - Authorized JavaScript origins: `https://your-app.vercel.app`
     - Authorized redirect URIs: `https://your-app.vercel.app`

3. **Custom Domain (opcionális)**
   - Vercel Dashboard > Settings > Domains
   - Add Custom Domain: `okosgyakorlo.szenmihalyatisk.hu`
   - Kövesd a DNS beállítási utasításokat

### 6. Tesztelés

1. **Production tesztelés**
   - Nyisd meg a Vercel URL-t
   - Próbálj bejelentkezni @szenmihalyatisk.hu email címmel
   - Ellenőrizd a profil szerkesztést
   - Nézd meg a játék történetet

2. **Database ellenőrzés**
   ```bash
   # Csatlakozz a Neon DB-hez
   psql "your-neon-connection-string"
   
   # Ellenőrizd a táblákat
   \dt
   
   # Nézd meg a tanárokat
   SELECT * FROM teachers;
   ```

## 🔧 Fejlesztői Környezet

### Helyi fejlesztés beállítása

1. **Environment variables**
   ```bash
   cp .env.example .env.local
   # Szerkeszd a .env.local fájlt a megfelelő értékekkel
   ```

2. **Development szerver**
   ```bash
   npm install
   npm run dev
   ```

3. **Database kapcsolat tesztelése**
   ```bash
   # Node.js script a connection tesztelésére
   node -e "
   const { healthCheck } = require('./database/connection.ts');
   healthCheck().then(result => console.log('DB Health:', result));
   "
   ```

## 📋 Checklist

- [ ] GitHub repository létrehozva és kód feltöltve
- [ ] Neon DB projekt létrehozva
- [ ] Database schema telepítve
- [ ] Google Cloud projekt létrehozva
- [ ] OAuth Consent Screen beállítva
- [ ] OAuth Credentials létrehozva
- [ ] Vercel projekt létrehozva
- [ ] Environment variables beállítva
- [ ] Első deployment sikeres
- [ ] Google OAuth URL-ek frissítve
- [ ] Production tesztelés sikeres

## 🆘 Hibaelhárítás

### Gyakori problémák

1. **Database connection error**
   - Ellenőrizd a DATABASE_URL formátumát
   - Győződj meg róla, hogy a Neon DB elérhető

2. **Google OAuth error**
   - Ellenőrizd a GOOGLE_CLIENT_ID és GOOGLE_CLIENT_SECRET értékeket
   - Győződj meg róla, hogy az OAuth URL-ek helyesek

3. **Build error**
   - Ellenőrizd a Node.js verziót (minimum 18)
   - Futtasd le a `npm install`-t újra

4. **Environment variables**
   - Vercel Dashboard > Settings > Environment Variables
   - Győződj meg róla, hogy minden változó be van állítva

## 📞 Támogatás

Ha problémába ütközöl, ellenőrizd:
1. Vercel deployment logs
2. Browser developer console
3. Neon DB connection status
4. Google Cloud Console audit logs

---

**Következő lépés**: Miután a deployment sikeres, folytathatjuk a következő funkciókkal (Game Room Management, WebSocket, stb.).