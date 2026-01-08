import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flow.app',
  appName: 'FLOW',
  webDir: 'dist',
  server: {
    url: 'https://4f80439d-456c-47d4-8afe-f4444d0b35a2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  // Deep link configuration for native camera QR scans
  plugins: {
    App: {
      // Register URL schemes that FLOW handles
      // When native camera scans a flow:// QR, it opens FLOW
    }
  },
  // Android deep link configuration
  android: {
    appendUserAgent: 'FLOW-App',
  },
  // iOS deep link configuration  
  ios: {
    appendUserAgent: 'FLOW-App',
  }
};

export default config;
