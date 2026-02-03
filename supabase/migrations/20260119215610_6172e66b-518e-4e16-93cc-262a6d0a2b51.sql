-- Add Stripe fields to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Create stripe_customers table for customer mapping
CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stripe_payments table for one-time payments
CREATE TABLE IF NOT EXISTS public.stripe_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT UNIQUE,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'cad',
    status TEXT NOT NULL DEFAULT 'pending',
    product_type TEXT NOT NULL,
    product_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for stripe_customers
CREATE POLICY "Users can view their own stripe customer" 
ON public.stripe_customers FOR SELECT 
USING (auth.uid() = user_id);

-- RLS policies for stripe_payments
CREATE POLICY "Users can view their own payments" 
ON public.stripe_payments FOR SELECT 
USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id ON public.stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON public.stripe_payments(status);

-- Add updated_at triggers
CREATE TRIGGER update_stripe_customers_updated_at
BEFORE UPDATE ON public.stripe_customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stripe_payments_updated_at
BEFORE UPDATE ON public.stripe_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();