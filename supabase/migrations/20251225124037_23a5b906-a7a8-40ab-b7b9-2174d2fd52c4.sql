-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'student', 'parent');

-- Create subscription_status enum
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled');

-- Create subscription_plan enum
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'pro');

-- Create payment_status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =====================
-- PROFILES TABLE
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================
-- USER ROLES TABLE (Separate from profiles for security)
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================
-- SCHOOLS TABLE
-- =====================
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  principal_name TEXT,
  logo_url TEXT,
  board TEXT DEFAULT 'CBSE',
  student_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- =====================
-- SUBSCRIPTIONS TABLE
-- =====================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'basic',
  status subscription_status NOT NULL DEFAULT 'trial',
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 day'),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  amount DECIMAL(10,2),
  coupon_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================
-- PAYMENTS TABLE
-- =====================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  receipt_url TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =====================
-- COUPONS TABLE
-- =====================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- =====================
-- CLASSES TABLE
-- =====================
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  section TEXT DEFAULT 'A',
  academic_year TEXT NOT NULL DEFAULT '2024-25',
  class_teacher_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- =====================
-- STUDENTS TABLE
-- =====================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  admission_number TEXT,
  roll_number TEXT,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  address TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  parent_user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- =====================
-- TEACHERS TABLE
-- =====================
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  qualification TEXT,
  subjects TEXT[],
  date_of_joining DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- =====================
-- ATTENDANCE TABLE
-- =====================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present',
  marked_by UUID REFERENCES auth.users(id),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- =====================
-- FEE STRUCTURES TABLE
-- =====================
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT DEFAULT 'monthly',
  academic_year TEXT DEFAULT '2024-25',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

-- =====================
-- STUDENT FEES TABLE
-- =====================
CREATE TABLE public.student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES public.fee_structures(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;

-- =====================
-- EXAMS TABLE
-- =====================
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_type TEXT DEFAULT 'unit_test',
  start_date DATE,
  end_date DATE,
  academic_year TEXT DEFAULT '2024-25',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- =====================
-- EXAM RESULTS TABLE
-- =====================
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  obtained_marks DECIMAL(5,2) NOT NULL,
  grade TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id, subject)
);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- =====================
-- NOTICES TABLE
-- =====================
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT DEFAULT 'all',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- =====================
-- SECURITY DEFINER FUNCTIONS
-- =====================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to check if user belongs to school
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND school_id = _school_id
  )
$$;

-- =====================
-- RLS POLICIES
-- =====================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Schools policies
CREATE POLICY "School admins can view their school" ON public.schools
  FOR SELECT USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.user_belongs_to_school(auth.uid(), id)
  );

CREATE POLICY "Super admins can manage all schools" ON public.schools
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "School admins can update their school" ON public.schools
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), id)
  );

-- Subscriptions policies
CREATE POLICY "View school subscription" ON public.subscriptions
  FOR SELECT USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.user_belongs_to_school(auth.uid(), school_id)
  );

CREATE POLICY "Super admins manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Payments policies
CREATE POLICY "View school payments" ON public.payments
  FOR SELECT USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.user_belongs_to_school(auth.uid(), school_id)
  );

CREATE POLICY "Super admins manage payments" ON public.payments
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Coupons policies
CREATE POLICY "Super admins manage coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

-- Classes policies
CREATE POLICY "School members can view classes" ON public.classes
  FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School admins manage classes" ON public.classes
  FOR ALL USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

-- Students policies
CREATE POLICY "School members can view students" ON public.students
  FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School admins manage students" ON public.students
  FOR ALL USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

CREATE POLICY "Parents can view own children" ON public.students
  FOR SELECT USING (parent_user_id = auth.uid());

-- Teachers policies
CREATE POLICY "School members can view teachers" ON public.teachers
  FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School admins manage teachers" ON public.teachers
  FOR ALL USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

-- Attendance policies
CREATE POLICY "School members can view attendance" ON public.attendance
  FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "Teachers can mark attendance" ON public.attendance
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'teacher') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

CREATE POLICY "School admins manage attendance" ON public.attendance
  FOR ALL USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

-- Fee structures policies
CREATE POLICY "School members can view fee structures" ON public.fee_structures
  FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School admins manage fee structures" ON public.fee_structures
  FOR ALL USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

-- Student fees policies
CREATE POLICY "School members can view student fees" ON public.student_fees
  FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School admins manage student fees" ON public.student_fees
  FOR ALL USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

-- Exams policies
CREATE POLICY "School members can view exams" ON public.exams
  FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School admins manage exams" ON public.exams
  FOR ALL USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

-- Exam results policies
CREATE POLICY "View exam results" ON public.exam_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_id
      AND public.user_belongs_to_school(auth.uid(), e.school_id)
    )
  );

CREATE POLICY "Teachers can add exam results" ON public.exam_results
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'teacher') AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_id
      AND public.user_belongs_to_school(auth.uid(), e.school_id)
    )
  );

-- Notices policies
CREATE POLICY "School members can view notices" ON public.notices
  FOR SELECT USING (public.user_belongs_to_school(auth.uid(), school_id));

CREATE POLICY "School admins manage notices" ON public.notices
  FOR ALL USING (
    public.has_role(auth.uid(), 'school_admin') AND
    public.user_belongs_to_school(auth.uid(), school_id)
  );

-- =====================
-- TRIGGERS
-- =====================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();