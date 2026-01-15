import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4f80439d456c47d48afef4444d0b35a2',
  appName: 'FLOW',
  webDir: 'dist',
  server: {
    url: 'https://4f80439d-456c-47d4-8afe-f4444d0b35a2.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    // Deep links and URL schemes
    App: {
      // Register URL schemes that FLOW handles
      // When native camera scans a flow:// QR, it opens FLOW
    },
    // Push notifications configuration
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Haptics configuration (uses system defaults)
    Haptics: {},
    // Network status monitoring
    Network: {},
  },
  // Android configuration
  android: {
    appendUserAgent: 'FLOW-App',
    // Enable cleartext traffic for development
    allowMixedContent: true,
  },
  // iOS configuration
  ios: {
    appendUserAgent: 'FLOW-App',
    scheme: 'flow',
  },
};

export default config;
