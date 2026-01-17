/**
 * QR Scanner Component
 * 
 * iOS 26 Liquid Glass design - aurora gradient frame, frosted overlays
 * Real camera-based QR code scanner using html5-qrcode.
 * 
 * Enhanced with Send & Receive QR code generation (like TnG/DuitNow)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlashlightOff, Flashlight, SwitchCamera, AlertCircle, QrCode, Wallet, ArrowUpRight, ArrowDownLeft, Copy, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import flowIcon from '@/assets/flow-icon.png';

type ScannerMode = 'scan' | 'receive' | 'send';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
  onMyCodePress?: () => void;
}

const QRScanner = ({ onScan, onClose, isOpen }: QRScannerProps) => {
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSimulator, setIsSimulator] = useState(false);
  
  // Mode: scan, receive (my QR), or send (amount QR)
  const [mode, setMode] = useState<ScannerMode>('scan');
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<'DuitNow' | 'TouchNGo' | 'GrabPay'>('DuitNow');
  const [sendAmount, setSendAmount] = useState('');
  const [copied, setCopied] = useState(false);

  // Load user phone for receive QR - fallback to demo number
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('phone')
            .eq('id', user.id)
            .single();
          if (userData?.phone) {
            setUserPhone(userData.phone);
            return;
          }
        }
      } catch (e) {
        console.log('User phone load error:', e);
      }
      // Fallback to demo phone for prototype mode
      setUserPhone('+60 12-345 6789');
    };
    if (isOpen) loadUser();
  }, [isOpen]);

  // Serialize start/stop operations to avoid html5-qrcode state transition errors
  const opQueueRef = useRef<Promise<void>>(Promise.resolve());
  const startSeqRef = useRef(0);

  const enqueueOp = useCallback((op: () => Promise<void>) => {
    opQueueRef.current = opQueueRef.current
      .then(op)
      .catch((e) => {
        console.log('Scanner op error:', e);
      });
    return opQueueRef.current;
  }, []);

  const stopScanner = useCallback(async () => {
    await enqueueOp(async () => {
      const scanner = scannerRef.current;
      if (!scanner) return;

      try {
        const state = scanner.getState();
        // 2 = SCANNING (html5-qrcode internal enum)
        if (state === 2) {
          await scanner.stop();
        }
      } catch (e) {
        console.log('Stop scanner error:', e);
      }

      try {
        // clear() throws if still scanning/transitioning; best-effort only
        // @ts-ignore - clear exists in html5-qrcode
        scanner.clear?.();
      } catch (e) {
        console.log('Clear scanner error:', e);
      }
    });
  }, [enqueueOp]);

  const startScanner = useCallback(async () => {
    if (!isOpen || mode !== 'scan') return;

    const seq = ++startSeqRef.current;
    setIsInitializing(true);
    setError(null);
    setIsSimulator(false);

    await enqueueOp(async () => {
      // Abandon if a newer start/stop request happened
      if (seq !== startSeqRef.current) return;
      if (!isOpen || mode !== 'scan') return;

      try {
        const devices = await navigator.mediaDevices?.enumerateDevices?.();
        const hasCamera = devices?.some(device => device.kind === 'videoinput');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !hasCamera) {
          setIsInitializing(false);
          setIsSimulator(true);
          setError('Camera not available. Use test mode to simulate scans.');
          return;
        }
      } catch {
        // Continue anyway
      }

      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('qr-reader', {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });
        }

        // Stop + clear any prior run before starting
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          console.log('Stop scanner error:', e);
        }

        try {
          // @ts-ignore
          scannerRef.current.clear?.();
        } catch (e) {
          console.log('Clear scanner error:', e);
        }

        if (seq !== startSeqRef.current) return;
        if (!isOpen || mode !== 'scan') return;

        await scannerRef.current.start(
          { facingMode },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            onScan(decodedText);
            // Stop in background (queued) to prevent multi-scan bursts
            stopScanner();
          },
          () => {}
        );

        if (seq !== startSeqRef.current) return;
        setIsInitializing(false);
      } catch (e: any) {
        console.error('Scanner start error:', e);
        setIsInitializing(false);

        const errorStr = e?.toString?.() || '';

        if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission')) {
          setError('Camera permission denied. Please allow camera access.');
        } else if (errorStr.includes('NotFoundError') || errorStr.includes('NotReadableError')) {
          setIsSimulator(true);
          setError('Camera not available. Use test mode to simulate scans.');
        } else if (errorStr.includes('not supported') || errorStr.includes('NotSupportedError')) {
          setIsSimulator(true);
          setError('Camera not supported in this environment. Use test mode.');
        } else {
          setIsSimulator(true);
          setError('Camera unavailable. Use test mode to test scanning.');
        }
      }
    });
  }, [enqueueOp, facingMode, isOpen, mode, onScan, stopScanner]);

  useEffect(() => {
    if (isOpen && mode === 'scan') {
      startScanner();
    } else {
      // Cancel any pending start
      startSeqRef.current += 1;
      setIsInitializing(false);
      stopScanner();
    }

    return () => {
      startSeqRef.current += 1;
      stopScanner();
    };
  }, [isOpen, mode, startScanner, stopScanner]);

  // Reset mode when closing
  useEffect(() => {
    if (!isOpen) {
      setMode('scan');
      setSendAmount('');
    }
  }, [isOpen]);

  const switchCamera = async () => {
    await stopScanner();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const toggleTorch = async () => {
    if (scannerRef.current) {
      try {
        const capabilities = await scannerRef.current.getRunningTrackCapabilities();
        if ('torch' in capabilities) {
          await scannerRef.current.applyVideoConstraints({
            // @ts-ignore
            advanced: [{ torch: !torchOn }]
          });
          setTorchOn(!torchOn);
        }
      } catch (e) {
        console.log('Torch not supported');
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleCopy = async () => {
    const text = mode === 'send' && sendAmount 
      ? `flow://pay?phone=${userPhone}&amount=${sendAmount}`
      : userPhone || '';
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied!", description: "Payment link copied" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && userPhone) {
      try {
        const text = mode === 'send' && sendAmount
          ? `Pay me RM${sendAmount} via FLOW: flow://pay?phone=${userPhone}&amount=${sendAmount}`
          : `Send money to ${userPhone} via ${selectedWallet}`;
        await navigator.share({ title: 'Pay me via FLOW', text });
      } catch (e) {
        // User cancelled
      }
    }
  };

  // Generate QR pattern
  const generateQRPattern = (includeAmount = false) => {
    const size = 180;
    const cells = 9;
    const cellSize = size / cells;
    const pattern: JSX.Element[] = [];
    const seed = (userPhone ? userPhone.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0) + (includeAmount ? parseFloat(sendAmount || '0') * 100 : 0);
    
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const isCorner = (
          (x < 3 && y < 3) ||
          (x >= cells - 3 && y < 3) ||
          (x < 3 && y >= cells - 3)
        );
        const isCornerOuter = isCorner && (x === 0 || x === 2 || x === cells - 1 || x === cells - 3 || y === 0 || y === 2 || y === cells - 1 || y === cells - 3);
        const isCornerInner = isCorner && (x === 1 || x === cells - 2) && (y === 1 || y === cells - 2);
        const shouldFill = isCornerOuter || isCornerInner || ((seed + x * y) % 3 === 0 && !isCorner);
        
        if (shouldFill) {
          pattern.push(
            <rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize - 1} height={cellSize - 1} className="fill-foreground" rx={2} />
          );
        }
      }
    }
    return pattern;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95"
      >
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-0 left-0 right-0 z-30 safe-area-top"
        >
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="w-10 h-10 rounded-full glass-dark text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <span className="text-white font-medium text-lg">
              {mode === 'scan' ? 'Scan QR' : mode === 'receive' ? 'Receive' : 'Request'}
            </span>
            
            <div className="flex gap-2">
              {mode === 'scan' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTorch}
                    className="w-10 h-10 rounded-full glass-dark text-white hover:bg-white/10"
                  >
                    {torchOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={switchCamera}
                    className="w-10 h-10 rounded-full glass-dark text-white hover:bg-white/10"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Mode Tabs - Like TnG/DuitNow */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-20 left-4 right-4 z-30"
        >
          <div className="flex glass-dark rounded-2xl p-1">
            <button
              onClick={() => setMode('scan')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'scan' ? 'bg-white/20 text-white' : 'text-white/60'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Scan
            </button>
            <button
              onClick={() => setMode('receive')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'receive' ? 'bg-white/20 text-white' : 'text-white/60'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Receive
            </button>
            <button
              onClick={() => setMode('send')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'send' ? 'bg-white/20 text-white' : 'text-white/60'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Request
            </button>
          </div>
        </motion.div>

        {/* SCAN MODE */}
        {mode === 'scan' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div id="qr-reader" className="w-full max-w-md" />
              
              {!error && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-72 h-72"
                  >
                    <div className="absolute inset-0 rounded-3xl scanner-frame" />
                    <div className="absolute -top-1 -left-1 w-16 h-16">
                      <div className="absolute top-0 left-0 w-full h-1 aurora-gradient rounded-full shadow-glow-blue" />
                      <div className="absolute top-0 left-0 w-1 h-full aurora-gradient rounded-full shadow-glow-blue" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-16 h-16">
                      <div className="absolute top-0 right-0 w-full h-1 aurora-gradient rounded-full shadow-glow-purple" />
                      <div className="absolute top-0 right-0 w-1 h-full aurora-gradient rounded-full shadow-glow-purple" />
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-16 h-16">
                      <div className="absolute bottom-0 left-0 w-full h-1 aurora-gradient rounded-full shadow-glow-purple" />
                      <div className="absolute bottom-0 left-0 w-1 h-full aurora-gradient rounded-full shadow-glow-purple" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-16 h-16">
                      <div className="absolute bottom-0 right-0 w-full h-1 aurora-gradient rounded-full shadow-glow-blue" />
                      <div className="absolute bottom-0 right-0 w-1 h-full aurora-gradient rounded-full shadow-glow-blue" />
                    </div>
                    <motion.div
                      className="absolute left-4 right-4 h-0.5 aurora-gradient rounded-full shadow-glow-blue"
                      initial={{ top: '8%' }}
                      animate={{ top: ['8%', '88%', '8%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="absolute inset-8 rounded-2xl border border-white/5" />
                  </motion.div>
                </div>
              )}
            </div>

            {isInitializing && (
              <motion.div className="absolute inset-0 flex items-center justify-center glass-dark z-20">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full aurora-gradient opacity-30" />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="absolute inset-1 rounded-full border-2 border-transparent border-t-white" />
                  </div>
                  <p className="text-white/80 font-medium mb-4">Starting camera...</p>
                  <Button 
                    onClick={handleClose} 
                    className="bg-white/20 text-white border border-white/40 hover:bg-white/30 px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div className="absolute inset-0 flex items-center justify-center glass-dark px-8">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <p className="text-white mb-6">{error}</p>
                  <div className="flex flex-col gap-3">
                    {isSimulator ? (
                      <>
                        <Button 
                          onClick={() => {
                            onScan('flow://pay?merchant=TestMerchant&amount=25.00&currency=MYR');
                            handleClose();
                          }} 
                          className="aurora-gradient text-white border-0 shadow-glow-aurora"
                        >
                          Simulate Test Scan
                        </Button>
                        <Button variant="outline" onClick={handleClose} className="text-white border-white/20">
                          Close
                        </Button>
                      </>
                    ) : (
                      <Button onClick={startScanner} className="aurora-gradient text-white border-0 shadow-glow-aurora">
                        Try Again
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div className="absolute bottom-0 left-0 right-0 p-6 safe-area-bottom">
              <p className="text-white/50 text-sm text-center mb-4">Position QR code within the frame</p>
            </motion.div>
          </>
        )}

        {/* RECEIVE MODE - My QR Code */}
        {mode === 'receive' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 pt-36 px-6 flex flex-col items-center"
          >
            {/* Wallet Selector */}
            <div className="flex gap-2 mb-6 w-full max-w-sm">
              {(['DuitNow', 'TouchNGo', 'GrabPay'] as const).map((wallet) => (
                <button
                  key={wallet}
                  onClick={() => setSelectedWallet(wallet)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    selectedWallet === wallet ? 'bg-white text-black' : 'glass-dark text-white/70'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {wallet === 'TouchNGo' ? 'TNG' : wallet}
                </button>
              ))}
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 180 180" className="w-full h-full">
                  {generateQRPattern(false)}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                    <img src={flowIcon} alt="FLOW" className="w-10 h-6 object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-white text-lg font-medium">{userPhone || '+60 *** *** ***'}</p>
              <p className="text-white/50 text-sm mt-1">Scan to pay via {selectedWallet}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 w-full max-w-sm">
              <Button onClick={handleCopy} variant="outline" className="flex-1 h-12 rounded-2xl glass-dark text-white border-white/20">
                {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={handleShare} className="flex-1 h-12 rounded-2xl aurora-gradient text-white border-0">
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>
        )}

        {/* SEND/REQUEST MODE - Amount QR */}
        {mode === 'send' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 pt-36 px-6 flex flex-col items-center"
          >
            {/* Amount Input */}
            <div className="mb-6 w-full max-w-sm">
              <p className="text-white/60 text-sm mb-2 text-center">Request Amount</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-medium text-white/60">RM</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="pl-16 h-16 text-3xl font-semibold text-center rounded-2xl glass-dark border-white/20 text-white"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* QR Code with amount */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 180 180" className="w-full h-full">
                  {generateQRPattern(true)}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                    <img src={flowIcon} alt="FLOW" className="w-10 h-6 object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              {sendAmount && parseFloat(sendAmount) > 0 ? (
                <>
                  <p className="text-white text-2xl font-bold">RM {parseFloat(sendAmount).toFixed(2)}</p>
                  <p className="text-white/50 text-sm mt-1">Scan to pay {userPhone}</p>
                </>
              ) : (
                <p className="text-white/50 text-sm">Enter amount above</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 w-full max-w-sm">
              <Button onClick={handleCopy} variant="outline" className="flex-1 h-12 rounded-2xl glass-dark text-white border-white/20" disabled={!sendAmount}>
                {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={handleShare} className="flex-1 h-12 rounded-2xl aurora-gradient text-white border-0" disabled={!sendAmount}>
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;
