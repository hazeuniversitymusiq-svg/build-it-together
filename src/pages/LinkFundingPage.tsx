/**
 * Link Funding Page - Real-World Ready
 * 
 * Manual balance entry + statement import.
 * No fake API simulations.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useFundingSources } from '@/hooks/useFundingSources';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManualBalanceEntry } from '@/components/funding/ManualBalanceEntry';
import { StatementImport } from '@/components/funding/StatementImport';
import { 
  Loader2,
  Wallet,
  FileText,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const LinkFundingPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    sources, 
    loading: sourcesLoading, 
    updateBalance, 
    updateLinkedStatus,
    refetch 
  } = useFundingSources();
  
  const [activeTab, setActiveTab] = useState('manual');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleStatementImport = async (data: { balance: number; transactions: unknown[] }) => {
    // Find the first wallet source and update its balance
    const walletSource = sources.find(s => s.type === 'wallet' && s.isLinked);
    if (walletSource) {
      const result = await updateBalance(walletSource.id, data.balance);
      if (result.success) {
        toast.success(`Updated ${walletSource.name} balance to RM ${data.balance.toFixed(2)}`);
        await refetch();
      } else {
        toast.error('Failed to update balance');
      }
    } else {
      toast.info('Link a wallet first to import statement data');
    }
  };

  const handleContinue = () => {
    // Check if at least one source is linked with balance
    const hasLinkedSource = sources.some(s => s.isLinked && s.balance > 0);
    
    if (!hasLinkedSource) {
      toast.info('Consider adding your balances for better payment resolution');
    }
    
    navigate('/auto-sync', { replace: true });
  };

  if (authLoading || sourcesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const linkedCount = sources.filter(s => s.isLinked).length;
  const totalBalance = sources
    .filter(s => s.isLinked)
    .reduce((sum, s) => sum + s.balance, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-aurora-blue/5 flex flex-col px-6 safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Aurora background glow */}
      <div className="absolute top-20 left-0 w-64 h-64 bg-aurora-blue/15 blur-3xl rounded-full" />
      <div className="absolute bottom-60 right-0 w-48 h-48 bg-aurora-purple/10 blur-3xl rounded-full" />
      
      {/* Main content */}
      <div className="flex-1 pt-12 pb-6 max-w-md mx-auto w-full overflow-y-auto relative z-10">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-foreground tracking-tight mb-2"
        >
          Your payment sources
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base text-muted-foreground mb-6"
        >
          Enter your current balances so FLOW can resolve payments accurately.
        </motion.p>

        {/* Summary Card - Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="glass-card p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Available</p>
              <p className="text-2xl font-bold text-foreground">
                RM {totalBalance.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Sources</p>
              <p className="text-lg font-semibold text-aurora-blue">
                {linkedCount} linked
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs: Manual Entry vs Import */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 glass rounded-xl p-1">
              <TabsTrigger value="manual" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">
                <Wallet className="w-4 h-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">
                <FileText className="w-4 h-4" />
                Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-0">
              <ManualBalanceEntry
                sources={sources}
                onUpdateBalance={updateBalance}
                onUpdateLinked={updateLinkedStatus}
              />
            </TabsContent>

            <TabsContent value="import" className="mt-0">
              <StatementImport onImport={handleStatementImport} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Bottom section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="pb-6 max-w-md mx-auto w-full space-y-3 relative z-10"
      >
        <Button
          onClick={handleContinue}
          className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        <button
          onClick={() => navigate('/auto-sync', { replace: true })}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default LinkFundingPage;
