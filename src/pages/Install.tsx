import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Smartphone, 
  Share, 
  Plus, 
  Check, 
  ChevronRight,
  Monitor,
  Apple,
  Chrome,
  Wifi,
  Bell,
  Zap,
  Shield,
  ArrowLeft,
  Ban
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const { isFeatureEnabled, isFeatureUpcoming, isLoading: featuresLoading } = useProjectFeatures();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installStep, setInstallStep] = useState(0);
  
  const isPWAEnabled = isFeatureEnabled('pwa');
  const isPWAUpcoming = isFeatureUpcoming('pwa');

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect device
    const userAgent = navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    setIsIOS(iOS);
    setIsAndroid(android);

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsStandalone(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: 'Quick Access', description: 'Open the app directly from your home screen' },
    { icon: Wifi, title: 'Works Offline', description: 'View data even without internet connection' },
    { icon: Bell, title: 'Push Notifications', description: 'Receive real-time project alerts' },
    { icon: Shield, title: 'Secure', description: 'Your data is encrypted and protected' },
  ];

  const iosSteps = [
    { step: 1, title: 'Tap the Share button', description: 'Find the Share button in Safari navigation bar', icon: Share },
    { step: 2, title: 'Scroll down and tap "Add to Home Screen"', description: 'Find this option in the Share menu', icon: Plus },
    { step: 3, title: 'Tap "Add" to confirm', description: 'The app will appear on your home screen', icon: Check },
  ];

  const androidSteps = [
    { step: 1, title: 'Tap the browser menu (⋮)', description: 'Three dots in the top right corner', icon: Chrome },
    { step: 2, title: 'Select "Install App" or "Add to Home Screen"', description: 'Option in the dropdown menu', icon: Download },
    { step: 3, title: 'Confirm installation', description: 'The app will appear on your home screen', icon: Check },
  ];

  // Show "Coming Soon" page if PWA feature is upcoming
  if (!featuresLoading && isPWAUpcoming) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-xl">Install CLMP</CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Coming Soon
              </Badge>
            </div>
            <CardDescription>
              PWA installation will be available soon. You can continue using the app in your browser for now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
              <p>We're working on bringing you the best mobile experience. Stay tuned for:</p>
              <ul className="mt-2 space-y-1 text-left list-disc list-inside">
                <li>Home screen installation</li>
                <li>Offline access</li>
                <li>Push notifications</li>
              </ul>
            </div>
            <Button asChild className="w-full">
              <Link to="/dashboard">
                Continue in Browser
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to home if PWA feature is disabled (not upcoming)
  if (!featuresLoading && !isPWAEnabled && !isPWAUpcoming) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Ban className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">PWA Not Available</CardTitle>
            <CardDescription>
              The PWA installation feature is currently disabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/">
                Go to Home
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-xl">Already Installed!</CardTitle>
            <CardDescription>
              CLMP Tech has been installed on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/dashboard">
                Open App
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Badge variant="secondary" className="gap-1">
          <Smartphone className="h-3 w-3" />
          PWA
        </Badge>
      </header>

      <div className="px-4 pb-8 space-y-6 max-w-lg mx-auto">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <img src="/favicon.png" alt="CLMP" className="h-12 w-12" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Install CLMP Tech</h1>
            <p className="text-muted-foreground mt-1">
              Manage construction projects right on your phone
            </p>
          </div>
        </div>

        {/* Quick Install Button (Android/Desktop with prompt) */}
        {deferredPrompt && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <Button onClick={handleInstall} size="lg" className="w-full gap-2">
                <Download className="h-5 w-5" />
                Install Now
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-3">
                Takes only seconds, no App Store needed
              </p>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Why Install?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature.title} className="p-3 rounded-xl bg-muted/50 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {isIOS ? (
                <Apple className="h-5 w-5" />
              ) : isAndroid ? (
                <Chrome className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
              <CardTitle className="text-lg">
                Installation Guide
                {isIOS && ' (iPhone/iPad)'}
                {isAndroid && ' (Android)'}
                {!isIOS && !isAndroid && ' (Desktop)'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isIOS ? iosSteps : androidSteps).map((step, index) => (
              <div 
                key={step.step} 
                className={`flex gap-4 p-3 rounded-xl transition-all cursor-pointer ${
                  installStep === index ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                }`}
                onClick={() => setInstallStep(index)}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  installStep === index ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {installStep > index ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-bold">{step.step}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <step.icon className={`h-5 w-5 flex-shrink-0 mt-1 ${
                  installStep === index ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Platform-specific tips */}
        {isIOS && (
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Apple className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-600 dark:text-blue-400">Tip for iOS</p>
                  <p className="text-muted-foreground mt-1">
                    Make sure you're using Safari. Other browsers on iOS don't support PWA installation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!deferredPrompt && !isIOS && (
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Chrome className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">Use Chrome</p>
                  <p className="text-muted-foreground mt-1">
                    For the best experience, open this page in Chrome or Edge.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip link */}
        <div className="text-center">
          <Button variant="ghost" asChild>
            <Link to="/dashboard" className="text-muted-foreground">
              Skip, continue in browser
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPage;
