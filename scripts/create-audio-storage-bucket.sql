-- Create the storage bucket for ride audio messages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ride-audio-messages',
  'ride-audio-messages',
  true,
  5242880, -- 5MB limit
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg']
);

-- Create policy to allow authenticated users to upload audio files
CREATE POLICY "Users can upload audio messages" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ride-audio-messages' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow public read access to audio files
CREATE POLICY "Public can view audio messages" ON storage.objects
FOR SELECT USING (bucket_id = 'ride-audio-messages');

-- Create policy to allow users to delete their own audio files
CREATE POLICY "Users can delete their own audio messages" ON storage.objects
FOR DELETE USING (
  bucket_id = 'ride-audio-messages' 
  AND auth.role() = 'authenticated'
);
