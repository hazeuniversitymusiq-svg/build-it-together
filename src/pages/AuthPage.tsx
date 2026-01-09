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
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

// Phone validation - supports international formats
const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number');

// OTP validation
const otpSchema = z.string()
  .length(6, 'Code must be 6 digits')
  .regex(/^\d{6}$/, 'Code must be 6 digits');

type AuthStep = 'phone' | 'otp' | 'security';

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; otp?: string }>({});
  
  // Security settings
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  useEffect(() => {
    if (user && !loading && step !== 'security') {
      // After auth, show security step
      setStep('security');
    }
  }, [user, loading, step]);

  const formatPhoneForSupabase = (phoneNumber: string): string => {
    let formatted = phoneNumber.trim().replace(/\s/g, '');
    if (!formatted.startsWith('+')) {
      // Default to Malaysia if no country code
      formatted = '+60' + formatted;
    }
    return formatted;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = phoneSchema.safeParse(phone.replace(/\s/g, ''));
    if (!result.success) {
      setErrors({ phone: result.error.errors[0].message });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formattedPhone = formatPhoneForSupabase(phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          toast.error('Too many attempts. Please wait a moment.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Verification code sent!');
      setStep('otp');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = otpSchema.safeParse(otp);
    if (!result.success) {
      setErrors({ otp: result.error.errors[0].message });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formattedPhone = formatPhoneForSupabase(phone);
      
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          toast.error('Invalid or expired code. Please try again.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Welcome to FLOW');
      // Step will update via useEffect when user state changes
    } catch (error) {
      toast.error('Verification failed. Please try again.');
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
          session_timeout_minutes: 15, // Default to inactivity-based
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to save settings');
        return;
      }

      navigate('/auto-sync', { replace: true });
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleChangeNumber = () => {
    setStep('phone');
    setOtp('');
    setErrors({});
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
        {step === 'phone' && (
          <motion.div
            key="phone-step"
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
              Sign in
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-muted-foreground mb-8"
            >
              Use your phone number to secure your FLOW account.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handlePhoneSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone number
                </label>
                <Input
                  type="tel"
                  placeholder="+60 12 345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-14 text-lg rounded-2xl border-border"
                  autoComplete="tel"
                  autoFocus
                />
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.phone}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !phone}
                className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send code'
                )}
              </Button>
            </motion.form>
          </motion.div>
        )}
        
        {step === 'otp' && (
          <motion.div
            key="otp-step"
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
              Enter code
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-muted-foreground mb-8"
            >
              We sent a 6 digit code to your phone.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleOtpSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  className="h-14 text-2xl text-center tracking-[0.5em] font-mono rounded-2xl border-border"
                  autoComplete="one-time-code"
                  autoFocus
                />
                {errors.otp && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive text-center"
                  >
                    {errors.otp}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleChangeNumber}
                  className="text-muted-foreground"
                >
                  Change number
                </Button>
              </div>
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
