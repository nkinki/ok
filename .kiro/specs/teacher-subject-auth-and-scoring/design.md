# Tantárgyi Bejelentkezés és Teljesítmény Számítás - Tervezés

## Rendszer Architektúra

### 1. Tantárgyi Authentication Rendszer

#### 1.1 Tantárgyi Jelszavak
```typescript
interface SubjectCredentials {
  subject: string;
  password: string;
  displayName: string;
  colorTheme: string;
}

const SUBJECT_CREDENTIALS: SubjectCredentials[] = [
  { subject: 'info', password: 'infoxxx', displayName: 'Informatika', colorTheme: 'blue' },
  { subject: 'matek', password: 'matekxxx', displayName: 'Matematika', colorTheme: 'green' },
  { subject: 'magy', password: 'magyxxx', displayName: 'Magyar nyelv', colorTheme: 'red' },
  { subject: 'tori', password: 'torixxx', displayName: 'Történelem', colorTheme: 'purple' },
  { subject: 'termeszet', password: 'termxxx', displayName: 'Természetismeret', colorTheme: 'orange' }
];
```

#### 1.2 Subject Context
```typescript
interface SubjectContext {
  currentSubject: string | null;
  subjectDisplayName: string;
  subjectTheme: string;
  isAuthenticated: boolean;
}
```

### 2. Teljesítmény Számítási Rendszer

#### 2.1 Teljesítmény Metrikák
```typescript
interface PerformanceMetrics {
  studentName: string;
  studentClass: string;
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  category: 'excellent' | 'good' | 'average' | 'poor';
  timeSpent: number;
  sessionCode: string;
  subject: string;
}
```

#### 2.2 Teljesítmény Kategóriák
```typescript
const PERFORMANCE_CATEGORIES = {
  excellent: { min: 90, max: 100, color: 'green', label: 'Kiváló' },
  good: { min: 75, max: 89, color: 'blue', label: 'Jó' },
  average: { min: 60, max: 74, color: 'yellow', label: 'Közepes' },
  poor: { min: 0, max: 59, color: 'red', label: 'Gyenge' }
};
```

### 3. Adatbázis Séma Bővítések

#### 3.1 Teacher Sessions Tábla Bővítése
```sql
ALTER TABLE teacher_sessions 
ADD COLUMN subject VARCHAR(50) DEFAULT 'general',
ADD COLUMN max_possible_score INTEGER DEFAULT 0;
```

#### 3.2 Session Participants Bővítése
```sql
ALTER TABLE session_participants 
ADD COLUMN percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN performance_category VARCHAR(20) DEFAULT 'poor';
```

#### 3.3 Subject Statistics Tábla
```sql
CREATE TABLE subject_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(50) NOT NULL,
  session_code VARCHAR(10) NOT NULL,
  total_students INTEGER DEFAULT 0,
  average_percentage DECIMAL(5,2) DEFAULT 0,
  excellent_count INTEGER DEFAULT 0,
  good_count INTEGER DEFAULT 0,
  average_count INTEGER DEFAULT 0,
  poor_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (session_code) REFERENCES teacher_sessions(session_code)
);
```

### 4. API Endpoint Bővítések

#### 4.1 Subject Authentication
```typescript
// POST /api/simple-api/auth/subject
interface SubjectAuthRequest {
  password: string;
}

interface SubjectAuthResponse {
  success: boolean;
  subject: string;
  displayName: string;
  theme: string;
  token: string;
}
```

#### 4.2 Subject-Filtered Sessions
```typescript
// GET /api/simple-api/sessions/list?subject=info
interface SubjectSessionsResponse {
  sessions: SessionWithPerformance[];
  statistics: SubjectStatistics;
}
```

#### 4.3 Performance Analytics
```typescript
// GET /api/simple-api/performance/analytics?subject=info&period=week
interface PerformanceAnalytics {
  overview: {
    totalSessions: number;
    totalStudents: number;
    averagePerformance: number;
    categoryDistribution: CategoryDistribution;
  };
  trends: PerformanceTrend[];
  topPerformers: StudentPerformance[];
}
```

### 5. Frontend Komponens Tervezés

