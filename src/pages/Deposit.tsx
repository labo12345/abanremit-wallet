import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const PAYBILL = '247247';

export default function DepositPage() {
  const { profile } = useAuth();
  const { data: wallet } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'amount' | 'instructions' | 'done'>('amount');
  const [copied, setCopied] = useState(false);

  const accountRef = profile?.phone_number || '';

  const handleDeposit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setStep('instructions');
  };

  const confirmDeposit = async () => {
    if (!wallet || !profile) return;
    const amt = parseFloat(amount);

    // MVP: Admin/self-confirm deposit
    const { error: walletErr } = await supabase
      .from('wallets')
      .update({ balance: Number(wallet.balance) + amt })
      .eq('id', wallet.id);

    if (walletErr) { toast.error('Deposit failed'); return; }

    await supabase.from('transactions').insert({
      wallet_id: wallet.id,
      type: 'deposit' as any,
      amount: amt,
      status: 'completed' as any,
      description: `Deposit via M-Pesa (Paybill ${PAYBILL})`,
    });

    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    toast.success(`KES ${amt.toLocaleString()} deposited successfully`);
    setStep('done');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => step === 'instructions' ? setStep('amount') : navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-bold">Add Funds</h1>
      </div>

      <div className="px-5">
        {step === 'amount' && (
          <div className="space-y-4 animate-slide-up">
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <Label>Amount to Deposit (KES)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mt-2 text-2xl font-bold"
              />
            </div>
            <Button onClick={handleDeposit} className="w-full" size="lg">Continue</Button>
          </div>
        )}

        {step === 'instructions' && (
          <div className="space-y-4 animate-slide-up">
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <h3 className="font-display text-base font-semibold">M-Pesa Payment Instructions</h3>
              <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li>1. Go to M-Pesa on your phone</li>
                <li>2. Select <strong>Lipa na M-Pesa</strong></li>
                <li>3. Select <strong>Pay Bill</strong></li>
                <li>4. Enter Business Number:</li>
              </ol>

              <div className="mt-2 flex items-center gap-2 rounded-xl bg-muted p-3">
                <span className="flex-1 font-display text-lg font-bold">{PAYBILL}</span>
                <button onClick={() => copyToClipboard(PAYBILL)}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">5. Account Number:</p>
              <div className="mt-1 flex items-center gap-2 rounded-xl bg-muted p-3">
                <span className="flex-1 font-display text-lg font-bold">{accountRef}</span>
                <button onClick={() => copyToClipboard(accountRef)}>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                6. Amount: <strong>KES {Number(amount).toLocaleString()}</strong>
              </p>
            </div>

            <Button onClick={confirmDeposit} className="w-full" size="lg">
              I've Made the Payment
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              For MVP, this will credit your wallet immediately
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="animate-slide-up rounded-2xl bg-secondary p-6 text-center shadow-card">
            <Check className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-3 font-display text-lg font-bold">Deposit Successful</h2>
            <p className="mt-1 text-2xl font-bold text-primary">KES {Number(amount).toLocaleString()}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your wallet has been credited
            </p>
            <Button onClick={() => navigate('/')} className="mt-4 w-full" variant="outline">
              Back to Home
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
