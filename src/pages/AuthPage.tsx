import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type AuthStep = 'phone' | 'otp';

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; otp?: string }>({});

  useEffect(() => {
    if (user && !loading) {
      // After auth, navigate to Security Setup (biometric)
      navigate('/biometric-setup', { replace: true });
    }
  }, [user, loading, navigate]);

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
      // Navigation handled by useEffect when user state updates
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom">
      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
          >
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground tracking-tight mb-4"
            >
              Sign in
            </motion.h1>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-muted-foreground mb-8"
            >
              Use your phone number to secure your FLOW account.
            </motion.p>

            {/* Phone form */}
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
                className="w-full h-14 text-base font-medium rounded-2xl"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send code'
                )}
              </Button>
            </motion.form>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
          >
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground tracking-tight mb-4"
            >
              Enter code
            </motion.h1>

            {/* Helper */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base text-muted-foreground mb-8"
            >
              We sent a 6 digit code to your phone.
            </motion.p>

            {/* OTP form */}
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
                className="w-full h-14 text-base font-medium rounded-2xl"
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
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;
