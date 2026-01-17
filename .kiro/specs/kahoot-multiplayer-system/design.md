# Design Document

## Overview

A Kahoot-szerű versenyrendszer egy modern, skálázható web alkalmazás, amely valós idejű multiplayer funkcionalitást biztosít oktatási célokra. A rendszer a meglévő Okos Gyakorló alkalmazásra épül, és kiterjeszti azt osztálytermi versenyekkel.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        UI[User Interface]
        WS[WebSocket Client]
        STATE[State Management]
    end
    
    subgraph "Vercel Platform"
        API[API Routes]
        WS_SERVER[WebSocket Server]
        STATIC[Static Assets]
    end
    
    subgraph "Database Layer"
        DB[(Neon PostgreSQL)]
        REALTIME[WebSocket Events]
    end
    
    subgraph "External Services"
        GEMINI[Gemini AI API]
        GITHUB[GitHub Repository]
    end
    
    UI --> API
    WS --> WS_SERVER
    API --> DB
    WS_SERVER --> REALTIME
    API --> GEMINI
    GITHUB --> VERCEL[Vercel Deployment]
    VERCEL --> STATIC
```

### Deployment Pipeline

```mermaid
graph LR
    DEV[Local Development] --> COMMIT[Git Commit]
    COMMIT --> PUSH[Push to GitHub]
    PUSH --> VERCEL[Vercel Auto-Deploy]
    VERCEL --> BUILD[Build Process]
    BUILD --> DEPLOY[Deploy to Production]
    DEPLOY --> DOMAIN[Custom Domain]
    
    subgraph "Environment Variables"
        ENV_VARS[Gemini API Keys<br/>Database URLs<br/>WebSocket Config]
    end
    
    VERCEL --> ENV_VARS
```

## Components and Interfaces

### Frontend Components

#### 1. Game Host Dashboard
```typescript
interface GameHostDashboard {
  createRoom(): Promise<GameRoom>
  selectExercises(exercises: Exercise[]): void
  configureGame(settings: GameSettings): void
  startGame(): void
  controlGameFlow(): void
  viewAnalytics(): AnalyticsData
}

interface GameSettings {
  timeLimit: number
  pointsPerCorrect: number
  pointsForSpeed: boolean
  maxPlayers: number
  exerciseOrder: 'sequential' | 'random'
}
```

#### 2. Player Interface
```typescript
interface PlayerInterface {
  joinRoom(roomCode: string, playerName: string): Promise<void>
  submitAnswer(answer: Answer): void
  viewLeaderboard(): LeaderboardData
  viewQuestion(): Question
  viewResults(): GameResults
}

interface Player {
  id: string
  name: string
  score: number
  currentStreak: number
  joinedAt: Date
}
```

#### 3. Real-Time Game Engine
```typescript
interface GameEngine {
  initializeGame(gameRoom: GameRoom): void
  broadcastQuestion(question: Question): void
  collectAnswers(): Promise<Answer[]>
  calculateScores(answers: Answer[]): ScoreUpdate[]
  updateLeaderboard(): void
  advanceToNextQuestion(): void
  endGame(): GameResults
}
```

### Backend API Structure

#### 1. Authentication API
```typescript
// POST /api/auth/login
interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  teacher: TeacherProfile
  expiresAt: string
}

// POST /api/auth/register
interface RegisterRequest {
  username: string
  email: string
  password: string
  fullName: string
}

// GET /api/auth/profile
interface TeacherProfile {
  id: string
  username: string
  email: string
  fullName: string
  createdAt: Date
  gameHistory: GameRoom[]
}
```

#### 2. Game Room Management
```typescript
// POST /api/rooms
interface CreateRoomRequest {
  teacherId: string
  title: string
  exercises: string[]
  settings: GameSettings
}

interface CreateRoomResponse {
  roomCode: string
  roomId: string
}

// POST /api/rooms/:roomCode/join
interface JoinRoomRequest {
  playerName: string
}

interface JoinRoomResponse {
  playerId: string
  playerToken: string
  roomInfo: GameRoom
}
```

#### 2. WebSocket Events
```typescript
interface WebSocketEvents {
  // Host Events
  'game:start': GameStartEvent
  'game:next-question': NextQuestionEvent
  'game:end': GameEndEvent
  
