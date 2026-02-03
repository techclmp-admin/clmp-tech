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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Validate the user token using getClaims
    const token = authHeader.replace("Bearer ", "");
    
    // Create client with user's token for auth validation
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: claimsData, error: authError } = await authClient.auth.getUser();
    
    if (authError || !claimsData?.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const user = claimsData.user;
    
    // Create service client for data queries
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // RATE LIMITING: Check rate limit for this user
    const rateLimitResult = await checkRateLimit(user.id, 'ai-chat', RATE_LIMIT_CONFIGS.ai);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id} on ai-chat`);
      return createRateLimitErrorResponse(rateLimitResult, corsHeaders);
    }

    const { messages, context } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Get user context from Supabase
    let userContext = "";
    if (context?.includeUserData) {
      try {
        // Fetch user's projects summary
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, budget, status')
          .eq('owner_id', user.id)
          .limit(10);
        
        // Fetch recent expenses
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, category, expense_date, project_id')
          .eq('created_by', user.id)
          .order('expense_date', { ascending: false })
          .limit(20);
        
        // Fetch budget summary
        const { data: budgets } = await supabase
          .from('project_budgets')
          .select('budgeted_amount, category, project_id')
          .limit(20);
        
        if (projects?.length || expenses?.length) {
          userContext = `\n\nUser's current data:
- Projects: ${projects?.length || 0} active projects
${projects?.map(p => `  • ${p.name}: Budget $${p.budget?.toLocaleString() || 'N/A'}, Status: ${p.status}`).join('\n') || '  No projects'}
- Recent expenses: ${expenses?.length || 0} entries
  Total recent spending: $${expenses?.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
- Budget allocations: ${budgets?.length || 0} entries`;
        }
      } catch (contextError) {
        console.error("Error fetching user context:", contextError);
      }
    }

    const systemPrompt = `You are CLMP AI Assistant - a helpful, knowledgeable assistant for the CLMP (Construction & Landscape Management Platform) application. You help users with:

1. **Budget & Finance**: Explain budget tracking, expense management, forecasting, and the Canadian Tax Calculator feature.

2. **Project Management**: Help with project creation, task management, Kanban boards, Gantt charts, team collaboration, and timeline planning.

3. **Compliance & Safety**: Guide users through permit tracking, OBC compliance, safety checklists, and inspection scheduling.

4. **Risk Management**: Explain AI-powered risk analysis, weather alerts, and mitigation strategies.

5. **Team Collaboration**: Help with team invitations, role management, chat features, and file sharing.

6. **Integrations**: Assist with QuickBooks, Slack notifications, and other integrations.

7. **General Support**: Answer questions about subscription plans, billing, settings, and app navigation.

Be concise, friendly, and professional. If you don't know something specific about CLMP features, suggest checking the Help section or contacting support at info@clmptech.ca.${userContext}`;

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system prompt as first user message (Gemini doesn't have system role)
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I am CLMP AI Assistant, ready to help with construction and landscape management questions.' }] },
      ...geminiMessages
    ];

    // Call Gemini API with streaming
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
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
      throw new Error("AI service unavailable");
    }

    // Transform Gemini SSE to OpenAI-compatible SSE format
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr.trim() === '[DONE]') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              continue;
            }
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              
              if (content) {
                // Convert to OpenAI format
                const openAIFormat = {
                  choices: [{
                    delta: { content },
                    index: 0
                  }]
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      },
      flush(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      }
    });

    const transformedBody = response.body?.pipeThrough(transformStream);

    // Add rate limit headers to response
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

    return new Response(transformedBody, {
      headers: { 
        ...corsHeaders, 
        ...rateLimitHeaders,
        "Content-Type": "text/event-stream" 
      },
    });

  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
