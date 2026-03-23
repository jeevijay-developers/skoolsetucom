
-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  created_by UUID,
  academic_year TEXT DEFAULT '2024-25',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- School admins: full access
CREATE POLICY "School admins manage assignments"
  ON public.assignments FOR ALL
  TO public
  USING (has_role(auth.uid(), 'school_admin'::app_role) AND user_belongs_to_school(auth.uid(), school_id));

-- Teachers: insert own assignments
CREATE POLICY "Teachers can create assignments"
  ON public.assignments FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND user_belongs_to_school(auth.uid(), school_id) AND auth.uid() = created_by);

-- Teachers: update own assignments
CREATE POLICY "Teachers can update own assignments"
  ON public.assignments FOR UPDATE
  TO public
  USING (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = created_by AND user_belongs_to_school(auth.uid(), school_id));

-- Teachers: delete own assignments
CREATE POLICY "Teachers can delete own assignments"
  ON public.assignments FOR DELETE
  TO public
  USING (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = created_by AND user_belongs_to_school(auth.uid(), school_id));

-- School members: read access
CREATE POLICY "School members can view assignments"
  ON public.assignments FOR SELECT
  TO public
  USING (user_belongs_to_school(auth.uid(), school_id));
