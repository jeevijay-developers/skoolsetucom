
-- Create exam_schedules table for exam timetable
CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject text NOT NULL,
  exam_date date NOT NULL,
  start_time time,
  end_time time,
  max_marks numeric DEFAULT 100,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage exam schedules" ON public.exam_schedules
  FOR ALL USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can view exam schedules" ON public.exam_schedules
  FOR SELECT USING (user_belongs_to_school(auth.uid(), school_id));

-- Create employees table for payroll
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  category text NOT NULL DEFAULT 'teacher',
  employee_code text,
  phone text,
  email text,
  bank_name text,
  bank_account text,
  ifsc_code text,
  base_salary numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  date_of_joining date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage employees" ON public.employees
  FOR ALL USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can view employees" ON public.employees
  FOR SELECT USING (user_belongs_to_school(auth.uid(), school_id));

-- Create payroll table
CREATE TABLE IF NOT EXISTS public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  basic_salary numeric NOT NULL DEFAULT 0,
  allowances numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_salary numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  paid_at timestamp with time zone,
  payment_mode text,
  remarks text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (employee_id, month, year)
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage payroll" ON public.payroll
  FOR ALL USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can view payroll" ON public.payroll
  FOR SELECT USING (user_belongs_to_school(auth.uid(), school_id));

-- Create greetings table for festival greetings
CREATE TABLE IF NOT EXISTS public.greetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  festival_name text NOT NULL,
  custom_message text,
  image_url text,
  is_active boolean DEFAULT true,
  valid_from date NOT NULL,
  valid_until date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.greetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage greetings" ON public.greetings
  FOR ALL USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School members can view greetings" ON public.greetings
  FOR SELECT USING (user_belongs_to_school(auth.uid(), school_id));

-- Create fee_reminders table
CREATE TABLE IF NOT EXISTS public.fee_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_fee_id uuid NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sent_at timestamp with time zone DEFAULT now() NOT NULL,
  reminder_type text DEFAULT 'whatsapp',
  message text,
  status text DEFAULT 'sent'
);

ALTER TABLE public.fee_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage fee reminders" ON public.fee_reminders
  FOR ALL USING (has_role(auth.uid(), 'school_admin') AND user_belongs_to_school(auth.uid(), school_id));

-- Create storage bucket for school logos
INSERT INTO storage.buckets (id, name, public) VALUES ('school-logos', 'school-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for school logos
CREATE POLICY "Anyone can view school logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-logos');

CREATE POLICY "School admins can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'school-logos' AND auth.role() = 'authenticated');

CREATE POLICY "School admins can update logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'school-logos' AND auth.role() = 'authenticated');

CREATE POLICY "School admins can delete logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'school-logos' AND auth.role() = 'authenticated');
