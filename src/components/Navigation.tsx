import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, X, LogIn } from "lucide-react";
import clmpLogo from "@/assets/clmp-logo.png";
import ContactDialog from "@/components/ContactDialog";
import { useReturningUser } from "@/hooks/useReturningUser";

const Navigation = () => {
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isReturningUser = useReturningUser();

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#comparison", label: "Compare" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <>
      <ContactDialog 
        open={showContactDialog} 
        onOpenChange={setShowContactDialog}
        type="demo"
      />
      <nav className="fixed top-0 w-full glass border-b border-glass-border z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="icon-3d p-2">
              <img 
                src={clmpLogo}
                alt="CLMP Tech inc - Advanced Management" 
                className="h-8 w-auto"
              />
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                className="text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="glass" 
              size="sm" 
              className="shadow-3d"
              onClick={() => setShowContactDialog(true)}
            >
              Book a Demo
            </Button>
            <Button size="sm" className="btn-gradient-primary shadow-3d hover:shadow-3d-hover" asChild>
              <a href="/auth">
                {isReturningUser ? (
                  <>
                    <LogIn className="mr-1.5 h-4 w-4" />
                    Login
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={clmpLogo}
                      alt="CLMP" 
                      className="h-8 w-auto"
                    />
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                <div className="flex-1 py-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="block px-6 py-3 text-foreground hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>

                {/* Mobile CTA Buttons */}
                <div className="p-4 border-t space-y-3">
                  <Button 
                    variant="glass" 
                    className="w-full shadow-3d"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowContactDialog(true);
                    }}
                  >
                    Book a Demo
                  </Button>
                  <Button className="w-full btn-gradient-primary shadow-3d" asChild>
                    <a href="/auth">
                      {isReturningUser ? (
                        <>
                          <LogIn className="mr-1.5 h-4 w-4" />
                          Login
                        </>
                      ) : (
                        'Start Free Trial'
                      )}
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
