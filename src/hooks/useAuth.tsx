import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { toast } from 'sonner';

// Deep-link callback handled by the app (Capacitor appUrlOpen listener)
const NATIVE_OAUTH_REDIRECT = 'flow://auth/callback';

// Web redirect used for browser flows
const WEB_OAUTH_REDIRECT = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth`;

// Native OAuth needs an HTTPS redirect; we bridge back into the app via this backend function
const NATIVE_OAUTH_BRIDGE_REDIRECT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-bridge`;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Native OAuth callback handler (deep link)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => void } | null = null;

    // Capacitor listener registration is async
    CapApp.addListener('appUrlOpen', async ({ url }) => {
      // Handle both custom scheme and universal link callbacks
      if (!url) return;
      
      const isOAuthCallback = url.startsWith(NATIVE_OAUTH_REDIRECT) || 
                               url.includes('/auth') && (url.includes('code=') || url.includes('access_token='));
      
      if (!isOAuthCallback) return;

      try {
        const parsed = new URL(url);

        // Check for errors
        const errorDescription =
          parsed.searchParams.get('error_description') || 
          parsed.searchParams.get('error') ||
          parsed.hash && new URLSearchParams(parsed.hash.replace(/^#/, '')).get('error_description');

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
            : new Error(
                'Failed to open browser. Run `npx cap sync ios` then rebuild in Xcode.'
              )) as any,
        };
      }
    }

    // Web (also works reliably inside embedded previews)
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    // In embedded previews we must complete OAuth in a separate window/tab.
    // We redirect that window back to /oauth/callback, which will broadcast the result
    // back to this page (so the user ends up signed in *here*).
    const redirectTo = isInIframe
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/oauth/callback`
      : WEB_OAUTH_REDIRECT;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // Handle navigation ourselves so the flow works even when the app is
        // embedded (OAuth providers often block running inside iframes).
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };
    if (!data?.url) return { error: new Error('Missing OAuth URL') as any };

    // Embedded: open a new window and wait for /oauth/callback to report back.
    if (isInIframe) {
      const oauthUrl = data.url;
      const timeoutMs = 2 * 60 * 1000;

      const result = await new Promise<{ ok: true } | { ok: false; message: string }>((resolve) => {
        let settled = false;
        let popup: Window | null = null;
        const cleanups: Array<() => void> = [];

        const finish = (r: { ok: true } | { ok: false; message: string }) => {
          if (settled) return;
          settled = true;
          for (const fn of cleanups) {
            try {
              fn();
            } catch {
              // ignore
            }
          }
          resolve(r);
        };

        const openPopup = (features: string) => window.open(oauthUrl, '_blank', features);

        // Prefer BroadcastChannel (works even when the popup is opened with noopener)
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const channel = new BroadcastChannel('flow_oauth');
            cleanups.push(() => channel.close());

            channel.onmessage = (event) => {
              const data = event.data as any;
              if (!data || typeof data !== 'object') return;

              if (data.type === 'done') {
                finish({ ok: true });
              } else if (data.type === 'error') {
                finish({ ok: false, message: String(data.message ?? 'Google sign-in failed') });
              }
            };

            popup = openPopup('noopener,noreferrer');
            if (!popup) {
              finish({ ok: false, message: 'Popup blocked. Please allow popups, then try again.' });
              return;
            }

            const poll = window.setInterval(() => {
              if (popup && popup.closed) {
                finish({ ok: false, message: 'Sign-in window was closed.' });
              }
            }, 400);
            cleanups.push(() => window.clearInterval(poll));

            const timer = window.setTimeout(() => {
              finish({ ok: false, message: 'Timed out waiting for Google sign-in.' });
            }, timeoutMs);
            cleanups.push(() => window.clearTimeout(timer));

            return;
          } catch {
            // fall through to postMessage fallback
          }
        }

        // Fallback (older browsers): requires opener, so we do NOT use noopener here
        const origin = window.location.origin;
        const onMessage = (event: MessageEvent) => {
          if (event.origin !== origin) return;
          const data = event.data as any;
          if (!data || typeof data !== 'object') return;

          if (data.type === 'FLOW_OAUTH_DONE') {
            finish({ ok: true });
          } else if (data.type === 'FLOW_OAUTH_ERROR') {
            finish({ ok: false, message: String(data.message ?? 'Google sign-in failed') });
          }
        };

        window.addEventListener('message', onMessage);
        cleanups.push(() => window.removeEventListener('message', onMessage));

        popup = openPopup('');
        if (!popup) {
          finish({ ok: false, message: 'Popup blocked. Please allow popups, then try again.' });
          return;
        }

        const poll = window.setInterval(() => {
          if (popup && popup.closed) {
            finish({ ok: false, message: 'Sign-in window was closed.' });
          }
        }, 400);
        cleanups.push(() => window.clearInterval(poll));

        const timer = window.setTimeout(() => {
          finish({ ok: false, message: 'Timed out waiting for Google sign-in.' });
        }, timeoutMs);
        cleanups.push(() => window.clearTimeout(timer));
      });

      if (!result.ok) return { error: new Error('message' in result ? result.message : 'Google sign-in failed') as any };

      toast.success('Signed in');
      await refreshSession();
      return { error: null };
    }

    // Top-level web: navigate normally
    window.location.assign(data.url);
    return { error: null };
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
