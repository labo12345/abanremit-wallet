import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function useAllUsers() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, wallets(balance)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin',
  });
}

export function useAllAgents() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['admin-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*, profiles(full_name, phone_number, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin',
  });
}

export function useAllTransactions() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, wallets(profiles(full_name, phone_number))')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin',
  });
}

export function useAllWithdrawals() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, profiles(full_name, phone_number), agents(profiles(full_name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin',
  });
}

export function useUpdateAgentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, status }: { agentId: string; status: 'pending' | 'approved' | 'suspended' }) => {
      const { error } = await supabase
        .from('agents')
        .update({ status })
        .eq('id', agentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
    },
  });
}

export function useAdminStats() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, agentsRes, txnsRes, withdrawalsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('agents').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('transactions').select('amount').eq('status', 'completed'),
        supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      
      const totalVolume = txnsRes.data?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
      
      return {
        totalUsers: usersRes.count ?? 0,
        activeAgents: agentsRes.count ?? 0,
        pendingWithdrawals: withdrawalsRes.count ?? 0,
        totalVolume,
      };
    },
    enabled: profile?.role === 'admin',
  });
}
