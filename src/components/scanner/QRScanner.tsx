/**
 * QR Scanner Component
 * 
 * iOS 26 Liquid Glass design - aurora gradient frame, frosted overlays
 * Real camera-based QR code scanner using html5-qrcode.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlashlightOff, Flashlight, SwitchCamera, AlertCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner = ({ onScan, onClose, isOpen }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.log('Stop scanner error:', e);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await stopScanner();

      await scannerRef.current.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {}
      );

      setIsInitializing(false);
    } catch (e: any) {
      console.error('Scanner start error:', e);
      setIsInitializing(false);
      
      if (e.toString().includes('NotAllowedError') || e.toString().includes('Permission')) {
        setError('Camera permission denied. Please allow camera access.');
      } else if (e.toString().includes('NotFoundError')) {
        setError('No camera found. Please ensure your device has a camera.');
      } else {
        setError('Failed to start camera. Please try again.');
      }
    }
  }, [facingMode, onScan, stopScanner]);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95"
      >
        {/* Header with glass effect */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-0 left-0 right-0 z-10 safe-area-top"
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
            
            <span className="text-white font-medium text-lg">Scan QR Code</span>
            
            <div className="flex gap-2">
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
            </div>
          </div>
        </motion.div>

        {/* Scanner viewport */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div id="qr-reader" className="w-full max-w-md" />
          
          {/* Aurora gradient scanner frame */}
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative w-72 h-72"
              >
                {/* Aurora gradient border */}
                <div className="absolute inset-0 rounded-3xl scanner-frame" />
                
                {/* Corner accents with glow */}
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
                
                {/* Animated scan line with aurora gradient */}
                <motion.div
                  className="absolute left-4 right-4 h-0.5 aurora-gradient rounded-full shadow-glow-blue"
                  initial={{ top: '8%' }}
                  animate={{ top: ['8%', '88%', '8%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                
                {/* Subtle inner glow */}
                <div className="absolute inset-8 rounded-2xl border border-white/5" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Loading state with glass effect */}
        {isInitializing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center glass-dark"
          >
            <div className="text-center">
              {/* Aurora loading ring */}
              <div className="relative w-16 h-16 mx-auto mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full aurora-gradient opacity-30"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-1 rounded-full border-2 border-transparent border-t-white"
                />
              </div>
              <p className="text-white/80 font-medium">Starting camera...</p>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center glass-dark px-8"
          >
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-white mb-6">{error}</p>
              <Button 
                onClick={startScanner} 
                className="aurora-gradient text-white border-0 shadow-glow-aurora"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        )}

        {/* Footer with My Payment Code button */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 p-6 safe-area-bottom"
        >
          <p className="text-white/50 text-sm text-center mb-4">
            Position QR code within the frame
          </p>
          
          {/* My Payment Code button */}
          <button className="w-full py-4 glass-dark rounded-2xl flex items-center justify-center gap-3 text-white/90 hover:bg-white/10 transition-colors">
            <QrCode className="w-5 h-5" />
            <span className="font-medium">My Payment Code</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;
