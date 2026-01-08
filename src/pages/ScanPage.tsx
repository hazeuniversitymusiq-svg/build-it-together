/**
 * FLOW Scan Page - Phase 3
 * 
 * Scan → Add to Queue → Resolve
 */

import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QrCode, Camera, Trash2, ChevronRight, Store, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createIntentFromQR } from "@/lib/core/intent-creators";
import { useNativeCameraSurface } from "@/hooks/useNativeCameraSurface";

interface QRPayload {
  id: string;
  merchant_name: string | null;
  amount: number | null;
  reference_id: string | null;
  rails_available: string[];
}

const ScanPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { simulateNativeScan, isPending: isNativePending } = useNativeCameraSurface();
  
  const [qrPayloads, setQrPayloads] = useState<QRPayload[]>([]);
  const [queue, setQueue] = useState<QRPayload[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorUrl, setSimulatorUrl] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadQRPayloads = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      // Fetch seeded QR payloads for prototype mode
      const { data } = await supabase
        .from("qr_payloads")
        .select("id, merchant_name, amount, reference_id, rails_available")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setQrPayloads(data.map(qr => ({
          ...qr,
          rails_available: Array.isArray(qr.rails_available) 
            ? qr.rails_available as string[]
            : []
        })));
      }
    };

    loadQRPayloads();
  }, [navigate]);

  const addToQueue = (qr: QRPayload) => {
    // Check if already in queue
    if (queue.some(q => q.id === qr.id)) {
      toast({ title: "Already in queue" });
      return;
    }
    setQueue(prev => [...prev, qr]);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const handleResolve = async () => {
    if (queue.length === 0 || !userId) return;

    setIsResolving(true);

    // Take the latest (last added) QR from queue
    const latestQR = queue[queue.length - 1];

    // Create intent from QR
    const result = await createIntentFromQR(userId, latestQR.id);

    if (!result.success || !result.intentId) {
      toast({ 
        title: "Failed to create payment", 
        description: result.error,
        variant: "destructive" 
      });
      setIsResolving(false);
      return;
    }

    // Remove from queue
    setQueue(prev => prev.filter(q => q.id !== latestQR.id));

    // Navigate to resolve screen with intent ID
    navigate(`/resolve/${result.intentId}`);
  };

  const isInQueue = (qrId: string) => queue.some(q => q.id === qrId);

  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16 pb-2"
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Scan to Pay
        </h1>
      </motion.div>

      {/* Helper */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-muted-foreground mb-6"
      >
        Scan a QR code or choose one from your gallery.
      </motion.p>

      {/* Native Camera Surface Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">Native Camera Ready</p>
            <p className="text-xs text-muted-foreground mt-1">
              Scan any FLOW QR with your device camera. FLOW will open automatically.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Simulate Native Scan (Prototype) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mb-8"
      >
        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ExternalLink className="w-4 h-4" />
          Simulate native camera scan
        </button>
        
        <AnimatePresence>
          {showSimulator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <Input
                placeholder="flow://pay/merchant-name/12.50"
                value={simulatorUrl}
                onChange={(e) => setSimulatorUrl(e.target.value)}
                className="h-12 rounded-xl"
              />
              <Button
                onClick={() => {
                  if (simulatorUrl) {
                    simulateNativeScan(simulatorUrl);
                    setSimulatorUrl("");
                    setShowSimulator(false);
                  }
                }}
                disabled={!simulatorUrl || isNativePending}
                className="w-full rounded-xl"
              >
                {isNativePending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Simulate Scan"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Example: flow://pay/kopi-corner/6.50/KC-001
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* QR Gallery Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-medium text-foreground">QR gallery</h2>
          <Badge variant="secondary" className="text-xs">Prototype only</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {qrPayloads.map((qr, index) => (
            <motion.button
              key={qr.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              onClick={() => addToQueue(qr)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                isInQueue(qr.id)
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                <Store className="w-5 h-5 text-accent" />
              </div>
              <p className="font-medium text-foreground text-sm truncate">
                {qr.merchant_name || "Unknown"}
              </p>
              <p className="text-lg font-semibold text-foreground">
                RM {qr.amount?.toFixed(2) || "0.00"}
              </p>
            </motion.button>
          ))}
        </div>

        {qrPayloads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No QR codes available</p>
          </div>
        )}
      </motion.div>

      {/* Queue Section */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">Queue</h2>
              <Badge variant="outline">{queue.length}</Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              You can scan multiple codes, then resolve one by one.
            </p>

            <div className="space-y-2 mb-6">
              {queue.map((qr, index) => (
                <motion.div
                  key={qr.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Store className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {qr.merchant_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        RM {qr.amount?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="py-6 space-y-3 mt-auto"
      >
        <Button
          onClick={handleResolve}
          disabled={queue.length === 0 || isResolving}
          className="w-full h-14 text-base font-medium rounded-2xl"
        >
          Resolve now
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear queue
          </button>
        )}
      </motion.div>
    </div>
  );
});
ScanPage.displayName = "ScanPage";

export default ScanPage;
