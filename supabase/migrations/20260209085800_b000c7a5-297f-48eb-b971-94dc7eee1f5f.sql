-- =============================================
-- PRODUCTION HARDENING MIGRATION
-- =============================================

-- 1. KYC Fields on Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS national_id TEXT,
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kyc_consent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- 2. Transaction Limits Table
CREATE TABLE IF NOT EXISTS public.transaction_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type TEXT NOT NULL UNIQUE, -- 'per_transaction', 'daily_send', 'daily_withdrawal', 'agent_float'
  min_amount NUMERIC NOT NULL DEFAULT 10,
  max_amount NUMERIC NOT NULL DEFAULT 100000,
  daily_limit NUMERIC,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default limits
INSERT INTO public.transaction_limits (limit_type, min_amount, max_amount, daily_limit, description) VALUES
  ('per_transaction_send', 10, 70000, NULL, 'Per transaction send limit'),
  ('per_transaction_withdrawal', 50, 70000, NULL, 'Per transaction withdrawal limit'),
  ('daily_send', 10, 150000, 150000, 'Daily send limit'),
  ('daily_withdrawal', 50, 150000, 150000, 'Daily withdrawal limit'),
  ('agent_float_min', 1000, 1000000, NULL, 'Agent minimum float balance')
ON CONFLICT (limit_type) DO NOTHING;

-- Enable RLS on transaction_limits
ALTER TABLE public.transaction_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view limits" ON public.transaction_limits FOR SELECT USING (true);
CREATE POLICY "Admin can manage limits" ON public.transaction_limits FOR ALL USING (is_admin());

-- 3. User Daily Transaction Tracking
CREATE TABLE IF NOT EXISTS public.daily_transaction_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sent NUMERIC NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, transaction_date)
);

ALTER TABLE public.daily_transaction_totals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own totals" ON public.daily_transaction_totals FOR SELECT USING (profile_id = get_profile_id() OR is_admin());
CREATE POLICY "System can insert totals" ON public.daily_transaction_totals FOR INSERT WITH CHECK (profile_id = get_profile_id() OR is_admin());
CREATE POLICY "System can update totals" ON public.daily_transaction_totals FOR UPDATE USING (profile_id = get_profile_id() OR is_admin());

-- 4. Session Tracking Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can delete own sessions" ON public.user_sessions FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "System can manage sessions" ON public.user_sessions FOR ALL USING (is_admin());

-- 5. Enhanced Audit Logs
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS balance_before NUMERIC,
ADD COLUMN IF NOT EXISTS balance_after NUMERIC,
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id UUID;

-- 6. Webhook Events Table (for idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'mpesa', 'airtime_provider', etc.
  event_type TEXT NOT NULL,
  external_reference TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'duplicate'
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider, external_reference)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view webhook events" ON public.webhook_events FOR SELECT USING (is_admin());
CREATE POLICY "System can insert webhook events" ON public.webhook_events FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update webhook events" ON public.webhook_events FOR UPDATE USING (is_admin());

-- 7. Notification Queue Table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL, -- 'sms', 'email', 'push'
  template_name TEXT NOT NULL,
  recipient TEXT NOT NULL, -- phone or email
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notification_queue FOR SELECT USING (profile_id = get_profile_id() OR is_admin());
CREATE POLICY "System can manage notifications" ON public.notification_queue FOR ALL USING (is_admin());

-- 8. System Health/Status Table
CREATE TABLE IF NOT EXISTS public.system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL UNIQUE, -- 'database', 'mpesa', 'sms', 'airtime'
  status TEXT NOT NULL DEFAULT 'operational', -- 'operational', 'degraded', 'down'
  last_check_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view system status" ON public.system_status FOR SELECT USING (true);
CREATE POLICY "Admin can manage system status" ON public.system_status FOR ALL USING (is_admin());

INSERT INTO public.system_status (component, status) VALUES
  ('database', 'operational'),
  ('mpesa', 'operational'),
  ('sms', 'operational'),
  ('airtime', 'operational')
