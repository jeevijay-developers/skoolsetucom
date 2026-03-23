
-- Add new columns to students table
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  ADD COLUMN IF NOT EXISTS medical_notes text,
  ADD COLUMN IF NOT EXISTS previous_school text,
  ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Indian';

-- Create student_promotions table for audit trail
CREATE TABLE public.student_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_class_id uuid REFERENCES public.classes(id),
  to_class_id uuid REFERENCES public.classes(id),
  academic_year_from text NOT NULL,
  academic_year_to text NOT NULL,
  promotion_type text NOT NULL DEFAULT 'promoted',
  remarks text,
  promoted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_promotions ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_promotions
CREATE POLICY "School admins manage promotions"
  ON public.student_promotions FOR ALL
  TO public
  USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can view promotions"
  ON public.student_promotions FOR SELECT
  TO public
  USING (user_belongs_to_school(auth.uid(), school_id));
