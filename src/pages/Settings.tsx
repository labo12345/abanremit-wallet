import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BottomNav } from '@/components/BottomNav';
import { 
  ArrowLeft, User, Phone, Mail, Shield, LogOut, UserCheck, Loader2,
  CheckCircle, AlertCircle, FileText, HelpCircle, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);

  const { data: agentStatus, refetch: refetchAgent } = useQuery({
    queryKey: ['agent-status', profile?.id],
    queryFn: async () => {
      if (!profile) return null;
      const { data } = await supabase
        .from('agents')
        .select('status')
        .eq('profile_id', profile.id)
        .single();
      return data;
    },
    enabled: !!profile,
  });

  const registerAsAgent = async () => {
    if (!profile) return;
    
    // Check KYC
    if (!profile.kyc_verified) {
      toast.error('Please complete KYC verification first');
      navigate('/kyc');
      return;
    }

    setRegistering(true);
    try {
      const { error } = await supabase.from('agents').insert({
        profile_id: profile.id,
        status: 'pending' as any,
      });
      if (error) throw error;

      // Add agent role
      await supabase.from('user_roles').insert({ user_id: profile.user_id, role: 'agent' as any });

      toast.success('Agent registration submitted! Awaiting admin approval.');
      refetchAgent();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="font-display text-xl font-bold">Settings</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Profile Card */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role} Account</p>
            </div>
            {profile?.kyc_verified ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Unverified
              </Badge>
            )}
          </div>
        </div>

        {/* KYC Banner */}
        {!profile?.kyc_verified && (
          <button
            onClick={() => navigate('/kyc')}
            className="flex w-full items-center justify-between rounded-xl bg-warning/10 border border-warning/20 p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div className="text-left">
                <p className="font-medium text-sm">Complete KYC Verification</p>
                <p className="text-xs text-muted-foreground">Required for withdrawals</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Profile Details */}
        <div className="rounded-2xl bg-card shadow-card divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{profile?.phone_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{profile?.email || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>

        {/* Agent Registration */}
        {profile?.role === 'user' && !agentStatus && (
          <div className="rounded-2xl bg-secondary p-5 shadow-card">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Become an Agent</p>
                <p className="text-xs text-muted-foreground">Process withdrawals and earn commissions</p>
              </div>
            </div>
            <Button onClick={registerAsAgent} disabled={registering} className="mt-4 w-full">
              {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply to Become Agent'}
            </Button>
          </div>
        )}

        {agentStatus && (
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-primary" />
                <span className="font-medium">Agent Status</span>
              </div>
              <Badge variant={agentStatus.status === 'approved' ? 'default' : agentStatus.status === 'pending' ? 'secondary' : 'destructive'}>
                {agentStatus.status}
              </Badge>
            </div>
            {agentStatus.status === 'approved' && (
              <Button onClick={() => navigate('/agent')} variant="outline" className="mt-3 w-full">
                Open Agent Dashboard
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Legal & Support Links */}
        <div className="rounded-2xl bg-card shadow-card divide-y divide-border">
          <button onClick={() => navigate('/support')} className="flex items-center justify-between w-full p-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Help & Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate('/privacy')} className="flex items-center justify-between w-full p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Privacy Policy</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate('/terms')} className="flex items-center justify-between w-full p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Terms & Conditions</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <Button onClick={signOut} variant="destructive" className="w-full" size="lg">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
