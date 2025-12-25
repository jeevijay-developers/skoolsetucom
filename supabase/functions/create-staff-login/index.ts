import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create user client to verify caller
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the calling user
    const { data: { user: callingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !callingUser) {
      throw new Error('Unauthorized');
    }

    // Get request body
    const { email, password, school_id, employee_id, permissions } = await req.json();

    console.log('Creating staff login for:', email, 'school:', school_id);

    // Validate input
    if (!email || !password || !school_id) {
      throw new Error('Email, password, and school_id are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Verify caller is a school admin for this school
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', callingUser.id)
      .eq('role', 'school_admin')
      .eq('school_id', school_id)
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Not authorized to create staff for this school');
    }

    // Check if user with email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(authError.message);
    }

    const newUserId = authData.user.id;
    console.log('Created auth user:', newUserId);

    // Create user role as school_staff
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: 'school_staff',
        school_id: school_id,
      });

    if (roleInsertError) {
      console.error('Error creating user role:', roleInsertError);
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error('Failed to create user role');
    }

    // Create staff permissions
    const { error: permError } = await supabaseAdmin
      .from('staff_permissions')
      .insert({
        user_id: newUserId,
        school_id: school_id,
        employee_id: employee_id || null,
        can_collect_fee: permissions?.can_collect_fee || false,
        can_manage_payroll: permissions?.can_manage_payroll || false,
        can_manage_attendance: permissions?.can_manage_attendance || false,
        can_manage_students: permissions?.can_manage_students || false,
        can_manage_exams: permissions?.can_manage_exams || false,
        can_view_reports: permissions?.can_view_reports || false,
        can_manage_notices: permissions?.can_manage_notices || false,
        is_active: true,
      });

    if (permError) {
      console.error('Error creating staff permissions:', permError);
      // Rollback: delete the auth user and role
      await supabaseAdmin.from('user_roles').delete().eq('user_id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error('Failed to create staff permissions');
    }

    console.log('Staff login created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUserId,
        message: 'Staff login created successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in create-staff-login:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
