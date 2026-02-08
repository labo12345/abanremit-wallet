import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet, useAvailableAgents } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, ArrowDownToLine, Loader2, User, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function WithdrawPage() {
  const { profile } = useAuth();
  const { data: wallet } = useWallet();
  const { data: agents } = useAvailableAgents();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'amount' | 'agent' | 'confirm'>('amount');
  const [refCode, setRefCode] = useState('');

  const handleNext = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > Number(wallet?.balance ?? 0)) { toast.error('Insufficient balance'); return; }
    setStep('agent');
  };

  const selectAgent = (agent: any) => {
    setSelectedAgent(agent);
    setStep('confirm');
  };

  const submitWithdrawal = async () => {
    if (!profile || !selectedAgent || !wallet) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .insert({
          profile_id: profile.id,
          agent_id: selectedAgent.id,
          amount: parseFloat(amount),
          status: 'pending' as any,
        })
        .select()
        .single();

      if (error) throw error;
      setRefCode(data.reference_code || data.id.slice(0, 8).toUpperCase());
      toast.success('Withdrawal request submitted!');
      setStep('confirm');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => {
          if (step === 'agent') setStep('amount');
          else if (step === 'confirm' && !refCode) setStep('agent');
          else navigate(-1);
        }}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-bold">Withdraw</h1>
      </div>

      <div className="px-5">
        {step === 'amount' && (
          <div className="space-y-4 animate-slide-up">
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <Label>Withdrawal Amount (KES)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mt-2 text-2xl font-bold"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Available: KES {Number(wallet?.balance ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Button onClick={handleNext} className="w-full" size="lg">
              Select Agent <ArrowDownToLine className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'agent' && (
          <div className="space-y-3 animate-slide-up">
            <p className="text-sm text-muted-foreground">Select an available agent</p>
            {!agents?.length ? (
              <div className="rounded-2xl bg-card p-6 text-center shadow-card">
                <p className="text-sm text-muted-foreground">No agents available</p>
              </div>
            ) : (
              agents.map((agent: any) => (
                <button
                  key={agent.id}
                  onClick={() => selectAgent(agent)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-card text-left transition-all',
                    selectedAgent?.id === agent.id && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{agent.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{agent.profiles?.phone_number}</p>
                  </div>
                  {selectedAgent?.id === agent.id && <Check className="h-5 w-5 text-primary" />}
                </button>
              ))
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4 animate-slide-up">
            {refCode ? (
              <div className="rounded-2xl bg-secondary p-6 text-center shadow-card">
                <Check className="mx-auto h-12 w-12 text-primary" />
                <h2 className="mt-3 font-display text-lg font-bold">Withdrawal Pending</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Show this reference code to the agent
                </p>
                <div className="mt-4 rounded-xl bg-card p-4">
                  <p className="font-display text-2xl font-bold tracking-widest text-primary">{refCode}</p>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Amount: KES {Number(amount).toLocaleString()} • Agent: {selectedAgent?.profiles?.full_name}
                </p>
                <p className="mt-1 text-xs text-warning font-medium">
                  ⚠ Wallet will be debited only after agent confirms
                </p>
                <Button onClick={() => navigate('/')} className="mt-4 w-full" variant="outline">
                  Back to Home
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-card p-5 shadow-card space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">KES {Number(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Agent</span>
                    <span className="font-semibold">{selectedAgent?.profiles?.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{selectedAgent?.profiles?.phone_number}</span>
                  </div>
                </div>
                <Button onClick={submitWithdrawal} disabled={submitting} className="w-full" size="lg">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Withdrawal Request'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
