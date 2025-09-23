-- Add work_field column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS work_field TEXT;

-- Add work_field column to business_cards table
ALTER TABLE business_cards
ADD COLUMN IF NOT EXISTS work_field TEXT;

-- Set default values for existing records
UPDATE user_profiles
SET work_field = NULL
WHERE work_field IS NULL;

UPDATE business_cards
SET work_field = NULL
WHERE work_field IS NULL;
