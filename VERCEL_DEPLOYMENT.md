# Vercel Deployment Útmutató

## 🚀 Gyors Deployment

### 1. GitHub Repository Push
```bash
git remote add origin https://github.com/YOUR_USERNAME/okos-gyakorlo.git
git push -u origin main
```

### 2. Vercel Import
1. Menj a [vercel.com](https://vercel.com)
2. **Import Git Repository**
3. Válaszd ki a GitHub repository-t
4. **Framework Preset**: Vite
5. **Deploy**

### 3. Environment Variables Beállítása

A Vercel dashboard-ban **Settings** → **Environment Variables**:

```env
# Supabase Configuration
SUPABASE_URL=https://ranobnqscptmmiyhsqzj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbm9ibnFzY3B0bW1peWhzcXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDY4MDAsImV4cCI6MjA4NDIyMjgwMH0.bRif3ceyzC2FNFqI57y35BI5MsrNZKPeF5nuF943PQs
DATABASE_URL=postgresql://postgres:KahootSystem2024!@db.ranobnqscptmmiyhsqzj.supabase.co:5432/postgres

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret
JWT_SECRET=kahoot-super-secret-jwt-key-2024

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
ALLOWED_EMAIL_DOMAIN=szenmihalyatisk.hu
```

### 4. Domain Beállítása (Opcionális)

**Settings** → **Domains** → Add custom domain

## 📋 Deployment Checklist

- ✅ GitHub repository létrehozva és push-olva
- ✅ Vercel project importálva
- ✅ Environment variables beállítva
- ✅ Supabase adatbázis működik
- ✅ Build sikeres
- ✅ Deployment sikeres
- ✅ Fix szobák működnek
- ✅ Diák csatlakozás működik
- ✅ Feladatok betöltése működik

## 🔧 Troubleshooting

### Build Error
- Ellenőrizd a TypeScript hibákat
- Győződj meg róla, hogy minden dependency telepítve van

### API Error
- Ellenőrizd az environment variables-t
- Teszteld a Supabase kapcsolatot

### Database Error
- Ellenőrizd a DATABASE_URL-t
- Győződj meg róla, hogy a táblák léteznek

## 🌐 Production URLs

- **Frontend**: https://your-app.vercel.app
- **API Health**: https://your-app.vercel.app/api/health/database
- **Fixed Rooms**: https://your-app.vercel.app/api/simple-api/rooms/fixed

## 📊 Monitoring

- **Vercel Dashboard**: Build logs, function logs
- **Supabase Dashboard**: Database metrics, API usage
- **Browser Console**: Frontend errors

## 🔄 Updates

Minden push automatikusan deploy-ol:
```bash
git add .
git commit -m "Update message"
git push origin main
```

## 🎯 Next Steps

1. **Tesztelés**: Próbáld ki az összes funkciót
2. **Optimalizálás**: Figyeld a teljesítményt
3. **Monitoring**: Állíts be alerteket
4. **Backup**: Rendszeres adatbázis backup
5. **Scaling**: Ha szükséges, upgrade Supabase plan