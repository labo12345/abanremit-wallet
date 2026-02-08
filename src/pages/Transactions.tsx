import { useTransactions } from '@/hooks/useWallet';
import { BottomNav } from '@/components/BottomNav';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

function getTransactionIcon(type: string) {
  switch (type) {
    case 'send': return '↑';
    case 'receive': return '↓';
    case 'deposit': return '+';
    case 'withdrawal': return '−';
    case 'airtime': return '📱';
    case 'commission': return '💰';
    default: return '•';
  }
}

function getTransactionColor(type: string) {
  switch (type) {
    case 'send': case 'withdrawal': case 'airtime': case 'fee': return 'text-destructive';
    case 'receive': case 'deposit': case 'commission': return 'text-success';
    default: return 'text-muted-foreground';
  }
}

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="font-display text-xl font-bold">Transactions</h1>
      </div>

      <div className="px-5 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !transactions?.length ? (
          <div className="rounded-2xl bg-card p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          transactions.map((txn: any) => (
            <div key={txn.id} className="flex items-center gap-3 rounded-xl bg-card p-3.5 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold">
                {getTransactionIcon(txn.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium capitalize">{txn.type}</p>
                  <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                    {txn.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{txn.description || txn.reference_code}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${getTransactionColor(txn.type)}`}>
                  {txn.type === 'receive' || txn.type === 'deposit' || txn.type === 'commission' ? '+' : '-'}
                  KES {Number(txn.amount).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(txn.created_at), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
