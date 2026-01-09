import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type SessionRule = 'every_payment' | 'after_inactivity';

const BiometricSetupPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [sessionRule, setSessionRule] = useState<SessionRule>('after_inactivity');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // session_timeout_minutes: 0 = every payment, 15 = after inactivity
      const sessionTimeoutMinutes = sessionRule === 'every_payment' ? 0 : 15;
      
      const { error } = await supabase
        .from('users')
        .update({
          biometric_enabled: biometricEnabled,
          session_timeout_minutes: sessionTimeoutMinutes,
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to save settings');
        return;
      }

      toast.success('Security settings saved');
      navigate('/link-funding', { replace: true });
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
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
      
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-foreground tracking-tight mb-4"
        >
          Security
        </motion.h1>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-2 mb-8"
        >
          <p className="text-base text-muted-foreground">
            FLOW uses your device security.
          </p>
          <p className="text-base text-muted-foreground">
            Payments always require confirmation.
          </p>
        </motion.div>

        {/* Toggle - Enable biometrics - Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card p-4 mb-6"
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
        </motion.div>

        {/* Session rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-sm font-medium text-foreground mb-4">Session rules</p>
          <RadioGroup
            value={sessionRule}
            onValueChange={(value) => setSessionRule(value as SessionRule)}
            className="space-y-3"
          >
            <div className="glass-card flex items-center space-x-3 p-4">
              <RadioGroupItem value="every_payment" id="every_payment" />
              <Label 
                htmlFor="every_payment" 
                className="text-base text-foreground cursor-pointer flex-1"
              >
                Require biometrics for every payment
              </Label>
            </div>
            <div className="glass-card flex items-center space-x-3 p-4">
              <RadioGroupItem value="after_inactivity" id="after_inactivity" />
              <Label 
                htmlFor="after_inactivity" 
                className="text-base text-foreground cursor-pointer flex-1"
              >
                Ask again after inactivity
              </Label>
            </div>
          </RadioGroup>
        </motion.div>

        {/* Helper */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm text-muted-foreground mb-8"
        >
          You can change this later.
        </motion.p>
      </div>

      {/* Bottom section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="pb-6 max-w-md mx-auto w-full relative z-10"
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Save and continue'
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default BiometricSetupPage;
