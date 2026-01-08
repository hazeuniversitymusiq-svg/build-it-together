/**
 * Native Camera Surface Hook - Payment Surface A
 * 
 * Handles QR scans from the native device camera.
 * When a QR is recognized as a payment intent, invokes FLOW.
 * 
 * Rules:
 * - Does NOT bypass Resolve
 * - Does NOT bypass Confirm
 * - Uses existing CreateIntentFromQR logic
 * - Routes user to Resolve screen
 */

import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, URLOpenListenerEvent } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NativeCameraState {
  isInitialized: boolean;
  lastScannedUrl: string | null;
  isPending: boolean;
}

interface ParsedQRData {
  type: "payment" | "unknown";
  merchantName?: string;
  amount?: number;
  referenceId?: string;
  railsAvailable?: string[];
  rawPayload: string;
}

/**
 * Parse a QR code payload to determine if it's a FLOW payment
 */
const parseQRPayload = (url: string): ParsedQRData => {
  try {
    // Handle flow:// protocol
    // Format: flow://pay/merchant-name/amount/reference
    if (url.startsWith("flow://pay/")) {
      const path = url.replace("flow://pay/", "");
      const parts = path.split("/");
      
      return {
        type: "payment",
        merchantName: decodeURIComponent(parts[0]?.replace(/-/g, " ") || ""),
        amount: parseFloat(parts[1]) || 0,
        referenceId: parts[2] || undefined,
        railsAvailable: ["TouchNGo", "DuitNow", "GrabPay"],
        rawPayload: url,
      };
    }

    // Handle DuitNow QR format (example)
    if (url.includes("duitnow://")) {
      // Parse DuitNow specific format
      const params = new URLSearchParams(url.split("?")[1]);
      return {
        type: "payment",
        merchantName: params.get("name") || "DuitNow Merchant",
        amount: parseFloat(params.get("amount") || "0"),
        referenceId: params.get("ref") || undefined,
        railsAvailable: ["DuitNow"],
        rawPayload: url,
      };
    }

    // Handle generic payment URL with query params
    if (url.includes("?")) {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      if (params.has("pay") || params.has("amount")) {
        return {
          type: "payment",
          merchantName: params.get("merchant") || params.get("name") || "Merchant",
          amount: parseFloat(params.get("amount") || "0"),
          referenceId: params.get("ref") || params.get("reference") || undefined,
          railsAvailable: ["TouchNGo", "DuitNow"],
          rawPayload: url,
        };
      }
    }

    return { type: "unknown", rawPayload: url };
  } catch {
    return { type: "unknown", rawPayload: url };
  }
};

/**
 * Check if user has completed FLOW onboarding
 */
const checkUserOnboarded = async (): Promise<{ isOnboarded: boolean; userId?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { isOnboarded: false };
  }

  // Check if user has active identity status
  const { data: userData } = await supabase
    .from("users")
    .select("identity_status")
    .eq("id", user.id)
    .single();

  if (!userData || userData.identity_status !== "active") {
    return { isOnboarded: false, userId: user.id };
  }

  return { isOnboarded: true, userId: user.id };
};

/**
 * Update payment surface usage tracking
 */
const trackSurfaceUsage = async (userId: string) => {
  await supabase
    .from("payment_surfaces")
    .upsert({
      user_id: userId,
      surface_type: "camera",
      enabled: true,
      last_used_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,surface_type",
    });
};

