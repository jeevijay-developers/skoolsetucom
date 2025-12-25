-- Create an atomic function for school registration
-- This runs as SECURITY DEFINER to bypass RLS and ensures all records are created together
CREATE OR REPLACE FUNCTION public.complete_school_registration(
  _school_name TEXT,
  _school_email TEXT,
  _school_phone TEXT,
  _city TEXT,
  _state TEXT,
  _board TEXT,
  _address TEXT DEFAULT NULL,
  _pincode TEXT DEFAULT NULL,
  _principal_name TEXT DEFAULT NULL,
  _student_count INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _school_id UUID;
  _result JSON;
BEGIN
  -- Get the authenticated user
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if user already has a role (prevent duplicate registrations)
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already has a registered role';
  END IF;
  
  -- Create the school
  INSERT INTO public.schools (
    name, email, phone, city, state, board, 
    address, pincode, principal_name, student_count, created_by
  )
  VALUES (
    _school_name, _school_email, _school_phone, _city, _state, _board,
    _address, _pincode, _principal_name, _student_count, _user_id
  )
  RETURNING id INTO _school_id;
  
  -- Create user role as school_admin
  INSERT INTO public.user_roles (user_id, role, school_id)
  VALUES (_user_id, 'school_admin', _school_id);
  
  -- Create trial subscription
  INSERT INTO public.subscriptions (school_id, plan, status)
  VALUES (_school_id, 'basic', 'trial');
  
  -- Return the created school data
  SELECT json_build_object(
    'school_id', _school_id,
    'user_id', _user_id,
    'success', true
  ) INTO _result;
  
  RETURN _result;
END;
$$;