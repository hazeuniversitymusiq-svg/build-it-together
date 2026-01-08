/**
 * Deep Link Handler Hook - Payment Surface
 * 
 * Handles flow:// URLs and payment deep links.
 * Parses link parameters and creates intents.
 * Always hands off to FLOW journey.
 */

import { useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeepLinkData {
  type: "pay" | "request" | "scan";
  merchantName?: string;
  amount?: number;
  reference?: string;
  requestId?: string;
  railsAvailable?: string[];
}

/**
 * Parses a deep link URL and extracts payment data
 */
const parseDeepLink = (url: string): DeepLinkData | null => {
  try {
    // Handle flow:// protocol
    if (url.startsWith("flow://")) {
      const path = url.replace("flow://", "");
      const parts = path.split("/");
      
      if (parts[0] === "pay" && parts.length >= 3) {
        // flow://pay/merchant-name/amount
        return {
          type: "pay",
          merchantName: parts[1].replace(/-/g, " "),
          amount: parseFloat(parts[2]) || 0,
          reference: parts[3],
          railsAvailable: ["TouchNGo", "DuitNow", "GrabPay"],
        };
      }
      
      if (parts[0] === "request" && parts[1]) {
        // flow://request/request-id
        return {
          type: "request",
          requestId: parts[1],
        };
      }

      if (parts[0] === "scan") {
        return { type: "scan" };
      }
    }

    // Handle https:// URLs with query params
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;

    if (searchParams.has("request")) {
      return {
        type: "request",
        requestId: searchParams.get("request") || undefined,
      };
    }

    if (searchParams.has("pay")) {
      return {
        type: "pay",
        merchantName: searchParams.get("merchant") || undefined,
        amount: parseFloat(searchParams.get("amount") || "0"),
        reference: searchParams.get("ref") || undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
};

export const useDeepLink = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const handleDeepLink = useCallback(async (linkData: DeepLinkData) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Store deep link for after auth
      sessionStorage.setItem("pendingDeepLink", JSON.stringify(linkData));
      navigate("/auth");
      return;
    }

    try {
      if (linkData.type === "scan") {
        navigate("/scan");
        return;
      }

      if (linkData.type === "request" && linkData.requestId) {
        // Fetch the original request intent
        const { data: originalIntent } = await supabase
          .from("intents")
          .select("*")
          .eq("id", linkData.requestId)
          .single();

        if (!originalIntent) {
          toast({
            title: "Request not found",
            description: "This payment request no longer exists",
            variant: "destructive",
          });
          navigate("/home");
          return;
        }

        // Create a SendMoney intent for the payer
        const { data: intent, error } = await supabase
          .from("intents")
          .insert({
            user_id: user.id,
            type: "SendMoney",
            amount: originalIntent.amount,
            currency: originalIntent.currency,
            payee_name: originalIntent.payee_name,
            payee_identifier: originalIntent.payee_identifier,
            metadata: {
              source: "deep_link",
              originalRequestId: linkData.requestId,
              railsAvailable: ["TouchNGo", "GrabPay", "DuitNow"],
            },
          })
          .select("id")
          .single();

        if (error || !intent) {
          throw new Error("Failed to create payment");
        }

        navigate(`/resolve/${intent.id}`);
        return;
      }

      if (linkData.type === "pay" && linkData.merchantName) {
        // Create PayMerchant intent
        const { data: intent, error } = await supabase
          .from("intents")
          .insert({
            user_id: user.id,
            type: "PayMerchant",
            amount: linkData.amount || 0,
            currency: "MYR",
            payee_name: linkData.merchantName,
            payee_identifier: linkData.reference || linkData.merchantName,
            metadata: {
              source: "deep_link",
              reference: linkData.reference,
              railsAvailable: linkData.railsAvailable || ["TouchNGo", "DuitNow"],
            },
          })
          .select("id")
          .single();

        if (error || !intent) {
          throw new Error("Failed to create payment");
        }

        navigate(`/resolve/${intent.id}`);
        return;
      }

      // Unknown link type
      navigate("/home");
    } catch (error) {
      console.error("Deep link error:", error);
      toast({
        title: "Error",
        description: "Failed to process payment link",
        variant: "destructive",
      });
      navigate("/home");
    }
  }, [navigate, toast]);

  // Check for pending deep links after auth
  useEffect(() => {
    const checkPendingDeepLink = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const pendingLink = sessionStorage.getItem("pendingDeepLink");
      if (pendingLink) {
        sessionStorage.removeItem("pendingDeepLink");
        const linkData = JSON.parse(pendingLink) as DeepLinkData;
        await handleDeepLink(linkData);
      }
    };

    checkPendingDeepLink();
  }, [handleDeepLink]);

  // Check URL search params for deep links
  useEffect(() => {
    const requestId = searchParams.get("request");
    const payMerchant = searchParams.get("pay");

    if (requestId) {
      handleDeepLink({ type: "request", requestId });
    } else if (payMerchant) {
      handleDeepLink({
        type: "pay",
        merchantName: searchParams.get("merchant") || payMerchant,
        amount: parseFloat(searchParams.get("amount") || "0"),
        reference: searchParams.get("ref") || undefined,
      });
    }
  }, [searchParams, handleDeepLink]);

  return {
    parseDeepLink,
    handleDeepLink,
  };
};

export default useDeepLink;
