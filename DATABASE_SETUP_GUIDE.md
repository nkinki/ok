# Database Setup Guide

## Problem
The session system is getting 500 errors because the required database tables don't exist in Supabase.

## Solution
You need to create the missing tables in your Supabase database.

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the SQL Script
Copy and paste the contents of `create-missing-tables.sql` into the SQL Editor and click "Run".

Alternatively, you can copy this SQL directly:

```sql
-- Missing tables for teacher-student session system
-- Run this SQL in your Supabase SQL Editor

-- Teacher sessions table (for code-based sessions)
CREATE TABLE IF NOT EXISTS teacher_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(8) UNIQUE NOT NULL,
    exercises JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session participants table (students who joined sessions)
CREATE TABLE IF NOT EXISTS session_participants (
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_code ON teacher_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_active ON teacher_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_expires ON teacher_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_student ON session_participants(student_name, student_class);

-- Update trigger for teacher_sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teacher_sessions_updated_at BEFORE UPDATE ON teacher_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 'teacher_sessions' as table_name, count(*) as row_count FROM teacher_sessions
UNION ALL
SELECT 'session_participants' as table_name, count(*) as row_count FROM session_participants;
```

### Step 3: Verify Success
After running the SQL, you should see a result showing:
```
table_name           | row_count
teacher_sessions     | 0
session_participants | 0
```

This confirms the tables were created successfully.

### Step 4: Test the System
1. Try creating a new session in the teacher interface
2. The session should now be created successfully without 500 errors
3. Students should be able to join using the session code

## What Changed
- **Database-only storage**: No more localStorage fallback
- **Better error handling**: Clear error messages when tables are missing
- **Improved performance**: Direct database operations for network usage
- **24-hour session expiry**: Sessions automatically expire after 24 hours

## Troubleshooting

### If you still get errors:
1. Check your `.env.local` file has correct Supabase credentials
2. Verify the tables exist in Supabase dashboard > Table Editor
3. Check the browser console for detailed error messages

### If tables already exist:
The SQL uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.