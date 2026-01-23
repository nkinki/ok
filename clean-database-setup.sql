-- TELJES ADATBÁZIS TISZTÍTÁS ÉS ÚJRAÉPÍTÉS
-- Futtasd ezt a Supabase SQL Editor-ban

-- 1. Töröljük a meglévő táblákat ha léteznek
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS teacher_sessions CASCADE;

-- 2. Töröljük a meglévő indexeket
DROP INDEX IF EXISTS idx_teacher_sessions_code;
DROP INDEX IF EXISTS idx_teacher_sessions_active;
DROP INDEX IF EXISTS idx_teacher_sessions_expires;
DROP INDEX IF EXISTS idx_session_participants_session;
DROP INDEX IF EXISTS idx_session_participants_student;

-- 3. Töröljük a trigger függvényt
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 4. Létrehozzuk a teacher_sessions táblát
CREATE TABLE teacher_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(8) UNIQUE NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Létrehozzuk a session_participants táblát
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

-- 6. Indexek létrehozása
CREATE INDEX idx_teacher_sessions_code ON teacher_sessions(session_code);
CREATE INDEX idx_teacher_sessions_active ON teacher_sessions(is_active);
CREATE INDEX idx_teacher_sessions_expires ON teacher_sessions(expires_at);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_student ON session_participants(student_name, student_class);

-- 7. Update trigger függvény
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Trigger létrehozása
CREATE TRIGGER update_teacher_sessions_updated_at 
    BEFORE UPDATE ON teacher_sessions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS (Row Level Security) kikapcsolása teszteléshez
ALTER TABLE teacher_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants DISABLE ROW LEVEL SECURITY;

-- 10. Teszt adatok beszúrása
INSERT INTO teacher_sessions (session_code, exercises, is_active) 
VALUES ('TEST123', '[{"type":"quiz","title":"Teszt feladat"}]'::jsonb, true);

-- 11. Ellenőrzés
SELECT 'teacher_sessions' as table_name, count(*) as row_count FROM teacher_sessions
UNION ALL
SELECT 'session_participants' as table_name, count(*) as row_count FROM session_participants;

-- 12. Tábla struktúra ellenőrzése
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('teacher_sessions', 'session_participants')
ORDER BY table_name, ordinal_position;