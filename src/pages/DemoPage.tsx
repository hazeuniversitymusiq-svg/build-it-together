/**
 * Bank Partnership Demo Page
 * 
 * Split-screen demo showcasing the ideal FLOW experience
 * with real-time API call visualization.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  Fingerprint, 
  CheckCircle2, 
  Wallet,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  AlertCircle,
  Building2,
  Zap,
  Code2,
  Terminal,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type DemoStep = 'idle' | 'scanning' | 'scanned' | 'authorizing' | 'handoff' | 'in_wallet' | 'wallet_error' | 'fallback' | 'fallback_handoff' | 'fallback_wallet' | 'returning' | 'processing' | 'complete' | 'error' | 'card_processing' | 'card_3ds';

interface ApiLog {
  id: string;
  timestamp: Date;
  type: 'request' | 'response';
  method: string;
  endpoint: string;
  status?: number;
  duration?: number;
  body?: unknown;
}

interface DemoPayment {
  merchant: string;
  amount: number;
  qrId: string;
  rail: 'DuitNow' | 'TouchNGo' | 'GrabPay' | 'Boost' | 'Atome' | 'ShopeePay' | 'BigPay' | 'VisaMastercard';
  railColor: string;
  railIcon: string;
  simulateError?: 'insufficient_balance';
  fallbackRail?: 'DuitNow' | 'TouchNGo' | 'GrabPay' | 'Boost' | 'Atome' | 'ShopeePay' | 'BigPay' | 'VisaMastercard';
  fallbackIcon?: string;
  fallbackColor?: string;
  showBnplOption?: boolean; // Show "Pay in installments" option
  bnplInstallments?: number;
  bnplPerInstallment?: number;
  isCardPayment?: boolean; // Direct card payment (no wallet)
  cardType?: 'visa' | 'mastercard';
  cardLast4?: string;
}

const DEMO_PAYMENTS: DemoPayment[] = [
  { merchant: 'Ah Seng Mamak', amount: 12.50, qrId: 'DQR001', rail: 'DuitNow', railColor: 'text-pink-600', railIcon: '🏦' },
  { merchant: 'Starbucks KLCC', amount: 18.90, qrId: 'TNG002', rail: 'TouchNGo', railColor: 'text-blue-600', railIcon: '💙' },
  { merchant: 'Village Park', amount: 75.00, qrId: 'GP003', rail: 'GrabPay', railColor: 'text-green-600', railIcon: '💚' },
  { merchant: 'Parking MBPJ', amount: 3.00, qrId: 'BST004', rail: 'Boost', railColor: 'text-orange-500', railIcon: '🔶' },
  { 
    merchant: 'Nasi Lemak', 
    amount: 45.00, 
    qrId: 'ERR005', 
    rail: 'GrabPay', 
    railColor: 'text-green-600', 
    railIcon: '💚',
    simulateError: 'insufficient_balance',
    fallbackRail: 'TouchNGo',
    fallbackIcon: '💙',
    fallbackColor: 'text-blue-600'
  },
];

// API URL helper
function getApiUrl(endpoint: string): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'yqlojpvoeyzitbrrihiy';
  return `https://${projectId}.supabase.co/functions/v1/mock-bank-api/${endpoint}`;
}

const DemoPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<DemoStep>('idle');
  const [balance, setBalance] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<DemoPayment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'spec'>('logs');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [apiLogs]);

  const addLog = (log: Omit<ApiLog, 'id' | 'timestamp'>) => {
    setApiLogs(prev => [...prev, {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }]);
  };

  const clearLogs = () => setApiLogs([]);

  // Wrapped fetch that logs API calls
  const loggedFetch = async (
    endpoint: string,
    method: string,
    body?: unknown
  ): Promise<{ data: unknown; status: number; duration: number }> => {
    const startTime = Date.now();
    
    addLog({
      type: 'request',
      method,
      endpoint,
      body,
    });

    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(getApiUrl(endpoint), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    addLog({
      type: 'response',
      method,
      endpoint,
      status: response.status,
      duration,
      body: data,
    });

    return { data, status: response.status, duration };
  };

  const fetchBalance = async () => {
    const { data } = await loggedFetch('balance', 'GET');
    if (data && typeof data === 'object' && 'available_balance' in data) {
      setBalance((data as { available_balance: number }).available_balance);
    }
  };

  const startDemo = async (payment: DemoPayment) => {
    setSelectedPayment(payment);
    setErrorMessage('');
    clearLogs();
    
    // Step 1: Scanning animation
    setStep('scanning');
    await new Promise(r => setTimeout(r, 1000));
    
    // Fetch balance
    await fetchBalance();
    
    // Step 2: Show scanned result
    setStep('scanned');
  };

  const authorizeAndPay = async () => {
    if (!selectedPayment) return;
    
    setStep('authorizing');
    await new Promise(r => setTimeout(r, 600));
    
    // Card payment flow - no wallet handoff needed
    if (selectedPayment.isCardPayment) {
      // Show card processing
      setStep('card_processing');
      await new Promise(r => setTimeout(r, 1500));
      
      // Simulate 3DS authentication for amounts over RM100
      if (selectedPayment.amount > 100) {
        setStep('card_3ds');
        await new Promise(r => setTimeout(r, 2000));
      }
      
      setStep('processing');
    } else {
      // Wallet payment flow
      setStep('handoff');
      await new Promise(r => setTimeout(r, 1200));
      
      // Simulate being in the wallet app
      setStep('in_wallet');
      await new Promise(r => setTimeout(r, 2500));
      
      // Check if this payment should simulate an error
      if (selectedPayment.simulateError === 'insufficient_balance') {
        // Show wallet error
        setStep('wallet_error');
        await new Promise(r => setTimeout(r, 2000));
        
        // Show fallback selection
        setStep('fallback');
        await new Promise(r => setTimeout(r, 1800));
        
        // Handoff to fallback wallet
        setStep('fallback_handoff');
        await new Promise(r => setTimeout(r, 1200));
        
        // In fallback wallet
        setStep('fallback_wallet');
        await new Promise(r => setTimeout(r, 2500));
      }
      
      // Simulate returning from wallet
      setStep('returning');
      await new Promise(r => setTimeout(r, 800));
      
      setStep('processing');
    }
    
    // Initiate payment
    const { data, status } = await loggedFetch('payments/initiate', 'POST', {
      amount: { value: selectedPayment.amount, currency: 'MYR' },
      recipient: { name: selectedPayment.merchant, duitnow_id: selectedPayment.qrId },
      reference: `FLOW-DEMO-${Date.now()}`,
      rail: selectedPayment.simulateError ? selectedPayment.fallbackRail : selectedPayment.rail,
    });

    const paymentData = data as {
      status: string;
      payment_id?: string;
      new_balance?: number;
      authorization?: { challenge_id: string };
      error?: { message: string };
    };

    if (status >= 400 || paymentData.error) {
      setStep('error');
      setErrorMessage(paymentData.error?.message || 'Payment failed');
      return;
    }

    // Handle 2FA if required
    if (paymentData.status === 'pending_authorization' && paymentData.authorization) {
      const { data: authData, status: authStatus } = await loggedFetch(
        `payments/${paymentData.payment_id}/authorize`,
        'POST',
        {
          challenge_id: paymentData.authorization.challenge_id,
          authorization_type: 'biometric',
        }
      );

      const authResult = authData as { status: string; new_balance?: number; error?: { message: string } };

      if (authStatus >= 400 || authResult.error) {
        setStep('error');
        setErrorMessage(authResult.error?.message || 'Authorization failed');
        return;
      }

      if (authResult.new_balance !== undefined) {
        setBalance(authResult.new_balance);
      }
    } else if (paymentData.new_balance !== undefined) {
      setBalance(paymentData.new_balance);
    }

    setStep('complete');
  };

  const reset = () => {
    setStep('idle');
    setSelectedPayment(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-background safe-area-top">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/home')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">Bank Partnership Demo</h1>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            RYT Bank API (Simulated)
          </Badge>
        </div>
      </header>

      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Left: Demo Experience */}
        <div className="flex-1 p-4 overflow-auto border-b lg:border-b-0 lg:border-r">
          <div className="max-w-md mx-auto space-y-4">
            {/* Balance Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      RYT Bank Balance
                    </p>
                    <p className="text-2xl font-bold">
                      RM {balance?.toFixed(2) ?? '---'}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={fetchBalance}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Demo Flow */}
            <AnimatePresence mode="wait">
              {step === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-medium text-center text-muted-foreground">
                    Select a QR payment to demo:
                  </p>
                  {DEMO_PAYMENTS.map((payment) => (
                    <Card 
                      key={payment.qrId}
                      className={cn(
                        "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all",
                        payment.simulateError && "border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10"
                      )}
                      onClick={() => startDemo(payment)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-lg bg-muted shrink-0">
                              {payment.railIcon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{payment.merchant}</p>
                              <p className={cn("text-xs", payment.railColor)}>
                                {payment.rail === 'TouchNGo' ? "Touch 'n Go" : payment.rail}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold">RM {payment.amount.toFixed(2)}</p>
                          </div>
                        </div>
                        {payment.simulateError && (
                          <p className="text-xs text-amber-600 mt-1">Demo: Fallback flow</p>
                        )}
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
                  className="py-16 text-center space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <Scan className="h-12 w-12 text-primary" />
                  </motion.div>
                  <p className="text-xl font-medium">Scanning QR...</p>
                  <p className="text-muted-foreground">Parsing EMVCo payload</p>
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
                        Ready to Pay
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Merchant</span>
                          <span className="font-medium">{selectedPayment.merchant}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="text-2xl font-bold">RM {selectedPayment.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Rail</span>
                          <span className={cn("flex items-center gap-1 font-medium", selectedPayment.railColor)}>
                            <span>{selectedPayment.railIcon}</span>
                            {selectedPayment.isCardPayment 
                              ? `${selectedPayment.cardType === 'visa' ? 'Visa' : 'Mastercard'} •••• ${selectedPayment.cardLast4}`
                              : selectedPayment.rail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.rail
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Funded by</span>
                          <span className="flex items-center gap-1 font-medium">
                            {selectedPayment.isCardPayment ? (
                              <>
                                <span>💳</span>
                                Linked Card
                              </>
                            ) : (
                              <>
                                <Building2 className="h-4 w-4 text-primary" />
                                RYT Bank
                              </>
                            )}
                          </span>
                        </div>
                        {selectedPayment.isCardPayment && (
                          <div className="mt-2 p-2 bg-indigo-500/10 rounded-lg">
                            <p className="text-xs text-indigo-600 text-center">
                              💡 Direct card payment - no wallet top-up required
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full gap-2 h-12 text-base" 
                        size="lg"
                        onClick={authorizeAndPay}
                      >
                        <Fingerprint className="h-5 w-5" />
                        {selectedPayment.isCardPayment ? 'Pay with Card' : 'Authorize & Pay'}
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

              {step === 'authorizing' && (
                <motion.div
                  key="authorizing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-16 text-center space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <Fingerprint className="h-12 w-12 text-primary" />
                  </motion.div>
                  <p className="text-xl font-medium">Verifying biometric...</p>
                  <p className="text-muted-foreground">Touch sensor to confirm</p>
                </motion.div>
              )}

              {/* Card Processing - Direct card payment without wallet */}
              {step === 'card_processing' && selectedPayment && (
                <motion.div
                  key="card_processing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-8"
                >
                  <Card className="border-2 border-indigo-500 bg-gradient-to-br from-indigo-500 to-indigo-600 overflow-hidden">
                    <CardContent className="p-6 text-white text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl">💳</span>
                        <span className="text-xl font-bold">
                          {selectedPayment.cardType === 'visa' ? 'Visa' : 'Mastercard'}
                        </span>
                      </div>
                      
                      <div className="py-4 border-t border-b border-white/20">
                        <p className="text-sm opacity-80">Pay to</p>
                        <p className="text-lg font-semibold">{selectedPayment.merchant}</p>
                        <p className="text-4xl font-bold mt-2">RM {selectedPayment.amount.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-8 rounded bg-gradient-to-br from-amber-300 to-amber-500" />
                        <span className="font-mono text-lg">•••• •••• •••• {selectedPayment.cardLast4}</span>
                      </div>
                      
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span className="text-sm">Processing payment...</span>
                      </motion.div>
                    </CardContent>
                  </Card>
                  
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Direct card payment - no wallet app needed
                  </p>
                </motion.div>
              )}

              {/* 3DS Authentication for high-value card payments */}
              {step === 'card_3ds' && selectedPayment && (
                <motion.div
                  key="card_3ds"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-8"
                >
                  <Card className="border-2 border-indigo-500 overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-center gap-2 text-indigo-600">
                        <Shield className="h-6 w-6" />
                        <span className="text-lg font-bold">3D Secure Authentication</span>
                      </div>
                      
                      <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <p className="text-sm text-muted-foreground">Verifying with your bank</p>
                        <p className="font-semibold mt-1">
                          {selectedPayment.cardType === 'visa' ? 'Visa' : 'Mastercard'} •••• {selectedPayment.cardLast4}
                        </p>
                        <p className="text-2xl font-bold mt-2">RM {selectedPayment.amount.toFixed(2)}</p>
                      </div>
                      
                      <div className="border rounded-xl p-4 bg-background">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            selectedPayment.cardType === 'visa' ? "bg-blue-100" : "bg-orange-100"
                          )}>
                            <span className="text-xl">🔐</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {selectedPayment.cardType === 'visa' ? 'Verified by Visa' : 'Mastercard SecureCode'}
                            </p>
                            <p className="text-xs text-muted-foreground">Additional security verification</p>
                          </div>
                        </div>
                        
                        <motion.div
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="flex items-center justify-center gap-2 py-3 text-muted-foreground"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"
                          />
                          <span className="text-sm">Authenticating with your bank...</span>
                        </motion.div>
                      </div>
                      
                      <p className="text-xs text-center text-muted-foreground">
                        This additional step helps protect your card against fraud
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 'handoff' && selectedPayment && (
                <motion.div
                  key="handoff"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, y: -50 }}
                  className="py-12 text-center space-y-6"
                >
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-6xl"
                  >
                    {selectedPayment.railIcon}
                  </motion.div>
                  <div>
                    <p className="text-xl font-bold">Opening {selectedPayment.rail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.rail}...</p>
                    <p className="text-muted-foreground mt-2">Handing off to wallet app</p>
                  </div>
                  <motion.div
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    className="h-1 bg-primary rounded-full mx-auto max-w-[200px]"
                  />
                </motion.div>
              )}

              {step === 'in_wallet' && selectedPayment && (
                <motion.div
                  key="in_wallet"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="py-8"
                >
                  <Card className={cn(
                    "border-2 overflow-hidden",
                    selectedPayment.rail === 'TouchNGo' && "border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600",
                    selectedPayment.rail === 'GrabPay' && "border-green-500 bg-gradient-to-br from-green-500 to-green-600",
                    selectedPayment.rail === 'Boost' && "border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600",
                    selectedPayment.rail === 'DuitNow' && "border-pink-500 bg-gradient-to-br from-pink-500 to-pink-600",
                    selectedPayment.rail === 'Atome' && "border-teal-500 bg-gradient-to-br from-teal-500 to-cyan-600",
                    selectedPayment.rail === 'ShopeePay' && "border-orange-600 bg-gradient-to-br from-orange-500 to-red-500",
                    selectedPayment.rail === 'BigPay' && "border-red-500 bg-gradient-to-br from-red-500 to-red-600"
                  )}>
                    <CardContent className="p-6 text-white text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl">{selectedPayment.railIcon}</span>
                        <span className="text-xl font-bold">
                          {selectedPayment.rail === 'TouchNGo' ? "Touch 'n Go eWallet" : selectedPayment.rail}
                        </span>
                      </div>
                      
                      {selectedPayment.showBnplOption ? (
                        <div className="py-4 border-t border-b border-white/20 space-y-3">
                          <p className="text-sm opacity-80">Pay to</p>
                          <p className="text-lg font-semibold">{selectedPayment.merchant}</p>
                          <div className="bg-white/10 rounded-xl p-3 mt-3">
                            <p className="text-xs opacity-70">Pay in {selectedPayment.bnplInstallments} interest-free installments</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                                    {i}
                                  </div>
                                  <p className="text-xs mt-1">RM {selectedPayment.bnplPerInstallment?.toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="text-3xl font-bold">Total: RM {selectedPayment.amount.toFixed(2)}</p>
                        </div>
                      ) : (
                        <div className="py-4 border-t border-b border-white/20">
                          <p className="text-sm opacity-80">Pay to</p>
                          <p className="text-lg font-semibold">{selectedPayment.merchant}</p>
                          <p className="text-4xl font-bold mt-2">RM {selectedPayment.amount.toFixed(2)}</p>
                        </div>
                      )}
                      
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Fingerprint className="h-5 w-5" />
                        <span className="text-sm">Confirming payment...</span>
                      </motion.div>
                    </CardContent>
                  </Card>
                  
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Simulating {selectedPayment.rail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.rail} app experience
                  </p>
                </motion.div>
              )}

              {step === 'wallet_error' && selectedPayment && (
                <motion.div
                  key="wallet_error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-8"
                >
                  <Card className="border-2 border-red-500 bg-gradient-to-br from-red-500 to-red-600 overflow-hidden">
                    <CardContent className="p-6 text-white text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl">{selectedPayment.railIcon}</span>
                        <span className="text-xl font-bold">
                          {selectedPayment.rail === 'TouchNGo' ? "Touch 'n Go eWallet" : selectedPayment.rail}
                        </span>
                      </div>
                      
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"
                      >
                        <AlertCircle className="h-10 w-10 text-white" />
                      </motion.div>
                      
                      <div>
                        <p className="text-lg font-bold">Insufficient Balance</p>
                        <p className="text-sm opacity-80 mt-1">
                          Your {selectedPayment.rail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.rail} balance is too low
                        </p>
                        <p className="text-xs opacity-60 mt-2">
                          Required: RM {selectedPayment.amount.toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    FLOW will automatically find an alternative...
                  </p>
                </motion.div>
              )}

              {step === 'fallback' && selectedPayment && selectedPayment.fallbackRail && (
                <motion.div
                  key="fallback"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="py-8 space-y-4"
                >
                  <div className="text-center space-y-2">
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1 }}
                      className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <Zap className="h-6 w-6 text-primary" />
                    </motion.div>
                    <p className="font-semibold">FLOW Smart Fallback</p>
                    <p className="text-sm text-muted-foreground">Finding best alternative payment rail...</p>
                  </div>
                  
                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3 opacity-50">
                        <span className="text-2xl">{selectedPayment.railIcon}</span>
                        <div className="flex-1">
                          <p className="font-medium line-through">
                            {selectedPayment.rail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.rail}
                          </p>
                          <p className="text-xs text-red-500">Insufficient balance</p>
                        </div>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                      
                      <div className="h-px bg-border" />
                      
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-2xl">{selectedPayment.fallbackIcon}</span>
                        <div className="flex-1">
                          <p className="font-medium">
                            {selectedPayment.fallbackRail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.fallbackRail}
                          </p>
                          <p className="text-xs text-green-600">Balance sufficient ✓</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </motion.div>
                    </CardContent>
                  </Card>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Switching to backup wallet automatically...
                  </p>
                </motion.div>
              )}

              {step === 'fallback_handoff' && selectedPayment && (
                <motion.div
                  key="fallback_handoff"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, y: -50 }}
                  className="py-12 text-center space-y-6"
                >
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-6xl"
                  >
                    {selectedPayment.fallbackIcon}
                  </motion.div>
                  <div>
                    <p className="text-xl font-bold">Opening {selectedPayment.fallbackRail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.fallbackRail}...</p>
                    <p className="text-muted-foreground mt-2">Switching to backup wallet</p>
                  </div>
                  <motion.div
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    className="h-1 bg-primary rounded-full mx-auto max-w-[200px]"
                  />
                </motion.div>
              )}

              {step === 'fallback_wallet' && selectedPayment && selectedPayment.fallbackRail && (
                <motion.div
                  key="fallback_wallet"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="py-8"
                >
                  <Card className={cn(
                    "border-2 overflow-hidden",
                    selectedPayment.fallbackRail === 'TouchNGo' && "border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600",
                    selectedPayment.fallbackRail === 'GrabPay' && "border-green-500 bg-gradient-to-br from-green-500 to-green-600",
                    selectedPayment.fallbackRail === 'Boost' && "border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600",
                    selectedPayment.fallbackRail === 'DuitNow' && "border-pink-500 bg-gradient-to-br from-pink-500 to-pink-600"
                  )}>
                    <CardContent className="p-6 text-white text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl">{selectedPayment.fallbackIcon}</span>
                        <span className="text-xl font-bold">
                          {selectedPayment.fallbackRail === 'TouchNGo' ? "Touch 'n Go eWallet" : selectedPayment.fallbackRail}
                        </span>
                      </div>
                      
                      <Badge className="bg-white/20 text-white border-0">
                        Fallback Payment
                      </Badge>
                      
                      <div className="py-4 border-t border-b border-white/20">
                        <p className="text-sm opacity-80">Pay to</p>
                        <p className="text-lg font-semibold">{selectedPayment.merchant}</p>
                        <p className="text-4xl font-bold mt-2">RM {selectedPayment.amount.toFixed(2)}</p>
                      </div>
                      
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Fingerprint className="h-5 w-5" />
                        <span className="text-sm">Confirming payment...</span>
                      </motion.div>
                    </CardContent>
                  </Card>
                  
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Payment recovered via {selectedPayment.fallbackRail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.fallbackRail}
                  </p>
                </motion.div>
              )}

              {step === 'returning' && selectedPayment && (
                <motion.div
                  key="returning"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="py-16 text-center space-y-4"
                >
                  <motion.div
                    animate={{ x: [20, 0, 20] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <ArrowRight className="h-12 w-12 text-primary" />
                  </motion.div>
                  <p className="text-xl font-medium">Returning to FLOW...</p>
                  <p className="text-muted-foreground">Payment confirmed by {selectedPayment.simulateError ? (selectedPayment.fallbackRail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.fallbackRail) : (selectedPayment.rail === 'TouchNGo' ? "Touch 'n Go" : selectedPayment.rail)}</p>
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-16 text-center space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                  </motion.div>
                  <p className="text-xl font-medium">Recording transaction...</p>
                  <p className="text-muted-foreground">Syncing with RYT Bank</p>
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
                    className="mx-auto w-28 h-28 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-14 w-14 text-green-500" />
                  </motion.div>
                  
                  <div>
                    <p className="text-2xl font-bold text-green-600">Payment Complete!</p>
                    <p className="text-muted-foreground mt-1">{selectedPayment.merchant}</p>
                  </div>
                  
                  <div className="text-5xl font-bold">
                    RM {selectedPayment.amount.toFixed(2)}
                  </div>
                  
                  <Card className="bg-muted/30">
                    <CardContent className="py-4">
                      <p className="text-sm text-muted-foreground">New Balance</p>
                      <p className="text-2xl font-semibold">RM {balance?.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  
                  <Button onClick={reset} size="lg" className="gap-2">
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
                  className="text-center space-y-6 py-12"
                >
                  <div className="mx-auto w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  </div>
                  
                  <div>
                    <p className="text-xl font-bold text-destructive">Payment Failed</p>
                    <p className="text-muted-foreground mt-2">{errorMessage}</p>
                  </div>
                  
                  <Button onClick={reset} variant="outline" size="lg">
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flow Steps Indicator */}
            <div className="flex items-center justify-center gap-2 pt-4">
              {['Scan', 'Authorize', 'Done'].map((label, i) => {
                const stepIndex = step === 'idle' ? -1 
                  : step === 'scanning' ? 0 
                  : step === 'scanned' ? 0.5
                  : step === 'authorizing' ? 1 
                  : step === 'processing' ? 1.5
                  : step === 'complete' ? 2 
                  : -1;
                const isActive = i <= stepIndex;
                const isCurrent = Math.floor(stepIndex) === i;
                
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground",
                      isCurrent && "ring-2 ring-primary ring-offset-2"
                    )}>
                      {i + 1}
                    </div>
                    <span className={cn(
                      "text-sm",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {label}
                    </span>
                    {i < 2 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: API Logs */}
        <div className="flex-1 flex flex-col bg-muted/30 min-h-[300px] lg:min-h-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'logs' | 'spec')} className="flex flex-col h-full">
            <div className="border-b px-4 py-2 flex items-center justify-between bg-background">
              <TabsList className="h-9">
                <TabsTrigger value="logs" className="gap-1.5 text-xs">
                  <Terminal className="h-3.5 w-3.5" />
                  Live API Logs
                </TabsTrigger>
                <TabsTrigger value="spec" className="gap-1.5 text-xs">
                  <Code2 className="h-3.5 w-3.5" />
                  API Spec
                </TabsTrigger>
              </TabsList>
              {activeTab === 'logs' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearLogs}
                  className="text-xs h-7"
                >
                  Clear
                </Button>
              )}
            </div>

            <TabsContent value="logs" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3 font-mono text-sm">
                  {apiLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Terminal className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p>API calls will appear here</p>
                      <p className="text-xs mt-1">Select a payment to start the demo</p>
                    </div>
                  ) : (
                    apiLogs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "rounded-lg p-3 border",
                          log.type === 'request' 
                            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
                            : log.status && log.status >= 400
                              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                              : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {log.type === 'request' ? (
                              <ArrowUpRight className="h-4 w-4 text-blue-500" />
                            ) : (
                              <ArrowDownLeft className={cn(
                                "h-4 w-4",
                                log.status && log.status >= 400 ? "text-red-500" : "text-green-500"
                              )} />
                            )}
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              log.method === 'GET' ? "border-green-500 text-green-600" : "border-blue-500 text-blue-600"
                            )}>
                              {log.method}
                            </Badge>
                            <code className="text-xs">/mock-bank-api/{log.endpoint}</code>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {log.status && (
                              <Badge variant={log.status >= 400 ? "destructive" : "secondary"} className="text-xs">
                                {log.status}
                              </Badge>
                            )}
                            {log.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {log.duration}ms
                              </span>
                            )}
                          </div>
                        </div>
                        {log.body && (
                          <pre className="text-xs bg-background/50 rounded p-2 overflow-x-auto">
                            {JSON.stringify(log.body, null, 2)}
                          </pre>
                        )}
                      </motion.div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="spec" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      API Endpoints Used
                    </h3>
                    <div className="space-y-3 font-mono">
                      <div className="bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="border-green-500 text-green-600 text-xs">GET</Badge>
                          <code>/balance</code>
                        </div>
                        <p className="text-xs text-muted-foreground">Fetch real-time account balance</p>
                      </div>
                      
                      <div className="flex justify-center">
                        <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">POST</Badge>
                          <code>/payments/initiate</code>
                        </div>
                        <p className="text-xs text-muted-foreground">Start payment, returns authorization challenge if amount &gt; RM50</p>
                      </div>
                      
                      <div className="flex justify-center">
                        <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="bg-background rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">POST</Badge>
                          <code>/payments/:id/authorize</code>
                        </div>
                        <p className="text-xs text-muted-foreground">Complete 2FA with biometric signature</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Security Features</h3>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• OAuth 2.0 + PKCE authentication</li>
                      <li>• Biometric authorization for payments &gt; RM50</li>
                      <li>• Idempotency keys prevent duplicates</li>
                      <li>• Real-time balance validation</li>
                      <li>• Daily transaction limits</li>
                    </ul>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Response Times</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-background rounded p-2 border">
                        <p className="text-muted-foreground">Balance API</p>
                        <p className="font-mono font-medium">&lt; 200ms</p>
                      </div>
                      <div className="bg-background rounded p-2 border">
                        <p className="text-muted-foreground">Payment API</p>
                        <p className="font-mono font-medium">&lt; 500ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
