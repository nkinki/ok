# Supabase Setup Útmutató

## 1. Supabase Projekt Létrehozása

1. Menj a [supabase.com](https://supabase.com) oldalra
2. Kattints a **"Start your project"** gombra
3. Jelentkezz be GitHub/Google fiókkal
4. Kattints **"New Project"**
5. Válaszd ki a szervezetet (vagy hozz létre újat)
6. Projekt beállítások:
   - **Name**: `okos-gyakorlo` vagy `kahoot-system`
   - **Database Password**: Generálj erős jelszót (mentsd el!)
   - **Region**: `Europe (Frankfurt)` (legközelebb)
   - **Pricing Plan**: `Free tier`
7. Kattints **"Create new project"**

⏱️ **Várakozás**: 2-3 perc, amíg a projekt létrejön.

## 2. Kapcsolódási Adatok Megszerzése

A projekt létrehozása után:

1. **Settings** → **API** menüpont
2. Másold ki ezeket az értékeket:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `eyJ...` (hosszú token)
3. **Settings** → **Database** menüpont
4. Másold ki a **Connection string**-et:
   - `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`

## 3. Környezeti Változók Beállítása

Hozd létre a `.env.local` fájlt a projekt gyökérkönyvtárában:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres

# Google OAuth (később)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_EMAIL_DOMAIN=szenmihalyatisk.hu
```

## 4. Függőségek Telepítése

```bash
# Supabase client telepítése
npm install @supabase/supabase-js

# Vagy ha már telepítve van:
npm install
```

## 5. Adatbázis Séma Létrehozása

```bash
# Automatikus setup futtatása
npm run supabase:setup
```

Vagy manuálisan a Supabase dashboardban:

1. **SQL Editor** → **New query**
2. Másold be ezt a kódot:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'student',
  institution VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) NOT NULL,
  teacher_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting',
  max_players INTEGER DEFAULT 30,
  exercises JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Game results table
CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id),
  player_name VARCHAR(255) NOT NULL,
  player_email VARCHAR(255),
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Teachers can create game sessions" ON game_sessions
FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Anyone can view active game sessions" ON game_sessions
FOR SELECT USING (status = 'active' OR status = 'waiting');
```

3. Kattints **"Run"**

## 6. Google OAuth Beállítása (Opcionális)

1. **Authentication** → **Settings** → **Auth Providers**
2. **Google** provider engedélyezése
3. Add meg a Google OAuth credentials-t
4. **Site URL**: `http://localhost:3000` (development)
5. **Redirect URLs**: `http://localhost:3000/auth/callback`

## 7. Tesztelés

```bash
# Adatbázis kapcsolat tesztelése
npm run db:health

# Teljes rendszer indítása
npm run dev:full
```

## 8. Vercel Deployment Frissítése

Vercel dashboardban add hozzá ezeket a környezeti változókat:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
ALLOWED_EMAIL_DOMAIN=szenmihalyatisk.hu
```

## 9. Ellenőrzés

✅ **Supabase projekt létrehozva**  
✅ **Környezeti változók beállítva**  
✅ **Függőségek telepítve**  
✅ **Adatbázis séma létrehozva**  
✅ **Kapcsolat tesztelve**  
✅ **Alkalmazás fut**  

## Hibaelhárítás

### "relation does not exist" hiba
- Futtasd újra: `npm run supabase:setup`
- Vagy hozd létre manuálisan a táblákat az SQL Editor-ban

### Kapcsolódási hiba
- Ellenőrizd a `.env.local` fájlt
- Győződj meg róla, hogy a jelszó helyes
- Próbáld meg a connection string-et a Supabase dashboardból újra másolni

### RLS (Row Level Security) problémák
- Ideiglenesen kapcsold ki: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
- Vagy állítsd be a megfelelő policy-kat

## Következő Lépések

1. **Tesztelés**: Próbáld ki a fix szobákat
2. **Optimalizálás**: Figyeld a teljesítményt
3. **Monitoring**: Állíts be alerteket a Supabase dashboardban
4. **Backup**: Automatikus backup már be van állítva

Ha bármi probléma van, szólj! 🚀