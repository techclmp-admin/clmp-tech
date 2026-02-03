import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { CreditCard, Crown, Users, Building } from "lucide-react";
import { Link } from "react-router-dom";

interface SubscriptionWidgetProps {
  language: string;
}

const SubscriptionWidget = ({ language }: SubscriptionWidgetProps) => {
  const { limits, hasActiveSubscription, isTrialing, loading } = useSubscription();

  const translations = {
    en: {
      subscription: 'Your Subscription',
      currentPlan: 'Current Plan',
      projectsUsed: 'Projects Used',
      teamMembers: 'Team Members',
      nextBilling: 'Next Billing',
      manageBilling: 'Manage Billing',
      upgrade: 'Upgrade Plan',
      noSubscription: 'No Active Subscription',
      startTrial: 'Start Free Trial',
      trialEnds: 'Trial Ends',
      viewDetails: 'View Details'
    },
    fr: {
      subscription: 'Votre Abonnement',
      currentPlan: 'Plan Actuel',
      projectsUsed: 'Projets Utilisés',
      teamMembers: 'Membres Équipe',
      nextBilling: 'Prochaine Facture',
      manageBilling: 'Gérer Facture',
      upgrade: 'Mettre à Niveau',
      noSubscription: 'Aucun Abonnement Actif',
      startTrial: 'Commencer Essai Gratuit',
      trialEnds: 'Essai Se Termine',
      viewDetails: 'Voir Détails'
    }
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 p-3 bg-primary/10 rounded-lg w-fit">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">{t.noSubscription}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {language === 'fr' 
              ? 'Commencez votre essai gratuit de 14 jours maintenant!' 
              : 'Start your 14-day free trial now!'}
          </p>
          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link to="/billing">
                <Crown className="h-4 w-4 mr-2" />
                {t.startTrial}
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/billing">{t.viewDetails}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{t.subscription}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant={isTrialing ? "secondary" : "default"}>
            {limits?.plan_name}
          </Badge>
          {isTrialing && (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              TRIAL
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs md:text-sm text-muted-foreground truncate">{t.projectsUsed}</span>
            </div>
            <div className="text-xl md:text-2xl font-bold">
              {limits?.current_projects}/{limits?.max_projects}
            </div>
            <Progress 
              value={(limits?.current_projects || 0) / (limits?.max_projects || 1) * 100} 
              className="h-2"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs md:text-sm text-muted-foreground truncate">{t.teamMembers}</span>
            </div>
            <div className="text-xl md:text-2xl font-bold">
              {limits?.current_users}/{limits?.max_users}
            </div>
            <Progress 
              value={(limits?.current_users || 0) / (limits?.max_users || 1) * 100} 
              className="h-2"
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isTrialing ? t.trialEnds : t.nextBilling}
            </span>
            <span className="font-medium">
              {limits?.current_period_end 
                ? new Date(limits.current_period_end).toLocaleDateString(
                    language === 'fr' ? 'fr-CA' : 'en-CA'
                  )
                : 'N/A'
              }
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs md:text-sm" asChild>
            <Link to="/billing">
              <CreditCard className="h-4 w-4 mr-1" />
              {t.manageBilling}
            </Link>
          </Button>
          {limits && limits.current_projects >= limits.max_projects && (
            <Button size="sm" className="flex-1" asChild>
              <Link to="/billing">
                <Crown className="h-4 w-4 mr-1" />
                {t.upgrade}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionWidget;