import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    click?: {
      link: string;
      timestamp: string;
      userAgent: string;
      ipAddress: string;
    };
    open?: {
      timestamp: string;
      userAgent: string;
      ipAddress: string;
    };
    bounce?: {
      message: string;
    };
    complaint?: {
      complaintFeedbackType: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event: ResendWebhookEvent = await req.json();
    console.log("Received Resend webhook event:", event.type, event.data.email_id);

    const resendMessageId = event.data.email_id;
    
    // Find the recipient by resend_message_id
    const { data: recipient, error: recipientError } = await supabase
      .from("email_campaign_recipients")
      .select("id, campaign_id, opened_count, clicked_count")
      .eq("resend_message_id", resendMessageId)
      .single();

    if (recipientError || !recipient) {
      // Log the event anyway for non-campaign emails
      await supabase.from("email_events").insert({
        resend_message_id: resendMessageId,
        event_type: event.type,
        event_data: event.data,
        link_url: event.data.click?.link || null,
        user_agent: event.data.click?.userAgent || event.data.open?.userAgent || null,
        ip_address: event.data.click?.ipAddress || event.data.open?.ipAddress || null,
      });

      console.log("Recipient not found in campaigns, event logged for non-campaign email");
      return new Response(
        JSON.stringify({ success: true, message: "Event logged (non-campaign)" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const campaignId = recipient.campaign_id;
    const recipientId = recipient.id;

    // Insert event record
    await supabase.from("email_events").insert({
      campaign_id: campaignId,
      recipient_id: recipientId,
      resend_message_id: resendMessageId,
      event_type: event.type,
      event_data: event.data,
      link_url: event.data.click?.link || null,
      user_agent: event.data.click?.userAgent || event.data.open?.userAgent || null,
      ip_address: event.data.click?.ipAddress || event.data.open?.ipAddress || null,
    });

    // Update recipient and campaign stats based on event type
    switch (event.type) {
      case "email.opened":
        // Update recipient
        await supabase
          .from("email_campaign_recipients")
          .update({
            opened_at: new Date().toISOString(),
            opened_count: (recipient.opened_count || 0) + 1,
          })
          .eq("id", recipientId);
        break;

      case "email.clicked":
        // Update recipient
        await supabase
          .from("email_campaign_recipients")
          .update({
            clicked_at: new Date().toISOString(),
            clicked_count: (recipient.clicked_count || 0) + 1,
          })
          .eq("id", recipientId);
        break;

      case "email.bounced":
        await supabase
          .from("email_campaign_recipients")
          .update({
            status: "bounced",
            bounced_at: new Date().toISOString(),
            error_message: event.data.bounce?.message || "Email bounced",
          })
          .eq("id", recipientId);
        break;

      case "email.complained":
        await supabase
          .from("email_campaign_recipients")
          .update({
            status: "complained",
            complained_at: new Date().toISOString(),
            error_message: `Spam complaint: ${event.data.complaint?.complaintFeedbackType || "unknown"}`,
          })
          .eq("id", recipientId);
        break;

      case "email.delivered":
        await supabase
          .from("email_campaign_recipients")
          .update({ status: "delivered" })
          .eq("id", recipientId);
        break;
    }

    // Update campaign aggregate stats for tracking events
    if (["email.opened", "email.clicked", "email.bounced", "email.complained"].includes(event.type)) {
      // Get current counts from all recipients
      const { data: stats } = await supabase
        .from("email_campaign_recipients")
        .select("opened_at, clicked_at, bounced_at, complained_at")
        .eq("campaign_id", campaignId);

      if (stats) {
        const openedCount = stats.filter(s => s.opened_at).length;
        const clickedCount = stats.filter(s => s.clicked_at).length;
        const bouncedCount = stats.filter(s => s.bounced_at).length;
        const complainedCount = stats.filter(s => s.complained_at).length;

        await supabase
          .from("email_campaigns")
          .update({
            opened_count: openedCount,
            clicked_count: clickedCount,
            bounced_count: bouncedCount,
            complained_count: complainedCount,
          })
          .eq("id", campaignId);
      }
    }

    console.log(`Processed ${event.type} event for campaign ${campaignId}`);

    return new Response(
      JSON.stringify({ success: true, event_type: event.type }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Resend webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
