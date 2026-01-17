# Browser Testing Guide

## Current Status ✅

The Kahoot-multiplayer system is now **functionally complete** for core gameplay! 

### What's Working:
- ✅ **Teacher Authentication** (Google OAuth with institutional domain)
- ✅ **Room Management** (create, join, manage rooms)
- ✅ **Player Registration** (join rooms with validation)
- ✅ **Real-time Game Flow** (questions, timing, progression)
- ✅ **Answer Collection** (submit answers, validation)
- ✅ **Scoring System** (time-based scoring, points calculation)
- ✅ **Leaderboard** (real-time rankings, final results)

## How to Test in Browser

### 1. Start Development Servers
```bash
npm run dev:full
```

This starts:
- Frontend: http://localhost:5173/
- API: http://localhost:3001/

### 2. Teacher Mode Testing

1. **Open Teacher Dashboard**: http://localhost:5173/
   - You'll be automatically logged in as "Fejlesztő Tanár" in development mode
   - Click "🏠 Dashboard" to see the teacher dashboard

2. **Create a Room**:
   - Click "Új verseny létrehozása"
   - Fill in room details (title, description, max players, etc.)
   - Select exercises from the library
   - Click "Verseny létrehozása"
   - Note the **Room Code** (e.g., "ABC123")

3. **Host the Game**:
   - Click the "▶️" button next to your created room
   - This opens the Game Host interface
   - Wait for players to join
   - Click "🚀 Verseny indítása" when ready

### 3. Player Mode Testing

1. **Open Player Join Page**: http://localhost:5173/?mode=player
   - Enter the Room Code from step 2
   - Enter a player name
   - Click "Csatlakozás"

2. **Wait in Lobby**:
   - You'll see the waiting room
   - Player list updates in real-time
   - Wait for teacher to start the game

3. **Play the Game**:
   - Answer questions when they appear
   - See your score and ranking
   - View leaderboard between questions

### 4. Multi-Player Testing

Open multiple browser tabs/windows:
- **Tab 1**: Teacher mode (http://localhost:5173/)
- **Tab 2**: Player 1 (http://localhost:5173/?mode=player)
- **Tab 3**: Player 2 (http://localhost:5173/?mode=player)
- **Tab 4**: Player 3 (http://localhost:5173/?mode=player)

## Sample Test Flow

1. **Teacher**: Create room → Get room code (e.g., "XYZ789")
2. **Players**: Join with room code → Enter different names
3. **Teacher**: Start game when all players joined
4. **Everyone**: Play through questions, see real-time updates
5. **Players**: View leaderboard between questions
6. **Everyone**: See final results at the end

## Expected Behavior

### Game States:
- `not_started` → `starting` → `question` → `answer_reveal` → `leaderboard` → `question` → ... → `finished`

### Timing:
- Starting phase: 3 seconds
- Question phase: 30 seconds (configurable)
- Answer reveal: 3 seconds  
- Leaderboard: 5 seconds
- Auto-progression through all questions

### Scoring:
- Correct answers get points (50-100 based on response time)
- Faster responses = more points
- Wrong answers = 0 points
- Leaderboard updates in real-time

## Development Notes

- **Mock Data**: Uses sample questions in development
- **Authentication**: Auto-login in development mode
- **Real-time**: Uses polling (1-2 second intervals) instead of WebSocket
- **Database**: Uses in-memory storage for development

## Next Steps for Production

1. **Exercise Integration**: Connect to real exercise library
2. **WebSocket**: Replace polling with real WebSocket for production
3. **Database**: Connect to Neon PostgreSQL database
4. **Authentication**: Deploy with real Google OAuth
5. **Deployment**: Deploy to Vercel with environment variables

## Troubleshooting

### API Errors:
- Make sure both servers are running (`npm run dev:full`)
- Check console for error messages
- Verify room codes are correct

### Connection Issues:
- Refresh the page
- Check network tab in browser dev tools
- Ensure localhost:3001 is accessible

### Game Not Starting:
- Make sure at least one player has joined
- Check teacher dashboard for room status
- Verify game state in browser console

---

**Status**: Core multiplayer functionality is complete and ready for testing! 🎉