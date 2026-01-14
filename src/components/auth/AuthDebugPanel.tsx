import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

function maskToken(token: string | null | undefined) {
  if (!token) return null;
  if (token.length <= 16) return `${token.slice(0, 4)}…${token.slice(-2)}`;
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

function safeKeysFromStorage(): string[] {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

export default function AuthDebugPanel({ user, session, loading }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [sessionFromSdk, setSessionFromSdk] = useState<Session | null>(null);
  const [userFromSdk, setUserFromSdk] = useState<User | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem("flow_auth_debug_dismissed") === "1");
      setOpen(sessionStorage.getItem("flow_auth_debug_open") === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((event) => {
      setLastEvent(event);
      setLastEventAt(new Date().toISOString());
    });

    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setSdkError(null);
        const [{ data: sData, error: sErr }, { data: uData, error: uErr }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

        if (sErr) throw sErr;
        if (uErr) throw uErr;

        if (!cancelled) {
          setSessionFromSdk(sData.session);
          setUserFromSdk(uData.user);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setSdkError(msg);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, session?.access_token]);

  const info = useMemo(() => {
    const isInIframe = typeof window !== "undefined" && window.self !== window.top;

    const storageKeys = safeKeysFromStorage();
    const authRelatedKeys = storageKeys
      .filter((k) => k.includes("sb-") || k.includes("supabase") || k.includes("auth"))
      .slice(0, 50);

    const url = new URL(window.location.href);

    return {
      page: {
        path: url.pathname,
        searchKeys: Array.from(url.searchParams.keys()),
        hashPresent: !!url.hash,
      },
      environment: {
        isInIframe,
        visibility: document.visibilityState,
      },
      authHook: {
        loading,
        user: user ? { id: user.id, email: user.email } : null,
        session: session
          ? {
              accessToken: maskToken(session.access_token),
              expiresAt: session.expires_at ?? null,
            }
          : null,
      },
      sdk: {
        error: sdkError,
        user: userFromSdk ? { id: userFromSdk.id, email: userFromSdk.email } : null,
        session: sessionFromSdk
          ? {
              accessToken: maskToken(sessionFromSdk.access_token),
              expiresAt: sessionFromSdk.expires_at ?? null,
            }
          : null,
      },
      events: {
        lastEvent,
        lastEventAt,
      },
      storage: {
        totalKeys: storageKeys.length,
        authRelatedKeys,
      },
    };
  }, [lastEvent, lastEventAt, loading, sdkError, session, sessionFromSdk, user, userFromSdk]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(info, null, 2));
      toast.success("Auth debug copied");
    } catch {
      toast.error("Could not copy (clipboard blocked)");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("flow_auth_debug_dismissed", "1");
    } catch {
      // ignore
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    try {
      sessionStorage.setItem("flow_auth_debug_open", next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Auth Debug</p>
          <p className="text-xs text-muted-foreground truncate">
            {info.environment.isInIframe ? "iframe" : "top-level"} • last event: {info.events.lastEvent ?? "(none)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleToggle}>
            {open ? "Hide" : "Show"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-end gap-2 mb-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              Copy JSON
            </Button>
          </div>
          <pre className="max-h-56 overflow-auto rounded-lg bg-muted/40 p-3 text-xs text-foreground whitespace-pre-wrap">
            {JSON.stringify(info, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
