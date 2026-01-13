import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'app.lovable.4f80439d456c47d48afef4444d0b35a2',
  appName: 'FLOW',
  webDir: 'dist',
  // For native testing, we default to bundled web assets (dist).
  // If you want live-reload, set CAP_SERVER_URL (e.g. http://localhost:8080)
  ...(liveReloadUrl
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: true,
        },
      }
    : {}),
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
