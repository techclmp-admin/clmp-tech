-- Update existing users with 'free' plan to 'trial' if they have valid trial dates
UPDATE public.profiles 
SET subscription_plan = 'trial' 
WHERE subscription_plan = 'free' 
  AND trial_end_date IS NOT NULL 
  AND trial_end_date > NOW();