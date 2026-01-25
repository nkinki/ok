-- Add JSON download support columns to teacher_sessions table
-- Run this in Supabase SQL Editor

-- Add columns for JSON download functionality
ALTER TABLE teacher_sessions 
ADD COLUMN IF NOT EXISTS full_session_json JSONB,
ADD COLUMN IF NOT EXISTS json_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_download_url TEXT;

-- Update existing sessions to have JSON download URLs
UPDATE teacher_sessions 
SET session_json_url = '/api/simple-api/sessions/' || session_code || '/download'
WHERE session_json_url IS NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_json_uploaded 
ON teacher_sessions(json_uploaded_at) 
WHERE full_session_json IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_sessions_drive_file 
ON teacher_sessions(google_drive_file_id) 
WHERE google_drive_file_id IS NOT NULL;

-- Verify the changes
SELECT 
  session_code,
  subject,
  class_name,
  CASE 
    WHEN full_session_json IS NOT NULL THEN 'Has JSON'
    ELSE 'No JSON'
  END as json_status,
  CASE 
    WHEN google_drive_file_id IS NOT NULL THEN 'Has Drive ID'
    ELSE 'No Drive ID'
  END as drive_status,
  created_at
FROM teacher_sessions 
ORDER BY created_at DESC 
LIMIT 5;