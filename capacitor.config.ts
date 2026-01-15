import type { CapacitorConfig } from '@capacitor/cli';

// Native builds should load bundled web assets from /dist.
// (Live reload can be added later, but keeping this off avoids white-screen issues
// caused by a stale CAP_SERVER_URL pointing at an unreachable/locked page.)
const config: CapacitorConfig = {
  appId: 'app.lovable.flow4f80439d456c47d48afef4444d0b35a2',
  appName: 'FLOW',
  webDir: 'dist',
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
