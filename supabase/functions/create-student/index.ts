import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourseAssignment {
  course_id: string;
  enabled_from?: string;
  expires_at?: string;
  notes?: string;
}

interface CreateStudentRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  status?: 'active' | 'inactive' | 'suspended';
  enabled_from?: string;
  expires_at?: string;
  notes?: string;
  courses?: CourseAssignment[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create client with user's token to verify they're a superadmin
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the caller is a superadmin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: hasRole, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'superadmin' });
    
    if (roleError || !hasRole) {
      throw new Error('Only superadmins can create students');
    }

    // Parse request body
    const body: CreateStudentRequest = await req.json();
    
    if (!body.email || !body.password || !body.name) {
      throw new Error('Email, password and name are required');
    }

    if (body.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name: body.name }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(authError.message);
    }

    const userId = authData.user.id;
    console.log('Created auth user:', userId);

    // Update the profile (trigger already creates it, so we update)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name: body.name,
        phone: body.phone || null,
        avatar: body.avatar || null,
        status: body.status || 'active',
        enabled_from: body.enabled_from || new Date().toISOString(),
        expires_at: body.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        notes: body.notes || null,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile error:', profileError);
      // Don't throw, profile might be created by trigger
    }

    // Assign courses if provided
    if (body.courses && body.courses.length > 0) {
      const courseAssignments = body.courses.map(c => ({
        user_id: userId,
        course_id: c.course_id,
        enabled_from: c.enabled_from || new Date().toISOString(),
        expires_at: c.expires_at || null,
        notes: c.notes || null,
      }));

      const { error: assignError } = await supabaseAdmin
        .from('user_course_assignments')
        .insert(courseAssignments);

      if (assignError) {
        console.error('Assignment error:', assignError);
      }
    }

    console.log('Student created successfully:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        message: 'Student created successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in create-student:', error);
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
