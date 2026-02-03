import { HardHat, Calculator, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WhoItsForSection = () => {
  const personas = [
    {
      icon: HardHat,
      title: "General Contractors",
      description: "Manage teams & timelines",
      details: "Streamline project coordination, track progress, and keep your crews organized across multiple job sites."
    },
    {
      icon: Calculator,
      title: "Financial Controllers",
      description: "Track budgets & GST/HST",
      details: "Maintain accurate financial records, ensure CRA compliance, and generate tax reports with confidence."
    },
    {
      icon: ClipboardList,
      title: "Site Supervisors",
      description: "Stay on top of permits & weather risks",
      details: "Get AI-powered alerts for weather delays, permit deadlines, and safety concerns before they impact your project."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Who It's For
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built specifically for Canadian construction professionals who need efficiency and compliance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {personas.map((persona, index) => {
            const IconComponent = persona.icon;
            return (
              <Card key={index} className="border-border/50 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg text-center">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-secondary" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground mb-2">
                    {persona.title}
                  </CardTitle>
                  <p className="text-lg font-medium text-secondary">
                    {persona.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {persona.details}
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

export default WhoItsForSection;