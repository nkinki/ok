# Okos Gyakorló - Kahoot Multiplayer System

🎮 **Kahoot-like multiplayer educational game system** with Supabase integration

## 🚀 Live Demo
- **Production**: https://nyirad.vercel.app
- **GitHub**: https://github.com/nkinki/ok

## ✨ Features
- **Fixed Rooms**: Static rooms for grades 3-8 with 6-character codes
- **Real-time Gameplay**: Students join with codes, teacher controls game flow  
- **Exercise Integration**: Displays exercises exactly as they appear in Library view
- **Scoring System**: Time-based scoring (500-1000 points)
- **Teacher Statistics**: Results view with CSV export capability
- **Supabase Backend**: PostgreSQL database with 500MB free tier

## 🏫 How it works
1. **Teacher**: Selects exercises → Students join with 6-character code → Teacher clicks START
2. **Students**: Enter code → Wait in lobby → Play exercises with zoom controls
3. **Scoring**: 1000 points max, decreases with response time
4. **Results**: Teacher sees statistics and can export CSV

## 🛠️ Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Express.js + Supabase PostgreSQL  
- **Deployment**: Vercel
- **Real-time**: WebSocket connections
- **Authentication**: Google OAuth (optional)

## 📊 System Status
- ✅ Supabase database connected
- ✅ Fixed rooms system working
- ✅ Exercise integration complete
- ✅ GitHub repository ready
- 🚀 Vercel deployment in progress

Built for educational institutions with focus on simplicity and reliability.

---

## Original OkosGyakorló Features

Ez az alkalmazás segít tankönyvi képekből interaktív feladatokat generálni a Google Gemini AI segítségével.

### Funkciók
- **Egyesével:** Képek fotózása/feltöltése és azonnali átalakítása.
- **Tömeges Feldolgozó:** Több tucat kép elemzése egyszerre, biztonságos módban.
- **Könyvtár:** Az elkészült feladatok mentése és visszatöltése.
- **Kahoot Mode:** Multiplayer verseny módban játszható feladatok.

