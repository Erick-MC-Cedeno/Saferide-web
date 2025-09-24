-- Update ride_messages table to support location messages
ALTER TABLE ride_messages 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Update message_type check constraint to include location
ALTER TABLE ride_messages 
DROP CONSTRAINT IF EXISTS ride_messages_message_type_check;

ALTER TABLE ride_messages 
ADD CONSTRAINT ride_messages_message_type_check 
CHECK (message_type IN ('text', 'audio', 'location'));

-- Create index for location messages
CREATE INDEX IF NOT EXISTS idx_ride_messages_location ON ride_messages(latitude, longitude) WHERE message_type = 'location';

-- Update the notification function to include location data
CREATE OR REPLACE FUNCTION notify_ride_message()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'ride_message',
        json_build_object(
            'ride_id', NEW.ride_id,
            'sender_id', NEW.sender_id,
            'message', NEW.message,
            'message_type', NEW.message_type,
            'audio_url', NEW.audio_url,
            'audio_duration', NEW.audio_duration,
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'location_name', NEW.location_name
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
