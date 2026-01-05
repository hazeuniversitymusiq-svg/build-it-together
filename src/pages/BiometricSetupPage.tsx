import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSecurity } from '@/contexts/SecurityContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Fingerprint, Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const BiometricSetupPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    isWebAuthnSupported, 
    isWebAuthnRegistered, 
    registerWebAuthn,
    isAuthenticating 
  } = useSecurity();
  
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // If already registered, go to main app
    if (user && isWebAuthnRegistered) {
      navigate('/scan', { replace: true });
    }
  }, [user, isWebAuthnRegistered, navigate]);

  const handleSetupBiometrics = async () => {
    setIsRegistering(true);
    
    try {
      const success = await registerWebAuthn();
      
      if (success) {
        toast.success('Biometric lock enabled!');
        navigate('/scan', { replace: true });
      } else {
        toast.error('Failed to set up biometrics. Please try again.');
      }
    } catch (error) {
      toast.error('Biometric setup failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSkip = () => {
    toast.info('You can set up biometrics later in Settings');
    navigate('/scan', { replace: true });
  };

  if (authLoading) {
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
              className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center flow-biometric-ring"
            >
              <Fingerprint className="w-10 h-10 text-success" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-semibold">
                Secure your payments
              </CardTitle>
              <CardDescription className="mt-2">
                Use Face ID or fingerprint to confirm every payment
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Security benefits */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              {[
                'Confirm payments with your face or fingerprint',
                'No one can pay without your explicit authorization',
                'Your biometric data never leaves your device',
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{benefit}</p>
                </div>
              ))}
            </motion.div>

            {!isWebAuthnSupported ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-warning/10 border border-warning/20"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Biometrics not available
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your device doesn't support biometric authentication. 
                      You can still use FLOW, but payments won't have biometric confirmation.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <Button
                onClick={handleSetupBiometrics}
                disabled={isRegistering || isAuthenticating}
                className="w-full h-14 text-base font-medium rounded-xl gap-2 bg-success hover:bg-success/90"
              >
                {isRegistering || isAuthenticating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Enable Biometric Lock
                  </>
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              {isWebAuthnSupported ? 'Set up later' : 'Continue without biometrics'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* FLOW product truth */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          FLOW acts only with your explicit authorization
        </motion.p>
      </motion.div>
    </div>
  );
};

export default BiometricSetupPage;
