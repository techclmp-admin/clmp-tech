import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionLimits {
  has_subscription: boolean;
  plan_name?: string;
  status?: string;
  max_projects: number;
  current_projects: number;
  max_users: number;
  current_users: number;
  can_create_project: boolean;
  can_add_user: boolean;
  trial_end?: string;
  trial_end_date?: string;
  trial_days_left?: number;
  current_period_end?: string;
  is_pending?: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_cad: number;
  max_projects: number;
  max_users: number;
  features: string[];
}

interface Addon {
  id: string;
  name: string;
  description: string;
  price_cad: number;
  addon_type: string;
}

export const useSubscription = () => {
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscriptionLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Return default limits for unauthenticated users
        const defaultLimits: SubscriptionLimits = {
          has_subscription: false,
          plan_name: 'Free',
          status: 'inactive',
          max_projects: 1,
          current_projects: 0,
          max_users: 5,
          current_users: 0,
          can_create_project: false,
          can_add_user: false,
          is_pending: false
        };
        setLimits(defaultLimits);
        return defaultLimits;
      }

      // Get user's subscription info - use maybeSingle() to avoid error if no profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, trial_end_date')
        .eq('user_id', user.id)
        .maybeSingle();

      const plan = profile?.subscription_plan || 'trial';
      const status = profile?.subscription_status || 'active';
      const trialEndDate = profile?.trial_end_date;

      // Calculate trial days left
      let trialDaysLeft = 0;
      if (trialEndDate) {
        const now = new Date();
        const endDate = new Date(trialEndDate);
        trialDaysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      // Define limits based on plan
      const planLimits: Record<string, { maxProjects: number; maxUsers: number }> = {
        trial: { maxProjects: 3, maxUsers: 10 },
        professional: { maxProjects: 10, maxUsers: 25 },
        enterprise: { maxProjects: 20, maxUsers: 100 }
      };

      const limits = planLimits[plan] || planLimits.trial;

      // Get actual project count for this user
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .neq('status', 'archived');

      // Get project IDs for this user
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('created_by', user.id)
        .neq('status', 'archived');

      const projectIds = userProjects?.map(p => p.id) || [];

      // Get unique team member count across all user's projects
      let teamMemberCount = 0;
      if (projectIds.length > 0) {
        const { data: memberData } = await supabase
          .from('project_members')
          .select('user_id')
          .in('project_id', projectIds);

        const uniqueMembers = new Set(memberData?.map(m => m.user_id) || []);
        teamMemberCount = uniqueMembers.size;
      }

      const subscriptionLimits: SubscriptionLimits = {
        has_subscription: status === 'active',
        plan_name: plan.charAt(0).toUpperCase() + plan.slice(1),
        status: status,
        max_projects: limits.maxProjects,
        current_projects: projectCount || 0,
        max_users: limits.maxUsers,
        current_users: teamMemberCount,
        can_create_project: status === 'active' && (projectCount || 0) < limits.maxProjects,
        can_add_user: status === 'active' && teamMemberCount < limits.maxUsers,
        trial_end: trialEndDate || undefined,
        trial_end_date: trialEndDate || undefined,
        trial_days_left: trialDaysLeft,
        is_pending: status === 'pending'
      };
      
      setLimits(subscriptionLimits);
      return subscriptionLimits;
    } catch (error) {
      console.error('Error checking subscription limits:', error);
      // Set default limits on error so page still renders
      const defaultLimits: SubscriptionLimits = {
        has_subscription: false,
        plan_name: 'Free',
        status: 'inactive',
        max_projects: 1,
        current_projects: 0,
        max_users: 5,
        current_users: 0,
        can_create_project: true,
        can_add_user: true,
        is_pending: false
      };
      setLimits(defaultLimits);
      return defaultLimits;
    }
  };

  const loadPlans = async () => {
    try {
      const plans = [
        {
          id: "professional",
          name: "Professional",
          description: "For growing construction teams",
          price_cad: 49.00,
          max_projects: 10,
          max_users: 25,
          features: ["10 Active Projects", "Up to 25 Team Members", "Advanced Task Management", "Priority Email Support", "Advanced Analytics", "Custom Reports"]
        },
        {
          id: "enterprise",
          name: "Enterprise",
          description: "For large organizations",
          price_cad: 199.00,
          max_projects: 20,
          max_users: 100,
          features: ["20 Projects", "100 Team Members", "All Professional Features", "24/7 Priority Support", "API Access", "Dedicated Account Manager"]
        }
      ];
      setPlans(plans);
      return plans;
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
      return [];
    }
  };

  const loadAddons = async () => {
    try {
      const mockAddons = [
        {
          id: "1",
          name: "Extra User Seat",
          description: "Add additional team members beyond the 5 included users",
          price_cad: 20.00,
          addon_type: "user_seat"
        },
        {
          id: "2",
          name: "AI Insight Reports",
          description: "Advanced AI-powered insights for progress, risk, and cash flow optimization",
          price_cad: 100.00,
          addon_type: "ai_reports"
        },
        {
          id: "3",
          name: "Custom Branding & Domain",
          description: "White-label solution with your company branding and custom domain",
          price_cad: 50.00,
          addon_type: "custom_branding"
        },
        {
          id: "4",
          name: "Priority Support",
          description: "24-hour SLA with dedicated support channel",
          price_cad: 100.00,
          addon_type: "priority_support"
        }
      ];
      setAddons(mockAddons);
      return mockAddons;
    } catch (error) {
      console.error('Error loading addons:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription add-ons",
        variant: "destructive"
      });
      return [];
    }
  };

  const refreshSubscriptionData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkSubscriptionLimits(),
        loadPlans(),
        loadAddons()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscriptionData();

    let channel: any = null;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('profile-subscription-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            checkSubscriptionLimits();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const canCreateProject = limits?.can_create_project || false;
  const canAddUser = limits?.can_add_user || false;
  const hasActiveSubscription = limits?.has_subscription && limits?.status === 'active';
  const isTrialing = limits?.plan_name?.toLowerCase() === 'trial'
    && limits?.trial_end_date 
    && new Date(limits.trial_end_date) > new Date()
    && limits?.status === 'active';
  const isPending = limits?.is_pending || false;

  return {
    limits,
    plans,
    addons,
    loading,
    canCreateProject,
    canAddUser,
    hasActiveSubscription,
    isTrialing,
    isPending,
    checkSubscriptionLimits,
    refreshSubscriptionData
  };
};