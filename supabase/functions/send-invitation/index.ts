import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  projectName: string;
  projectId: string;
  inviterName: string;
  invitationToken: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with user's JWT token to verify authorization
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated by passing the token explicitly
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { 
      email, 
      projectName,
      projectId,
      inviterName, 
      invitationToken, 
      role 
    }: InvitationEmailRequest = await req.json();

    // Validate required fields
    if (!email || !projectName || !invitationToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: email, projectName, invitationToken' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Special case: team invite (not a project invite)
    const isTeamInvite = projectId === 'team-invite';

    // Check if the invited email already has an account (for team invites)
    let userExists = false;
    if (isTeamInvite) {
      // Use service role client to check if user exists
      const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { data: existingUser } = await serviceClient
        .from('profiles')
        .select('user_id')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      userExists = !!existingUser;
      console.log(`Team invite to ${email} - user exists: ${userExists}`);
    }

    if (!isTeamInvite && projectId) {
      // Verify user has permission to invite (must be owner or admin of the project)
      const { data: projectMember, error: memberError } = await supabaseClient
        .from('project_members')
        .select('id, role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !projectMember) {
        return new Response(
          JSON.stringify({ success: false, error: 'Access denied - you are not a member of this project' }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Only owners and admins can send invitations
      if (!['owner', 'admin'].includes(projectMember.role)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Access denied - only owners and admins can send invitations' }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify the invitation exists in the database
      const { data: invitation, error: inviteError } = await supabaseClient
        .from('team_invitations')
        .select('id, email, status')
        .eq('invitation_token', invitationToken)
        .eq('project_id', projectId)
        .single();

      if (inviteError || !invitation) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid invitation token' }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (invitation.status !== 'pending') {
        return new Response(
          JSON.stringify({ success: false, error: 'Invitation is no longer valid' }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    console.log('Sending invitation email to:', email);

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      // Log but don't fail - email sending is optional
      console.log('RESEND_API_KEY not configured - skipping email send');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invitation created but email sending is not configured',
          emailSent: false 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    // For team invites: existing users go to dashboard (they'll see invite there), new users go to auth
    const acceptUrl = isTeamInvite 
      ? (userExists 
          ? `${Deno.env.get('SITE_URL') || 'https://clmp.ca'}/team` 
          : `${Deno.env.get('SITE_URL') || 'https://clmp.ca'}/auth`)
      : `${Deno.env.get('SITE_URL') || 'https://clmp.ca'}/accept-invitation?token=${invitationToken}`;
    
    const emailSubject = isTeamInvite 
      ? `${inviterName} invited you to join CLMP Tech`
      : `Invitation to join ${projectName} project`;

    // Button text based on whether user exists
    const teamInviteButtonText = userExists ? 'View Invitation' : 'Sign Up Now';
    const teamInviteInstruction = userExists 
      ? `Click below to view and accept the invitation in your dashboard.`
      : `After signing up, share your <strong>Member Code</strong> with ${inviterName} to be added to their team.`;

    const teamInviteHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f9fc; }
          .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .role-badge { background: #fff7ed; color: #ea580c; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://clmp.ca/images/clmp-logo-full.png" alt="CLMP Tech" style="height: 50px; margin-bottom: 10px;" />
            <h2>Team Invitation</h2>
          </div>
          <div class="content">
            <h3>You're invited to join CLMP Tech!</h3>
            <p>Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to join their team on CLMP Tech - the advanced construction project management platform.</p>
            <p><strong>Your Role:</strong> <span class="role-badge">${role.toUpperCase()}</span></p>
            <p>With CLMP Tech, you'll be able to:</p>
            <ul>
              <li>📊 Manage construction projects efficiently</li>
              <li>📝 Track tasks and deadlines</li>
              <li>💬 Collaborate with team members</li>
              <li>📁 Share documents and files</li>
            </ul>
            <div style="text-align: center;">
              <a href="${acceptUrl}" class="button">${teamInviteButtonText}</a>
            </div>
            <p>${teamInviteInstruction}</p>
            <p>Best regards,<br>The CLMP Tech Team</p>
          </div>
          <div class="footer">
            <p>CLMP Tech Inc. | Advanced Construction Management Platform</p>
            <p>Unit 4, 205 Torbay Road, Markham, ON L3R 3W4, Canada</p>
            <p><a href="https://clmp.ca">clmp.ca</a> | <a href="mailto:info@clmptech.ca">info@clmptech.ca</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const projectInviteHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Invitation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f9fc; }
          .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
          .project-details { background: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .role-badge { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://clmp.ca/images/clmp-logo-full.png" alt="CLMP Tech" style="height: 50px; margin-bottom: 10px;" />
            <h2>Project Invitation</h2>
          </div>
          <div class="content">
            <h3>You're invited to join a construction project!</h3>
            <p>Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to join the construction project management platform and collaborate on:</p>
            <div class="project-details">
              <h4>📋 ${projectName}</h4>
              <p><strong>Your Role:</strong> <span class="role-badge">${role.toUpperCase()}</span></p>
            </div>
            <p>As a <strong>${role}</strong>, you'll be able to:</p>
            <ul>
              <li>📊 View project progress and milestones</li>
              <li>📝 Manage tasks and deadlines</li>
              <li>💬 Communicate with team members</li>
              <li>📁 Access project documents and files</li>
              ${role === 'admin' || role === 'manager' ? '<li>⚙️ Manage project settings and team</li>' : ''}
            </ul>
            <div style="text-align: center;">
              <a href="${acceptUrl}" class="button">Accept Invitation</a>
            </div>
            <p><strong>Note:</strong> This invitation will expire in 7 days. If you don't have an account yet, you'll be prompted to create one when you accept the invitation.</p>
            <p>If you have any questions, feel free to reach out to <strong>${inviterName}</strong> or our support team.</p>
            <p>Welcome to the team!</p>
            <p>Best regards,<br>The CLMP Tech Team</p>
          </div>
          <div class="footer">
            <p>CLMP Tech Inc. | Advanced Construction Management Platform</p>
            <p>Unit 4, 205 Torbay Road, Markham, ON L3R 3W4, Canada</p>
            <p><a href="https://clmp.ca">clmp.ca</a> | <a href="mailto:info@clmptech.ca">info@clmptech.ca</a> | +1 (705) 985-9688</p>
            <p style="margin-top: 15px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "CLMP Tech <noreply@clmp.ca>",
      to: [email],
      subject: emailSubject,
      html: isTeamInvite ? teamInviteHtml : projectInviteHtml,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      emailSent: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);