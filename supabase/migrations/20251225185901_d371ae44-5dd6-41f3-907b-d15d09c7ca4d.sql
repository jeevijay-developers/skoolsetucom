-- Create invoice_settings table for signature and template preferences
CREATE TABLE public.invoice_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  signature_url text,
  authorized_name text,
  default_template text DEFAULT 'A4',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

-- Enable RLS
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- School admins can manage their invoice settings
CREATE POLICY "School admins manage invoice settings"
ON public.invoice_settings
FOR ALL
USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

-- School members can view invoice settings
CREATE POLICY "School members can view invoice settings"
ON public.invoice_settings
FOR SELECT
USING (user_belongs_to_school(auth.uid(), school_id));

-- Add payment_mode and payment_screenshot_url columns to student_fees
ALTER TABLE public.student_fees 
ADD COLUMN IF NOT EXISTS payment_mode text,
ADD COLUMN IF NOT EXISTS payment_screenshot_url text,
ADD COLUMN IF NOT EXISTS collected_by uuid REFERENCES auth.users(id);

-- Create storage bucket for payment screenshots and signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoice-signatures', 'invoice-signatures', true)
ON CONFLICT DO NOTHING;

-- Storage policies for payment screenshots
CREATE POLICY "School members can upload payment screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-screenshots' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "School members can view payment screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-screenshots' AND 
  auth.uid() IS NOT NULL
);

-- Storage policies for invoice signatures
CREATE POLICY "School admins can upload signatures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoice-signatures' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view signatures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoice-signatures');

CREATE POLICY "School admins can update signatures"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'invoice-signatures' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "School admins can delete signatures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'invoice-signatures' AND 
  auth.uid() IS NOT NULL
);

-- Trigger for updated_at
CREATE TRIGGER update_invoice_settings_updated_at
BEFORE UPDATE ON public.invoice_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();