
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('user', 'agent', 'admin');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'send', 'receive', 'airtime', 'commission', 'fee');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
CREATE TYPE public.agent_status AS ENUM ('pending', 'approved', 'suspended');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  email TEXT,
  pin_hash TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  type public.transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  status public.transaction_status NOT NULL DEFAULT 'pending',
  description TEXT,
  reference_code TEXT UNIQUE DEFAULT 'TXN-' || substring(gen_random_uuid()::text, 1, 8),
  recipient_phone TEXT,
  recipient_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status public.agent_status NOT NULL DEFAULT 'pending',
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (wallet_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  agent_id UUID REFERENCES public.agents(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  reference_code TEXT UNIQUE DEFAULT 'WDR-' || substring(gen_random_uuid()::text, 1, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Commissions table
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) NOT NULL,
  withdrawal_id UUID REFERENCES public.withdrawals(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- User roles table for RLS helper
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and wallet on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone_number, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone::text, ''),
    NEW.email,
    'user'
  )
  RETURNING id INTO new_profile_id;

  INSERT INTO public.wallets (profile_id) VALUES (new_profile_id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin() OR user_id = auth.uid());
-- Allow anyone to search profiles by phone for send money
CREATE POLICY "Users can search profiles by phone" ON public.profiles FOR SELECT USING (true);

-- Wallets
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (profile_id = public.get_profile_id() OR public.is_admin());
CREATE POLICY "System can insert wallets" ON public.wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update wallets" ON public.wallets FOR UPDATE USING (public.is_admin());

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (
  wallet_id IN (SELECT id FROM public.wallets WHERE profile_id = public.get_profile_id()) OR public.is_admin()
);
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (
  wallet_id IN (SELECT id FROM public.wallets WHERE profile_id = public.get_profile_id()) OR public.is_admin()
);

-- Agents
CREATE POLICY "Anyone can view approved agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Admin can manage agents" ON public.agents FOR ALL USING (public.is_admin());
CREATE POLICY "Agent can view own record" ON public.agents FOR SELECT USING (profile_id = public.get_profile_id());

-- Withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (
  profile_id = public.get_profile_id() OR 
  agent_id IN (SELECT id FROM public.agents WHERE profile_id = public.get_profile_id()) OR
  public.is_admin()
);
CREATE POLICY "Users can create withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (profile_id = public.get_profile_id());
CREATE POLICY "Agents can update assigned withdrawals" ON public.withdrawals FOR UPDATE USING (
  agent_id IN (SELECT id FROM public.agents WHERE profile_id = public.get_profile_id()) OR public.is_admin()
);

-- Commissions
CREATE POLICY "Agents can view own commissions" ON public.commissions FOR SELECT USING (
  agent_id IN (SELECT id FROM public.agents WHERE profile_id = public.get_profile_id()) OR public.is_admin()
);
CREATE POLICY "System can insert commissions" ON public.commissions FOR INSERT WITH CHECK (true);

-- Audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (profile_id = public.get_profile_id() OR public.is_admin());
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "System can insert roles" ON public.user_roles FOR INSERT WITH CHECK (true);
