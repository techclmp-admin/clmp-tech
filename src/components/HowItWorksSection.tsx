import { UserPlus, FileText, Users, Settings, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Sign up with email or SSO",
      description: "Quick registration with Google, Apple, Facebook, or email to get started immediately"
    },
    {
      icon: FileText,
      title: "Pick a project template",
      description: "Choose from Residential, Commercial, or Infrastructure templates"
    },
    {
      icon: Users,
      title: "Invite your team and assign tasks",
      description: "Add team members and delegate responsibilities"
    },
    {
      icon: Settings,
      title: "Connect your accounting tool",
      description: "Optional integration with QuickBooks or Sage for seamless workflow"
    },
    {
      icon: Play,
      title: "Start managing smarter",
      description: "Real-time updates and AI alerts keep your projects on track"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get up and running in under 60 minutes with our simple 5-step process
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={index} className="border-border/50 hover:border-secondary/50 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center relative">
                          <IconComponent className="h-8 w-8 text-secondary" />
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;