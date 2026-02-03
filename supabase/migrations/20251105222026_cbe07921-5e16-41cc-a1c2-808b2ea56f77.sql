-- Add subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'free', 'professional', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'pending', 'suspended', 'cancelled')),
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date);

-- Function to check and update expired trials
CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET subscription_status = 'pending',
      subscription_plan = 'free'
  WHERE subscription_plan = 'trial'
    AND trial_end_date < NOW()
    AND subscription_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create subscription_history table for tracking changes
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_plan TEXT,
  new_plan TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscription_history
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription history
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all subscription history
CREATE POLICY "Admins can view all subscription history"
  ON subscription_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND (OLD.subscription_plan != NEW.subscription_plan OR OLD.subscription_status != NEW.subscription_status)) THEN
    INSERT INTO subscription_history (
      user_id,
      previous_plan,
      new_plan,
      previous_status,
      new_status,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.subscription_plan,
      NEW.subscription_plan,
      OLD.subscription_status,
      NEW.subscription_status,
      auth.uid(),
      CASE 
        WHEN NEW.subscription_plan = 'trial' AND OLD.subscription_plan != 'trial' THEN 'Trial started'
        WHEN OLD.subscription_plan = 'trial' AND NEW.subscription_status = 'pending' THEN 'Trial expired'
        WHEN NEW.subscription_status = 'active' AND OLD.subscription_status = 'pending' THEN 'Plan upgraded'
        ELSE 'Subscription updated'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for logging subscription changes
DROP TRIGGER IF EXISTS log_subscription_change_trigger ON profiles;
CREATE TRIGGER log_subscription_change_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- Update existing users to have trial period (only those without a plan set)
UPDATE profiles
SET 
  subscription_plan = 'trial',
  subscription_status = 'active',
  trial_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '30 days'
WHERE subscription_plan IS NULL;