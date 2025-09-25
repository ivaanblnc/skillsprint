-- Create the submissions bucket in Supabase Storage
-- Run this script in your Supabase SQL editor

-- First, create the bucket (this should work)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions', 
  true,
  5242880, -- 5MB in bytes
  ARRAY[
    'application/zip',
    'application/x-zip-compressed', 
    'text/plain',
    'text/javascript',
    'text/x-python',
    'text/x-java-source',
    'text/x-c++src',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/markdown'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies need to be created from Supabase Dashboard
-- Go to Storage > Policies and create the following policies:

-- 1. INSERT Policy: "Users can upload their own submissions"
--    Target roles: authenticated
--    Expression: bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[2]

-- 2. SELECT Policy: "Users can view all submissions" 
--    Target roles: authenticated
--    Expression: bucket_id = 'submissions'

-- 3. UPDATE Policy: "Users can update their own submissions"
--    Target roles: authenticated  
--    Expression: bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[2]

-- 4. DELETE Policy: "Users can delete their own submissions"
--    Target roles: authenticated
--    Expression: bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[2]
