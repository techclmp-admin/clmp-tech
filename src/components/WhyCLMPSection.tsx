import { CheckCircle, Brain, Clock, Shield, Globe, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const WhyCLMPSection = () => {
  const features = [
    {
      icon: Shield,
      title: "CRA-compliant cost tracking & tax reports",
      description: "Stay compliant with Canadian tax regulations automatically"
    },
    {
      icon: Brain,
      title: "AI-powered alerts for delays & weather",
      description: "Smart notifications keep your projects on track"
    },
    {
      icon: Zap,
      title: "Gantt + Kanban views for effortless planning",
      description: "Switch between views that work for your team"
    },
    {
      icon: Globe,
      title: "Slack, QuickBooks, and Sage integration",
      description: "Works with the tools you already use"
    },
    {
      icon: Clock,
      title: "Fast onboarding in under 60 minutes",
      description: "Get your team up and running quickly"
    },
    {
      icon: CheckCircle,
      title: "Fully bilingual (English / French)",
      description: "Built for Canada's linguistic diversity"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Why CLMP?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built for Canadian Contractors. Powered by AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-border/50 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg group">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center group-hover:from-secondary/30 group-hover:to-accent/30 transition-all duration-300">
                        <IconComponent className="h-6 w-6 text-secondary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <CheckCircle className="h-5 w-5 text-secondary mr-2 flex-shrink-0" />
                        <h3 className="font-semibold text-foreground text-lg leading-tight">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyCLMPSection;