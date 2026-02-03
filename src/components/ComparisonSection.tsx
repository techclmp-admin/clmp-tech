import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ComparisonSection = () => {
  const comparisons = [
    {
      feature: "CRA Tax Compliance",
      clmp: true,
      procore: false,
      monday: false
    },
    {
      feature: "AI Risk Alerts",
      clmp: true,
      procore: false,
      monday: false
    },
    {
      feature: "Gantt + Kanban Views",
      clmp: true,
      procore: true,
      monday: false
    },
    {
      feature: "QuickBooks Integration",
      clmp: true,
      procore: true,
      monday: true
    },
    {
      feature: "30-Day Free Trial",
      clmp: true,
      procore: false,
      monday: "14 days"
    },
    {
      feature: "Built for Canadians",
      clmp: true,
      procore: "US-based",
      monday: false
    }
  ];

  const renderIcon = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-secondary" />;
    } else if (value === false) {
      return <X className="h-5 w-5 text-muted-foreground" />;
    } else {
      return <span className="text-sm text-muted-foreground">{value}</span>;
    }
  };

  return (
    <section id="comparison" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            CLMP vs. Alternatives
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how CLMP stacks up against the competition
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10">
            <CardTitle className="text-center text-2xl font-bold">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold text-foreground">Feature / Platform</th>
                    <th className="text-center p-4 font-semibold text-secondary">CLMP</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Procore</th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Monday.com</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, index) => (
                    <tr key={index} className={`border-b border-border ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                      <td className="p-4 font-medium text-foreground">{row.feature}</td>
                      <td className="p-4 text-center">{renderIcon(row.clmp)}</td>
                      <td className="p-4 text-center">{renderIcon(row.procore)}</td>
                      <td className="p-4 text-center">{renderIcon(row.monday)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ComparisonSection;