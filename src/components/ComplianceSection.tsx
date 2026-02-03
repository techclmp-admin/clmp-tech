import { Shield, Lock, Globe, Server } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ComplianceSection = () => {
  const features = [
    {
      icon: Shield,
      title: "CRA, GST/HST, and PIPEDA compliant",
      description: "Fully compliant with Canadian tax and privacy regulations"
    },
    {
      icon: Lock,
      title: "End-to-end encryption & Canadian data residency",
      description: "Your data stays secure and within Canadian borders"
    },
    {
      icon: Globe,
      title: "SOC 2 readiness & GDPR compliant",
      description: "International security and privacy standards"
    },
    {
      icon: Server,
      title: "Hosted securely on Canadian cloud servers",
      description: "Reliable infrastructure you can trust"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Compliance & Data Security
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built with Canadian regulations and security standards in mind
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-border/50 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-secondary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground text-lg mb-2">
                        {feature.title}
                      </h3>
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

export default ComplianceSection;