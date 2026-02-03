import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import clmpLogo from "@/assets/clmp-logo.png";
import ContactDialog from "@/components/ContactDialog";

const Footer = () => {
  const [showContactDialog, setShowContactDialog] = useState(false);

  return (
    <>
      <ContactDialog 
        open={showContactDialog} 
        onOpenChange={setShowContactDialog}
        type="demo"
      />
    <footer className="bg-primary text-primary-foreground">
      {/* CTA Section */}
      <section id="contact" className="py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to build smarter?
            </h2>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-8">
              Join the growing community of Canadian contractors who are modernizing their project management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-lg px-8 py-6 h-auto font-semibold"
                asChild
              >
                <a href="/auth">
                  Start Free for 30 Days
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6 h-auto"
                onClick={() => setShowContactDialog(true)}
              >
                Book a Personalized Demo
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/70 mt-4">
              No credit card required • We'll walk you through in 20 minutes
            </p>
          </div>

          {/* Proudly Canadian */}
          <div className="border-t border-primary-foreground/20 pt-12">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">🍁 Proudly Canadian</h3>
              <p className="text-primary-foreground/90">
                CLMP Tech inc is designed, hosted, and supported in Canada. 
                We're committed to modernizing our home-grown construction industry—project by project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="border-t border-primary-foreground/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <img 
              src={clmpLogo}
              alt="CLMP Tech inc - Advanced Management" 
              className="h-10 w-auto"
            />
            
            <div className="flex items-center space-x-6 text-sm">
              <a href="/privacy" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Privacy Policy</a>
              <a href="/terms" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Terms of Service</a>
              <a href="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="text-center mt-8 pt-8 border-t border-primary-foreground/20">
            <p className="text-primary-foreground/70 text-sm">
              © 2025 CLMP Tech inc. All rights reserved. Made with ❤️ in Canada.
            </p>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;