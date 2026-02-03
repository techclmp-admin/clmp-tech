import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Share, Plus, Smartphone, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const { isFeatureEnabled, isFeatureUpcoming, isLoading: featuresLoading } = useProjectFeatures();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const isPWAEnabled = isFeatureEnabled('pwa');
  const isPWAUpcoming = isFeatureUpcoming('pwa');

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standalone) {
        // Delay prompt for better UX
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show prompt for iOS after delay (only on mobile)
    if (iOS && !standalone && mobile) {
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if PWA feature is enabled or upcoming
  if (featuresLoading) return null;
  if (!isPWAEnabled && !isPWAUpcoming) return null;
  
  if (isStandalone || dismissed || !showPrompt) {
    return null;
  }

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  // Show "Coming Soon" prompt if feature is upcoming
  if (isPWAUpcoming) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-4 md:bottom-4">
        <Card className="shadow-xl border-primary/20 bg-background/95 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-muted rounded-xl">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Install CLMP</CardTitle>
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Soon
                    </span>
                  </div>
                  <CardDescription className="text-xs">App installation coming soon</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground">
              PWA installation will be available soon. You can continue using the app in your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-4 md:bottom-4">
      <Card className="shadow-xl border-primary/20 bg-background/95 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Install CLMP</CardTitle>
                <CardDescription className="text-xs">Quick access from your home screen</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isIOS ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                  <ChevronRight className="h-3 w-3" />
                  <Plus className="h-4 w-4" />
                  <span>Add to Home Screen</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to="/install">
                    View Instructions
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDismiss}>
                  Later
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Install
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Later
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
