/**
 * Demo Credential Screens
 * 
 * Visual mockups of credential collection for prototype demos.
 * These screens simulate OAuth, account input, and OTP flows
 * without storing any real data.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Fingerprint,
  KeyRound,
  Smartphone,
  Shield,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { getBrandedIcon } from '@/components/icons/BrandedIcons';
import type { AppDefinition } from '@/lib/connection/connection-engine';

interface DemoCredentialScreenProps {
  app: AppDefinition;
  onComplete: () => void;
  onSkip?: () => void;
}

type CredentialType = 'oauth' | 'account' | 'otp' | 'biometric';

// Determine which credential screen to show based on app type
function getCredentialType(app: AppDefinition): CredentialType {
  if (app.category === 'wallet' || app.category === 'bnpl') {
    return 'oauth';
  }
  if (app.category === 'bank') {
    return 'otp';
  }
  if (app.category === 'biller') {
    return 'account';
  }
  return 'oauth';
}

// OAuth Demo Screen (for wallets like TnG, GrabPay)
function OAuthDemoScreen({ app, onComplete }: DemoCredentialScreenProps) {
  const [step, setStep] = useState<'redirect' | 'authorizing' | 'done'>('redirect');
  const BrandIcon = getBrandedIcon(app.name, app.category);

  useEffect(() => {
    if (step === 'redirect') {
      const timer = setTimeout(() => setStep('authorizing'), 1200);
      return () => clearTimeout(timer);
    }
    if (step === 'authorizing') {
      const timer = setTimeout(() => setStep('done'), 1500);
      return () => clearTimeout(timer);
    }
    if (step === 'done') {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-lg max-w-sm mx-auto"
    >
      {/* App header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl overflow-hidden">
          <BrandIcon size={48} />
        </div>
        <div>
          <p className="font-semibold">{app.displayName}</p>
          <p className="text-xs text-muted-foreground">OAuth Authorization</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'redirect' && (
          <motion.div
            key="redirect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <ExternalLink className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="text-sm text-muted-foreground">
              Redirecting to {app.displayName}...
            </p>
          </motion.div>
        )}

        {step === 'authorizing' && (
          <motion.div
            key="authorizing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Shield className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="text-sm font-medium">Authorizing FLOW access...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Read balance • View transactions
            </p>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-success" />
            </motion.div>
            <p className="text-sm font-medium text-success">Authorized!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo badge */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground/60 text-center uppercase tracking-wider">
          Demo Mode • No real data stored
        </p>
      </div>
    </motion.div>
  );
}

// Account Input Demo Screen (for billers like TNB, Maxis)
function AccountDemoScreen({ app, onComplete }: DemoCredentialScreenProps) {
  const [accountNumber, setAccountNumber] = useState('');
  const [step, setStep] = useState<'input' | 'verifying' | 'done'>('input');
  const BrandIcon = getBrandedIcon(app.name, app.category);

  const handleSubmit = () => {
    if (accountNumber.length >= 6) {
      setStep('verifying');
      setTimeout(() => setStep('done'), 1200);
      setTimeout(onComplete, 1800);
    }
  };

  // Auto-fill demo account number
  useEffect(() => {
    const timer = setTimeout(() => {
      const demoAccounts: Record<string, string> = {
        TNB: '2200-1234-5678',
        Maxis: '012-345-6789',
        Unifi: 'UNI-2024-0001',
      };
      setAccountNumber(demoAccounts[app.name] || '123456789');
    }, 500);
    return () => clearTimeout(timer);
  }, [app.name]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-lg max-w-sm mx-auto"
    >
      {/* App header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl overflow-hidden">
          <BrandIcon size={48} />
        </div>
        <div>
          <p className="font-semibold">{app.displayName}</p>
          <p className="text-xs text-muted-foreground">Account Linking</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="account" className="text-sm">Account Number</Label>
                <Input
                  id="account"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter your account number"
                  className="mt-1.5"
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={accountNumber.length < 6}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Link Account
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying account...</p>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
              className="w-14 h-14 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center"
            >
              <Check className="w-7 h-7 text-success" />
            </motion.div>
            <p className="text-sm font-medium text-success">Account Linked!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo badge */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground/60 text-center uppercase tracking-wider">
          Demo Mode • No real data stored
        </p>
      </div>
    </motion.div>
  );
}

// OTP Demo Screen (for banks like Maybank)
function OTPDemoScreen({ app, onComplete }: DemoCredentialScreenProps) {
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'verifying' | 'biometric' | 'done'>('input');
  const BrandIcon = getBrandedIcon(app.name, app.category);

  // Auto-fill OTP for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setOtp('123456');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (otp.length === 6 && step === 'input') {
      setStep('verifying');
      setTimeout(() => setStep('biometric'), 1000);
      setTimeout(() => setStep('done'), 2200);
      setTimeout(onComplete, 2800);
    }
  }, [otp, step, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-lg max-w-sm mx-auto"
    >
      {/* App header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl overflow-hidden">
          <BrandIcon size={48} />
        </div>
        <div>
          <p className="font-semibold">{app.displayName}</p>
          <p className="text-xs text-muted-foreground">Secure Verification</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <Smartphone className="w-10 h-10 mx-auto mb-3 text-primary" />
            <p className="text-sm font-medium mb-1">Enter OTP</p>
            <p className="text-xs text-muted-foreground mb-4">
              Sent to •••• •••• 1234
            </p>
            <div className="flex justify-center">
              <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </motion.div>
        )}

        {step === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying OTP...</p>
          </motion.div>
        )}

        {step === 'biometric' && (
          <motion.div
            key="biometric"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Fingerprint className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="text-sm font-medium">Confirm with biometrics</p>
            <p className="text-xs text-muted-foreground mt-1">Touch sensor to authorize</p>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
              className="w-14 h-14 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center"
            >
              <Check className="w-7 h-7 text-success" />
            </motion.div>
            <p className="text-sm font-medium text-success">Verified!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo badge */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground/60 text-center uppercase tracking-wider">
          Demo Mode • No real data stored
        </p>
      </div>
    </motion.div>
  );
}

// Main export - renders the appropriate screen based on app type
export function DemoCredentialScreen({ app, onComplete, onSkip }: DemoCredentialScreenProps) {
  const credentialType = getCredentialType(app);

  switch (credentialType) {
    case 'oauth':
      return <OAuthDemoScreen app={app} onComplete={onComplete} onSkip={onSkip} />;
    case 'account':
      return <AccountDemoScreen app={app} onComplete={onComplete} onSkip={onSkip} />;
    case 'otp':
      return <OTPDemoScreen app={app} onComplete={onComplete} onSkip={onSkip} />;
    default:
      return <OAuthDemoScreen app={app} onComplete={onComplete} onSkip={onSkip} />;
  }
}
