import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, RATE_LIMIT_CONFIGS, createRateLimitErrorResponse, createRateLimitHeaders } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Validate the user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RATE LIMITING: Check rate limit for this user
    const rateLimitResult = await checkRateLimit(user.id, 'scan-receipt', RATE_LIMIT_CONFIGS.receipt);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id} on scan-receipt`);
      return createRateLimitErrorResponse(rateLimitResult, corsHeaders);
    }

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Extract base64 data and mime type
    let base64Data = imageBase64;
    let mimeType = "image/jpeg";
    
    if (imageBase64.startsWith('data:')) {
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    const systemPrompt = `You are an expert receipt/invoice scanner. Extract the following information from the receipt image:
- vendor: The name of the store/vendor
- amount: The total amount (number only, no currency symbols)
- date: The date in YYYY-MM-DD format
- description: A brief description of the purchase
- category: Suggest a category from: Materials, Labor, Equipment, Subcontractor, Permits, Insurance, Utilities, Transportation, Office, Other

Respond ONLY with valid JSON in this exact format:
{
  "vendor": "string",
  "amount": "number as string",
  "date": "YYYY-MM-DD",
  "description": "string",
  "category": "string",
  "confidence": "high/medium/low"
}`;

    // Call Gemini API with vision
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                },
                { text: "Please scan this receipt and extract the information:" }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "API key issue. Please check your Gemini API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to process receipt");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let extractedData;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Could not parse receipt data");
    }

    // Log successful scan for user
    console.log(`Receipt scanned successfully for user ${user.id}`);

    // Add rate limit headers to response
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Receipt scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
