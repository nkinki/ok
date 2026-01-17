# Adatbázis Migráció Útmutató - Neon → Supabase

## Miért váltani?

- **Neon**: Drágább lesz több projekttel, korlátozott free tier
- **Supabase**: Nagyobb free tier, több funkció, jobb ár/érték arány

## Supabase előnyei:

✅ **500MB** adatbázis (vs Neon 512MB)  
✅ **2GB** sávszélesség havonta  
✅ **Beépített auth** (Google OAuth támogatás)  
✅ **Real-time subscriptions** (WebSocket helyett)  
✅ **File storage** (képek tárolásához)  
✅ **Dashboard** és SQL editor  
✅ **Automatic backups**  

## Migráció lépései:

### 1. Supabase projekt létrehozása

1. Menj a [supabase.com](https://supabase.com) oldalra
2. Regisztrálj/jelentkezz be
3. "New Project" → Add meg a projekt nevét
4. Válassz régiót (Frankfurt - legközelebb)
5. Generálj erős jelszót

### 2. Adatok exportálása Neon-ból

```bash
# Neon adatbázis dump készítése
pg_dump "postgresql://username:password@host/database?sslmode=require" > neon_backup.sql

# Vagy csak a sémát:
pg_dump --schema-only "postgresql://username:password@host/database?sslmode=require" > schema.sql

# Csak az adatokat:
pg_dump --data-only "postgresql://username:password@host/database?sslmode=require" > data.sql
```

### 3. Supabase konfigurálása

A Supabase dashboardban:

1. **Settings** → **Database** → Connection string másolása
2. **SQL Editor** → Új query → Schema létrehozása
3. **Authentication** → **Settings** → Google OAuth beállítása

### 4. Környezeti változók frissítése

```env
# .env.local fájlban:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Google OAuth (Supabase-ben beállítva)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Kód módosítások

#### A. Database connection frissítése

```typescript
// database/connection.ts - Supabase verzió
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// PostgreSQL connection is still available:
import { Pool } from 'pg'
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
```

#### B. Auth módosítások (opcionális)

```typescript
// Supabase auth használata Google OAuth helyett
import { supabase } from '../database/connection'

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}
```

### 6. Adatok importálása

```bash
# Supabase-be importálás
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" < neon_backup.sql
```

Vagy a Supabase SQL Editor-ben:
1. **SQL Editor** → **New query**
2. Másold be a schema.sql tartalmát
3. Futtasd le
4. Ismételd meg a data.sql-lel

### 7. Tesztelés

```bash
# Helyi tesztelés
npm run dev

# Adatbázis kapcsolat tesztelése
npm run db:health
```

### 8. Vercel deployment frissítése

Vercel dashboard → Project Settings → Environment Variables:
- Töröld a régi Neon változókat
- Add hozzá az új Supabase változókat

## Alternatív megoldások:

### Railway (ha Supabase nem tetszik)

```env
# Railway PostgreSQL
DATABASE_URL=postgresql://username:password@host:port/database
```

**Előnyök**: 
- $5 kredit havonta
- Egyszerű Git-based deployment
- PostgreSQL kompatibilis

### Turso (SQLite-based)

```env
# Turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

**Előnyök**:
- 9GB storage ingyen
- Nagyon gyors
- Edge deployment

**Hátrány**: SQLite, nem PostgreSQL (kód módosítás kell)

## Költség összehasonlítás:

| Provider | Free Tier | Következő Tier |
|----------|-----------|----------------|
| **Neon** | 512MB, 1 projekt | $19/hó |
| **Supabase** | 500MB, 2GB bandwidth | $25/hó |
| **Railway** | $5 kredit/hó | Pay-as-you-go |
| **Turso** | 9GB storage | $29/hó |

## Ajánlás:

1. **Supabase** - Ha PostgreSQL-t akarsz megtartani és több funkciót szeretnél
2. **Railway** - Ha egyszerű PostgreSQL kell, jó ár/érték arány
3. **Turso** - Ha hajlandó vagy SQLite-ra váltani a jobb teljesítményért

## Segítség kell?

Ha segítség kell a migrációhoz, szólj! Tudok segíteni:
- Adatok exportálásában/importálásában  
- Kód módosításokban
- Supabase beállításában
- Tesztelésben