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
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type DemoStep = 'idle' | 'scanning' | 'scanned' | 'authorizing' | 'processing' | 'complete' | 'error';

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
}

const DEMO_PAYMENTS: DemoPayment[] = [
  { merchant: 'Ah Seng Mamak', amount: 12.50, qrId: 'DQR001' },
  { merchant: 'Starbucks KLCC', amount: 18.90, qrId: 'DQR002' },
  { merchant: 'Village Park Restaurant', amount: 75.00, qrId: 'DQR003' },
  { merchant: 'Parking MBPJ', amount: 3.00, qrId: 'DQR004' },
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
    
    setStep('processing');
    
    // Initiate payment
    const { data, status } = await loggedFetch('payments/initiate', 'POST', {
      amount: { value: selectedPayment.amount, currency: 'MYR' },
      recipient: { name: selectedPayment.merchant, duitnow_id: selectedPayment.qrId },
      reference: `FLOW-DEMO-${Date.now()}`,
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
    <div className="min-h-screen bg-background">
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
        <div className="flex-1 p-6 overflow-auto border-b lg:border-b-0 lg:border-r">
          <div className="max-w-md mx-auto space-y-6">
            {/* Balance Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      RYT Bank Balance
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      RM {balance?.toFixed(2) ?? '---'}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={fetchBalance}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
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
                  className="space-y-3"
                >
                  <p className="text-sm font-medium text-center text-muted-foreground">
                    Select a QR payment to demo:
                  </p>
                  {DEMO_PAYMENTS.map((payment) => (
                    <Card 
                      key={payment.qrId}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                      onClick={() => startDemo(payment)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <Scan className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{payment.merchant}</p>
                            <p className="text-xs text-muted-foreground">DuitNow QR: {payment.qrId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">RM {payment.amount.toFixed(2)}</p>
                          <ArrowRight className="h-4 w-4 text-primary ml-auto" />
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
                          <span className="text-muted-foreground">Pay from</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Building2 className="h-4 w-4 text-primary" />
                            RYT Bank
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full gap-2 h-12 text-base" 
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
                  className="py-16 text-center space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    {step === 'authorizing' ? (
                      <Fingerprint className="h-12 w-12 text-primary" />
                    ) : (
                      <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                    )}
                  </motion.div>
                  <p className="text-xl font-medium">
                    {step === 'authorizing' ? 'Verifying biometric...' : 'Processing payment...'}
                  </p>
                  <p className="text-muted-foreground">
                    {step === 'authorizing' ? 'Touch sensor to confirm' : 'Connecting to RYT Bank API'}
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