  // Player Events
  'player:answer': PlayerAnswerEvent
  'player:join': PlayerJoinEvent
  'player:leave': PlayerLeaveEvent
  
  // Broadcast Events
  'leaderboard:update': LeaderboardUpdateEvent
  'question:display': QuestionDisplayEvent
  'results:show': ResultsShowEvent
}

interface PlayerAnswerEvent {
  playerId: string
  questionId: string
  answer: any
  timestamp: number
}
```

## Data Models

### Database Schema

```sql
-- Teachers (Authentication)
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Game Rooms
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) UNIQUE NOT NULL,
  teacher_id UUID REFERENCES teachers(id) NOT NULL,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  settings JSONB NOT NULL,
  exercises JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Players (no authentication needed)
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id),
  name VARCHAR(100) NOT NULL,
  score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, name)
);

-- Game Sessions (for analytics)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id),
  question_index INTEGER NOT NULL,
  question_data JSONB NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- Player Answers
CREATE TABLE player_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id),
  player_id UUID REFERENCES game_players(id),
  answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time INTEGER NOT NULL, -- milliseconds
  points_earned INTEGER NOT NULL,
  answered_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Interfaces

```typescript
interface GameRoom {
  id: string
  roomCode: string
  hostId: string
  status: 'waiting' | 'active' | 'finished'
  settings: GameSettings
  exercises: Exercise[]
  players: Player[]
  currentQuestionIndex: number
  createdAt: Date
  startedAt?: Date
  endedAt?: Date
}

interface Question {
  id: string
  type: 'MATCHING' | 'CATEGORIZATION' | 'QUIZ'
  title: string
  instruction: string
  content: any
  timeLimit: number
  points: number
}

interface Answer {
  playerId: string
  questionId: string
  content: any
  timestamp: number
  responseTime: number
}

interface LeaderboardEntry {
  playerId: string
  playerName: string
  score: number
  streak: number
  rank: number
  lastAnswerCorrect: boolean
}
```

## Real-Time Communication

### WebSocket Implementation

```typescript
// Server-side WebSocket handler
class GameWebSocketServer {
  private rooms = new Map<string, Set<WebSocket>>()
  
  handleConnection(ws: WebSocket, roomCode: string) {
    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, new Set())
    }
    this.rooms.get(roomCode)!.add(ws)
    
    ws.on('message', (data) => {
      const event = JSON.parse(data.toString())
      this.handleEvent(roomCode, event, ws)
    })
    
    ws.on('close', () => {
      this.rooms.get(roomCode)?.delete(ws)
    })
  }
  
  broadcast(roomCode: string, event: any, excludeWs?: WebSocket) {
    const roomSockets = this.rooms.get(roomCode)
    if (roomSockets) {
      roomSockets.forEach(ws => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event))
        }
      })
    }
  }
}
```

### Client-side WebSocket Manager

```typescript
class GameWebSocketClient {
  private ws: WebSocket | null = null
  private eventHandlers = new Map<string, Function[]>()
  
  connect(roomCode: string, playerToken: string) {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/game/${roomCode}?token=${playerToken}`
    this.ws = new WebSocket(wsUrl)
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.emit(data.type, data.payload)
    }
  }
  
  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }
  
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }
}
```

## Scoring System

### Point Calculation Algorithm

```typescript
interface ScoringConfig {
  basePoints: number
  speedBonus: boolean
  streakMultiplier: boolean
  maxResponseTime: number
}

class ScoringEngine {
  calculatePoints(
    isCorrect: boolean,
    responseTime: number,
    currentStreak: number,
    config: ScoringConfig
  ): number {
    if (!isCorrect) return 0
    
    let points = config.basePoints
    
    // Speed bonus (faster = more points)
    if (config.speedBonus) {
      const speedRatio = Math.max(0, (config.maxResponseTime - responseTime) / config.maxResponseTime)
      points += Math.floor(config.basePoints * speedRatio * 0.5)
    }
    
    // Streak multiplier
    if (config.streakMultiplier && currentStreak > 1) {
      const multiplier = Math.min(2.0, 1 + (currentStreak - 1) * 0.1)
      points = Math.floor(points * multiplier)
    }
    
    return points
  }
}
```

## Exercise Integration

### Exercise Adapter

```typescript
class ExerciseAdapter {
  convertToGameQuestion(exercise: ExerciseData): Question {
    switch (exercise.type) {
      case ExerciseType.QUIZ:
        return this.convertQuizExercise(exercise)
      case ExerciseType.MATCHING:
        return this.convertMatchingExercise(exercise)
      case ExerciseType.CATEGORIZATION:
        return this.convertCategorizationExercise(exercise)
      default:
        throw new Error(`Unsupported exercise type: ${exercise.type}`)
    }
  }
  
