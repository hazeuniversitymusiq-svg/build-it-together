import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flow.app',
  appName: 'FLOW',
  webDir: 'dist',
  server: {
    url: 'https://4f80439d-456c-47d4-8afe-f4444d0b35a2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
