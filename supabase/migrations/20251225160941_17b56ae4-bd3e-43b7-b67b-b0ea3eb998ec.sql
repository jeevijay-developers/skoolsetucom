-- Create a function to generate parent login credentials
-- This is a SECURITY DEFINER function that creates an auth user and links to student

CREATE OR REPLACE FUNCTION public.create_parent_login(
  p_student_id uuid,
  p_temp_password text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_parent_user_id uuid;
  v_school_id uuid;
  v_result json;
BEGIN
  -- Get student details
  SELECT id, full_name, parent_email, parent_user_id, school_id 
  INTO v_student
  FROM public.students 
  WHERE id = p_student_id;
  
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  IF v_student.parent_email IS NULL OR v_student.parent_email = '' THEN
    RAISE EXCEPTION 'Parent email is required to create login';
  END IF;
  
  IF v_student.parent_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Parent login already exists for this student';
  END IF;
  
  v_school_id := v_student.school_id;
  
  -- Create auth user using the admin API
  -- Note: This requires the supabase.auth.admin functions or a service role
  -- For now, we'll return the email and expect the edge function to create the user
  
  SELECT json_build_object(
    'student_id', p_student_id,
    'parent_email', v_student.parent_email,
    'school_id', v_school_id,
    'student_name', v_student.full_name,
    'temp_password', p_temp_password
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_parent_login(uuid, text) TO authenticated;