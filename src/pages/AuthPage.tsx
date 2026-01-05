import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { z } from 'zod';

// Phone validation - supports international formats
const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number');

// OTP validation
const otpSchema = z.string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must be 6 digits');

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
      // After auth, go to biometric setup
      navigate('/biometric-setup', { replace: true });
    }
  }, [user, loading, navigate]);

  const formatPhoneForSupabase = (phoneNumber: string): string => {
    // Ensure phone starts with + for international format
    let formatted = phoneNumber.trim().replace(/\s/g, '');
    if (!formatted.startsWith('+')) {
      // Default to US if no country code
      formatted = '+1' + formatted;
    }
    return formatted;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate phone
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
        // Handle specific error cases
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

    // Validate OTP
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

  const handleResendOtp = async () => {
    setIsSubmitting(true);
    
    try {
      const formattedPhone = formatPhoneForSupabase(phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('New code sent!');
    } catch (error) {
      toast.error('Failed to resend code.');
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="flow-card-shadow border-0">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center"
            >
              <Shield className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-semibold">
                {step === 'phone' ? 'Enter your phone' : 'Verify your number'}
              </CardTitle>
              <CardDescription className="mt-2">
                {step === 'phone' 
                  ? 'We\'ll send you a verification code'
                  : `Code sent to ${phone}`
                }
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {step === 'phone' ? (
                <motion.form
                  key="phone-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handlePhoneSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-12 h-14 text-lg rounded-xl border-border"
                        autoComplete="tel"
                        autoFocus
                      />
                    </div>
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
                    className="w-full h-14 text-base font-medium rounded-xl gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
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
                      className="h-14 text-2xl text-center tracking-[0.5em] font-mono rounded-xl border-border"
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
                    className="w-full h-14 text-base font-medium rounded-xl gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Verify
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setStep('phone');
                        setOtp('');
                      }}
                      className="text-muted-foreground"
                    >
                      Change number
                    </Button>
                    <span className="text-muted-foreground">•</span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                      className="text-muted-foreground"
                    >
                      Resend code
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Trust indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Your phone number is used only for verification.
          <br />
          FLOW never stores or shares your data.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
