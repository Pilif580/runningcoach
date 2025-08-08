-- Add push_token column to profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Optional: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_push_token 
ON profiles(push_token) 
WHERE push_token IS NOT NULL;

-- Optional: Add updated_at column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create or replace a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to automatically update updated_at when profiles are modified
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
