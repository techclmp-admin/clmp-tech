import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { checkRateLimit, RATE_LIMIT_CONFIGS, createRateLimitErrorResponse, createRateLimitHeaders } from '../_shared/rate-limiter.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskAnalysisRequest {
  projectId: string;
  weatherData: any;
  projectType?: string;
  location?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RATE LIMITING: Check rate limit for this user
    const rateLimitResult = await checkRateLimit(user.id, 'ai-risk-analysis', RATE_LIMIT_CONFIGS.ai);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id} on ai-risk-analysis`);
      return createRateLimitErrorResponse(rateLimitResult, corsHeaders);
    }

    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your secrets.');
    }

    const { projectId, weatherData, projectType = 'construction', location }: RiskAnalysisRequest = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has access to the project
    const { data: projectMember, error: memberError } = await supabase
      .from('project_members')
      .select('id, role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !projectMember) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing weather risks for project: ${projectId} by user: ${user.id}`);

    // Create AI prompt for risk analysis
    const prompt = `You are an AI construction safety expert. Analyze the following weather conditions and provide a comprehensive risk assessment for a ${projectType} project.

Weather Data:
- Temperature: ${weatherData.temperature}°C (feels like ${weatherData.feels_like}°C)
- Wind Speed: ${weatherData.wind_speed} km/h
- Humidity: ${weatherData.humidity}%
- Pressure: ${weatherData.pressure} hPa
- Visibility: ${weatherData.visibility} km
- Conditions: ${weatherData.description}
- Location: ${location || 'Unknown'}

Please provide a detailed risk analysis in JSON format with the following structure:
{
  "riskScore": number between 0-1 (0 = no risk, 1 = extreme risk),
  "severityLevel": "low" | "medium" | "high" | "critical",
  "riskFactors": [
    {
      "type": "wind" | "temperature" | "visibility" | "precipitation" | "equipment",
      "level": "low" | "medium" | "high" | "critical",
      "description": "detailed description",
      "impact": "specific impact on construction"
    }
  ],
  "recommendedActions": [
    "specific actionable recommendations"
  ],
  "workActivitiesAffected": [
    {
      "activity": "crane operations" | "concrete work" | "roofing" | "exterior work" | "painting",
      "riskLevel": "low" | "medium" | "high" | "critical",
      "recommendation": "specific guidance"
    }
  ],
  "timeframe": "immediate" | "next_6_hours" | "next_24_hours",
  "equipment_concerns": [
    "list of equipment that may be affected"
  ]
}

Focus on construction-specific hazards and provide actionable, practical recommendations. Return ONLY valid JSON, no additional text.`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      if (geminiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        throw new Error('API key issue. Please check your Gemini API key.');
      }
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    
    // Extract content from Gemini response
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error('No content returned from Gemini API');
    }

    // Parse the JSON response
    let aiAnalysis;
    try {
      // Clean the response in case there are markdown code blocks
      const cleanedContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiAnalysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Store risk assessment in database
    const { data: riskAssessment, error: riskError } = await supabase
      .from('risk_assessments')
      .insert({
        project_id: projectId,
        risk_type: 'weather',
        severity: aiAnalysis.severityLevel,
        risk_score: Math.round(aiAnalysis.riskScore * 100), // Convert to integer 0-100
        risk_factors: aiAnalysis.riskFactors,
        mitigation_strategies: aiAnalysis.recommendedActions,
        ai_recommendations: aiAnalysis,
        weather_conditions: weatherData,
        valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // Valid for 6 hours
        description: `Weather risk analysis: ${aiAnalysis.severityLevel} risk level`,
        status: 'active',
      })
      .select()
      .single();

    if (riskError) {
      console.error('Error storing risk assessment:', riskError);
    }

    // Create weather alerts if risk is medium or higher
    if (['medium', 'high', 'critical'].includes(aiAnalysis.severityLevel)) {
      const alertData = {
        project_id: projectId,
        alert_type: aiAnalysis.riskFactors[0]?.type || 'severe_weather',
        severity: aiAnalysis.severityLevel,
        title: `Weather Risk Alert - ${aiAnalysis.severityLevel.toUpperCase()}`,
        description: `Weather conditions pose ${aiAnalysis.severityLevel} risk to construction activities. ${aiAnalysis.recommendedActions[0] || 'Monitor conditions closely.'}`,
        weather_data: weatherData,
        ai_analysis: aiAnalysis,
        recommended_actions: aiAnalysis.recommendedActions,
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // Expires in 12 hours
      };

      const { error: alertError } = await supabase
        .from('weather_alerts')
        .insert(alertData);

      if (alertError) {
        console.error('Error creating weather alert:', alertError);
      }
    }

    console.log('Risk analysis completed successfully with Gemini');

    // Add rate limit headers to response
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

    return new Response(JSON.stringify({
      riskAssessment: riskAssessment,
      aiAnalysis: aiAnalysis,
      alertCreated: ['medium', 'high', 'critical'].includes(aiAnalysis.severityLevel)
    }), {
      headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-risk-analysis function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to analyze weather risks',
      details: 'Please check the input data and try again'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
