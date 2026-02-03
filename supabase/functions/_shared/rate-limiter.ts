import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RateLimitConfig {
  maxRequests: number;      // Max requests per window
  windowMs: number;         // Window duration in milliseconds
  blockDurationMs?: number; // Block duration when limit exceeded (default: windowMs * 2)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until retry allowed
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 2 * 60 * 1000, // 2 minutes
};

// Different configs for different function types
export const RATE_LIMIT_CONFIGS = {
  // AI functions - more restrictive (expensive API calls)
  ai: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
  },
  // Receipt scanning - moderate limits
  receipt: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    blockDurationMs: 3 * 60 * 1000,
  },
  // General API - standard limits
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    blockDurationMs: 2 * 60 * 1000,
  },
  // Webhook - higher limits for external services
  webhook: {
    maxRequests: 500,
    windowMs: 60 * 1000,
    blockDurationMs: 1 * 60 * 1000,
  },
} as const;

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // Create a unique identifier combining user/IP and endpoint
  const rateLimitId = `${identifier}:${endpoint}`;

  // Check for existing rate limit record
  const { data: existing, error: fetchError } = await supabase
    .from('advanced_rate_limits')
    .select('*')
    .eq('identifier', rateLimitId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Rate limit fetch error:', fetchError);
    // On error, allow the request but log it
    return { allowed: true, remaining: config.maxRequests, resetAt: now };
  }

  // Check if currently blocked
  if (existing?.is_blocked && existing?.block_expires_at) {
    const blockExpiry = new Date(existing.block_expires_at);
    if (blockExpiry > now) {
      const retryAfter = Math.ceil((blockExpiry.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockExpiry,
        retryAfter,
      };
    }
  }

  // Check if we need to reset the window
  const existingWindowStart = existing?.window_start ? new Date(existing.window_start) : null;
  const shouldResetWindow = !existingWindowStart || existingWindowStart < windowStart;

  if (!existing) {
    // Create new rate limit record
    await supabase.from('advanced_rate_limits').insert({
      identifier: rateLimitId,
      identifier_type: 'user',
      request_count: 1,
      window_start: now.toISOString(),
      is_blocked: false,
      consecutive_violations: 0,
      total_violations: 0,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }

  if (shouldResetWindow) {
    // Reset the window
    await supabase
      .from('advanced_rate_limits')
      .update({
        request_count: 1,
        window_start: now.toISOString(),
        is_blocked: false,
        consecutive_violations: 0,
      })
      .eq('identifier', rateLimitId);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }

  // Increment request count
  const newCount = (existing.request_count || 0) + 1;

  if (newCount > config.maxRequests) {
    // Rate limit exceeded - block the user
    const blockDuration = config.blockDurationMs || config.windowMs * 2;
    const consecutiveViolations = (existing.consecutive_violations || 0) + 1;
    
    // Exponential backoff for repeated violations
    const actualBlockDuration = blockDuration * Math.min(consecutiveViolations, 5);
    const blockExpiry = new Date(now.getTime() + actualBlockDuration);

    await supabase
      .from('advanced_rate_limits')
      .update({
        request_count: newCount,
        is_blocked: true,
        block_expires_at: blockExpiry.toISOString(),
        consecutive_violations: consecutiveViolations,
        total_violations: (existing.total_violations || 0) + 1,
      })
      .eq('identifier', rateLimitId);

    console.warn(`Rate limit exceeded for ${rateLimitId}. Blocked until ${blockExpiry.toISOString()}`);

    return {
      allowed: false,
      remaining: 0,
      resetAt: blockExpiry,
      retryAfter: Math.ceil(actualBlockDuration / 1000),
    };
  }

  // Update request count
  await supabase
    .from('advanced_rate_limits')
    .update({ request_count: newCount })
    .eq('identifier', rateLimitId);

  return {
    allowed: true,
    remaining: config.maxRequests - newCount,
    resetAt: new Date(new Date(existing.window_start).getTime() + config.windowMs),
  };
}

// Helper to create rate limit response headers
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

// Helper to create rate limit error response
export function createRateLimitErrorResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        ...createRateLimitHeaders(result),
        'Content-Type': 'application/json',
      },
    }
  );
}
