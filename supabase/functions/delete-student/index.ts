import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteStudentRequest {
  student_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify caller is superadmin
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: hasRole } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'superadmin' });
    
    if (!hasRole) {
      throw new Error('Only superadmins can delete students');
    }

    const body: DeleteStudentRequest = await req.json();
    
    if (!body.student_id) {
      throw new Error('Student ID is required');
    }

    // Prevent self-deletion
    if (body.student_id === user.id) {
      throw new Error('Cannot delete your own account');
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Delete the auth user (cascade will delete profile and roles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      body.student_id
    );

    if (deleteError) {
      console.error('Delete user error:', deleteError);
      throw new Error(deleteError.message);
    }

    console.log('Student deleted:', body.student_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Student deleted successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in delete-student:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
