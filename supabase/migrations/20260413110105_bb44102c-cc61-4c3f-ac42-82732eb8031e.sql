-- Drop class_subjects table
DROP TABLE IF EXISTS public.class_subjects CASCADE;

-- Drop subjects table
DROP TABLE IF EXISTS public.subjects CASCADE;

-- Remove subjects column from teachers table
ALTER TABLE public.teachers DROP COLUMN IF EXISTS subjects;