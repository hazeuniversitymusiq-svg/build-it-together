import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CircleCheck, CircleX } from "lucide-react";

type Status = "working" | "success" | "error";

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState<Status>("working");
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    type Payload =
      | { type: "done" }
      | { type: "error"; message: string }
      | { type: "code"; code: string }
      | { type: "tokens"; access_token: string; refresh_token: string };

    const postResult = (payload: Payload): Promise<void> => {
      return new Promise((resolve) => {
        // Post via BroadcastChannel
        if (typeof BroadcastChannel !== "undefined") {
          try {
            const channel = new BroadcastChannel("flow_oauth");
            channel.postMessage(payload);
            channel.close();
          } catch {
            // ignore
          }
        }

        // Also try window.opener postMessage as fallback
        if (window.opener) {
          const targetOrigin = window.location.origin;
          try {
            if (payload.type === "tokens") {
              window.opener.postMessage({ type: "FLOW_OAUTH_TOKENS", ...payload }, targetOrigin);
            } else if (payload.type === "code") {
              window.opener.postMessage({ type: "FLOW_OAUTH_CODE", code: payload.code }, targetOrigin);
            } else if (payload.type === "error") {
              window.opener.postMessage({ type: "FLOW_OAUTH_ERROR", message: payload.message }, targetOrigin);
            } else {
              window.opener.postMessage({ type: "FLOW_OAUTH_DONE" }, targetOrigin);
            }
          } catch {
            // ignore
          }
        }

        // Give time for message delivery before resolving
        setTimeout(resolve, 100);
      });
    };

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDescription =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error") ||
          (url.hash ? new URLSearchParams(url.hash.replace(/^#/, "")).get("error_description") : null);

        if (errorDescription && !code) {
          throw new Error(decodeURIComponent(errorDescription));
        }

        // Exchange code for session in this top-level window
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          const { data } = await supabase.auth.getSession();
          const session = data.session;
          if (!session) throw new Error("No session found after redirect.");

          // Post tokens back to opener and wait for delivery
          await postResult({
            type: "tokens",
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        } else {
          // Check for hash tokens (implicit flow)
          const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            await postResult({ type: "tokens", access_token: accessToken, refresh_token: refreshToken });
          } else {
            throw new Error("Missing OAuth response.");
          }
        }

        if (cancelled) return;
        setStatus("success");

        const hasOpener = !!window.opener;
        setMessage(hasOpener ? "Signed in. You can close this window." : "Signed in. Redirecting…");

        // If we were opened as a popup, try to close (best-effort).
        // Otherwise (same-tab flow), continue into the app.
        window.setTimeout(() => {
          try {
            if (hasOpener) {
              window.close();
            } else {
              window.location.replace("/connect");
            }
          } catch {
            if (!hasOpener) window.location.assign("/connect");
          }
        }, hasOpener ? 800 : 200);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        if (cancelled) return;
        setStatus("error");
        setMessage(msg);
        await postResult({ type: "error", message: msg });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 safe-area-top safe-area-bottom">
      <section className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
        {status === "working" && (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {status === "success" && <CircleCheck className="mx-auto h-6 w-6 text-primary" />}
        {status === "error" && <CircleX className="mx-auto h-6 w-6 text-destructive" />}

        <h1 className="mt-4 text-lg font-semibold text-foreground">Sign-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </section>
    </main>
  );
}
