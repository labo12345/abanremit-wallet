import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export function useAgentProfile() {
  const { profile } = useAuth();
  const { data: role } = useUserRole();
  return useQuery({
    queryKey: ['agent-profile', profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile && role === 'agent',
  });
}

export function usePendingWithdrawals() {
  const { data: agentProfile } = useAgentProfile();
  return useQuery({
    queryKey: ['agent-pending-withdrawals', agentProfile?.id],
    queryFn: async () => {
      if (!agentProfile) return [];
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, profiles(full_name, phone_number)')
        .eq('agent_id', agentProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!agentProfile,
  });
}

export function useAgentWithdrawals() {
  const { data: agentProfile } = useAgentProfile();
  return useQuery({
    queryKey: ['agent-all-withdrawals', agentProfile?.id],
    queryFn: async () => {
      if (!agentProfile) return [];
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, profiles(full_name, phone_number)')
        .eq('agent_id', agentProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!agentProfile,
  });
}

export function useAgentCommissions() {
  const { data: agentProfile } = useAgentProfile();
  return useQuery({
    queryKey: ['agent-commissions', agentProfile?.id],
    queryFn: async () => {
      if (!agentProfile) return [];
      const { data, error } = await supabase
        .from('commissions')
        .select('*, withdrawals(amount, profiles(full_name))')
        .eq('agent_id', agentProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!agentProfile,
  });
}

export function useAgentStats() {
  const { data: agentProfile } = useAgentProfile();
  const { data: commissions } = useAgentCommissions();
  const { data: withdrawals } = useAgentWithdrawals();

  const totalEarnings = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;
  const pendingCount = withdrawals?.filter(w => w.status === 'pending').length ?? 0;
  const completedCount = withdrawals?.filter(w => w.status === 'confirmed').length ?? 0;
  const todayEarnings = commissions
    ?.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

  return {
    walletBalance: Number(agentProfile?.wallet_balance ?? 0),
    totalEarnings,
    todayEarnings,
    pendingCount,
    completedCount,
    commissionRate: Number(agentProfile?.commission_rate ?? 2),
  };
}

export function useConfirmWithdrawal() {
  const queryClient = useQueryClient();
  const { data: agentProfile } = useAgentProfile();

  return useMutation({
    mutationFn: async ({ withdrawalId, action }: { withdrawalId: string; action: 'confirm' | 'reject' }) => {
      if (!agentProfile) throw new Error('Agent profile not found');

      // Get withdrawal details
      const { data: withdrawal, error: fetchErr } = await supabase
        .from('withdrawals')
        .select('*, profiles(id)')
        .eq('id', withdrawalId)
        .single();
      if (fetchErr || !withdrawal) throw new Error('Withdrawal not found');

      if (action === 'reject') {
        // Just update status
        const { error } = await supabase
          .from('withdrawals')
          .update({ status: 'rejected' as any, confirmed_at: new Date().toISOString() })
          .eq('id', withdrawalId);
        if (error) throw error;
        return { action: 'rejected' };
      }

      // Confirm flow: debit user wallet, credit agent, record commission
      const amount = Number(withdrawal.amount);
      const commission = amount * (Number(agentProfile.commission_rate) / 100);

      // Get user wallet
      const { data: userWallet, error: walletErr } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', withdrawal.profile_id)
        .single();
      if (walletErr || !userWallet) throw new Error('User wallet not found');

      if (Number(userWallet.balance) < amount) {
        throw new Error('User has insufficient balance');
      }

      // Debit user wallet
      const { error: debitErr } = await supabase
        .from('wallets')
        .update({ balance: Number(userWallet.balance) - amount })
        .eq('id', userWallet.id);
      if (debitErr) throw debitErr;

      // Credit agent wallet
      const { error: creditErr } = await supabase
        .from('agents')
        .update({ wallet_balance: Number(agentProfile.wallet_balance) + amount })
        .eq('id', agentProfile.id);
      if (creditErr) throw creditErr;

      // Record user transaction
      await supabase.from('transactions').insert({
        wallet_id: userWallet.id,
        type: 'withdrawal' as any,
        amount,
        status: 'completed' as any,
        description: `Withdrawal via agent`,
        reference_code: withdrawal.reference_code,
      });

      // Record commission
      await supabase.from('commissions').insert({
        agent_id: agentProfile.id,
        withdrawal_id: withdrawalId,
        amount: commission,
      });

      // Update withdrawal status
      const { error: updateErr } = await supabase
        .from('withdrawals')
        .update({ status: 'confirmed' as any, confirmed_at: new Date().toISOString() })
        .eq('id', withdrawalId);
      if (updateErr) throw updateErr;

      return { action: 'confirmed', amount, commission };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-pending-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['agent-all-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['agent-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['agent-profile'] });
    },
  });
}
