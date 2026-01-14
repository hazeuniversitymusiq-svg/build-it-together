import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

// Email/password validation
const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthStep = 'auth' | 'security' | 'reset' | 'updatePassword';
type AuthMode = 'signin' | 'signup';

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  
  const [step, setStep] = useState<AuthStep>('auth');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Password recovery
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Security settings
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  useEffect(() => {
    // If user is already authenticated and we're on auth step, 
    // skip to quick connect (they've already completed onboarding)
    // But if we're on security step, let them complete it first
    if (user && !loading && step === 'auth') {
      navigate('/connect', { replace: true });
    }
  }, [user, loading, navigate, step]);

  useEffect(() => {
    // Check URL for recovery tokens first
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const fullUrl = hash + search;

    // If we were redirected here from an auth callback (set at app-level), honor it
    try {
      const callbackType = sessionStorage.getItem('flow_auth_callback');
      if (callbackType === 'recovery') {
        setMode('signin');
        setStep('updatePassword');
      }
      // clear so it doesn't keep forcing state on future /auth visits
      if (callbackType) sessionStorage.removeItem('flow_auth_callback');
    } catch {
      // ignore
    }

    // Direct URL-based detection (in case callback flag wasn't set)
    if (fullUrl.includes('type=recovery') || fullUrl.includes('type%3Drecovery')) {
      setMode('signin');
      setStep('updatePassword');
    }

    // Listen for PASSWORD_RECOVERY auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session?.user?.email);

      if (event === 'PASSWORD_RECOVERY') {
        setStep('updatePassword');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    
    if (!emailResult.success) {
      setErrors(prev => ({ ...prev, email: emailResult.error.errors[0].message }));
      return;
    }
    if (!passwordResult.success) {
      setErrors(prev => ({ ...prev, password: passwordResult.error.errors[0].message }));
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        // Move to security step for new signups
        toast.success('Account created!');
        setStep('security');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Welcome back!');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecuritySave = async () => {
    if (!user) return;
    
    setIsSavingSecurity(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          biometric_enabled: biometricEnabled,
          session_timeout_minutes: 15,
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to save settings');
        return;
      }

      navigate('/connect', { replace: true });
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: 'Please enter your email first' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Use origin-only here because the backend allowlist often permits the base URL
        // while rejecting specific paths; the app will route the callback to /auth.
        redirectTo: window.location.origin,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (newPassword.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ password: 'Passwords do not match' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password updated! You can now sign in.');
      setStep('auth');
      setMode('signin');
      setPassword(newPassword);
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-aurora-purple/5 flex flex-col px-6 safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Aurora background glow */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-aurora-purple/20 blur-3xl rounded-full" />
      <div className="absolute bottom-40 left-0 w-48 h-48 bg-aurora-blue/10 blur-3xl rounded-full" />
      
      <AnimatePresence mode="wait">
        {step === 'auth' && (
          <motion.div
            key="auth-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground tracking-tight mb-4"
            >
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-muted-foreground mb-8"
            >
              {mode === 'signin' 
                ? 'Sign in to continue to FLOW' 
                : 'Get started with your FLOW account'}
            </motion.p>

            {/* Google Sign-In Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mb-6"
            >
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full h-14 text-base font-medium rounded-2xl border-border gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleEmailSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 text-base pl-12 rounded-2xl border-border"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 text-base pl-12 pr-12 rounded-2xl border-border"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {mode === 'signin' && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    disabled={isSubmitting}
                    className="text-sm text-muted-foreground p-0 h-auto"
                  >
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-6"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-muted-foreground"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {step === 'reset' && (
          <motion.div
            key="reset-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground tracking-tight mb-4"
            >
              Check your email
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-muted-foreground mb-8"
            >
              We sent a password reset link to <strong>{email}</strong>
            </motion.p>

            <Button
              onClick={() => setStep('auth')}
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-2xl"
            >
              Back to sign in
            </Button>
          </motion.div>
        )}

        {step === 'updatePassword' && (
          <motion.div
            key="update-password-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground tracking-tight mb-4"
            >
              Set new password
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-muted-foreground mb-8"
            >
              Enter your new password below
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleUpdatePassword}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-14 text-base pl-12 pr-12 rounded-2xl border-border"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 text-base pl-12 pr-12 rounded-2xl border-border"
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword}
                className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Update password'
                )}
              </Button>
            </motion.form>
          </motion.div>
        )}

        {step === 'security' && (
          <motion.div
            key="security-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground tracking-tight mb-4"
            >
              Security
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-muted-foreground mb-8"
            >
              Payments always require your confirmation.
            </motion.p>

            {/* Biometric toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-4 mb-8"
            >
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="biometric-toggle" 
                  className="text-base font-medium text-foreground cursor-pointer"
                >
                  Enable Face ID or fingerprint
                </Label>
                <Switch
                  id="biometric-toggle"
                  checked={biometricEnabled}
                  onCheckedChange={setBiometricEnabled}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You can change this later in Settings.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                onClick={handleSecuritySave}
                disabled={isSavingSecurity}
                className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
              >
                {isSavingSecurity ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Continue'
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;
