import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStats, useAllUsers, useAllAgents, useAllTransactions, useUpdateAgentStatus } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Users, UserCheck, ArrowDownToLine, TrendingUp,
  Search, Shield, Loader2, Check, X, RefreshCw, LogOut, Settings,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold font-display">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useAdminStats();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useAllUsers();
  const { data: agents, isLoading: agentsLoading, refetch: refetchAgents } = useAllAgents();
  const { data: transactions, isLoading: txnsLoading } = useAllTransactions();
  const updateAgentStatus = useUpdateAgentStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('overview');

  const handleAgentStatusChange = async (agentId: string, status: 'approved' | 'suspended') => {
    try {
      await updateAgentStatus.mutateAsync({ agentId, status });
      toast.success(`Agent ${status === 'approved' ? 'approved' : 'suspended'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update agent');
    }
  };

  const filteredUsers = users?.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone_number?.includes(searchTerm) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const filteredAgents = agents?.filter(a =>
    a.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.profiles?.phone_number?.includes(searchTerm)
  ) ?? [];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <div>
              <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
              <p className="text-xs opacity-80">SACCO Management</p>
            </div>
          </div>
          <button onClick={signOut} className="rounded-full bg-primary-foreground/10 p-2.5 backdrop-blur-sm">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-5 -mt-4">
        {/* Admin Quick Links */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => navigate('/admin/settings')}
            className="flex items-center gap-2 rounded-xl bg-card p-3 shadow-card"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">System Settings</span>
          </button>
          <button
            onClick={() => navigate('/admin/charges')}
            className="flex items-center gap-2 rounded-xl bg-card p-3 shadow-card"
          >
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Charges & Revenue</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} color="bg-primary" />
          <StatCard icon={UserCheck} label="Active Agents" value={stats?.activeAgents ?? 0} color="bg-success" />
          <StatCard icon={ArrowDownToLine} label="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} color="bg-warning" />
          <StatCard icon={TrendingUp} label="Total Volume" value={`KES ${(stats?.totalVolume ?? 0).toLocaleString()}`} color="bg-accent" />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Agents</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => { refetchUsers(); refetchAgents(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <TabsContent value="overview" className="mt-4 space-y-2">
            {agentsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : !filteredAgents.length ? (
              <div className="rounded-xl bg-card p-6 text-center shadow-card">
                <p className="text-sm text-muted-foreground">No agents registered</p>
              </div>
            ) : (
              filteredAgents.map((agent: any) => (
                <div key={agent.id} className="rounded-xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{agent.profiles?.full_name}</p>
                        <Badge variant={agent.status === 'approved' ? 'default' : agent.status === 'pending' ? 'secondary' : 'destructive'}>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{agent.profiles?.phone_number}</p>
                      {agent.agent_code && <p className="text-[10px] font-mono text-primary">{agent.agent_code}</p>}
                      <p className="mt-1 text-xs">Wallet: KES {Number(agent.wallet_balance).toLocaleString()} • Rate: {agent.commission_rate}%</p>
                    </div>
                    <div className="flex gap-1">
                      {agent.status !== 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => handleAgentStatusChange(agent.id, 'approved')}>
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      {agent.status !== 'suspended' && (
                        <Button size="sm" variant="outline" onClick={() => handleAgentStatusChange(agent.id, 'suspended')}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-2">
            {usersLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              filteredUsers.map((user: any) => (
                <div key={user.id} className="rounded-xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.full_name || 'No name'}</p>
                        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'agent' ? 'secondary' : 'outline'} className="text-[10px]">
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.phone_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">KES {Number(user.wallets?.[0]?.balance ?? 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(user.created_at), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-4 space-y-2">
            {txnsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              transactions?.slice(0, 30).map((txn: any) => (
                <div key={txn.id} className="rounded-xl bg-card p-3 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium capitalize">{txn.type}</p>
                      <p className="text-xs text-muted-foreground">{txn.wallets?.profiles?.full_name} • {txn.reference_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">KES {Number(txn.amount).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(txn.created_at), 'dd MMM, HH:mm')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
