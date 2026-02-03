-- Create promo_codes table to store discount coupons
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applicable_plans TEXT[], -- null means all plans
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster code lookups
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code) WHERE is_active = true;
CREATE INDEX idx_promo_codes_valid_dates ON public.promo_codes(valid_from, valid_until) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active promo codes to validate them
CREATE POLICY "Anyone can read active promo codes"
ON public.promo_codes
FOR SELECT
USING (
  is_active = true 
  AND valid_from <= now()
  AND (valid_until IS NULL OR valid_until >= now())
  AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Function to validate and use a promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(promo_code_input TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  discount_type TEXT,
  discount_value DECIMAL,
  message TEXT
) AS $$
DECLARE
  promo_record RECORD;
BEGIN
  -- Find the promo code
  SELECT * INTO promo_record
  FROM public.promo_codes
  WHERE LOWER(code) = LOWER(promo_code_input)
  AND is_active = true;

  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;

  -- Check if code is within valid date range
  IF promo_record.valid_from > now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'This promo code is not yet valid'::TEXT;
    RETURN;
  END IF;

  IF promo_record.valid_until IS NOT NULL AND promo_record.valid_until < now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'This promo code has expired'::TEXT;
    RETURN;
  END IF;

  -- Check if max uses reached
  IF promo_record.max_uses IS NOT NULL AND promo_record.current_uses >= promo_record.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'This promo code has reached its usage limit'::TEXT;
    RETURN;
  END IF;

  -- Code is valid
  RETURN QUERY SELECT 
    true, 
    promo_record.discount_type, 
    promo_record.discount_value,
    'Promo code applied successfully!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample promo codes
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, max_uses, valid_until, applicable_plans) VALUES
  ('WELCOME20', '20% off for new customers', 'percentage', 20, 100, now() + interval '30 days', ARRAY['professional', 'enterprise']),
  ('SAVE10', 'Save $10 on any plan', 'fixed', 10, NULL, now() + interval '60 days', NULL),
  ('EARLYBIRD', '30% off for early adopters', 'percentage', 30, 50, now() + interval '14 days', ARRAY['professional', 'enterprise']);