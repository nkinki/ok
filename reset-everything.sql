-- TELJES ADATBÁZIS RESET
-- Futtasd ezt a Supabase SQL Editor-ban

-- 1. Töröljük az összes táblát
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS teacher_sessions CASCADE;
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS student_sessions CASCADE;
DROP TABLE IF EXISTS daily_assignments CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS player_answers CASCADE;
DROP TABLE IF EXISTS game_questions CASCADE;
DROP TABLE IF EXISTS game_players CASCADE;
DROP TABLE IF EXISTS game_results CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS game_rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS health_check CASCADE;

-- 2. Töröljük az összes indexet
DROP INDEX IF EXISTS idx_teacher_sessions_code;
DROP INDEX IF EXISTS idx_teacher_sessions_active;
DROP INDEX IF EXISTS idx_teacher_sessions_expires;
DROP INDEX IF EXISTS idx_session_participants_session;
DROP INDEX IF EXISTS idx_session_participants_student;

-- 3. Töröljük a függvényeket
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 4. Létrehozzuk CSAK a szükséges táblákat
CREATE TABLE teacher_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(8) UNIQUE NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES teacher_sessions(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_class VARCHAR(100) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN NOT NULL DEFAULT true,
    current_exercise INTEGER NOT NULL DEFAULT 0,
    completed_exercises INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    results JSONB DEFAULT '[]'::jsonb
);

-- 5. Indexek
CREATE INDEX idx_teacher_sessions_code ON teacher_sessions(session_code);
CREATE INDEX idx_teacher_sessions_active ON teacher_sessions(is_active);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);

-- 6. RLS kikapcsolása
ALTER TABLE teacher_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants DISABLE ROW LEVEL SECURITY;

-- 7. Teszt adat
INSERT INTO teacher_sessions (session_code, exercises, is_active) 
VALUES ('TEST123', '[{"type":"quiz","title":"Teszt feladat"}]'::jsonb, true);

-- 8. Ellenőrzés
SELECT 'teacher_sessions' as table_name, count(*) as row_count FROM teacher_sessions
UNION ALL
SELECT 'session_participants' as table_name, count(*) as row_count FROM session_participants;