export const useNativeCameraSurface = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<NativeCameraState>({
    isInitialized: false,
    lastScannedUrl: null,
    isPending: false,
  });

  /**
   * Handle incoming QR scan from native camera
   */
  const handleNativeQRScan = useCallback(async (qrData: ParsedQRData) => {
    if (qrData.type !== "payment") {
      toast({
        title: "Unrecognized QR",
        description: "This QR code is not a payment request",
      });
      return;
    }

    setState(prev => ({ ...prev, isPending: true }));

    try {
      // Check if user is onboarded
      const { isOnboarded, userId } = await checkUserOnboarded();

      if (!isOnboarded || !userId) {
        // Store pending payment for after onboarding
        sessionStorage.setItem("pendingNativeQR", JSON.stringify(qrData));
        
        toast({
          title: "Complete setup first",
          description: "Please complete FLOW onboarding to make payments",
        });
        
        navigate(userId ? "/flow-identity" : "/auth");
        return;
      }

      // Track surface usage
      await trackSurfaceUsage(userId);

      // Create intent from scanned QR
      const { data: intent, error } = await supabase
        .from("intents")
        .insert({
          user_id: userId,
          type: "PayMerchant",
          amount: qrData.amount || 0,
          currency: "MYR",
          payee_name: qrData.merchantName || "Merchant",
          payee_identifier: qrData.referenceId || qrData.merchantName || "",
          metadata: {
            source: "native_camera",
            rawPayload: qrData.rawPayload,
            railsAvailable: qrData.railsAvailable || ["TouchNGo", "DuitNow"],
          },
        })
        .select("id")
        .single();

      if (error || !intent) {
        throw new Error("Failed to create payment intent");
      }

      // Store QR payload for reference
      await supabase.from("qr_payloads").insert({
        user_id: userId,
        raw_payload: qrData.rawPayload,
        merchant_name: qrData.merchantName,
        amount: qrData.amount,
        reference_id: qrData.referenceId,
        rails_available: qrData.railsAvailable || [],
      });

      toast({
        title: "Payment detected",
        description: `${qrData.merchantName} • RM ${(qrData.amount || 0).toFixed(2)}`,
      });

      // Route to Resolve screen (never bypass)
      navigate(`/resolve/${intent.id}`);
    } catch (error) {
      console.error("Native camera scan error:", error);
      toast({
        title: "Scan failed",
        description: "Could not process the payment QR",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isPending: false }));
    }
  }, [navigate, toast]);

  /**
   * Handle app URL open event (deep link from QR scan)
   */
  const handleAppUrlOpen = useCallback((event: URLOpenListenerEvent) => {
    const url = event.url;
    
    setState(prev => ({ ...prev, lastScannedUrl: url }));
    
    // Parse the QR payload
    const qrData = parseQRPayload(url);
    
    // Process the payment
    handleNativeQRScan(qrData);
  }, [handleNativeQRScan]);

  /**
   * Initialize native app listeners
   */
  useEffect(() => {
    let appUrlListener: { remove: () => void } | null = null;

    const initializeListeners = async () => {
      try {
        // Listen for app URL open events (deep links from QR scans)
        appUrlListener = await App.addListener("appUrlOpen", handleAppUrlOpen);
        
        setState(prev => ({ ...prev, isInitialized: true }));

        // Check for pending QR from before onboarding
        const pendingQR = sessionStorage.getItem("pendingNativeQR");
        if (pendingQR) {
          sessionStorage.removeItem("pendingNativeQR");
          const qrData = JSON.parse(pendingQR) as ParsedQRData;
          handleNativeQRScan(qrData);
        }
      } catch (error) {
        // App plugin not available (web environment)
        console.log("Native app listeners not available (web environment)");
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeListeners();

    return () => {
      appUrlListener?.remove();
    };
  }, [handleAppUrlOpen, handleNativeQRScan]);

  /**
   * Manual trigger for simulating native camera scan (prototype mode)
   */
  const simulateNativeScan = useCallback((url: string) => {
    const qrData = parseQRPayload(url);
    handleNativeQRScan(qrData);
  }, [handleNativeQRScan]);

  return {
    isInitialized: state.isInitialized,
    isPending: state.isPending,
    lastScannedUrl: state.lastScannedUrl,
    simulateNativeScan,
    parseQRPayload,
  };
};

export default useNativeCameraSurface;
