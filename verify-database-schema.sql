-- Verify teacher_sessions table structure
-- Run this in Supabase SQL Editor to check current columns

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_sessions' 
ORDER BY ordinal_position;

-- Also check if there are any constraints or triggers that might reference exercise_count
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'teacher_sessions';

-- Check for any views or functions that might reference exercise_count
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%exercise_count%';