import { useState } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Check, Loader2, AlertCircle } from 'lucide-react';

interface BiometricConfirmationProps {
  onConfirmed: () => void;
  onCancel: () => void;
  amount: string;
  merchant: string;
}

export function BiometricConfirmation({ 
  onConfirmed, 
  onCancel, 
  amount, 
  merchant 
}: BiometricConfirmationProps) {
  const { 
    authorizePayment, 
    isAuthenticating, 
    isWebAuthnSupported,
    isWebAuthnRegistered 
  } = useSecurity();
  
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setStatus('authenticating');
    setError(null);

    const success = await authorizePayment();

    if (success) {
      setStatus('success');
      // Small delay to show success state
      setTimeout(() => {
        onConfirmed();
      }, 600);
    } else {
      setStatus('error');
      setError('Authentication failed. Please try again.');
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'authenticating':
        return (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Confirming...</span>
          </>
        );
      case 'success':
        return (
          <>
            <Check className="w-6 h-6" />
            <span>Confirmed</span>
          </>
        );
      case 'error':
        return (
          <>
            <Fingerprint className="w-6 h-6" />
            <span>Try again</span>
          </>
        );
      default:
        return (
          <>
            <Fingerprint className="w-6 h-6" />
            <span>
              {isWebAuthnRegistered ? 'Confirm with biometrics' : 'Confirm payment'}
            </span>
          </>
        );
    }
  };

  const getButtonClass = () => {
    switch (status) {
      case 'success':
        return 'bg-success hover:bg-success/90';
      case 'error':
        return 'bg-destructive hover:bg-destructive/90';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      {/* Payment summary */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Confirm payment to</p>
        <p className="text-lg font-medium">{merchant}</p>
        <p className="text-3xl font-semibold">{amount}</p>
      </div>

      {/* Biometric indicator */}
      <div className="flex justify-center">
        <motion.div
          animate={status === 'authenticating' ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center ${
            status === 'success' 
              ? 'bg-success/10' 
              : status === 'error'
              ? 'bg-destructive/10'
              : 'bg-muted'
          }`}
        >
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-12 h-12 text-success" />
              </motion.div>
            ) : status === 'error' ? (
              <motion.div
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <AlertCircle className="w-12 h-12 text-destructive" />
              </motion.div>
            ) : (
              <motion.div
                key="fingerprint"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={status === 'authenticating' ? 'flow-biometric-ring' : ''}
              >
                <Fingerprint className="w-12 h-12 text-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-destructive text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Info about biometrics */}
      {!isWebAuthnSupported && (
        <p className="text-sm text-muted-foreground text-center">
          Biometrics not available on this device
        </p>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleConfirm}
          disabled={isAuthenticating || status === 'success'}
          className={`w-full h-14 text-base font-medium rounded-xl gap-2 ${getButtonClass()}`}
        >
          {getButtonContent()}
        </Button>

        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={status === 'authenticating' || status === 'success'}
          className="w-full text-muted-foreground"
        >
          Cancel
        </Button>
      </div>

      {/* FLOW product truth */}
      <p className="text-xs text-center text-muted-foreground">
        FLOW acts only with your explicit authorization
      </p>
    </motion.div>
  );
}
