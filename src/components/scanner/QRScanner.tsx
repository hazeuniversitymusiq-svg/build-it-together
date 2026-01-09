/**
 * QR Scanner Component
 * 
 * Real camera-based QR code scanner using html5-qrcode.
 * Works on mobile browsers and desktop with webcam.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, FlashlightOff, Flashlight, SwitchCamera, AlertCircle } from 'lucide-react';
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
        if (state === 2) { // SCANNING
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
      // Create scanner instance
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      // Stop any existing scan
      await stopScanner();

      // Start scanning
      await scannerRef.current.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // Error callback (scan failures, not errors)
        }
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

  // Initialize scanner when opened
  useEffect(() => {
    if (isOpen) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  // Handle camera switch
  const switchCamera = async () => {
    await stopScanner();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Toggle torch (if supported)
  const toggleTorch = async () => {
    if (scannerRef.current) {
      try {
        const capabilities = await scannerRef.current.getRunningTrackCapabilities();
        if ('torch' in capabilities) {
          await scannerRef.current.applyVideoConstraints({
            // @ts-ignore - torch is valid but not in types
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
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-area-top">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <span className="text-white font-medium">Scan QR Code</span>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTorch}
              className="text-white hover:bg-white/20"
            >
              {torchOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="text-white hover:bg-white/20"
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scanner viewport */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div id="qr-reader" className="w-full max-w-md" />
          
          {/* Scanning overlay */}
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {/* Scanning line animation */}
                <motion.div
                  className="absolute left-4 right-4 h-0.5 bg-primary"
                  initial={{ top: '10%' }}
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-white">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 px-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-white mb-4">{error}</p>
              <Button onClick={startScanner} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div className="absolute bottom-0 left-0 right-0 p-6 safe-area-bottom text-center">
          <p className="text-white/70 text-sm">
            Point at any DuitNow, Touch'n'Go, or payment QR code
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;
