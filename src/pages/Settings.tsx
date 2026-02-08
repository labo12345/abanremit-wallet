import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/BottomNav';
import { ArrowLeft, User, Phone, Mail, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="font-display text-xl font-bold">Settings</h1>
      </div>

      <div className="px-5 space-y-4">
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role} Account</p>
            </div>
          </div>
        </div>

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

        <Separator />

        <Button onClick={signOut} variant="destructive" className="w-full" size="lg">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
