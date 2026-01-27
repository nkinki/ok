-- Add percentage and performance_category columns to session_participants table

-- Add percentage column (integer, 0-100)
ALTER TABLE session_participants 
ADD COLUMN IF NOT EXISTS percentage INTEGER DEFAULT 0;

-- Add performance_category column (text: poor, average, good, excellent)
ALTER TABLE session_participants 
ADD COLUMN IF NOT EXISTS performance_category TEXT DEFAULT 'poor';

-- Update existing records to have default values
UPDATE session_participants 
SET percentage = 0, performance_category = 'poor' 
WHERE percentage IS NULL OR performance_category IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'session_participants' 
  AND column_name IN ('percentage', 'performance_category')
ORDER BY column_name;