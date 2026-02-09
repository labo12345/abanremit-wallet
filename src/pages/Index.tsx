import { useAuth } from '@/contexts/AuthContext';
import { useWallet, useTransactions } from '@/hooks/useWallet';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import {
  SendHorizontal, ArrowDownToLine, Plus, Phone,
  Eye, EyeOff, LogOut, Settings, ChevronRight, UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const quickActions = [
  { label: 'Send Money', icon: SendHorizontal, path: '/send', color: 'bg-primary' },
  { label: 'Withdraw', icon: ArrowDownToLine, path: '/withdraw', color: 'bg-accent' },
  { label: 'Add Funds', icon: Plus, path: '/deposit', color: 'bg-success' },
  { label: 'Airtime', icon: Phone, path: '/airtime', color: 'bg-warning' },
];

function getTransactionIcon(type: string) {
  switch (type) {
    case 'send': return '↑';
    case 'receive': return '↓';
    case 'deposit': return '+';
    case 'withdrawal': return '−';
    case 'airtime': return '📱';
    default: return '•';
  }
}

function getTransactionColor(type: string) {
  switch (type) {
    case 'send': case 'withdrawal': case 'airtime': return 'text-destructive';
    case 'receive': case 'deposit': return 'text-success';
    default: return 'text-muted-foreground';
  }
}

export default function HomePage() {
  const { profile, signOut } = useAuth();
  const { data: wallet } = useWallet();
  const { data: transactions } = useTransactions();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  const recentTxns = transactions?.slice(0, 5) ?? [];

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Header */}
      <div className="gradient-hero px-5 pb-8 pt-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Hello,</p>
            <h1 className="font-display text-xl font-bold">{profile?.full_name || 'User'}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/settings')} className="rounded-full bg-primary-foreground/10 p-2.5 backdrop-blur-sm">
              <Settings className="h-4 w-4" />
            </button>
            <button onClick={signOut} className="rounded-full bg-primary-foreground/10 p-2.5 backdrop-blur-sm">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="mt-6 rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-80">Wallet Balance</p>
            <button onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye className="h-4 w-4 opacity-70" /> : <EyeOff className="h-4 w-4 opacity-70" />}
            </button>
          </div>
          <p className="mt-1 font-display text-3xl font-bold">
            {showBalance ? `KES ${Number(wallet?.balance ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '•••••••'}
          </p>
          <p className="mt-1 text-xs opacity-60">{wallet?.currency ?? 'KES'} Account</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 -mt-4">
        <div className="grid grid-cols-4 gap-3 rounded-2xl bg-card p-4 shadow-card">
          {quickActions.map(({ label, icon: Icon, path, color }) => (
            <button key={path} onClick={() => navigate(path)} className="flex flex-col items-center gap-1.5">
              <div className={`${color} flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Role-based Dashboard Link - Only for agents (admins can't access this page) */}
      {profile?.role === 'agent' && (
        <div className="mt-4 px-5">
          <button
            onClick={() => navigate('/agent')}
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground shadow-elevated"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Agent Dashboard</p>
                <p className="text-xs opacity-80">Process withdrawals</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Recent Transactions</h2>
          <button onClick={() => navigate('/transactions')} className="flex items-center gap-1 text-xs font-medium text-primary">
            See All <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {recentTxns.length === 0 ? (
            <div className="rounded-xl bg-card p-6 text-center shadow-card">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Your transaction history will appear here</p>
            </div>
          ) : (
            recentTxns.map((txn: any) => (
              <div key={txn.id} className="flex items-center gap-3 rounded-xl bg-card p-3.5 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold">
                  {getTransactionIcon(txn.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{txn.type}</p>
                  <p className="text-xs text-muted-foreground truncate">{txn.description || txn.recipient_name || txn.reference_code}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${getTransactionColor(txn.type)}`}>
                    {txn.type === 'receive' || txn.type === 'deposit' ? '+' : '-'}KES {Number(txn.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(txn.created_at), 'dd MMM')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
