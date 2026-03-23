
-- Leave Types table
CREATE TABLE public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  max_days_per_year integer NOT NULL DEFAULT 12,
  is_paid boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage leave types"
  ON public.leave_types FOR ALL TO public
  USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can view leave types"
  ON public.leave_types FOR SELECT TO public
  USING (user_belongs_to_school(auth.uid(), school_id));

-- Leave Applications table
CREATE TABLE public.leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL DEFAULT 1,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage leave applications"
  ON public.leave_applications FOR ALL TO public
  USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "Employees can view own leave applications"
  ON public.leave_applications FOR SELECT TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Employees can insert own leave applications"
  ON public.leave_applications FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND user_belongs_to_school(auth.uid(), school_id));

-- Leave Balances table
CREATE TABLE public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  academic_year text NOT NULL DEFAULT '2024-25',
  total_allowed integer NOT NULL DEFAULT 0,
  used_days integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, leave_type_id, academic_year)
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage leave balances"
  ON public.leave_balances FOR ALL TO public
  USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can view leave balances"
  ON public.leave_balances FOR SELECT TO public
  USING (user_belongs_to_school(auth.uid(), school_id));
