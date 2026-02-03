-- Step 1: Only add enum value (needs separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'system_admin';