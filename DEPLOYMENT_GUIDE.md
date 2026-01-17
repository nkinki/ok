# Okos Gyakorló - Deployment Guide

## System Overview

This is a Kahoot-like multiplayer educational game system with:
- **Fixed Rooms System**: Static rooms for grades 3-8 with 6-character codes
- **Exercise Integration**: Displays exercises exactly as they appear in Library view
- **Real-time Gameplay**: Students join with codes, teacher controls game flow
- **Scoring System**: Time-based scoring (500-1000 points)
- **Teacher Statistics**: Results view with CSV export

## Architecture

- **Frontend**: React + Vite (port 5173 in dev)
- **Main API**: Express server (port 3001 in dev) - handles regular rooms
- **Fixed Rooms API**: Simple server (port 3002 in dev) - handles static rooms
- **Database**: Neon PostgreSQL (for user auth and analytics)

## GitHub Deployment

### 1. Repository Setup

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Kahoot multiplayer system"

# Add GitHub remote
git remote add origin https://github.com/yourusername/okos-gyakorlo.git
git branch -M main
git push -u origin main
```

### 2. Environment Variables

Create these environment variables in your deployment platform:

```env
# Database (Supabase - Recommended)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Alternative: Neon DB (if staying)
# DATABASE_URL=postgresql://username:password@host/database?sslmode=require
# NEON_DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# App Config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Institution
ALLOWED_EMAIL_DOMAIN=szenmihalyatisk.hu
```

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite framework

### 2. Configure Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from the list above
3. Make sure to set `NODE_ENV=production`

### 3. Deploy

Vercel will automatically:
- Install dependencies with `npm install`
- Build the project with `npm run build`
- Deploy the static files from `dist/`
- Set up serverless functions for API routes

### 4. Custom Domain (Optional)

1. In Vercel dashboard, go to Domains
2. Add your custom domain
3. Configure DNS records as instructed

## System Features

### Fixed Rooms System

- **Grades 3-8**: Each grade has a persistent room
- **6-Character Codes**: Format like `3AB12C`, `4XY89Z`
- **Custom Codes**: Teachers can set custom 6-character codes
- **Persistent**: Rooms don't get deleted, always available

### Game Flow

1. **Teacher**: Selects exercises → Students join with code → Teacher clicks START
2. **Students**: Enter 6-character code → Wait in lobby → Play exercises
3. **Exercises**: Display exactly as in Library (image + interactive components)
4. **Scoring**: 1000 points max, decreases with response time
5. **Results**: Teacher sees statistics, can export CSV

### API Endpoints

#### Fixed Rooms (simple-server.js)
- `GET /api/rooms/fixed` - List all fixed rooms
- `POST /api/rooms/fixed/:grade/set-code` - Set custom room code
- `GET /api/rooms/check/:roomCode` - Check if room exists
- `POST /api/rooms/:roomCode/join` - Join room
- `POST /api/rooms/:id/exercises` - Load exercises
- `POST /api/rooms/:id/start` - Start game
- `POST /api/rooms/:id/answer` - Submit answer
- `GET /api/rooms/:id/results` - Get game results

#### Main API (dev-server.js)
- Regular room management
- User authentication
- Analytics and history

## Troubleshooting

### Common Issues

1. **Students can't join**: Check room code length (must be exactly 6 characters)
2. **Exercises not loading**: Verify `manual-exercises.json` is accessible
3. **Images not displaying**: Check image paths in exercise data
4. **Scoring not working**: Verify answer submission endpoints

### Development vs Production

- **Development**: 3 separate servers (frontend:5173, main:3001, simple:3002)
- **Production**: All APIs become serverless functions on Vercel

### Logs and Monitoring

- Check Vercel function logs in dashboard
- Monitor API response times
- Track error rates in production

## File Structure

```
okos-gyakorlo/
├── api/                    # Main API endpoints (Vercel functions)
├── components/             # React components
├── simple-server.js        # Fixed rooms server (becomes Vercel function)
├── dev-server.js          # Development main server
├── manual-exercises.json   # Exercise data
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies and scripts
└── README.md              # Project documentation
```

## Next Steps

1. Test deployment on Vercel
2. Configure custom domain if needed
3. Set up monitoring and analytics
4. Create user documentation
5. Plan for scaling (if needed for 600+ exercises)

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Check browser console for frontend errors