
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  userId: string;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create regular client to verify user auth
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId }: DeleteUserRequest = await req.json();

    // Input validation
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!UUID_REGEX.test(userId)) {
      console.error('Invalid UUID format:', userId);
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization check: user can only delete themselves OR must be admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const canDelete = (user.id === userId) || adminRole;

    if (!canDelete) {
      console.warn(`Unauthorized deletion attempt by ${user.id} for user ${userId}`);
      
      // Log audit event
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'DELETE_USER_DENIED',
        resource_type: 'user',
        resource_id: userId,
        details: { reason: 'Insufficient permissions' }
      });

      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only delete your own account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Safeguard: prevent deleting the last admin/system_admin
    const { data: targetRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'system_admin']);

    if (targetRoles && targetRoles.length > 0) {
      // User being deleted has admin privileges — check if they're the last one
      for (const { role } of targetRoles) {
        const { count } = await supabaseAdmin
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', role);

        if (count !== null && count <= 1) {
          console.warn(`Blocked deletion of last ${role}: ${userId}`);

          await supabaseAdmin.from('audit_logs').insert({
            user_id: user.id,
            action: 'DELETE_USER_DENIED',
            resource_type: 'user',
            resource_id: userId,
            details: { reason: `Cannot delete the last ${role}` }
          });

          return new Response(
            JSON.stringify({ error: `Cannot delete this account because it is the last ${role === 'system_admin' ? 'System Admin' : 'Admin'}. Please assign the role to another user first.` }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    console.log(`Starting deletion process for user: ${userId} by ${user.id}`);

    // Delete all user-related data first
    const tablesToCleanup = [
      'user_roles',
      'user_sessions', 
      'user_tokens',
      'user_achievements',
      'user_badges',
      'user_connections',
      'user_follows',
      'user_interests',
      'user_memories',
      'user_mfa_settings',
      'user_points',
      'user_privacy_settings',
      'user_subscriptions',
      'chat_participants',
      'project_members'
    ];

    for (const table of tablesToCleanup) {
      try {
        await supabaseAdmin.from(table).delete().eq('user_id', userId);
        console.log(`Deleted from ${table}`);
      } catch (err) {
        console.warn(`Error deleting from ${table}:`, err);
      }
    }

    // Delete from profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    } else {
      console.log('Profile deleted successfully');
    }

    // Finally delete the user from auth.users
    const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userError) {
      console.error('Error deleting user:', userError);
      return new Response(
        JSON.stringify({ error: `Failed to delete user: ${userError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted successfully');

    // Log successful deletion for audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'DELETE_USER_SUCCESS',
      resource_type: 'user',
      resource_id: userId,
      details: { deleted_by: user.id, deleted_at: new Date().toISOString() }
    });

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
