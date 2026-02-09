import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactionLimits, useUpdateTransactionLimit, useSystemStatus, useAllDeposits, useApproveDeposit } from '@/hooks/useSystemData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Settings, ArrowLeft, Loader2, Save, Shield, Activity,
  DollarSign, Check, X, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { data: limits, isLoading: limitsLoading, refetch: refetchLimits } = useTransactionLimits();
  const { data: systemStatus, isLoading: statusLoading, refetch: refetchStatus } = useSystemStatus();
  const { data: deposits, isLoading: depositsLoading, refetch: refetchDeposits } = useAllDeposits();
  const updateLimit = useUpdateTransactionLimit();
  const approveDeposit = useApproveDeposit();
  
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ min: string; max: string; daily: string }>({ min: '', max: '', daily: '' });

  const handleEditLimit = (limit: any) => {
    setEditingLimit(limit.id);
    setEditValues({
      min: String(limit.min_amount),
      max: String(limit.max_amount),
      daily: limit.daily_limit ? String(limit.daily_limit) : '',
    });
  };

  const handleSaveLimit = async (id: string) => {
    try {
      await updateLimit.mutateAsync({
        id,
        updates: {
          min_amount: Number(editValues.min),
          max_amount: Number(editValues.max),
          daily_limit: editValues.daily ? Number(editValues.daily) : null,
        },
      });
      setEditingLimit(null);
      toast.success('Limit updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update limit');
    }
  };

  const handleApproveDeposit = async (deposit: any) => {
    try {
      await approveDeposit.mutateAsync({
        depositId: deposit.id,
        profileId: deposit.profile_id,
        amount: deposit.amount,
        reference: deposit.reference_code,
      });
      toast.success('Deposit approved and wallet credited');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve deposit');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-success';
      case 'degraded': return 'bg-warning';
      case 'down': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">System Settings</h1>
            <p className="text-xs opacity-80">Manage limits & system configuration</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4">
        <Tabs defaultValue="limits">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="limits">Limits</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
          </TabsList>

          {/* Transaction Limits */}
          <TabsContent value="limits" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Transaction Limits
              </h2>
              <Button variant="ghost" size="sm" onClick={() => refetchLimits()}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            {limitsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              limits?.map((limit) => (
                <div key={limit.id} className="rounded-xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {limit.limit_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">{limit.description}</p>
                    </div>
                    <Switch
                      checked={limit.is_active}
                      onCheckedChange={async (checked) => {
                        await updateLimit.mutateAsync({ id: limit.id, updates: { is_active: checked } });
                        toast.success(`Limit ${checked ? 'enabled' : 'disabled'}`);
                      }}
                    />
                  </div>

                  {editingLimit === limit.id ? (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Min</label>
                        <Input
                          type="number"
                          value={editValues.min}
                          onChange={(e) => setEditValues({ ...editValues, min: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Max</label>
                        <Input
                          type="number"
                          value={editValues.max}
                          onChange={(e) => setEditValues({ ...editValues, max: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Daily</label>
                        <Input
                          type="number"
                          value={editValues.daily}
                          onChange={(e) => setEditValues({ ...editValues, daily: e.target.value })}
                          placeholder="N/A"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-3 flex gap-2 mt-2">
                        <Button size="sm" onClick={() => handleSaveLimit(limit.id)} disabled={updateLimit.isPending}>
                          <Save className="h-3 w-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingLimit(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        KES {limit.min_amount.toLocaleString()} - {limit.max_amount.toLocaleString()}
                        {limit.daily_limit && ` (Daily: ${limit.daily_limit.toLocaleString()})`}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleEditLimit(limit)}>
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Pending Deposits */}
          <TabsContent value="deposits" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pending Deposits
              </h2>
              <Button variant="ghost" size="sm" onClick={() => refetchDeposits()}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            {depositsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <>
                {deposits?.filter(d => d.status === 'pending').length === 0 && (
                  <div className="rounded-xl bg-card p-6 text-center shadow-card">
                    <p className="text-sm text-muted-foreground">No pending deposits</p>
                  </div>
                )}
                {deposits?.filter(d => d.status === 'pending').map((deposit: any) => (
                  <div key={deposit.id} className="rounded-xl bg-card p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deposit.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{deposit.profiles?.phone_number}</p>
                        <p className="text-xs text-muted-foreground mt-1">Ref: {deposit.reference_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">KES {Number(deposit.amount).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(deposit.created_at), 'dd MMM, HH:mm')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleApproveDeposit(deposit)}
                        disabled={approveDeposit.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}

                <h3 className="font-medium text-sm mt-6">Recent Completed</h3>
                {deposits?.filter(d => d.status === 'completed').slice(0, 10).map((deposit: any) => (
                  <div key={deposit.id} className="rounded-xl bg-card p-3 shadow-card flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{deposit.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{deposit.reference_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">KES {Number(deposit.amount).toLocaleString()}</p>
                      <Badge variant="secondary" className="text-[10px]">completed</Badge>
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          {/* System Health */}
          <TabsContent value="health" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Health
              </h2>
              <Button variant="ghost" size="sm" onClick={() => refetchStatus()}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>

            {statusLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              systemStatus?.map((status: any) => (
                <div key={status.id} className="rounded-xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(status.status)}`} />
                      <div>
                        <p className="font-medium capitalize">{status.component}</p>
                        <p className="text-xs text-muted-foreground">
                          Last check: {format(new Date(status.last_check_at), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.status === 'operational' ? 'default' : 'destructive'}>
                      {status.status}
                    </Badge>
                  </div>
                  {status.response_time_ms && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Response time: {status.response_time_ms}ms
                    </p>
                  )}
                  {status.error_message && (
                    <p className="text-xs text-destructive mt-2">{status.error_message}</p>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
