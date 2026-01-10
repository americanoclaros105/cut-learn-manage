-- Add avatar field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar text;

-- Add access duration fields to user_course_assignments
ALTER TABLE user_course_assignments 
  ADD COLUMN IF NOT EXISTS enabled_from timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS notes text;