  private convertQuizExercise(exercise: ExerciseData): Question {
    return {
      id: generateId(),
      type: 'QUIZ',
      title: exercise.title,
      instruction: exercise.instruction,
      content: {
        questions: exercise.content.questions.map(q => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex
        }))
      },
      timeLimit: 30000, // 30 seconds
      points: 100
    }
  }
}
```

## Performance Optimizations

### Client-Side Optimizations

1. **State Management**: Redux Toolkit for predictable state updates
2. **Component Memoization**: React.memo for expensive components
3. **Virtual Scrolling**: For large leaderboards
4. **Debounced Updates**: Prevent excessive re-renders

### Server-Side Optimizations

1. **Connection Pooling**: Efficient database connections
2. **Caching**: Redis for frequently accessed data
3. **Rate Limiting**: Prevent abuse and ensure fair usage
4. **Horizontal Scaling**: Vercel's automatic scaling

## Security Considerations

### Authentication & Authorization

```typescript
interface SecurityMiddleware {
  validateRoomAccess(roomCode: string, token: string): boolean
  validateHostPermissions(roomId: string, hostToken: string): boolean
  sanitizePlayerInput(input: any): any
  rateLimitPlayer(playerId: string): boolean
}
```

### Data Validation

```typescript
// Input validation schemas
const JoinRoomSchema = z.object({
  playerName: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s]+$/),
  roomCode: z.string().length(6).regex(/^[A-Z0-9]+$/)
})

const SubmitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.any(),
  timestamp: z.number().positive()
})
```

## Error Handling

### Client-Side Error Recovery

```typescript
class GameErrorHandler {
  handleWebSocketError(error: Event) {
    // Attempt reconnection with exponential backoff
    this.reconnectWithBackoff()
  }
  
  handleAPIError(error: ApiError) {
    // Show user-friendly error messages
    // Log errors for debugging
    this.showErrorToUser(error.message)
    this.logError(error)
  }
  
  private reconnectWithBackoff() {
    const maxRetries = 5
    let retryCount = 0
    
    const attempt = () => {
      if (retryCount >= maxRetries) return
      
      setTimeout(() => {
        this.reconnect()
          .catch(() => {
            retryCount++
            attempt()
          })
      }, Math.pow(2, retryCount) * 1000)
    }
    
    attempt()
  }
}
```

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- API endpoint testing with Jest
- WebSocket event testing with mock WebSocket

### Integration Testing
- End-to-end game flow testing
- Real-time synchronization testing
- Database transaction testing

### Performance Testing
- Load testing with multiple concurrent players
- WebSocket connection stress testing
- Database query performance testing

## Deployment Configuration

### Vercel Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_NEON_DATABASE_URL": "@neon_database_url",
    "VITE_WS_URL": "@websocket_url"
  }
}
```

### Environment Variables

```bash
# Production Environment
VITE_NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname
VITE_WS_URL=wss://your-domain.com
GEMINI_API_KEY=your-gemini-key

# Development Environment
VITE_NEON_DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
VITE_WS_URL=ws://localhost:3001
```

## Analytics and Monitoring

### Analytics Data Collection

