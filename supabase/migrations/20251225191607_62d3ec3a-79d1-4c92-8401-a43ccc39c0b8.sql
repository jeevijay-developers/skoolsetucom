-- Add discount and authorization fields to student_fees
ALTER TABLE public.student_fees 
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_reason text,
ADD COLUMN IF NOT EXISTS discount_authorized_by uuid REFERENCES public.employees(id);

-- Create a fee discount authorities table to track who can authorize discounts
CREATE TABLE IF NOT EXISTS public.fee_discount_authorities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  max_discount_percent numeric DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.fee_discount_authorities ENABLE ROW LEVEL SECURITY;

-- RLS policies for fee_discount_authorities
CREATE POLICY "School admins manage fee discount authorities"
ON public.fee_discount_authorities
FOR ALL
USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can view fee discount authorities"
ON public.fee_discount_authorities
FOR SELECT
USING (user_belongs_to_school(auth.uid(), school_id));