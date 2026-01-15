import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { toast } from 'sonner';

// Deep-link callback handled by the app (Capacitor appUrlOpen listener)
const NATIVE_OAUTH_REDIRECT = 'flow://auth/callback';

// Web redirect used for browser flows
// Use a dedicated callback route so we can deterministically exchange the code and then route onward.
const WEB_OAUTH_REDIRECT = `${typeof window !== 'undefined' ? window.location.origin : ''}/oauth/callback`;

// Native OAuth needs an HTTPS redirect; we bridge back into the app via this backend function
const NATIVE_OAUTH_BRIDGE_REDIRECT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-bridge`;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const oauthPopupRef = useRef<Window | null>(null);

  const refreshSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // THEN check for existing session
    refreshSession();

    // Listen for app resume (Capacitor) to refresh session
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshSession]);

  // Web (embedded iframe) OAuth receiver:
  // Popup completes OAuth + exchanges code, then posts tokens back to this window.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTokens = async (access_token: string, refresh_token: string) => {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        toast.error(error.message);
        return;
      }

      try {
        oauthPopupRef.current?.close();
      } catch {
        // ignore
      } finally {
        oauthPopupRef.current = null;
      }

      await refreshSession();
    };

    const onWindowMessage = async (event: MessageEvent) => {
      const data = event.data as any;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'FLOW_OAUTH_TOKENS' && data.access_token && data.refresh_token) {
        await handleTokens(String(data.access_token), String(data.refresh_token));
      }

      if (data.type === 'FLOW_OAUTH_ERROR' && data.message) {
        toast.error(String(data.message));
        try {
          oauthPopupRef.current?.close();
        } catch {
          // ignore
        } finally {
          oauthPopupRef.current = null;
        }
      }
    };

    window.addEventListener('message', onWindowMessage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('flow_oauth');
        channel.onmessage = async (ev) => {
          const payload = ev.data as any;
          if (!payload || typeof payload !== 'object') return;

          if (payload.type === 'tokens' && payload.access_token && payload.refresh_token) {
            await handleTokens(String(payload.access_token), String(payload.refresh_token));
          }

          if (payload.type === 'error' && payload.message) {
            toast.error(String(payload.message));
          }
        };
      } catch {
        channel = null;
      }
    }

    return () => {
      window.removeEventListener('message', onWindowMessage);
      try {
        channel?.close();
      } catch {
        // ignore
      }
    };
  }, [refreshSession]);

  // Native OAuth callback handler (deep link)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => void } | null = null;

    // Capacitor listener registration is async
    CapApp.addListener('appUrlOpen', async ({ url }) => {
      // Handle both custom scheme and universal link callbacks
      if (!url) return;

      const isOAuthCallback =
        url.startsWith(NATIVE_OAUTH_REDIRECT) ||
        (url.includes('/auth') && (url.includes('code=') || url.includes('access_token=')));

      if (!isOAuthCallback) return;

      try {
        const parsed = new URL(url);

        // Check for errors
        const errorDescription =
          parsed.searchParams.get('error_description') ||
          parsed.searchParams.get('error') ||
          (parsed.hash && new URLSearchParams(parsed.hash.replace(/^#/, '')).get('error_description'));

        if (errorDescription) {
          toast.error(decodeURIComponent(errorDescription));
          return;
        }

        // PKCE/code flow
        const code = parsed.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            toast.error(error.message);
            return;
          }

          toast.success('Signed in');
          refreshSession();
          return;
        }

        // Fallback: implicit flow (hash tokens)
        const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            toast.error(error.message);
            return;
          }

          toast.success('Signed in');
          refreshSession();
          return;
        }
      } catch (e) {
        console.error('[OAuth callback]', e);
      } finally {
        // Close the in-app browser if it's still open
        await Browser.close().catch(() => undefined);
      }
    }).then((h) => {
      listener = h;
    });

    return () => {
      listener?.remove();
    };
  }, [refreshSession]);

  const signInWithGoogle = async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // On native, we must use an HTTPS redirect (required by the auth backend),
      // then our oauth-bridge function bounces back into the app via flow://.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: NATIVE_OAUTH_BRIDGE_REDIRECT,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { error };
      if (!data?.url) return { error: new Error('Missing OAuth URL') as any };

      try {
        await Browser.open({
          url: data.url,
          windowName: '_self',
        });
        return { error: null };
      } catch (e) {
        return {
          error: (e instanceof Error
            ? e
            : new Error('Failed to open browser. Run `npx cap sync ios` then rebuild in Xcode.')) as any,
        };
      }
    }

    // Web
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    // Normal browser: let the auth client handle the redirect + URL parsing.
    if (!isInIframe) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: WEB_OAUTH_REDIRECT,
        },
      });
      return { error };
    }

    // Embedded previews (iframe): open a popup for Google (Google blocks iframe rendering),
    // then receive tokens via postMessage/BroadcastChannel and set the session in THIS iframe.
    const popupUrl = `${window.location.origin}/oauth/start`;

    try {
      const popup = window.open(
        popupUrl,
        'flow_oauth',
        'popup=yes,width=520,height=680,top=80,left=80,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        return { error: new Error('Popup blocked. Please allow popups and try again.') as any };
      }

      oauthPopupRef.current = popup;
      try {
        popup.focus();
      } catch {
        // ignore
      }

      return { error: null };
    } catch {
      // Fallback: try top navigation (may be blocked by iframe sandbox)
      try {
        window.top?.location.assign(popupUrl);
        return { error: null };
      } catch {
        return { error: new Error('Unable to open sign-in window.') as any };
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    refreshSession,
  };
}
