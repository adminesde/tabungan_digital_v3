import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("[get-parent-email-by-student-id] Function started.");

  if (req.method === 'OPTIONS') {
    console.log("[get-parent-email-by-student-id] OPTIONS request received, returning CORS headers.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("[get-parent-email-by-student-id] Request body parsed:", requestBody);
    } catch (e: any) {
      console.error("[get-parent-email-by-student-id] Error parsing request body:", e.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body: ' + e.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { studentId } = requestBody;
    console.log("[get-parent-email-by-student-id] Received studentId (NISN):", studentId);

    if (!studentId) {
      console.error("[get-parent-email-by-student-id] Missing studentId (NISN).");
      return new Response(JSON.stringify({ error: 'Missing studentId (NISN)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log(`[get-parent-email-by-student-id] SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Not Set'}`);
    console.log(`[get-parent-email-by-student-id] SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'Set' : 'Not Set'}`);

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[get-parent-email-by-student-id] Supabase environment variables not set.");
      return new Response(JSON.stringify({ error: 'Supabase environment variables not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log("[get-parent-email-by-student-id] Supabase admin client created.");

    // 1. Find parent_id from students table using student_id (NISN)
    console.log("[get-parent-email-by-student-id] Querying students table for parent_id...");
    const { data: studentDataArray, error: studentError } = await supabaseAdmin
      .from('students')
      .select('parent_id')
      .eq('student_id', studentId)
      .limit(1);

    if (studentError) {
      console.error("[get-parent-email-by-student-id] Error fetching student:", studentError);
      return new Response(JSON.stringify({ error: 'Gagal mencari siswa: ' + studentError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    if (!studentDataArray || studentDataArray.length === 0) {
      console.warn("[get-parent-email-by-student-id] Student not found for NISN:", studentId);
      return new Response(JSON.stringify({ error: 'Siswa tidak ditemukan untuk NISN ini.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const parentId = studentDataArray[0].parent_id;
    console.log("[get-parent-email-by-student-id] Found parent_id:", parentId);

    if (!parentId) {
      console.warn("[get-parent-email-by-student-id] Student found but not linked to a parent account (parent_id is null).");
      return new Response(JSON.stringify({ error: 'Siswa ini belum terhubung dengan akun orang tua.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // 2. Find parent's email from profiles table using parent_id
    console.log("[get-parent-email-by-student-id] Querying profiles table for parent email...");
    const { data: parentProfileArray, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', parentId)
      .limit(1);

    if (profileError) {
      console.error("[get-parent-email-by-student-id] Error fetching parent profile:", profileError);
      return new Response(JSON.stringify({ error: 'Gagal mencari profil orang tua: ' + profileError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!parentProfileArray || parentProfileArray.length === 0) {
      console.warn("[get-parent-email-by-student-id] Parent profile not found for parentId:", parentId);
      return new Response(JSON.stringify({ error: 'Profil orang tua tidak ditemukan.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const parentEmail = parentProfileArray[0].email;
    console.log("[get-parent-email-by-student-id] Parent email found:", parentEmail);

    return new Response(JSON.stringify({ email: parentEmail }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[get-parent-email-by-student-id] Top-level Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});