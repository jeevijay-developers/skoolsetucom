import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { teacher_data, employee_data, password, school_id } = await req.json();

    console.log("Creating teacher with login:", { email: teacher_data?.email, school_id });

    if (!teacher_data?.email || !password || !school_id) {
      throw new Error("Missing required fields: email, password, or school_id");
    }

    // Create the auth user with service role (won't affect caller's session)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: teacher_data.email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: teacher_data.full_name }
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log("Created auth user:", userId);

    // Create user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "teacher",
        school_id: school_id
      });

    if (roleError) {
      console.error("Role error:", roleError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create role: ${roleError.message}`);
    }
    console.log("Created user role");

    // Create teacher record
    const { error: teacherError } = await supabaseAdmin
      .from("teachers")
      .insert({
        ...teacher_data,
        school_id: school_id,
        user_id: userId
      });

    if (teacherError) {
      console.error("Teacher error:", teacherError);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create teacher: ${teacherError.message}`);
    }
    console.log("Created teacher record");

    // Create employee record if employee_data is provided
    if (employee_data) {
      const { error: employeeError } = await supabaseAdmin
        .from("employees")
        .insert({
          ...employee_data,
          school_id: school_id
        });

      if (employeeError) {
        console.error("Employee error (non-fatal):", employeeError);
        // Don't fail the whole operation if employee creation fails
      } else {
        console.log("Created employee record");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        email: teacher_data.email 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
