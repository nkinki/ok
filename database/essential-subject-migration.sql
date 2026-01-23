-- Egyszerűsített Tantárgyi Migráció Script
-- Futtatás: Supabase SQL Editor-ban

-- 1. Teacher sessions tábla bővítése
ALTER TABLE teacher_sessions 
ADD COLUMN IF NOT EXISTS subject VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS max_possible_score INTEGER DEFAULT 0;

-- 2. Session participants tábla bővítése
ALTER TABLE session_participants 
ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS performance_category VARCHAR(20) DEFAULT 'poor';

-- 3. Indexek létrehozása a teljesítmény optimalizáláshoz
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_subject ON teacher_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_subject_active ON teacher_sessions(subject, is_active);
CREATE INDEX IF NOT EXISTS idx_session_participants_percentage ON session_participants(percentage DESC);
CREATE INDEX IF NOT EXISTS idx_session_participants_category ON session_participants(performance_category);

-- 4. Meglévő adatok frissítése alapértelmezett értékekkel
UPDATE teacher_sessions 
SET subject = 'general', max_possible_score = 100 
WHERE subject IS NULL OR max_possible_score IS NULL;

UPDATE session_participants 
SET percentage = 0, performance_category = 'poor' 
WHERE percentage IS NULL OR performance_category IS NULL;

-- 5. Teljesítmény kategória meghatározó függvény
CREATE OR REPLACE FUNCTION get_performance_category(percentage DECIMAL) 
RETURNS VARCHAR(20) AS $$
BEGIN
  IF percentage >= 90 THEN
    RETURN 'excellent';
  ELSIF percentage >= 75 THEN
    RETURN 'good';
  ELSIF percentage >= 60 THEN
    RETURN 'average';
  ELSE
    RETURN 'poor';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Validálás
DO $$
BEGIN
  -- Ellenőrizzük, hogy minden oszlop létezik
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_sessions' AND column_name = 'subject'
  ) THEN
    RAISE EXCEPTION 'teacher_sessions.subject oszlop nem található!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'session_participants' AND column_name = 'percentage'
  ) THEN
    RAISE EXCEPTION 'session_participants.percentage oszlop nem található!';
  END IF;
  
  RAISE NOTICE 'Adatbázis migráció sikeresen befejezve!';
END $$;