-- Add JSON download support columns to teacher_sessions table
-- Run this in Supabase SQL Editor

-- Add columns for JSON download functionality
ALTER TABLE teacher_sessions 
ADD COLUMN IF NOT EXISTS full_session_json JSONB,
ADD COLUMN IF NOT EXISTS session_json_url TEXT;

-- Update existing sessions to have JSON download URLs
UPDATE teacher_sessions 
SET session_json_url = '/api/simple-api/sessions/' || session_code || '/download'
WHERE session_json_url IS NULL;

-- Add index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_json_url ON teacher_sessions(session_json_url);

-- Verify the changes
SELECT 
  session_code,
  subject,
  class_name,
  session_json_url,
  CASE 
    WHEN full_session_json IS NOT NULL THEN 'Has JSON'
    ELSE 'No JSON'
  END as json_status,
  created_at
FROM teacher_sessions 
ORDER BY created_at DESC 
LIMIT 5;