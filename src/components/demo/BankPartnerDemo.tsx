/**
 * Bank Partner Demo Component
 * 
 * Demonstrates the ideal FLOW experience with a simulated
 * bank partnership. Shows Scan → Authorize → Done flow.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  Fingerprint, 
  CheckCircle2, 
  Wallet,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Building2,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMockBankAPI, type BankBalance, type PaymentResult } from '@/hooks/useMockBankAPI';
import { cn } from '@/lib/utils';

type DemoStep = 'idle' | 'scanning' | 'scanned' | 'authorizing' | 'processing' | 'complete' | 'error';

interface DemoPayment {
  merchant: string;
  amount: number;
  qrId: string;
}

const DEMO_PAYMENTS: DemoPayment[] = [
  { merchant: 'Ah Seng Mamak', amount: 12.50, qrId: 'DQR001' },
  { merchant: 'Starbucks KLCC', amount: 18.90, qrId: 'DQR002' },
  { merchant: 'Village Park Nasi Lemak', amount: 75.00, qrId: 'DQR003' },
  { merchant: 'Parking MBPJ', amount: 3.00, qrId: 'DQR004' },
];

export function BankPartnerDemo() {
  const [step, setStep] = useState<DemoStep>('idle');
  const [balance, setBalance] = useState<BankBalance | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<DemoPayment | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const { loading, getBalance, initiatePayment, authorizePayment } = useMockBankAPI();

  const fetchBalance = async () => {
    const result = await getBalance();
    if (result) {
      setBalance(result);
    }
  };

  const startDemo = async (payment: DemoPayment) => {
    setSelectedPayment(payment);
    setErrorMessage('');
    
    // Step 1: Scanning animation
    setStep('scanning');
    await new Promise(r => setTimeout(r, 1200));
    
    // Fetch balance while "scanning"
    await fetchBalance();
    
    // Step 2: Show scanned result
    setStep('scanned');
  };

  const authorizeAndPay = async () => {
    if (!selectedPayment) return;
    
    setStep('authorizing');
    
    // Simulate biometric check
    await new Promise(r => setTimeout(r, 800));
    
    setStep('processing');
    
    // Initiate payment via mock bank API
    const result = await initiatePayment(
      selectedPayment.amount,
      selectedPayment.merchant,
      `FLOW-DEMO-${Date.now()}`,
      selectedPayment.qrId
    );
    
    if (!result) {
      setStep('error');
      setErrorMessage('Failed to connect to bank');
      return;
    }
    
    if (result.status === 'failed' && result.error) {
      setStep('error');
      setErrorMessage(result.error.message);
      return;
    }
    
    // If requires authorization (amount > RM50)
    if (result.status === 'pending_authorization' && result.authorization) {
      const authResult = await authorizePayment(
        result.paymentId,
        result.authorization.challengeId,
        'biometric'
      );
      
      if (!authResult || authResult.status === 'failed') {
        setStep('error');
        setErrorMessage(authResult?.error?.message || 'Authorization failed');
        return;
      }
      
      // Update balance from auth result
      if (authResult.newBalance !== undefined && balance) {
        setBalance({ ...balance, availableBalance: authResult.newBalance });
      }
    } else if (result.newBalance !== undefined && balance) {
      // Update balance from direct result
      setBalance({ ...balance, availableBalance: result.newBalance });
    }
    
    setPaymentResult(result);
    setStep('complete');
  };

  const reset = () => {
    setStep('idle');
    setSelectedPayment(null);
    setPaymentResult(null);
    setErrorMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Bank Partner Demo</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Experience the ideal FLOW: Scan → Authorize → Done
        </p>
        <Badge variant="outline" className="gap-1">
          <Zap className="h-3 w-3" />
          Powered by RYT Bank API (Simulated)
        </Badge>
      </div>

      {/* Balance Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">RYT Bank Balance</p>
              <p className="text-2xl font-bold">
                RM {balance?.availableBalance.toFixed(2) ?? '---'}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={fetchBalance}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
          {balance && (
            <p className="text-xs text-muted-foreground mt-1">
              Daily limit: RM {balance.dailyLimit.remaining.toFixed(2)} remaining
            </p>
          )}
        </CardContent>
      </Card>

      {/* Demo Area */}
      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <p className="text-sm font-medium text-center">Select a payment to demo:</p>
            {DEMO_PAYMENTS.map((payment) => (
              <Card 
                key={payment.qrId}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => startDemo(payment)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Scan className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.merchant}</p>
                      <p className="text-xs text-muted-foreground">QR: {payment.qrId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">RM {payment.amount.toFixed(2)}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="py-12 text-center space-y-4"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Scan className="h-10 w-10 text-primary" />
            </motion.div>
            <p className="text-lg font-medium">Scanning QR...</p>
            <p className="text-sm text-muted-foreground">
              Reading payment data
            </p>
          </motion.div>
        )}

        {step === 'scanned' && selectedPayment && (
          <motion.div
            key="scanned"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Card className="border-2 border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Payment Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Merchant</span>
                  <span className="font-medium">{selectedPayment.merchant}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-2xl font-bold">RM {selectedPayment.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Pay from</span>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-medium">RYT Bank</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={authorizeAndPay}
                >
                  <Fingerprint className="h-5 w-5" />
                  Authorize & Pay
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={reset}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(step === 'authorizing' || step === 'processing') && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="py-12 text-center space-y-4"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
            >
              {step === 'authorizing' ? (
                <Fingerprint className="h-10 w-10 text-primary" />
              ) : (
                <RefreshCw className="h-10 w-10 text-primary animate-spin" />
              )}
            </motion.div>
            <p className="text-lg font-medium">
              {step === 'authorizing' ? 'Verifying biometric...' : 'Processing payment...'}
            </p>
            <p className="text-sm text-muted-foreground">
              {step === 'authorizing' 
                ? 'Touch sensor to confirm' 
                : 'Connecting to RYT Bank API'}
            </p>
          </motion.div>
        )}

        {step === 'complete' && selectedPayment && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-6 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="mx-auto w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            >
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </motion.div>
            
            <div>
              <p className="text-2xl font-bold text-green-600">Payment Complete!</p>
              <p className="text-muted-foreground mt-1">{selectedPayment.merchant}</p>
            </div>
            
            <div className="text-4xl font-bold">
              RM {selectedPayment.amount.toFixed(2)}
            </div>
            
            {paymentResult?.bankReference && (
              <p className="text-xs text-muted-foreground">
                Ref: {paymentResult.bankReference}
              </p>
            )}
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-muted-foreground">New Balance</p>
              <p className="text-xl font-semibold">
                RM {balance?.availableBalance.toFixed(2)}
              </p>
            </div>
            
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Another Payment
            </Button>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-6 py-8"
          >
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            
            <div>
              <p className="text-xl font-bold text-destructive">Payment Failed</p>
              <p className="text-muted-foreground mt-2">{errorMessage}</p>
            </div>
            
            <Button onClick={reset} variant="outline">
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <p>This demo simulates the ideal bank-integrated FLOW experience.</p>
        <p className="mt-1">No actual transactions are processed.</p>
      </div>
    </div>
  );
}
