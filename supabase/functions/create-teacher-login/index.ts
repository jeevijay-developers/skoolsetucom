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

    const { teacher_data, employee_data, password, school_id, teacher_id, update_password } = await req.json();

    // Handle password update for existing teacher
    if (update_password && teacher_id) {
      console.log("Updating password for teacher:", teacher_id);
      
      // Get teacher's user_id
      const { data: teacher, error: teacherError } = await supabaseAdmin
        .from("teachers")
        .select("user_id, email")
        .eq("id", teacher_id)
        .single();

      if (teacherError || !teacher?.user_id) {
        throw new Error("Teacher not found or has no login account");
      }

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        teacher.user_id,
        { password: password }
      );

      if (updateError) {
        console.error("Password update error:", updateError);
        throw new Error(`Failed to update password: ${updateError.message}`);
      }

      console.log("Password updated successfully");
      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("Creating teacher with login:", { email: teacher_data?.email, school_id });

    if (!teacher_data?.email || !password || !school_id) {
      throw new Error("Missing required fields: email, password, or school_id");
    }

    // Check if teacher already exists in teachers table
    const { data: existingTeacher } = await supabaseAdmin
      .from("teachers")
      .select("id, user_id")
      .eq("email", teacher_data.email)
      .eq("school_id", school_id)
      .maybeSingle();

    if (existingTeacher) {
      throw new Error("A teacher with this email already exists in this school");
    }

    // Try to create the auth user
    let userId: string;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: teacher_data.email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: teacher_data.full_name }
    });

    if (authError) {
      // Check if user already exists in auth
      if (authError.code === "email_exists") {
        // Get existing user
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === teacher_data.email);
        
        if (!existingUser) {
          throw new Error("User exists but could not be found");
        }
        
        // Update password for existing user
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
        userId = existingUser.id;
        console.log("Using existing auth user:", userId);
      } else {
        console.error("Auth error:", authError);
        throw new Error(`Failed to create user: ${authError.message}`);
      }
    } else {
      userId = authData.user.id;
    }
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
