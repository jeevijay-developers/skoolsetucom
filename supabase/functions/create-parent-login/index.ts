import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateParentLoginRequest {
  student_id: string;
  temp_password: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create regular client for RPC call
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { student_id, temp_password }: CreateParentLoginRequest = await req.json();

    if (!student_id || !temp_password) {
      throw new Error("student_id and temp_password are required");
    }

    console.log("Creating parent login for student:", student_id);

    // Get student details using the RPC function
    const { data: studentData, error: rpcError } = await supabase.rpc(
      "create_parent_login",
      { p_student_id: student_id, p_temp_password: temp_password }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      throw new Error(rpcError.message);
    }

    const { parent_email, school_id, student_name } = studentData;

    console.log("Student data retrieved:", { parent_email, school_id, student_name });

    // Create auth user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: parent_email,
      password: temp_password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: `Parent of ${student_name}`,
        role: "parent",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(authError.message);
    }

    const parentUserId = authData.user.id;
    console.log("Auth user created:", parentUserId);

    // Create user_role entry
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: parentUserId,
        role: "parent",
        school_id: school_id,
      });

    if (roleError) {
      console.error("Role error:", roleError);
      // Rollback: delete the created auth user
      await supabaseAdmin.auth.admin.deleteUser(parentUserId);
      throw new Error("Failed to create user role: " + roleError.message);
    }

    // Update student with parent_user_id
    const { error: updateError } = await supabaseAdmin
      .from("students")
      .update({ parent_user_id: parentUserId })
      .eq("id", student_id);

    if (updateError) {
      console.error("Update error:", updateError);
      // Rollback
      await supabaseAdmin.from("user_roles").delete().eq("user_id", parentUserId);
      await supabaseAdmin.auth.admin.deleteUser(parentUserId);
      throw new Error("Failed to update student: " + updateError.message);
    }

    console.log("Parent login created successfully");

    return new Response(
      JSON.stringify({
        success: true,
        email: parent_email,
        message: "Parent login created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating parent login:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
