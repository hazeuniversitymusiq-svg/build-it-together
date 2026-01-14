import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { toast } from 'sonner';

// For native apps, we use a web redirect that's allowed in the backend
// The app will intercept this URL when it opens via universal link handling
const NATIVE_OAUTH_REDIRECT = 'flow://auth/callback';
const WEB_OAUTH_REDIRECT = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth`;

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
      // For native, we use skipBrowserRedirect and open in-app browser
      // The redirect goes to the web URL, but the in-app browser stays open
      // and we can detect when the URL changes to include auth tokens
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: WEB_OAUTH_REDIRECT,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { error };
      if (!data?.url) return { error: new Error('Missing OAuth URL') as any };

      try {
        // Open in-app browser for OAuth
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

    // Web
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: WEB_OAUTH_REDIRECT,
      },
    });
    return { error };
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
