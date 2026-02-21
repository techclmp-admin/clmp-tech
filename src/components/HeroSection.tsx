import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, LogIn } from "lucide-react";
import heroImage from "@/assets/hero-construction.jpg";
import ContactDialog from "@/components/ContactDialog";
import { useReturningUser } from "@/hooks/useReturningUser";

const HeroSection = () => {
  const [showContactDialog, setShowContactDialog] = useState(false);
  const isReturningUser = useReturningUser();

  return (
    <>
      <ContactDialog 
        open={showContactDialog} 
        onOpenChange={setShowContactDialog}
        type="demo"
      />
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Modern Construction Site"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="glass inline-flex items-center px-6 py-3 rounded-full shadow-3d hover:shadow-3d-hover transition-all duration-300 ease-out-expo hover:-translate-y-1 mb-8 animate-fade-in">
            <span className="mr-3 text-lg">🚀</span>
            <span className="text-primary font-semibold">CLMP – Construction Made Smarter</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Build Better, Faster, and{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">
              Fully Compliant
            </span>
            {" "}– All in One Place.
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 max-w-3xl leading-relaxed">
            CLMP is the only Canadian construction management platform built specifically for small and mid-sized contractors. 
            Plan smarter, track budgets, manage teams, and stay CRA-compliant—without the complexity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 mb-12 animate-scale-in">
            <Button
              size="xl"
              className="btn-gradient-primary text-lg px-10 py-4 h-auto font-semibold shadow-3d hover:shadow-3d-hover"
              asChild
            >
              <a href="/auth">
                {isReturningUser ? (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Login to Your Account
                  </>
                ) : (
                  <>
                    Start Free for 30 Days
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </a>
            </Button>
            <Button 
              variant="glass" 
              size="xl" 
              className="text-primary-foreground hover:bg-primary-foreground/10 text-lg px-10 py-4 h-auto"
              onClick={() => setShowContactDialog(true)}
            >
              <Play className="mr-2 h-5 w-5" />
              Book a Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-8 text-primary-foreground/80">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span className="text-sm">CRA-Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm">Canadian-Built</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span className="text-sm">30-Day Free Trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm">AI-Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
    </section>
    </>
  );
};

export default HeroSection;