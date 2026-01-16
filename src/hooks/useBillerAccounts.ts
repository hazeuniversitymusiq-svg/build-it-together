/**
 * Biller Accounts Hook
 * 
 * Unified management for biller accounts - fetch, link, unlink, and pay.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import { billerCatalog, type BillerTemplate } from "@/components/bills/BillerCatalog";
import type { Database } from "@/integrations/supabase/types";

type BillerAccountRow = Database['public']['Tables']['biller_accounts']['Row'];

export interface LinkedBiller {
  id: string;
  billerId: string;
  name: string;
  accountRef: string;
  category: string;
  icon: React.ReactNode;
  gradient: string;
  dueAmount: number;
  dueDate: Date;
  status: "linked" | "unlinked" | "error";
  lastSyncAt: string | null;
}

export const useBillerAccounts = () => {
  const { toast } = useToast();
  const [rawAccounts, setRawAccounts] = useState<BillerAccountRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user and accounts
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from("biller_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "linked");

      if (error) throw error;
      setRawAccounts(data || []);
    } catch (error) {
      console.error("Error fetching biller accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load biller accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Map raw accounts to enriched linked billers
  const linkedBillers = useMemo((): LinkedBiller[] => {
    return rawAccounts.map(account => {
      // Find matching template from catalog
      const template = billerCatalog.find(b => 
        b.name.toLowerCase() === account.biller_name.toLowerCase() ||
        b.id === account.biller_name.toLowerCase().replace(/\s+/g, '-')
      );

      // Generate simulated due info for prototype
      const dueAmount = Math.floor(Math.random() * 150) + 50;
      const dueDate = addDays(new Date(), Math.floor(Math.random() * 14) + 1);

      return {
        id: account.id,
        billerId: template?.id || account.biller_name.toLowerCase(),
        name: account.biller_name,
        accountRef: account.account_reference,
        category: template?.category || "utilities",
        icon: template?.icon || null,
        gradient: template?.gradient || "from-gray-500 to-slate-600",
        dueAmount,
        dueDate,
        status: account.status,
        lastSyncAt: account.last_sync_at,
      };
    });
  }, [rawAccounts]);

  // Get list of linked biller IDs for catalog filtering
  const linkedBillerIds = useMemo(() => {
    return linkedBillers.map(b => b.billerId);
  }, [linkedBillers]);

  // Link a new biller
  const linkBiller = useCallback(async (
    template: BillerTemplate,
    accountRef: string
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from("biller_accounts")
        .insert({
          user_id: userId,
          biller_name: template.name,
          account_reference: accountRef,
          status: "linked",
        });

      if (error) throw error;

      // Refresh accounts
      await fetchAccounts();

      toast({
        title: "✓ Biller linked",
        description: `${template.name} is now active`,
      });

      return true;
    } catch (error) {
      console.error("Error linking biller:", error);
      toast({
        title: "Failed to link",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    }
  }, [userId, fetchAccounts, toast]);

  // Unlink a biller
  const unlinkBiller = useCallback(async (billerId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("biller_accounts")
        .update({ status: "unlinked" })
        .eq("id", billerId);

      if (error) throw error;

      // Refresh accounts
      await fetchAccounts();

      toast({
        title: "Biller unlinked",
        description: "You can re-link anytime",
      });

      return true;
    } catch (error) {
      console.error("Error unlinking biller:", error);
      toast({
        title: "Failed to unlink",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchAccounts, toast]);

  return {
    linkedBillers,
    linkedBillerIds,
    isLoading,
    userId,
    linkBiller,
    unlinkBiller,
    refetch: fetchAccounts,
  };
};
