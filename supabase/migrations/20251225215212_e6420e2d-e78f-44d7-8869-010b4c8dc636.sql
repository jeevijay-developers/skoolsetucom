-- Add billing_cycle and student_count to subscriptions table for tracking trial requests
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS student_count integer DEFAULT 50;

-- Add comment for clarity
COMMENT ON COLUMN public.subscriptions.billing_cycle IS 'monthly or annually';
COMMENT ON COLUMN public.subscriptions.student_count IS 'Number of students selected at registration';