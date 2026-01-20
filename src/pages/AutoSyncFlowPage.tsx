/**
 * FLOW Auto Sync Flow Page
 * 
 * Multi-screen connection wizard following the production-ready spec:
 * 
 * Screen 1: Select Your Apps
 * Screen 2: OAuth Authentication (coming)
 * Screen 3: Consent Confirmation (coming)
 * Screen 4: Success Summary (coming)
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoSyncSelectApps } from '@/components/autosync';
import { supabase } from '@/integrations/supabase/client';

type FlowScreen = 'select' | 'auth' | 'consent' | 'success';

export default function AutoSyncFlowPage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<FlowScreen>('select');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [alreadyConnected, setAlreadyConnected] = useState<string[]>([]);
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

  // Handle screen 1 completion
  const handleAppsSelected = useCallback((apps: string[]) => {
    setSelectedApps(apps);
    
    // For now, navigate to home with the apps
    // In future, move to OAuth screen
    navigate('/home', { state: { connectApps: apps } });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  // Render current screen
  switch (screen) {
    case 'select':
      return (
        <AutoSyncSelectApps
          onContinue={handleAppsSelected}
          alreadyConnected={alreadyConnected}
        />
      );
    
    // Future screens will be added here
    default:
      return (
        <AutoSyncSelectApps
          onContinue={handleAppsSelected}
          alreadyConnected={alreadyConnected}
        />
      );
  }
}
