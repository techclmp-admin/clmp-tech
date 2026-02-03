import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import NotificationBell from './NotificationBell';
import clmpLogo from '@/assets/clmp-logo.png';

const AppLayout = () => {
  const [language, setLanguage] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };

  return (
    <div className="flex h-screen bg-background w-full">
      {/* Desktop Sidebar - always visible on md+ */}
      <div className="hidden md:block">
        <Sidebar language={language} onLanguageChange={handleLanguageChange} />
      </div>
      
      {/* Mobile Sidebar via Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 md:hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar language={language} onLanguageChange={handleLanguageChange} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
            <div className="flex items-center gap-2">
              <img src={clmpLogo} alt="CLMP" className="h-7 w-auto" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        
        {/* Main Content - with bottom padding for mobile nav */}
        <div className="flex-1 pb-24 md:pb-6 mobile-scroll">
          <div className="mx-auto w-full max-w-7xl px-0 md:px-6 py-0 md:py-6">
            <Outlet context={{ language }} />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;
