
-- 1. Add human-readable wallet_id to wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS wallet_id TEXT UNIQUE;

-- Generate wallet_id for existing wallets
UPDATE public.wallets 
SET wallet_id = 'ABR-WLT-' || EXTRACT(YEAR FROM created_at)::TEXT || '-' || UPPER(SUBSTRING(id::TEXT, 1, 6))
WHERE wallet_id IS NULL;

-- Make wallet_id NOT NULL after backfill
ALTER TABLE public.wallets ALTER COLUMN wallet_id SET NOT NULL;
ALTER TABLE public.wallets ALTER COLUMN wallet_id SET DEFAULT '';

-- Function to auto-generate wallet_id on insert
CREATE OR REPLACE FUNCTION public.generate_wallet_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wallet_id IS NULL OR NEW.wallet_id = '' THEN
    NEW.wallet_id := 'ABR-WLT-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_wallet_id
  BEFORE INSERT ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_wallet_id();

-- 2. Add human-readable agent_id to agents
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS agent_code TEXT UNIQUE;

-- Generate agent_code for existing approved agents
UPDATE public.agents 
SET agent_code = 'ABR-AGT-' || UPPER(SUBSTRING(id::TEXT, 1, 6))
WHERE agent_code IS NULL AND status = 'approved';

-- Function to generate agent_code on approval
CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND (NEW.agent_code IS NULL OR NEW.agent_code = '') THEN
    NEW.agent_code := 'ABR-AGT-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_agent_code
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_agent_code();

-- 3. Fee/Charges configuration table
CREATE TABLE IF NOT EXISTS public.fee_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL,
  fee_type TEXT NOT NULL DEFAULT 'flat' CHECK (fee_type IN ('flat', 'percentage', 'tiered')),
  flat_amount NUMERIC NOT NULL DEFAULT 0 CHECK (flat_amount >= 0),
  percentage_rate NUMERIC NOT NULL DEFAULT 0 CHECK (percentage_rate >= 0 AND percentage_rate <= 100),
  tier_config JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(transaction_type, version)
);

ALTER TABLE public.fee_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active fees" ON public.fee_configurations
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage fees" ON public.fee_configurations
  FOR ALL USING (is_admin());

-- Add fee_amount column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS fee_amount NUMERIC NOT NULL DEFAULT 0;

-- 4. Fee history/audit for changes
CREATE TABLE IF NOT EXISTS public.fee_change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_config_id UUID REFERENCES public.fee_configurations(id),
  changed_by UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view fee change logs" ON public.fee_change_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin can insert fee change logs" ON public.fee_change_logs
  FOR INSERT WITH CHECK (is_admin());

-- Seed default fee configs
INSERT INTO public.fee_configurations (transaction_type, fee_type, flat_amount, percentage_rate, description) VALUES
  ('deposit', 'flat', 0, 0, 'Deposit fee'),
  ('withdrawal', 'percentage', 0, 1.5, 'Withdrawal fee'),
  ('send', 'flat', 10, 0, 'Send money fee'),
  ('airtime', 'flat', 0, 0, 'Airtime purchase fee'),
  ('statement', 'flat', 50, 0, 'Statement download fee')
ON CONFLICT DO NOTHING;

-- Trigger for updated_at on fee_configurations
CREATE TRIGGER update_fee_configurations_updated_at
  BEFORE UPDATE ON public.fee_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
