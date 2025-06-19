-- Create table for ride messages
CREATE TABLE IF NOT EXISTS ride_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('passenger', 'driver')) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ride_messages_ride_id ON ride_messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_messages_sender_id ON ride_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ride_messages_created_at ON ride_messages(created_at);

-- Enable row level security
ALTER TABLE ride_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages for their rides" ON ride_messages
    FOR SELECT USING (
        sender_id = auth.uid()::text OR 
        ride_id IN (
            SELECT id FROM rides WHERE passenger_id = auth.uid()::text OR driver_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert messages for their rides" ON ride_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()::text AND
        ride_id IN (
            SELECT id FROM rides WHERE passenger_id = auth.uid()::text OR driver_id = auth.uid()::text
        )
    );

-- Create function to notify on new messages
CREATE OR REPLACE FUNCTION notify_ride_message()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'ride_message',
        json_build_object(
            'ride_id', NEW.ride_id,
            'sender_id', NEW.sender_id,
            'message', NEW.message
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
CREATE TRIGGER ride_message_notify
AFTER INSERT ON ride_messages
FOR EACH ROW
EXECUTE FUNCTION notify_ride_message();
