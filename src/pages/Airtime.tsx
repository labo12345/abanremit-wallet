import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Phone, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const amounts = [50, 100, 200, 500, 1000];

export default function AirtimePage() {
  const { data: wallet } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [done, setDone] = useState(false);

  const purchase = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!phone || phone.length < 10) { toast.error('Enter a valid phone number'); return; }
    if (amt > Number(wallet?.balance ?? 0)) { toast.error('Insufficient balance'); return; }
    if (!wallet) return;

    setPurchasing(true);
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ balance: Number(wallet.balance) - amt })
        .eq('id', wallet.id);
      if (error) throw error;

      await supabase.from('transactions').insert({
        wallet_id: wallet.id,
        type: 'airtime' as any,
        amount: amt,
        status: 'completed' as any,
        description: `Airtime for ${phone}`,
        recipient_phone: phone,
      });

      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`KES ${amt} airtime purchased`);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col pb-20">
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-display text-xl font-bold">Buy Airtime</h1>
        </div>
        <div className="px-5">
          <div className="animate-slide-up rounded-2xl bg-secondary p-6 text-center shadow-card">
            <Check className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-3 font-display text-lg font-bold">Airtime Sent</h2>
            <p className="mt-1 text-sm text-muted-foreground">KES {Number(amount).toLocaleString()} to {phone}</p>
            <Button onClick={() => navigate('/')} className="mt-4 w-full" variant="outline">Back to Home</Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="font-display text-xl font-bold">Buy Airtime</h1>
      </div>
      <div className="px-5 space-y-4">
        <div className="rounded-2xl bg-card p-5 shadow-card space-y-4">
          <div>
            <Label>Phone Number</Label>
            <Input placeholder="+254 700 000 000" value={phone} onChange={e => setPhone(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label>Amount (KES)</Label>
            <Input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="mt-2 text-xl font-bold" />
          </div>
          <div className="flex flex-wrap gap-2">
            {amounts.map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={purchase} disabled={purchasing} className="w-full" size="lg">
          {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Buy Airtime
            </>
          )}
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
