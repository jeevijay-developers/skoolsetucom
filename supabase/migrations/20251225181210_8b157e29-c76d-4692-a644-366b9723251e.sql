-- Add mother_name and photo_url columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS mother_name text,
ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for student photos
CREATE POLICY "School members can view student photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

CREATE POLICY "School admins can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "School admins can update student photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-photos');

CREATE POLICY "School admins can delete student photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-photos');