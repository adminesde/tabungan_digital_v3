import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'; // Revert to latest stable version

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    console.log("[create-user] Function started.");

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log("[create-user] Request body parsed:", requestBody);
    } catch (e: any) {
      console.error("[create-user] Error parsing request body:", e.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body: ' + e.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("[create-user] Entering main logic block.");
    const { email, password, first_name, last_name, role, class: userClass, nisn } = requestBody;
    console.log("[create-user] Destructured request data:", { email, first_name, last_name, role, userClass, nisn });

    if (!email || !password || !first_name || !role) {
      console.error("[create-user] Missing required fields.");
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, first_name, role' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log(`[create-user] SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Not Set'}`);
    console.log(`[create-user] SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'Set' : 'Not Set'}`);

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[create-user] Supabase environment variables not set.");
      return new Response(JSON.stringify({ error: 'Supabase environment variables not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    let supabaseAdmin;
    try {
      console.log("[create-user] Attempting to create Supabase admin client.");
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
      console.log("[create-user] Supabase admin client created successfully.");
    } catch (e: any) {
      console.error("[create-user] Exception during Supabase client creation:", e.message);
      return new Response(JSON.stringify({ error: 'Failed to initialize Supabase client: ' + e.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Directly attempt to create user and handle potential conflicts
    console.log("[create-user] Attempting to create user in auth.users...");
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role,
        class: userClass,
      },
    });

    if (authError) {
      console.error("[create-user] Supabase createUser error:", authError);
      if (authError.status === 409 || authError.message.includes('User already registered')) {
        return new Response(JSON.stringify({ error: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409, // Conflict
        });
      }
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!userData.user) {
      console.error("[create-user] User data is null after successful createUser call.");
      return new Response(JSON.stringify({ error: 'Failed to retrieve user data after creation.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log("[create-user] User created in auth.users with ID:", userData.user.id);

    // If parent role, link the new user ID to the student's parent_id
    if (role === 'parent' && nisn) {
      console.log(`[create-user] Attempting to link parent ${userData.user.id} to student with NISN: ${nisn}`);
      
      console.log("[create-user] Looking up student by NISN...");
      const { data: studentDataArray, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('student_id', nisn)
        .limit(1);
      console.log("[create-user] Student lookup completed. Data:", studentDataArray, "Error:", studentError);

      if (studentError || !studentDataArray || studentDataArray.length === 0) {
        console.error("[create-user] Error finding student for NISN during parent linking:", studentError, "Student Data Array:", studentDataArray);
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id); // Clean up created user
        return new Response(JSON.stringify({ error: 'Siswa tidak ditemukan untuk NISN yang diberikan atau penautan gagal.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      const studentData = studentDataArray[0];
      console.log(`[create-user] Found student ID ${studentData.id} for NISN ${nisn}. Attempting to update parent_id.`);
      const { error: updateStudentError } = await supabaseAdmin
        .from('students')
        .update({ parent_id: userData.user.id })
        .eq('id', studentData.id);
      console.log("[create-user] Student parent_id update completed. Error:", updateStudentError);

      if (updateStudentError) {
        console.error("[create-user] Supabase update student error details:", updateStudentError);
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id); // Clean up created user
        return new Response(JSON.stringify({ error: 'Gagal menautkan orang tua ke siswa: ' + updateStudentError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      console.log(`[create-user] Successfully linked parent ${userData.user.id} to student ${studentData.id}.`);
    }

    return new Response(JSON.stringify({ user: userData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[create-user] Top-level Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});