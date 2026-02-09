import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KYCVerification() {
  const { profile, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nationalId, setNationalId] = useState(profile?.national_id || '');
  const [consentChecked, setConsentChecked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nationalId || nationalId.length < 6) {
      toast.error('Please enter a valid National ID or Passport number');
      return;
    }

    if (!consentChecked) {
      toast.error('Please accept the consent to proceed');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          national_id: nationalId,
          kyc_consent_at: new Date().toISOString(),
          kyc_verified: true, // In production, this would be set after manual/automated verification
          kyc_verified_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (error) throw error;

      // Log the KYC submission
      await supabase.from('audit_logs').insert({
        profile_id: profile?.id,
        action: 'kyc_submitted',
        details: { national_id_masked: `****${nationalId.slice(-4)}` },
      });

      await refetchProfile();
      toast.success('KYC verification submitted successfully');
      navigate('/settings');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.kyc_verified) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-xl font-bold">KYC Verification</h1>
          </div>
        </div>

        <div className="px-5 mt-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-semibold text-lg">Already Verified</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your identity has been verified. You have full access to all features.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Verified on: {new Date(profile.kyc_verified_at!).toLocaleDateString()}
            </p>
            <Button className="mt-6" onClick={() => navigate('/settings')}>
              Back to Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="gradient-hero px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">KYC Verification</h1>
            <p className="text-xs opacity-80">Complete your identity verification</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl bg-warning/10 border border-warning/20 p-4 mb-6">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Why is KYC required?</p>
            <p className="text-xs text-muted-foreground mt-1">
              KYC verification is required to comply with financial regulations and to protect 
              your account from fraud. Without verification, you cannot make withdrawals.
            </p>
          </div>
        </div>

        {/* KYC Benefits */}
        <div className="rounded-xl bg-card p-4 shadow-card mb-6">
          <h3 className="font-medium flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            Benefits of Verification
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Access to cash withdrawals
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Higher transaction limits
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Eligibility to become an agent
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Enhanced account security
            </li>
          </ul>
        </div>

        {/* KYC Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl bg-card p-4 shadow-card space-y-4">
            <div>
              <Label htmlFor="fullName">Full Legal Name</Label>
              <Input
                id="fullName"
                value={profile?.full_name || ''}
                disabled
                className="mt-1 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Name as it appears on your ID</p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile?.phone_number || ''}
                disabled
                className="mt-1 bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="nationalId">National ID / Passport Number *</Label>
              <Input
                id="nationalId"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="e.g., 12345678"
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your Kenyan National ID or Passport number
              </p>
            </div>
          </div>

          {/* Consent */}
          <div className="rounded-xl bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
              />
              <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed">
                I consent to AbanRemit collecting and verifying my personal information for KYC purposes. 
                I confirm that the information provided is accurate and I have read and agree to the{' '}
                <button type="button" onClick={() => navigate('/privacy')} className="text-primary underline">
                  Privacy Policy
                </button>{' '}
                and{' '}
                <button type="button" onClick={() => navigate('/terms')} className="text-primary underline">
                  Terms & Conditions
                </button>.
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !consentChecked}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Verification'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
