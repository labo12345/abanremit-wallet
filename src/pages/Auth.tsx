import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { z } from 'zod';

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(100),
  phoneNumber: z.string().trim().min(10, 'Valid phone number required').max(15),
  email: z.string().trim().email('Valid email required').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
});

export default function AuthPage() {
  const { user, loading, signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', email: '', password: '',
  });

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isSignUp) {
        const parsed = signUpSchema.parse(form);
        const { error } = await signUp(parsed.email, parsed.password, parsed.fullName, parsed.phoneNumber);
        if (error) {
          if (error.message?.includes('already registered')) {
            toast.error('This email is already registered. Please sign in.');
          } else {
            toast.error(error.message || 'Sign up failed');
          }
        } else {
          toast.success('Account created! Welcome to AbanRemit.');
          navigate('/');
        }
      } else {
        const parsed = signInSchema.parse(form);
        const { error } = await signIn(parsed.email, parsed.password);
        if (error) {
          toast.error(error.message || 'Sign in failed');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="gradient-hero flex flex-col items-center justify-center px-6 py-12 text-primary-foreground">
        <h1 className="font-display text-3xl font-bold tracking-tight">AbanRemit</h1>
        <p className="mt-1 text-sm opacity-80">SACCO Digital Wallet</p>
      </div>

      <div className="flex flex-1 flex-col px-6 py-8">
        <h2 className="font-display text-2xl font-semibold">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignUp ? 'Join AbanRemit today' : 'Sign in to your wallet'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+254 700 000 000"
                  value={form.phoneNumber}
                  onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span className="font-medium text-primary">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </button>
      </div>
    </div>
  );
}
