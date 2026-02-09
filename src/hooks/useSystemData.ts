import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TransactionLimit {
  id: string;
  limit_type: string;
  min_amount: number;
  max_amount: number;
  daily_limit: number | null;
  description: string | null;
  is_active: boolean;
}

export function useTransactionLimits() {
  return useQuery({
    queryKey: ['transaction-limits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_limits')
        .select('*')
        .order('limit_type');
      if (error) throw error;
      return data as TransactionLimit[];
    },
  });
}

export function useUpdateTransactionLimit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TransactionLimit> }) => {
      const { error } = await supabase
        .from('transaction_limits')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-limits'] });
    },
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_status')
        .select('*')
        .order('component');
      if (error) throw error;
      return data;
    },
  });
}

export function useWebhookEvents() {
  return useQuery({
    queryKey: ['webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function useAllDeposits() {
  return useQuery({
    queryKey: ['admin-deposits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposits')
        .select('*, profiles(full_name, phone_number)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useApproveDeposit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ depositId, profileId, amount, reference }: { 
      depositId: string; 
      profileId: string;
      amount: number;
      reference: string;
    }) => {
      // Credit wallet
      const { data: result, error: creditError } = await supabase
        .rpc('credit_wallet', {
          p_profile_id: profileId,
          p_amount: amount,
          p_reference: reference,
          p_description: 'Manual deposit approval'
        });
      
      const resultObj = result as { success?: boolean; error?: string; new_balance?: number } | null;
      
      if (creditError || !resultObj?.success) {
        throw new Error(creditError?.message || resultObj?.error || 'Failed to credit wallet');
      }

      // Update deposit status
      const { error: updateError } = await supabase
        .from('deposits')
        .update({ 
          status: 'completed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', depositId);

      if (updateError) throw updateError;

      return resultObj;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}
