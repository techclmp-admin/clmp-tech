import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BotDetectionResult {
  blocked: boolean;
  isBot: boolean;
  score?: number;
  reasons?: string[];
}

export const useBotDetection = (enableProtection: boolean = true) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string>('');
  const requestCountRef = useRef(0);
  const lastCheckRef = useRef(Date.now());

  useEffect(() => {
    if (!enableProtection) return;

    const checkBot = async () => {
      try {
        // Get client info
        const userAgent = navigator.userAgent;
        const headers: Record<string, string> = {
          'accept': document.querySelector('meta[http-equiv="Content-Type"]')?.getAttribute('content') || '*/*',
          'accept-language': navigator.language,
          'accept-encoding': 'gzip, deflate, br'
        };

        // Generate fingerprint
        const fingerprint = await generateFingerprint();

        // Count requests in window
        const now = Date.now();
        if (now - lastCheckRef.current > 60000) {
          requestCountRef.current = 0;
          lastCheckRef.current = now;
        }
        requestCountRef.current++;

        // Call bot detection function
        const { data, error } = await supabase.functions.invoke('bot-detection', {
          body: {
            userAgent,
            ip: 'client', // IP will be extracted server-side
            path: window.location.pathname,
            headers,
            fingerprint,
            requestsInWindow: requestCountRef.current
          }
        });

        if (error) {
          console.error('Bot detection error:', error);
          return;
        }

        if (data?.blocked) {
          setIsBlocked(true);
          setBlockReason(data.reason || 'Access denied due to suspicious activity');
        }

      } catch (error) {
        console.error('Bot detection failed:', error);
      }
    };

    // Check on mount and route changes
    checkBot();

    // Periodic checks
    const interval = setInterval(checkBot, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [enableProtection]);

  return { isBlocked, blockReason };
};

async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown'
  ];

  const text = components.join('|');
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
