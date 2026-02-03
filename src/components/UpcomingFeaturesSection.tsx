import { Smartphone, Eye, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UpcomingFeaturesSection = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Mobile time tracking",
      description: "iOS + Android apps for field time tracking",
      timeline: "Q2 2026"
    },
    {
      icon: Eye,
      title: "BIM Viewer & collaborative markup tools",
      description: "3D model viewing with team annotations",
      timeline: "Q3 2026"
    },
    {
      icon: FileText,
      title: "RFI & Change Order Management",
      description: "Streamlined request and change processes",
      timeline: "Q3 2026"
    },
    {
      icon: TrendingUp,
      title: "AI-driven predictive analytics dashboard",
      description: "Smart insights for project success",
      timeline: "Q4 2026"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Upcoming in 2026
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're constantly innovating to bring you the future of construction management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-border/50 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg text-center">
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-7 w-7 text-secondary" />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium mb-3">
                    {feature.timeline}
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UpcomingFeaturesSection;