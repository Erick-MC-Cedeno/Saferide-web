-- Create profile_image columns for both passengers and drivers tables
-- This script creates the columns if they don't exist

-- Add profile_image column to passengers table
ALTER TABLE passengers 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add profile_image column to drivers table  
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add comments for documentation
COMMENT ON COLUMN passengers.profile_image IS 'Base64 encoded profile image data (PNG or JPG only)';
COMMENT ON COLUMN drivers.profile_image IS 'Base64 encoded profile image data (PNG or JPG only)';

-- Add indexes for better performance when querying users with profile images
CREATE INDEX IF NOT EXISTS idx_passengers_profile_image ON passengers(uid) WHERE profile_image IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_profile_image ON drivers(uid) WHERE profile_image IS NOT NULL;

-- Verify the columns were created successfully
DO $$
BEGIN
    -- Check if passengers.profile_image exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'passengers' 
        AND column_name = 'profile_image'
    ) THEN
        RAISE NOTICE 'Column profile_image successfully created in passengers table';
    ELSE
        RAISE EXCEPTION 'Failed to create profile_image column in passengers table';
    END IF;

    -- Check if drivers.profile_image exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'profile_image'
    ) THEN
        RAISE NOTICE 'Column profile_image successfully created in drivers table';
    ELSE
        RAISE EXCEPTION 'Failed to create profile_image column in drivers table';
    END IF;
END $$;