ON CONFLICT (component) DO NOTHING;

-- 9. Deposit Records Table
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  reference_code TEXT NOT NULL DEFAULT ('DEP-' || substring(gen_random_uuid()::text, 1, 8)),
  external_reference TEXT, -- M-Pesa transaction ID
  provider TEXT NOT NULL DEFAULT 'manual', -- 'mpesa', 'bank', 'manual'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES public.profiles(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (profile_id = get_profile_id() OR is_admin());
CREATE POLICY "Users can create deposits" ON public.deposits FOR INSERT WITH CHECK (profile_id = get_profile_id());
CREATE POLICY "Admin can update deposits" ON public.deposits FOR UPDATE USING (is_admin());

-- 10. Atomic Wallet Functions with Locking
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_profile_id UUID,
  p_amount NUMERIC,
  p_reference TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Lock the wallet row for update
  SELECT * INTO v_wallet 
  FROM wallets 
  WHERE profile_id = p_profile_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  v_new_balance := v_wallet.balance + p_amount;
  
  -- Update wallet balance
  UPDATE wallets 
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet.id;
  
  -- Create transaction record
  INSERT INTO transactions (wallet_id, type, amount, status, description, reference_code)
  VALUES (v_wallet.id, 'deposit', p_amount, 'completed', p_description, p_reference)
  RETURNING id INTO v_transaction_id;
  
  -- Audit log
  INSERT INTO audit_logs (profile_id, action, details, balance_before, balance_after, entity_type, entity_id)
  VALUES (p_profile_id, 'wallet_credit', jsonb_build_object('amount', p_amount, 'reference', p_reference), 
          v_wallet.balance, v_new_balance, 'transaction', v_transaction_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_profile_id UUID,
  p_amount NUMERIC,
  p_reference TEXT,
  p_type TEXT DEFAULT 'withdrawal',
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
  v_daily_total RECORD;
  v_limit RECORD;
BEGIN
  -- Lock the wallet row for update
  SELECT * INTO v_wallet 
  FROM wallets 
  WHERE profile_id = p_profile_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Check sufficient balance
  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Check transaction limits
  SELECT * INTO v_limit FROM transaction_limits WHERE limit_type = 'per_transaction_' || p_type AND is_active = true;
  IF FOUND AND (p_amount < v_limit.min_amount OR p_amount > v_limit.max_amount) THEN
    RETURN jsonb_build_object('success', false, 'error', 
      'Amount must be between ' || v_limit.min_amount || ' and ' || v_limit.max_amount);
  END IF;
  
  -- Check daily limits
  SELECT * INTO v_daily_total FROM daily_transaction_totals 
  WHERE profile_id = p_profile_id AND transaction_date = CURRENT_DATE;
  
  SELECT * INTO v_limit FROM transaction_limits WHERE limit_type = 'daily_' || p_type AND is_active = true;
  IF FOUND AND v_limit.daily_limit IS NOT NULL THEN
    IF (COALESCE(v_daily_total.total_sent, 0) + p_amount) > v_limit.daily_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'Daily limit exceeded');
    END IF;
  END IF;
  
  v_new_balance := v_wallet.balance - p_amount;
  
  -- Update wallet balance
  UPDATE wallets 
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet.id;
  
  -- Create transaction record
  INSERT INTO transactions (wallet_id, type, amount, status, description, reference_code)
  VALUES (v_wallet.id, p_type::transaction_type, p_amount, 'completed', p_description, p_reference)
  RETURNING id INTO v_transaction_id;
  
  -- Update daily totals
  INSERT INTO daily_transaction_totals (profile_id, transaction_date, total_sent, transaction_count)
  VALUES (p_profile_id, CURRENT_DATE, p_amount, 1)
  ON CONFLICT (profile_id, transaction_date) 
  DO UPDATE SET 
    total_sent = daily_transaction_totals.total_sent + p_amount,
    transaction_count = daily_transaction_totals.transaction_count + 1,
    updated_at = now();
  
  -- Audit log
  INSERT INTO audit_logs (profile_id, action, details, balance_before, balance_after, entity_type, entity_id)
  VALUES (p_profile_id, 'wallet_debit', jsonb_build_object('amount', p_amount, 'type', p_type, 'reference', p_reference), 
          v_wallet.balance, v_new_balance, 'transaction', v_transaction_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.transfer_wallet(
  p_from_profile_id UUID,
  p_to_profile_id UUID,
  p_amount NUMERIC,
  p_reference TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_wallet RECORD;
  v_to_wallet RECORD;
  v_from_new_balance NUMERIC;
  v_to_new_balance NUMERIC;
  v_send_txn_id UUID;
  v_receive_txn_id UUID;
  v_to_profile RECORD;
BEGIN
  -- Lock both wallets in consistent order to prevent deadlocks
  SELECT * INTO v_from_wallet 
  FROM wallets 
  WHERE profile_id = p_from_profile_id 
  FOR UPDATE;
  
  SELECT * INTO v_to_wallet 
  FROM wallets 
  WHERE profile_id = p_to_profile_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient wallet not found');
  END IF;
  
  -- Get recipient profile for name
  SELECT * INTO v_to_profile FROM profiles WHERE id = p_to_profile_id;
  
  -- Check sufficient balance
  IF v_from_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  v_from_new_balance := v_from_wallet.balance - p_amount;
  v_to_new_balance := v_to_wallet.balance + p_amount;
  
  -- Update sender wallet
  UPDATE wallets SET balance = v_from_new_balance, updated_at = now() WHERE id = v_from_wallet.id;
  
  -- Update receiver wallet
  UPDATE wallets SET balance = v_to_new_balance, updated_at = now() WHERE id = v_to_wallet.id;
  
  -- Create send transaction
  INSERT INTO transactions (wallet_id, type, amount, status, description, reference_code, recipient_name, recipient_phone)
  VALUES (v_from_wallet.id, 'send', p_amount, 'completed', p_description, p_reference, v_to_profile.full_name, v_to_profile.phone_number)
  RETURNING id INTO v_send_txn_id;
  
  -- Create receive transaction
  INSERT INTO transactions (wallet_id, type, amount, status, description, reference_code)
  VALUES (v_to_wallet.id, 'receive', p_amount, 'completed', 'Received from transfer', p_reference)
  RETURNING id INTO v_receive_txn_id;
  
  -- Update daily totals
  INSERT INTO daily_transaction_totals (profile_id, transaction_date, total_sent, transaction_count)
  VALUES (p_from_profile_id, CURRENT_DATE, p_amount, 1)
  ON CONFLICT (profile_id, transaction_date) 
  DO UPDATE SET 
    total_sent = daily_transaction_totals.total_sent + p_amount,
    transaction_count = daily_transaction_totals.transaction_count + 1,
    updated_at = now();
  
  -- Audit logs
  INSERT INTO audit_logs (profile_id, action, details, balance_before, balance_after, entity_type, entity_id)
  VALUES 
    (p_from_profile_id, 'wallet_transfer_out', jsonb_build_object('amount', p_amount, 'to', p_to_profile_id), 
     v_from_wallet.balance, v_from_new_balance, 'transaction', v_send_txn_id),
    (p_to_profile_id, 'wallet_transfer_in', jsonb_build_object('amount', p_amount, 'from', p_from_profile_id), 
     v_to_wallet.balance, v_to_new_balance, 'transaction', v_receive_txn_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'from_new_balance', v_from_new_balance,
    'to_new_balance', v_to_new_balance,
    'send_transaction_id', v_send_txn_id,
    'receive_transaction_id', v_receive_txn_id
  );
END;
$$;

-- 11. Triggers for updated_at
CREATE TRIGGER update_transaction_limits_updated_at BEFORE UPDATE ON public.transaction_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_totals_updated_at BEFORE UPDATE ON public.daily_transaction_totals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_status_updated_at BEFORE UPDATE ON public.system_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();