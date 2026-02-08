import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Search, SendHorizontal, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export default function SendMoneyPage() {
  const { profile } = useAuth();
  const { data: wallet } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<'search' | 'confirm'>('search');

  const searchRecipient = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      toast.error('Enter a valid phone number');
      return;
    }
    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('phone_number', phone.trim())
      .single();

    if (error || !data) {
      toast.error('Recipient not found');
      setRecipient(null);
    } else if (data.id === profile?.id) {
      toast.info('This is your own number. This will be treated as a withdrawal.');
      navigate('/withdraw');
    } else {
      setRecipient(data);
      setStep('confirm');
    }
    setSearching(false);
  };

  const sendMoney = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > Number(wallet?.balance ?? 0)) { toast.error('Insufficient balance'); return; }
    if (!wallet || !recipient || !profile) return;

    setSending(true);
    try {
      // Get recipient wallet
      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('profile_id', recipient.id)
        .single();

      if (!recipientWallet) { toast.error('Recipient wallet not found'); setSending(false); return; }

      // Debit sender
      const { error: debitErr } = await supabase
        .from('wallets')
        .update({ balance: Number(wallet.balance) - amt })
        .eq('id', wallet.id);
      if (debitErr) throw debitErr;

      // Credit receiver
      const { error: creditErr } = await supabase
        .from('wallets')
        .update({ balance: Number(recipientWallet.balance) + amt })
        .eq('id', recipientWallet.id);
      if (creditErr) throw creditErr;

      // Record sender transaction
      await supabase.from('transactions').insert({
        wallet_id: wallet.id,
        type: 'send' as any,
        amount: amt,
        status: 'completed' as any,
        description: `Sent to ${recipient.full_name}`,
        recipient_phone: recipient.phone_number,
        recipient_name: recipient.full_name,
      });

      // Record receiver transaction
      await supabase.from('transactions').insert({
        wallet_id: recipientWallet.id,
        type: 'receive' as any,
        amount: amt,
        status: 'completed' as any,
        description: `Received from ${profile.full_name}`,
        recipient_phone: profile.phone_number,
        recipient_name: profile.full_name,
      });

      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`KES ${amt.toLocaleString()} sent to ${recipient.full_name}`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Transaction failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => step === 'confirm' ? setStep('search') : navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-bold">Send Money</h1>
      </div>

      <div className="px-5">
        {step === 'search' ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <Label>Recipient Phone Number</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="+254 700 000 000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={searchRecipient} disabled={searching} size="icon">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <p className="text-xs text-muted-foreground">Sending to</p>
              <p className="mt-1 font-display text-lg font-semibold">{recipient.full_name}</p>
              <p className="text-sm text-muted-foreground">{recipient.phone_number}</p>
            </div>

            <div className="rounded-2xl bg-card p-5 shadow-card">
              <Label>Amount (KES)</Label>
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

            <Button onClick={sendMoney} disabled={sending} className="w-full" size="lg">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Send KES {amount ? Number(amount).toLocaleString() : '0'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
