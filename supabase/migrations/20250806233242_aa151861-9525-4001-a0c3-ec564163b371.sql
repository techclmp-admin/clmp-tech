-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cad DECIMAL(10,2) NOT NULL,
  billing_interval TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  max_projects INTEGER DEFAULT 1,
  max_users INTEGER DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create add-ons table
CREATE TABLE public.subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cad DECIMAL(10,2) NOT NULL,
  addon_type TEXT NOT NULL, -- user_seat, multi_project, ai_reports, custom_branding, priority_support
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, trialing
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscription addon usages table
CREATE TABLE public.subscription_addon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES subscription_addons(id),
  quantity INTEGER DEFAULT 1,
  stripe_subscription_item_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_addon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active addons" ON subscription_addons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions" ON user_subscriptions
  FOR ALL USING (true);

CREATE POLICY "Users can view their addon usage" ON subscription_addon_usage
  FOR SELECT USING (user_subscription_id IN (
    SELECT id FROM user_subscriptions WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can manage addon usage" ON subscription_addon_usage
  FOR ALL USING (true);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_cad, max_projects, max_users, features) VALUES
('Professional', 'Perfect for small contractors managing 1 project at a time', 300.00, 1, 5, 
 '["Project Management", "Team Collaboration", "CRA Compliance", "AI Risk Alerts", "Weather Integration", "Budget Tracking"]'::jsonb),
('Multi-Project', 'For contractors managing multiple projects simultaneously', 600.00, 3, 5,
 '["Project Management", "Team Collaboration", "CRA Compliance", "AI Risk Alerts", "Weather Integration", "Budget Tracking", "Multi-Project Support"]'::jsonb);

-- Insert add-ons
INSERT INTO subscription_addons (name, description, price_cad, addon_type) VALUES
('Extra User Seat', 'Add additional team members beyond the 5 included users', 20.00, 'user_seat'),
('AI Insight Reports', 'Advanced AI-powered insights for progress, risk, and cash flow optimization', 100.00, 'ai_reports'),
('Custom Branding & Domain', 'White-label solution with your company branding and custom domain', 50.00, 'custom_branding'),
('Priority Support', '24-hour SLA with dedicated support channel', 100.00, 'priority_support');

-- Create function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  project_count INTEGER;
  user_count INTEGER;
  extra_users INTEGER := 0;
  result JSONB;
BEGIN
  -- Get active subscription
  SELECT us.*, sp.max_projects, sp.max_users, sp.name as plan_name
  INTO subscription_record
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
  WHERE us.user_id = target_user_id 
  AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  IF subscription_record.id IS NULL THEN
    RETURN '{"has_subscription": false, "can_create_project": false, "can_add_user": false}'::jsonb;
  END IF;
  
  -- Count current projects
  SELECT COUNT(*) INTO project_count
  FROM projects p
  WHERE p.created_by = target_user_id;
  
  -- Count users across all projects
  SELECT COUNT(DISTINCT pm.user_id) INTO user_count
  FROM project_members pm
  JOIN projects p ON pm.project_id = p.id
  WHERE p.created_by = target_user_id;
  
  -- Count extra user seats purchased
  SELECT COALESCE(SUM(sau.quantity), 0) INTO extra_users
  FROM subscription_addon_usage sau
  JOIN subscription_addons sa ON sau.addon_id = sa.id
  WHERE sau.user_subscription_id = subscription_record.id
  AND sa.addon_type = 'user_seat';
  
  -- Build result
  result := jsonb_build_object(
    'has_subscription', true,
    'plan_name', subscription_record.plan_name,
    'status', subscription_record.status,
    'max_projects', subscription_record.max_projects,
    'current_projects', project_count,
    'max_users', subscription_record.max_users + extra_users,
    'current_users', user_count,
    'can_create_project', project_count < subscription_record.max_projects,
    'can_add_user', user_count < (subscription_record.max_users + extra_users),
    'trial_end', subscription_record.trial_end,
    'current_period_end', subscription_record.current_period_end
  );
  
  RETURN result;
END;
$$;