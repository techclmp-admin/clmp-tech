import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  template_key: string;
  recipient_email: string;
  recipient_user_id?: string;
  variables: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const resend = new Resend(resendApiKey);

    const { template_key, recipient_email, recipient_user_id, variables }: SendEmailRequest = await req.json();

    if (!template_key || !recipient_email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: template_key, recipient_email' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', template_key)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', template_key, templateError);
      return new Response(
        JSON.stringify({ success: false, error: `Email template not found: ${template_key}` }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Replace variables in subject and content
    let subject = template.subject;
    let htmlContent = template.html_content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      htmlContent = htmlContent.replace(regex, value);
    }

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "CLMP Tech <noreply@clmp.ca>",
      to: [recipient_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabase.from('email_logs').insert({
      template_key,
      recipient_email,
      recipient_user_id,
      subject,
      status: emailResponse.data?.id ? 'sent' : 'failed',
      resend_message_id: emailResponse.data?.id,
      error_message: emailResponse.error?.message,
      metadata: { variables },
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
