-- Add class_name column to teacher_sessions table
-- Run this in Supabase SQL Editor

ALTER TABLE teacher_sessions 
ADD COLUMN IF NOT EXISTS class_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN teacher_sessions.class_name IS 'Optional class name for the session (e.g., 8.A, 7.B)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teacher_sessions' 
AND column_name = 'class_name';