#### 5.1 SubjectLoginForm Komponens
```typescript
interface SubjectLoginFormProps {
  onSubjectLogin: (subject: string, displayName: string, theme: string) => void;
  onError: (error: string) => void;
}
```

#### 5.2 SubjectDashboard Komponens
```typescript
interface SubjectDashboardProps {
  subject: string;
  displayName: string;
  theme: string;
  onSubjectChange: () => void;
}
```

#### 5.3 PerformanceChart Komponens
```typescript
interface PerformanceChartProps {
  data: PerformanceMetrics[];
  type: 'bar' | 'pie' | 'line';
  subject: string;
}
```

### 6. Teljesítmény Számítási Algoritmusok

#### 6.1 Százalék Számítás
```typescript
function calculatePercentage(
  correctAnswers: number, 
  totalQuestions: number, 
  scoreWeighting: boolean = false
): number {
  if (totalQuestions === 0) return 0;
  
  if (scoreWeighting) {
    // Pontszám alapú számítás
    return Math.round((correctAnswers / totalQuestions) * 100);
  } else {
    // Egyszerű helyes válaszok alapján
    return Math.round((correctAnswers / totalQuestions) * 100);
  }
}
```

#### 6.2 Kategória Meghatározás
```typescript
function getPerformanceCategory(percentage: number): PerformanceCategory {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 60) return 'average';
  return 'poor';
}
```

### 7. UI/UX Tervezés

#### 7.1 Tantárgyi Színkódolás
- **Informatika**: Kék (#3B82F6)
- **Matematika**: Zöld (#10B981)
- **Magyar nyelv**: Piros (#EF4444)
- **Történelem**: Lila (#8B5CF6)
- **Természetismeret**: Narancs (#F97316)

#### 7.2 Teljesítmény Vizualizáció
- **Kiváló (90-100%)**: Zöld háttér, fehér szöveg
- **Jó (75-89%)**: Kék háttér, fehér szöveg
- **Közepes (60-74%)**: Sárga háttér, fekete szöveg
- **Gyenge (0-59%)**: Piros háttér, fehér szöveg

#### 7.3 Progress Bar Tervezés
```css
.performance-bar {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
  overflow: hidden;
}

.performance-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.performance-excellent { background: #10b981; }
.performance-good { background: #3b82f6; }
.performance-average { background: #f59e0b; }
.performance-poor { background: #ef4444; }
```

### 8. Biztonsági Megfontolások

#### 8.1 Jelszó Tárolás
- Jelszavak hash-elve tárolva
- Session alapú tantárgyi hozzáférés
- Automatikus kijelentkezés inaktivitás után

#### 8.2 Adatok Elkülönítése
- Tantárgyak közötti szigorú adatelkülönítés
- API szintű hozzáférés kontroll
- Audit log tantárgyi hozzáférésekről

### 9. Teljesítmény Optimalizálás

#### 9.1 Adatbázis Indexek
```sql
CREATE INDEX idx_teacher_sessions_subject ON teacher_sessions(subject);
CREATE INDEX idx_session_participants_percentage ON session_participants(percentage DESC);
CREATE INDEX idx_subject_statistics_subject_date ON subject_statistics(subject, created_at);
```

#### 9.2 Caching Stratégia
- Tantárgyi statisztikák cache-elése
- Teljesítmény számítások eredményeinek tárolása
- Redis cache a gyakori lekérdezésekhez

### 10. Tesztelési Stratégia

#### 10.1 Unit Tesztek
- Teljesítmény számítási függvények
- Tantárgyi authentication logika
- Adatbázis műveletek

#### 10.2 Integrációs Tesztek
- API endpoint tesztek
- Adatbázis kapcsolat tesztek
- Frontend-backend integráció

#### 10.3 E2E Tesztek
- Teljes tantárgyi bejelentkezési folyamat
- Munkamenet létrehozás és monitoring
- Teljesítmény számítás és megjelenítés

## Implementációs Sorrend

1. **Adatbázis séma bővítések**
2. **Tantárgyi authentication API**
3. **Teljesítmény számítási logika**
4. **Frontend komponensek**
5. **UI/UX finomhangolás**
6. **Tesztelés és optimalizálás**