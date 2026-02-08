import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentProfile, usePendingWithdrawals, useAgentWithdrawals, useAgentCommissions, useAgentStats, useConfirmWithdrawal } from '@/hooks/useAgentData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Wallet, TrendingUp, Clock, CheckCircle,
  ArrowLeft, Loader2, Check, X, AlertCircle,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <p className="mt-2 text-xl font-bold font-display">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function AgentDashboard() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { data: agentProfile, isLoading: agentLoading } = useAgentProfile();
  const { data: pendingWithdrawals, isLoading: pendingLoading } = usePendingWithdrawals();
  const { data: allWithdrawals } = useAgentWithdrawals();
  const { data: commissions } = useAgentCommissions();
  const stats = useAgentStats();
  const confirmWithdrawal = useConfirmWithdrawal();
  const [tab, setTab] = useState('pending');
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: 'confirm' | 'reject'; name: string; amount: number } | null>(null);

  if (loading || agentLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (profile?.role !== 'agent') {
    return <Navigate to="/" replace />;
  }

  if (!agentProfile || agentProfile.status !== 'approved') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-16 w-16 text-warning" />
        <h1 className="mt-4 font-display text-xl font-bold">Pending Approval</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your agent account is pending admin approval. Please check back later.</p>
        <Button onClick={() => navigate('/')} className="mt-6" variant="outline">Back to Home</Button>
      </div>
    );
  }

  const handleAction = async () => {
    if (!confirmDialog) return;
    try {
      const result = await confirmWithdrawal.mutateAsync({ withdrawalId: confirmDialog.id, action: confirmDialog.action });
      if (confirmDialog.action === 'confirm') {
        toast.success(`Withdrawal confirmed! Commission: KES ${(result.commission ?? 0).toFixed(2)}`);
      } else {
        toast.success('Withdrawal rejected');
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setConfirmDialog(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">Agent Dashboard</h1>
            <p className="text-xs opacity-80">{profile?.full_name}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Wallet} label="Agent Wallet" value={`KES ${stats.walletBalance.toLocaleString()}`} color="bg-primary" />
          <StatCard icon={TrendingUp} label="Total Earnings" value={`KES ${stats.totalEarnings.toLocaleString()}`} color="bg-success" />
          <StatCard icon={Clock} label="Pending" value={stats.pendingCount} color="bg-warning" />
          <StatCard icon={CheckCircle} label="Completed" value={stats.completedCount} color="bg-accent" />
        </div>

        <div className="mt-4 rounded-xl bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Today's Earnings</p>
          <p className="font-display text-lg font-bold text-success">KES {stats.todayEarnings.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Commission rate: {stats.commissionRate}%</p>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              Pending
              {stats.pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                  {stats.pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-2">
            {pendingLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : !pendingWithdrawals?.length ? (
              <div className="rounded-xl bg-card p-8 text-center shadow-card">
                <CheckCircle className="mx-auto h-10 w-10 text-success" />
                <p className="mt-2 text-sm font-medium">No pending withdrawals</p>
                <p className="text-xs text-muted-foreground">New requests will appear here</p>
              </div>
            ) : (
              pendingWithdrawals.map((w: any) => (
                <div key={w.id} className="rounded-xl bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{w.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{w.profiles?.phone_number}</p>
                      <p className="mt-2 font-display text-lg font-bold text-primary">KES {Number(w.amount).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Ref: {w.reference_code}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        onClick={() => setConfirmDialog({ id: w.id, action: 'confirm', name: w.profiles?.full_name, amount: Number(w.amount) })}
                        disabled={confirmWithdrawal.isPending}
                      >
                        <Check className="mr-1 h-3 w-3" /> Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDialog({ id: w.id, action: 'reject', name: w.profiles?.full_name, amount: Number(w.amount) })}
                        disabled={confirmWithdrawal.isPending}
                      >
                        <X className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-2">
            {allWithdrawals?.map((w: any) => (
              <div key={w.id} className="rounded-xl bg-card p-3 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{w.profiles?.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{w.reference_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">KES {Number(w.amount).toLocaleString()}</p>
                    <Badge variant={w.status === 'confirmed' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {w.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="earnings" className="mt-4 space-y-2">
            {!commissions?.length ? (
              <div className="rounded-xl bg-card p-6 text-center shadow-card">
                <p className="text-sm text-muted-foreground">No commissions earned yet</p>
              </div>
            ) : (
              commissions.map((c: any) => (
                <div key={c.id} className="rounded-xl bg-card p-3 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Commission</p>
                      <p className="text-[10px] text-muted-foreground">{c.withdrawals?.profiles?.full_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success">+KES {Number(c.amount).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), 'dd MMM, HH:mm')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'confirm' ? 'Confirm Withdrawal' : 'Reject Withdrawal'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'confirm' ? (
                <>
                  You are about to confirm a withdrawal of <strong>KES {confirmDialog?.amount.toLocaleString()}</strong> for <strong>{confirmDialog?.name}</strong>.
                  <br /><br />
                  Please verify the customer's identity before proceeding.
                </>
              ) : (
                <>
                  You are about to reject this withdrawal request from <strong>{confirmDialog?.name}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={confirmWithdrawal.isPending}>
              {confirmWithdrawal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmDialog?.action === 'confirm' ? 'Confirm' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
