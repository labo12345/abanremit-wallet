import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeeConfiguration {
  id: string;
  transaction_type: string;
  fee_type: 'flat' | 'percentage' | 'tiered';
  flat_amount: number;
  percentage_rate: number;
  tier_config: any[];
  is_active: boolean;
  description: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export function useFeeConfigurations() {
  return useQuery({
    queryKey: ['fee-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_configurations')
        .select('*')
        .order('transaction_type');
      if (error) throw error;
      return data as FeeConfiguration[];
    },
  });
}

export function useActiveFees() {
  return useQuery({
    queryKey: ['active-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_configurations')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as FeeConfiguration[];
    },
  });
}

export function calculateFee(fee: FeeConfiguration | undefined, amount: number): number {
  if (!fee || !fee.is_active) return 0;
  switch (fee.fee_type) {
    case 'flat':
      return fee.flat_amount;
    case 'percentage':
      return Math.round((amount * fee.percentage_rate / 100) * 100) / 100;
    case 'tiered': {
      const tiers = fee.tier_config || [];
      for (const tier of tiers) {
        if (amount >= (tier.min || 0) && amount <= (tier.max || Infinity)) {
          return tier.flat || 0 + (amount * (tier.percentage || 0) / 100);
        }
      }
      return 0;
    }
    default:
      return 0;
  }
}

export function useUpdateFeeConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates, adminId }: { 
      id: string; 
      updates: Partial<FeeConfiguration>;
      adminId?: string;
    }) => {
      // Get old values for audit
      const { data: oldFee } = await supabase
        .from('fee_configurations')
        .select('*')
        .eq('id', id)
        .single();

      // Validate
      if (updates.flat_amount !== undefined && updates.flat_amount < 0) {
        throw new Error('Fee amount cannot be negative');
      }
      if (updates.percentage_rate !== undefined && (updates.percentage_rate < 0 || updates.percentage_rate > 100)) {
        throw new Error('Percentage must be between 0 and 100');
      }

      const { error } = await supabase
        .from('fee_configurations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;

      // Log the change
      if (oldFee) {
        await supabase.from('fee_change_logs').insert({
          fee_config_id: id,
          changed_by: adminId,
          old_values: oldFee,
          new_values: updates,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['active-fees'] });
    },
  });
}

export function useFeeAnalytics(period: 'today' | 'week' | 'month') {
  return useQuery({
    queryKey: ['fee-analytics', period],
    queryFn: async () => {
      const now = new Date();
      let startDate: string;
      
      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString();
      } else {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        startDate = d.toISOString();
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('type, fee_amount, created_at')
        .gt('fee_amount', 0)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      const totalFees = data?.reduce((sum, t) => sum + Number(t.fee_amount), 0) ?? 0;
      const byType: Record<string, number> = {};
      data?.forEach(t => {
        byType[t.type] = (byType[t.type] || 0) + Number(t.fee_amount);
      });

      return { totalFees, byType, transactions: data ?? [] };
    },
  });
}

export function useRevenueStats() {
  return useQuery({
    queryKey: ['revenue-stats'],
    queryFn: async () => {
      const [feesRes, commissionsRes] = await Promise.all([
        supabase.from('transactions').select('fee_amount').gt('fee_amount', 0),
        supabase.from('commissions').select('amount'),
      ]);

      const totalFees = feesRes.data?.reduce((sum, t) => sum + Number(t.fee_amount), 0) ?? 0;
      const totalCommissions = commissionsRes.data?.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

      return {
        totalFees,
        totalCommissions,
        netRevenue: totalFees - totalCommissions,
      };
    },
  });
}
