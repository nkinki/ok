-- Tantárgyi Bejelentkezés és Teljesítmény Számítás - Adatbázis Migráció
-- Futtatás: Supabase SQL Editor-ban

-- 1. Teacher sessions tábla bővítése
ALTER TABLE teacher_sessions 
ADD COLUMN IF NOT EXISTS subject VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS max_possible_score INTEGER DEFAULT 0;

-- 2. Session participants tábla bővítése
ALTER TABLE session_participants 
ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS performance_category VARCHAR(20) DEFAULT 'poor';

-- 3. Subject statistics tábla létrehozása
CREATE TABLE IF NOT EXISTS subject_statistics (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexek létrehozása a teljesítmény optimalizáláshoz
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_subject ON teacher_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_subject_active ON teacher_sessions(subject, is_active);
CREATE INDEX IF NOT EXISTS idx_session_participants_percentage ON session_participants(percentage DESC);
CREATE INDEX IF NOT EXISTS idx_session_participants_category ON session_participants(performance_category);
CREATE INDEX IF NOT EXISTS idx_subject_statistics_subject ON subject_statistics(subject);
CREATE INDEX IF NOT EXISTS idx_subject_statistics_subject_date ON subject_statistics(subject, created_at);

-- 5. Meglévő adatok frissítése alapértelmezett értékekkel
UPDATE teacher_sessions 
SET subject = 'general', max_possible_score = 100 
WHERE subject IS NULL OR max_possible_score IS NULL;

UPDATE session_participants 
SET percentage = 0, performance_category = 'poor' 
WHERE percentage IS NULL OR performance_category IS NULL;

-- 6. Tantárgyi jelszavak tábla (opcionális - egyszerűbb megoldás a kódban)
CREATE TABLE IF NOT EXISTS subject_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  color_theme VARCHAR(20) DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Alapértelmezett tantárgyi jelszavak beszúrása (egyszerű formában - a jelszavak a kódban vannak kezelve)
-- Jelszavak: infoxxx, matekxxx, magyxxx, torixxx, termxxx
-- Megjegyzés: A jelszavak egyszerű formában vannak tárolva az API-ban a gyors fejlesztés érdekében
INSERT INTO subject_credentials (subject, password_hash, display_name, color_theme) VALUES
('info', 'infoxxx', 'Informatika', 'blue'),
('matek', 'matekxxx', 'Matematika', 'green'),
('magy', 'magyxxx', 'Magyar nyelv', 'red'),
('tori', 'torixxx', 'Történelem', 'purple'),
('termeszet', 'termxxx', 'Természetismeret', 'orange')
ON CONFLICT (subject) DO NOTHING;

-- 8. Teljesítmény számítási függvény (PostgreSQL)
CREATE OR REPLACE FUNCTION calculate_performance_percentage(
  correct_answers INTEGER,
  total_questions INTEGER,
  total_score INTEGER DEFAULT NULL,
  max_score INTEGER DEFAULT NULL
) RETURNS DECIMAL(5,2) AS $$
BEGIN
  -- Ha pontszám alapú számítás lehetséges
  IF total_score IS NOT NULL AND max_score IS NOT NULL AND max_score > 0 THEN
    RETURN ROUND((total_score::DECIMAL / max_score::DECIMAL) * 100, 2);
  END IF;
  
  -- Egyszerű helyes válaszok alapján
  IF total_questions > 0 THEN
    RETURN ROUND((correct_answers::DECIMAL / total_questions::DECIMAL) * 100, 2);
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 9. Teljesítmény kategória meghatározó függvény
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

-- 10. Trigger a teljesítmény automatikus frissítéséhez
CREATE OR REPLACE FUNCTION update_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Százalék számítás
  NEW.percentage := calculate_performance_percentage(
    NEW.correct_answers, 
    NEW.total_questions,
    NEW.total_score,
    NEW.max_possible_score
  );
  
  -- Kategória meghatározás
  NEW.performance_category := get_performance_category(NEW.percentage);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger létrehozása (ha még nem létezik)
DROP TRIGGER IF EXISTS trigger_update_performance ON session_participants;
CREATE TRIGGER trigger_update_performance
  BEFORE INSERT OR UPDATE ON session_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_metrics();

-- 11. Adatbázis séma validálás
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