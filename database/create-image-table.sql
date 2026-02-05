-- Create table for Google Drive image URLs (Supabase egress optimization)
-- This table stores only URLs, not the actual image data

CREATE TABLE IF NOT EXISTS exercise_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id TEXT NOT NULL UNIQUE,
  drive_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_exercise_images_exercise_id ON exercise_images(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_images_uploaded_at ON exercise_images(uploaded_at);

-- RLS (Row Level Security) policies
ALTER TABLE exercise_images ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be restricted later)
CREATE POLICY IF NOT EXISTS "Allow all operations on exercise_images" ON exercise_images
  FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE exercise_images IS 'Stores Google Drive URLs for exercise images to reduce Supabase egress';
COMMENT ON COLUMN exercise_images.exercise_id IS 'Unique identifier for the exercise';
COMMENT ON COLUMN exercise_images.drive_url IS 'Public Google Drive URL for the image';
COMMENT ON COLUMN exercise_images.file_size IS 'Original file size in bytes (for analytics)';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_exercise_images_updated_at 
  BEFORE UPDATE ON exercise_images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();