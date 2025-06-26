-- Update profile_image column to store base64 data instead of URLs
-- First, let's make sure the column can handle large base64 strings

-- For passengers table
ALTER TABLE passengers 
ALTER COLUMN profile_image TYPE TEXT;

-- For drivers table  
ALTER TABLE drivers
ALTER COLUMN profile_image TYPE TEXT;

-- Update comments to reflect base64 storage
COMMENT ON COLUMN passengers.profile_image IS 'Base64 encoded profile image data (PNG or JPG only)';
COMMENT ON COLUMN drivers.profile_image IS 'Base64 encoded profile image data (PNG or JPG only)';

-- Add indexes for better performance when querying users with profile images
CREATE INDEX IF NOT EXISTS idx_passengers_profile_image ON passengers(uid) WHERE profile_image IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_profile_image ON drivers(uid) WHERE profile_image IS NOT NULL;
