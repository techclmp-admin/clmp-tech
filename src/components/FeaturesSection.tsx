import { FileText, DollarSign, Brain, Users, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FeaturesSection = () => {
  const features = [
    {
      icon: FileText,
      title: "Project Planning",
      items: [
        "Kanban + Gantt view toggle",
        "Drag-and-drop task boards",
        "Templates for Residential, Commercial, Infrastructure"
      ]
    },
    {
      icon: DollarSign,
      title: "Budget & CRA Compliance",
      items: [
        "Real-time budget vs. actuals",
        "GST/HST calculation & export",
        "Direct integration with QuickBooks & Sage 50"
      ]
    },
    {
      icon: Brain,
      title: "AI Risk Alerts",
      items: [
        "Smart \"Heads-Up\" Tiles for weather, delays, missing permits",
        "Permit tracking & safety notifications",
        "Custom risk reports with AI insights"
      ]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      items: [
        "Activity feed & role-based permissions",
        "Internal messaging & notifications (Slack-ready)",
        "Invite users by email or CSV"
      ]
    },
    {
      icon: Rocket,
      title: "Easy Setup & Support",
      items: [
        "QuickStart wizard: Setup in < 60 minutes",
        "In-app help, documentation & email support",
        "Full responsive mobile design"
      ]
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Key Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to manage construction projects efficiently and stay compliant with Canadian regulations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-border/50 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;