```typescript
interface GameAnalytics {
  trackGameStart(roomId: string, playerCount: number): void
  trackPlayerJoin(roomId: string, playerId: string): void
  trackAnswerSubmission(roomId: string, playerId: string, isCorrect: boolean, responseTime: number): void
  trackGameEnd(roomId: string, duration: number, completionRate: number): void
}

interface PerformanceMetrics {
  averageResponseTime: number
  correctAnswerRate: number
  playerEngagement: number
  technicalIssues: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties while eliminating redundancy:

**Properties to implement:**
- Room code generation uniqueness
- Authorization control for game hosts
- Player name uniqueness validation
- Alternative name suggestion
- Scoring calculation accuracy
- Exercise conversion consistency
- Error handling for invalid exercises
- Analytics report generation
- CSV export functionality
- Network error recovery

**Redundancy eliminated:**
- Multiple real-time synchronization properties were consolidated into integration tests
- UI responsiveness properties were moved to visual testing
- Performance properties were moved to load testing
- Infrastructure properties were moved to deployment testing

### Core Correctness Properties

**Property 1: Room Code Uniqueness**
*For any* sequence of room creation requests, all generated room codes should be unique across the entire system
**Validates: Requirements 3.1**

**Property 2: Teacher Authentication Security**
*For any* login attempt with username and password, the system should only grant access to valid teacher accounts and properly hash/verify passwords
**Validates: Requirements 1.2, 1.3**

**Property 3: Game Host Authorization**
*For any* game room and user combination, only the authenticated teacher who created the room should be able to control game flow operations (start, pause, next question, end)
**Validates: Requirements 5.5**

**Property 4: Player Name Uniqueness Validation**
*For any* room and player name combination, the system should correctly identify whether the name is already taken within that specific room
**Validates: Requirements 6.2**

**Property 5: Alternative Name Generation**
*For any* taken player name, the system should generate a valid alternative name that is not already taken in the same room
**Validates: Requirements 6.3**

**Property 6: Score Calculation Accuracy**
*For any* correct answer with response time and current streak, the scoring system should calculate points consistently according to the configured scoring rules
**Validates: Requirements 7.4, 8.2**

**Property 7: Scoring System Consistency**
*For any* scoring configuration and identical game scenarios, the scoring system should produce identical results regardless of execution order
**Validates: Requirements 8.3**

**Property 8: Exercise Conversion Consistency**
*For any* valid exercise from the exercise pool, the conversion to game format should preserve all essential information and maintain question integrity
**Validates: Requirements 9.2, 9.3**

**Property 9: Invalid Exercise Error Handling**
*For any* exercise that cannot be converted to game format, the system should provide a descriptive error message and not crash
**Validates: Requirements 9.4**

**Property 10: Analytics Report Generation**
*For any* completed game session, the system should generate a complete analytics report containing all player actions and game events
**Validates: Requirements 11.2**

**Property 11: CSV Export Data Integrity**
*For any* game results data, the CSV export should contain all required fields and maintain data accuracy without loss or corruption
**Validates: Requirements 11.4**

**Property 12: Network Error Recovery**
*For any* network disconnection scenario, the WebSocket client should automatically attempt reconnection with exponential backoff and restore game state
**Validates: Requirements 12.4**

## Error Handling

### Client-Side Error Recovery

```typescript
class GameErrorHandler {
  handleWebSocketError(error: Event) {
    // Attempt reconnection with exponential backoff
    this.reconnectWithBackoff()
  }
  
  handleAPIError(error: ApiError) {
    // Show user-friendly error messages
    // Log errors for debugging
    this.showErrorToUser(error.message)
    this.logError(error)
  }
  
  private reconnectWithBackoff() {
    const maxRetries = 5
    let retryCount = 0
    
    const attempt = () => {
      if (retryCount >= maxRetries) return
      
      setTimeout(() => {
        this.reconnect()
          .catch(() => {
            retryCount++
            attempt()
          })
      }, Math.pow(2, retryCount) * 1000)
    }
    
    attempt()
  }
}
```

## Testing Strategy

### Dual Testing Approach

The system will use both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Verify specific examples and edge cases
- Test integration points between components
- Validate error conditions and boundary cases
- Focus on concrete scenarios and known inputs

**Property-Based Tests:**
- Verify universal properties across all inputs
- Test with randomized data generation
- Ensure comprehensive input coverage
- Validate system behavior under various conditions

**Property Test Configuration:**
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: **Feature: kahoot-multiplayer-system, Property {number}: {property_text}**

**Testing Balance:**
Unit tests handle specific examples and integration scenarios, while property tests verify that universal correctness properties hold across all possible inputs. Together, they provide comprehensive validation of both concrete behavior and general system correctness.

Ez a design egy teljes körű, skálázható megoldást biztosít a Kahoot-szerű versenyrendszerhez, amely integrálja a meglévő Okos Gyakorló funkcionalitást és modern web technológiákat használ.