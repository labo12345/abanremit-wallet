import { useState } from 'react';
import { useFeeConfigurations, useUpdateFeeConfiguration, useFeeAnalytics, useRevenueStats, FeeConfiguration } from '@/hooks/useFees';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft, Loader2, Save, DollarSign, TrendingUp, 
  BarChart3, Banknote, HandCoins, PiggyBank,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['hsl(153, 60%, 33%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(210, 50%, 50%)', 'hsl(280, 50%, 50%)'];

function RevenueCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
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

export default function AdminCharges() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: fees, isLoading } = useFeeConfigurations();
  const updateFee = useUpdateFeeConfiguration();
  const { data: revenueStats } = useRevenueStats();
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | 'week' | 'month'>('month');
  const { data: analytics } = useFeeAnalytics(analyticsPeriod);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ fee_type: '', flat_amount: '', percentage_rate: '' });

  const handleEdit = (fee: FeeConfiguration) => {
    setEditingId(fee.id);
    setEditValues({
      fee_type: fee.fee_type,
      flat_amount: String(fee.flat_amount),
      percentage_rate: String(fee.percentage_rate),
    });
  };

  const handleSave = async (id: string) => {
    try {
      await updateFee.mutateAsync({
        id,
        updates: {
          fee_type: editValues.fee_type as any,
          flat_amount: Number(editValues.flat_amount),
          percentage_rate: Number(editValues.percentage_rate),
        },
        adminId: profile?.id,
      });
      setEditingId(null);
      toast.success('Fee updated successfully');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const chartData = analytics?.byType 
    ? Object.entries(analytics.byType).map(([type, amount]) => ({ type, amount }))
    : [];

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')}><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="font-display text-xl font-bold">Charges & Revenue</h1>
            <p className="text-xs opacity-80">Fee management & analytics</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4">
        {/* Revenue Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <RevenueCard icon={DollarSign} label="Total Fees" value={`KES ${(revenueStats?.totalFees ?? 0).toLocaleString()}`} color="bg-primary" />
          <RevenueCard icon={HandCoins} label="Commissions" value={`KES ${(revenueStats?.totalCommissions ?? 0).toLocaleString()}`} color="bg-warning" />
          <RevenueCard icon={PiggyBank} label="Net Revenue" value={`KES ${(revenueStats?.netRevenue ?? 0).toLocaleString()}`} color="bg-success" />
        </div>

        <Tabs defaultValue="fees">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fees">Fee Config</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Fee Configuration */}
          <TabsContent value="fees" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              fees?.map(fee => (
                <div key={fee.id} className="rounded-xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm capitalize">{fee.transaction_type}</p>
                      <p className="text-xs text-muted-foreground">{fee.description}</p>
                    </div>
                    <Switch
                      checked={fee.is_active}
                      onCheckedChange={async (checked) => {
                        await updateFee.mutateAsync({ id: fee.id, updates: { is_active: checked }, adminId: profile?.id });
                        toast.success(`Fee ${checked ? 'enabled' : 'disabled'}`);
                      }}
                    />
                  </div>

                  {editingId === fee.id ? (
                    <div className="space-y-2 mt-3">
                      <Select value={editValues.fee_type} onValueChange={v => setEditValues({ ...editValues, fee_type: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="tiered">Tiered</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Flat (KES)</label>
                          <Input type="number" value={editValues.flat_amount} onChange={e => setEditValues({ ...editValues, flat_amount: e.target.value })} className="h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Rate (%)</label>
                          <Input type="number" value={editValues.percentage_rate} onChange={e => setEditValues({ ...editValues, percentage_rate: e.target.value })} className="h-8 text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(fee.id)} disabled={updateFee.isPending}>
                          <Save className="h-3 w-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        <Badge variant="outline" className="mr-2 text-[10px]">{fee.fee_type}</Badge>
                        {fee.fee_type === 'flat' && `KES ${fee.flat_amount}`}
                        {fee.fee_type === 'percentage' && `${fee.percentage_rate}%`}
                        {fee.fee_type === 'tiered' && 'Tiered rates'}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(fee)}>Edit</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-4 space-y-4">
            <div className="flex gap-2">
              {(['today', 'week', 'month'] as const).map(p => (
                <Button key={p} size="sm" variant={analyticsPeriod === p ? 'default' : 'outline'} onClick={() => setAnalyticsPeriod(p)} className="capitalize">
                  {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </Button>
              ))}
            </div>

            <div className="rounded-xl bg-card p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Fee Revenue</h3>
                <p className="text-lg font-bold text-primary">KES {(analytics?.totalFees ?? 0).toLocaleString()}</p>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="amount" fill="hsl(153, 60%, 33%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No fee data for this period</p>
              )}
            </div>

            {chartData.length > 0 && (
              <div className="rounded-xl bg-card p-4 shadow-card">
                <h3 className="text-sm font-semibold mb-3">Revenue by Type</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={70} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="mt-4 space-y-3">
            <div className="rounded-xl bg-card p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Volume vs Revenue</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total transactions with fees</span>
                  <span className="font-semibold">{analytics?.transactions?.length ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average fee per transaction</span>
                  <span className="font-semibold">
                    KES {analytics?.transactions?.length ? ((analytics.totalFees / analytics.transactions.length).toFixed(2)) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Highest earning type</span>
                  <span className="font-semibold capitalize">
                    {chartData.length > 0 ? chartData.sort((a, b) => b.amount - a.amount)[0]?.type : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card p-4 shadow-card">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Banknote className="h-4 w-4" /> Commission Analytics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total commissions paid</span>
                  <span className="font-semibold">KES {(revenueStats?.totalCommissions ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net platform revenue</span>
                  <span className="font-semibold text-primary">KES {(revenueStats?.netRevenue ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
