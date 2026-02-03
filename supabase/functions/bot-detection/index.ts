import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotDetectionRequest {
  userAgent: string;
  ip: string;
  path: string;
  headers: Record<string, string>;
  fingerprint?: string;
  requestsInWindow?: number;
}

interface BotScore {
  score: number;
  reasons: string[];
  isBot: boolean;
  shouldBlock: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const body: BotDetectionRequest = await req.json();
    const { userAgent, ip, path, headers, fingerprint, requestsInWindow } = body;

    console.log('Bot detection request:', { ip, path, userAgent });

    // Calculate bot detection score
    const botScore = calculateBotScore(userAgent, headers, requestsInWindow);

    // Check if IP is already blocked
    const { data: blockedIp } = await supabaseClient
      .from('bot_detection_logs')
      .select('*')
      .eq('ip_address', ip)
      .eq('is_blocked', true)
      .gte('block_expires_at', new Date().toISOString())
      .single();

    if (blockedIp) {
      console.log('IP is blocked:', ip);
      return new Response(
        JSON.stringify({
          blocked: true,
          reason: 'IP temporarily blocked due to suspicious activity',
          expiresAt: blockedIp.block_expires_at
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log detection
    const logData = {
      ip_address: ip,
      user_agent: userAgent,
      path,
      bot_score: botScore.score,
      detection_reasons: botScore.reasons,
      is_bot: botScore.isBot,
      is_blocked: botScore.shouldBlock,
      behavioral_data: {
        headers: Object.keys(headers),
        fingerprint,
        requestsInWindow
      },
      block_expires_at: botScore.shouldBlock 
        ? new Date(Date.now() + 3600000).toISOString() // Block for 1 hour
        : null
    };

    const { error: logError } = await supabaseClient
      .from('bot_detection_logs')
      .insert(logData);

    if (logError) {
      console.error('Error logging bot detection:', logError);
    }

    // Check rate limit using advanced_rate_limits
    const rateLimitCheck = await checkRateLimit(supabaseClient, ip, path);
    
    if (!rateLimitCheck.allowed) {
      console.log('Rate limit exceeded:', ip);
      return new Response(
        JSON.stringify({
          blocked: true,
          reason: 'Rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return detection result
    return new Response(
      JSON.stringify({
        blocked: botScore.shouldBlock,
        isBot: botScore.isBot,
        score: botScore.score,
        reasons: botScore.reasons,
        rateLimit: {
          remaining: rateLimitCheck.remaining,
          reset: rateLimitCheck.reset
        }
      }),
      {
        status: botScore.shouldBlock ? 403 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: unknown) {
    console.error('Bot detection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculateBotScore(
  userAgent: string,
  headers: Record<string, string>,
  requestsInWindow?: number
): BotScore {
  let score = 0;
  const reasons: string[] = [];

  // Common bot user agents
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /phantom/i, /selenium/i, /headless/i
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      score += 30;
      reasons.push(`Suspicious user agent: ${pattern.toString()}`);
      break;
    }
  }

  // Missing common headers
  const expectedHeaders = ['accept', 'accept-language', 'accept-encoding'];
  const missingHeaders = expectedHeaders.filter(h => !headers[h] && !headers[h.toLowerCase()]);
  
  if (missingHeaders.length > 0) {
    score += missingHeaders.length * 15;
    reasons.push(`Missing headers: ${missingHeaders.join(', ')}`);
  }

  // Empty or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    score += 25;
    reasons.push('Empty or too short user agent');
  }

  // High request rate
  if (requestsInWindow && requestsInWindow > 50) {
    score += 30;
    reasons.push(`High request rate: ${requestsInWindow} requests`);
  }

  // No accept-language (most browsers send this)
  if (!headers['accept-language'] && !headers['Accept-Language']) {
    score += 20;
    reasons.push('Missing Accept-Language header');
  }

  const isBot = score >= 50;
  const shouldBlock = score >= 70;

  return { score, reasons, isBot, shouldBlock };
}

async function checkRateLimit(
  supabase: any,
  identifier: string,
  endpoint: string
) {
  const windowMs = 60000; // 1 minute
  const maxRequests = 60; // 60 requests per minute

  const { data: limitData } = await supabase
    .from('advanced_rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('identifier_type', 'ip')
    .single();

  const now = Date.now();
  
  if (!limitData) {
    // Create new rate limit entry
    await supabase
      .from('advanced_rate_limits')
      .insert({
        identifier,
        identifier_type: 'ip',
        request_count: 1,
        window_start: new Date(now).toISOString(),
        is_blocked: false
      });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      reset: new Date(now + windowMs).toISOString()
    };
  }

  const windowStart = new Date(limitData.window_start).getTime();
  const isInWindow = (now - windowStart) < windowMs;

  if (!isInWindow) {
    // Reset window
    await supabase
      .from('advanced_rate_limits')
      .update({
        request_count: 1,
        window_start: new Date(now).toISOString(),
        is_blocked: false,
        consecutive_violations: 0
      })
      .eq('identifier', identifier);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      reset: new Date(now + windowMs).toISOString()
    };
  }

  const newCount = (limitData.request_count || 0) + 1;
  const exceeded = newCount > maxRequests;

  if (exceeded) {
    const violations = (limitData.consecutive_violations || 0) + 1;
    const blockDuration = Math.min(violations * 300000, 3600000); // Max 1 hour

    await supabase
      .from('advanced_rate_limits')
      .update({
        request_count: newCount,
        is_blocked: true,
        consecutive_violations: violations,
        block_expires_at: new Date(now + blockDuration).toISOString(),
        total_violations: (limitData.total_violations || 0) + 1
      })
      .eq('identifier', identifier);

    return {
      allowed: false,
      remaining: 0,
      reset: new Date(now + blockDuration).toISOString(),
      retryAfter: Math.ceil(blockDuration / 1000)
    };
  }

  await supabase
    .from('advanced_rate_limits')
    .update({
      request_count: newCount
    })
    .eq('identifier', identifier);

  return {
    allowed: true,
    remaining: maxRequests - newCount,
    reset: new Date(windowStart + windowMs).toISOString()
  };
}
