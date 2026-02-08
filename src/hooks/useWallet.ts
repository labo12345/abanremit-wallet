import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useWallet() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['wallet', profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });
}

export function useTransactions() {
  const { data: wallet } = useWallet();

  return useQuery({
    queryKey: ['transactions', wallet?.id],
    queryFn: async () => {
      if (!wallet) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!wallet,
  });
}

export function useWithdrawals() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['withdrawals', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, agents(*, profiles(full_name, phone_number))')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });
}

export function useAvailableAgents() {
  return useQuery({
    queryKey: ['available-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*, profiles(full_name, phone_number)')
        .eq('status', 'approved');
      if (error) throw error;
      return data;
    },
  });
}
