/**
 * FLOW Auto Sync Flow Page
 * 
 * Multi-screen connection wizard following the production-ready spec:
 * 
 * Screen 1: Select Your Apps
 * Screen 2: Connecting Apps (OAuth flow)
 * Screen 3: Consent Confirmation (coming)
 * Screen 4: Success Summary (coming)
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AutoSyncSelectApps, 
  AutoSyncConnecting,
  type AppConnectionStatus 
} from '@/components/autosync';
import { supabase } from '@/integrations/supabase/client';
import { APP_CATALOG } from '@/components/autosync/AutoSyncSelectApps';

type FlowScreen = 'select' | 'connecting' | 'consent' | 'success';

export default function AutoSyncFlowPage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<FlowScreen>('select');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [alreadyConnected, setAlreadyConnected] = useState<string[]>([]);
  const [connectionResults, setConnectionResults] = useState<AppConnectionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing connections
  useEffect(() => {
    const loadExistingConnections = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: connectors } = await supabase
          .from('connectors')
          .select('name')
          .eq('user_id', user.id);
        
        if (connectors) {
          setAlreadyConnected(connectors.map(c => c.name));
        }
      }
      
      setIsLoading(false);
    };

    loadExistingConnections();
  }, []);

  // Handle Screen 1 completion - move to connecting
  const handleAppsSelected = useCallback((apps: string[]) => {
    setSelectedApps(apps);
    setScreen('connecting');
  }, []);

  // Handle Screen 2 completion - save connections and go home
  const handleConnectionComplete = useCallback(async (results: AppConnectionStatus[]) => {
    setConnectionResults(results);
    
    // Save successful connections to database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/home');
      return;
    }

    const successfulApps = results.filter(r => r.state === 'connected');
    
    for (const result of successfulApps) {
      const appConfig = APP_CATALOG.find(a => a.id === result.appId);
      if (!appConfig) continue;

      // Ensure user exists
      await supabase.from('users').upsert({
        id: user.id,
        phone: '+60000000000',
        app_mode: 'Prototype',
        identity_status: 'active',
      }, { onConflict: 'id' });

      // Create connector
      const capabilities: Record<string, boolean> = {};
      if (appConfig.category === 'wallet') {
        capabilities.can_pay_qr = true;
        capabilities.can_p2p = true;
        capabilities.can_receive = true;
      } else if (appConfig.category === 'bank') {
        capabilities.can_transfer = true;
        capabilities.can_fund_topup = true;
      } else if (appConfig.category === 'bnpl') {
        capabilities.can_pay_qr = true;
        capabilities.can_installment = true;
      }

      // Map category to connector type
      const connectorType = appConfig.category === 'wallet' ? 'wallet' 
        : appConfig.category === 'bank' ? 'bank'
        : appConfig.category === 'bnpl' ? 'bnpl'
        : 'biller';

      await supabase.from('connectors').upsert({
        user_id: user.id,
        name: appConfig.name as any,
        type: connectorType,
        status: 'available',
        mode: 'Prototype',
        capabilities,
        last_sync_at: new Date().toISOString(),
      }, { onConflict: 'user_id,name' });

      // Create funding source for payment apps
      if (appConfig.category !== 'biller') {
        const defaultBalances: Record<string, number> = {
          TouchNGo: 85.50,
          GrabPay: 42.00,
          Boost: 25.00,
          DuitNow: 0,
          Maybank: 1250.00,
          CIMB: 890.00,
          PublicBank: 650.00,
          Atome: 1500.00,
          SPayLater: 1000.00,
          GrabPayLater: 800.00,
        };

        const sourceType = appConfig.category === 'wallet' ? 'wallet'
          : appConfig.category === 'bank' ? 'bank'
          : 'bnpl';

        await supabase.from('funding_sources').upsert({
          user_id: user.id,
          name: appConfig.name,
          type: sourceType,
          balance: defaultBalances[appConfig.name] || 100,
          currency: 'MYR',
          priority: appConfig.category === 'wallet' ? 1 : appConfig.category === 'bank' ? 5 : 10,
          linked_status: 'linked',
          available: true,
        }, { onConflict: 'user_id,name' });
      }
    }

    // Navigate to home
    navigate('/home');
  }, [navigate]);

  // Handle back from connecting screen
  const handleBackFromConnecting = useCallback(() => {
    setScreen('select');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full"
        />
      </div>
    );
  }

  // Render current screen with transitions
  return (
    <AnimatePresence mode="wait">
      {screen === 'select' && (
        <motion.div
          key="select"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <AutoSyncSelectApps
            onContinue={handleAppsSelected}
            alreadyConnected={alreadyConnected}
          />
        </motion.div>
      )}
      
      {screen === 'connecting' && (
        <motion.div
          key="connecting"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <AutoSyncConnecting
            selectedApps={selectedApps}
            onComplete={handleConnectionComplete}
            onBack={handleBackFromConnecting}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
