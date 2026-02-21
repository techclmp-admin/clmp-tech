-- =============================================
-- STANDARDIZE SUBSCRIPTION PLAN NAMES
-- =============================================
-- Canonical plan IDs: trial, free, standard, enterprise
-- See SUBSCRIPTION_PLANS.md for full documentation
--
-- Fixes:
--   1. CHECK constraint on profiles.subscription_plan allowed 'professional' but
--      Stripe/frontend use 'standard' → UPDATE silently failed → subscriptions never activated
--   2. Feature flag arrays used 'pro'/'business' instead of 'standard'/'enterprise'
--   3. Webhook defaulted to 'basic' which didn't exist in any constraint
-- =============================================

-- 1. Fix subscription_plan CHECK constraint
--    Old: ('trial', 'free', 'professional', 'enterprise')
--    New: ('trial', 'free', 'standard', 'enterprise')
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_plan_check
  CHECK (subscription_plan IN ('trial', 'free', 'standard', 'enterprise'));

-- Migrate any existing 'professional' rows to 'standard'
UPDATE profiles SET subscription_plan = 'standard' WHERE subscription_plan = 'professional';

-- 2. Fix subscription_status CHECK constraint
--    Edge functions use 'canceled' (American spelling) but old constraint only had 'cancelled'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('active', 'pending', 'suspended', 'cancelled', 'canceled'));

-- 3. Fix feature flag arrays: pro → standard, business → enterprise
--    global_feature_settings.requires_subscription
UPDATE global_feature_settings
SET requires_subscription = array_replace(
      array_replace(requires_subscription, 'pro', 'standard'),
      'business', 'enterprise'
    )
WHERE requires_subscription IS NOT NULL
  AND (requires_subscription @> ARRAY['pro'] OR requires_subscription @> ARRAY['business']);

--    global_sidebar_settings.required_subscription
UPDATE global_sidebar_settings
SET required_subscription = array_replace(
      array_replace(required_subscription, 'pro', 'standard'),
      'business', 'enterprise'
    )
WHERE required_subscription IS NOT NULL
  AND (required_subscription @> ARRAY['pro'] OR required_subscription @> ARRAY['business']);

--    feature_sub_items.requires_subscription (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_sub_items') THEN
    EXECUTE '
      UPDATE feature_sub_items
      SET requires_subscription = array_replace(
            array_replace(requires_subscription, ''pro'', ''standard''),
            ''business'', ''enterprise''
          )
      WHERE requires_subscription IS NOT NULL
        AND (requires_subscription @> ARRAY[''pro''] OR requires_subscription @> ARRAY[''business''])
    ';
  END IF;
END $$;
