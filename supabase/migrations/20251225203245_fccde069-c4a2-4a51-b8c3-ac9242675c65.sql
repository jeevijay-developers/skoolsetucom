-- Add school_staff to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_staff';

-- Create staff permissions table
CREATE TABLE public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  
  -- Module Permissions
  can_collect_fee BOOLEAN DEFAULT false,
  can_manage_payroll BOOLEAN DEFAULT false,
  can_manage_attendance BOOLEAN DEFAULT false,
  can_manage_students BOOLEAN DEFAULT false,
  can_manage_exams BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_manage_notices BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, school_id)
);

-- Enable RLS
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_permissions
CREATE POLICY "School admins manage staff permissions"
ON public.staff_permissions
FOR ALL
USING (
  has_role(auth.uid(), 'school_admin'::app_role) 
  AND user_belongs_to_school(auth.uid(), school_id)
);

CREATE POLICY "Staff can view own permissions"
ON public.staff_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to get staff permissions
CREATE OR REPLACE FUNCTION public.get_staff_permissions(_user_id uuid)
RETURNS TABLE (
  can_collect_fee boolean,
  can_manage_payroll boolean,
  can_manage_attendance boolean,
  can_manage_students boolean,
  can_manage_exams boolean,
  can_view_reports boolean,
  can_manage_notices boolean,
  school_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.can_collect_fee,
    sp.can_manage_payroll,
    sp.can_manage_attendance,
    sp.can_manage_students,
    sp.can_manage_exams,
    sp.can_view_reports,
    sp.can_manage_notices,
    sp.school_id
  FROM public.staff_permissions sp
  WHERE sp.user_id = _user_id
    AND sp.is_active = true
  LIMIT 1
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_staff_permissions_updated_at
BEFORE UPDATE ON public.staff_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();