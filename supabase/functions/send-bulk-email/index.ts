import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  campaign_id: string;
  batch_size?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { campaign_id, batch_size = 10 }: BulkEmailRequest = await req.json();

    if (!campaign_id) {
      throw new Error("campaign_id is required");
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status === "completed") {
      return new Response(
        JSON.stringify({ success: true, message: "Campaign already completed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update campaign status to sending if it's not already
    if (campaign.status !== "sending") {
      await supabase
        .from("email_campaigns")
        .update({ 
          status: "sending", 
          started_at: new Date().toISOString() 
        })
        .eq("id", campaign_id);
    }

    // Get pending recipients (batch processing)
    const { data: recipients, error: recipientsError } = await supabase
      .from("email_campaign_recipients")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("status", "pending")
      .limit(batch_size);

    if (recipientsError) {
      throw new Error("Failed to fetch recipients");
    }

    if (!recipients || recipients.length === 0) {
      // No more pending recipients, mark campaign as completed
      await supabase
        .from("email_campaigns")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", campaign_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Campaign completed", 
          sent: 0,
          remaining: 0
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    // Process each recipient with rate limiting
    for (const recipient of recipients) {
      try {
        // Replace variables in content
        let personalizedContent = campaign.html_content;
        personalizedContent = personalizedContent.replace(/{{user_name}}/g, recipient.recipient_name || "Valued Customer");
        personalizedContent = personalizedContent.replace(/{{user_email}}/g, recipient.recipient_email);
        personalizedContent = personalizedContent.replace(/{{unsubscribe_link}}/g, `https://clmp.ca/unsubscribe?email=${encodeURIComponent(recipient.recipient_email)}`);

        // Send email with tracking enabled
        const emailResult = await resend.emails.send({
          from: "CLMP <noreply@clmp.ca>",
          to: [recipient.recipient_email],
          subject: campaign.subject,
          html: personalizedContent,
          headers: {
            "X-Entity-Ref-ID": recipient.id, // For tracking
          },
        });

        // Store resend_message_id for webhook tracking
        if (emailResult.data?.id) {
          await supabase
            .from("email_campaign_recipients")
            .update({ resend_message_id: emailResult.data.id })
            .eq("id", recipient.id);
        }

        // Update recipient status
        await supabase
          .from("email_campaign_recipients")
          .update({ 
            status: "sent", 
            sent_at: new Date().toISOString() 
          })
          .eq("id", recipient.id);

        // Log to email_logs
        await supabase.from("email_logs").insert({
          template_key: `campaign_${campaign_id}`,
          recipient_email: recipient.recipient_email,
          subject: campaign.subject,
          status: "sent",
          resend_message_id: emailResult.data?.id || null,
          sent_at: new Date().toISOString(),
        });

        sentCount++;

        // Rate limiting: wait 200ms between emails to stay within Resend limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (emailError: any) {
        console.error(`Failed to send to ${recipient.recipient_email}:`, emailError);
        
        // Update recipient status as failed
        await supabase
          .from("email_campaign_recipients")
          .update({ 
            status: "failed", 
            error_message: emailError.message || "Unknown error"
          })
          .eq("id", recipient.id);

        failedCount++;
      }
    }

    // Update campaign counts
    const { data: updatedCampaign } = await supabase
      .from("email_campaigns")
      .update({ 
        sent_count: campaign.sent_count + sentCount,
        failed_count: campaign.failed_count + failedCount
      })
      .eq("id", campaign_id)
      .select()
      .single();

    // Check remaining recipients
    const { count: remainingCount } = await supabase
      .from("email_campaign_recipients")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaign_id)
      .eq("status", "pending");

    const hasMoreRecipients = (remainingCount || 0) > 0;

    // If no more recipients, mark as completed
    if (!hasMoreRecipients) {
      await supabase
        .from("email_campaigns")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", campaign_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        failed: failedCount,
        remaining: remainingCount || 0,
        hasMore: hasMoreRecipients,
        message: hasMoreRecipients 
          ? `Processed ${sentCount + failedCount} emails. ${remainingCount} remaining.`
          : "Campaign completed successfully!"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Bulk email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);