import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';

const OfflineIndicator = () => {
  const { isFeatureEnabled, isLoading: featuresLoading } = useProjectFeatures();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if PWA feature is enabled
  if (featuresLoading || !isFeatureEnabled('pwa')) return null;
  if (!showBanner) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 animate-in slide-in-from-top",
        isOnline 
          ? "bg-green-500 text-white" 
          : "bg-destructive text-destructive-foreground"
      )}
      style={{ paddingTop: 'calc(var(--sat, 0px) + 0.5rem)' }}
    >
      {isOnline ? (
        <>
          <RefreshCw className="h-4 w-4" />
          Đã kết nối lại
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Không có kết nối mạng
          <Button 
            variant="secondary" 
            size="sm" 
            className="ml-2 h-6 text-xs"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
