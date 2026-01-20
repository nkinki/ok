-- Kahoot Multiplayer System Database Schema
-- PostgreSQL (Neon DB)

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'code',
    google_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercise library (teacher's uploaded exercises)
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    exercise_data JSONB NOT NULL, -- Contains the parsed exercise data
    subject VARCHAR(100),
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    tags TEXT[], -- Array of tags for categorization
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily assignments (teacher selects exercises for students)
CREATE TABLE IF NOT EXISTS daily_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_class VARCHAR(50), -- Which class this is for
    exercise_ids UUID[] NOT NULL, -- Array of exercise IDs
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student sessions (when students work on assignments)
CREATE TABLE IF NOT EXISTS student_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES daily_assignments(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_exercises INTEGER NOT NULL DEFAULT 0,
    completed_exercises INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' -- in_progress, completed, abandoned
);

-- Student answers (individual exercise results)
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES student_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    student_answer JSONB NOT NULL, -- Student's submitted answer
    is_correct BOOLEAN NOT NULL DEFAULT false,
    score INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, exercise_id)
);

-- Game rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(8) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    max_players INTEGER NOT NULL DEFAULT 50,
    questions_count INTEGER NOT NULL,
    time_per_question INTEGER NOT NULL DEFAULT 30, -- seconds
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, active, finished, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game questions table
CREATE TABLE IF NOT EXISTS game_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false, matching
    options JSONB NOT NULL, -- Array of answer options
    correct_answers JSONB NOT NULL, -- Array of correct answer indices
    points INTEGER NOT NULL DEFAULT 100,
    time_limit INTEGER NOT NULL DEFAULT 30, -- seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, question_order)
);

-- Game players table
CREATE TABLE IF NOT EXISTS game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_name VARCHAR(100) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_connected BOOLEAN NOT NULL DEFAULT true,
    total_score INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    UNIQUE(room_id, player_name)
);

-- Game sessions table (for completed games)
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    player_count INTEGER NOT NULL,
    questions_count INTEGER NOT NULL,
    avg_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- completed, abandoned
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Player answers table
CREATE TABLE IF NOT EXISTS player_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES game_questions(id) ON DELETE CASCADE,
    selected_answers JSONB NOT NULL, -- Array of selected answer indices
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_earned INTEGER NOT NULL DEFAULT 0,
    response_time_ms INTEGER NOT NULL, -- milliseconds
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, question_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON teachers(subject);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_exercises_teacher ON exercises(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exercises_subject ON exercises(subject);
CREATE INDEX IF NOT EXISTS idx_exercises_active ON exercises(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_assignments_teacher ON daily_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_daily_assignments_class ON daily_assignments(target_class);
CREATE INDEX IF NOT EXISTS idx_daily_assignments_active ON daily_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_student_sessions_student ON student_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_assignment ON student_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_session ON student_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_exercise ON student_answers(exercise_id);

-- Legacy Kahoot indexes (keeping for compatibility)
CREATE INDEX IF NOT EXISTS idx_teachers_google_id ON teachers(google_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_teacher ON game_rooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_questions_room ON game_questions(room_id, question_order);
CREATE INDEX IF NOT EXISTS idx_game_players_room ON game_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_teacher ON game_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_player ON player_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_room ON player_answers(room_id);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_assignments_updated_at BEFORE UPDATE ON daily_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Legacy Kahoot triggers
CREATE TRIGGER update_game_rooms_updated_at BEFORE UPDATE ON game_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Room code generation function
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Sample data for development (optional)
-- INSERT INTO teachers (username, email, full_name, auth_provider, google_id) VALUES
-- ('teszt.tanar', 'teszt.tanar@szenmihalyatisk.hu', 'Teszt Tanár', 'google', 'google_123456789'),
-- ('kovacs.anna', 'kovacs.anna@szenmihalyatisk.hu', 'Kovács Anna', 'google', 'google_987654321');