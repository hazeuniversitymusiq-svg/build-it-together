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

    const postResult = (payload: Payload) => {
      // Primary: BroadcastChannel (works even when the opener is null due to noopener)
      if (typeof BroadcastChannel !== "undefined") {
        try {
          const channel = new BroadcastChannel("flow_oauth");
          channel.postMessage(payload);
          channel.close();
          return;
        } catch {
          // fall through
        }
      }

      // Fallback: window.opener postMessage (requires popup NOT opened with noopener)
      try {
        if (payload.type === "code") {
          window.opener?.postMessage({ type: "FLOW_OAUTH_CODE", code: payload.code }, window.location.origin);
          return;
        }
        if (payload.type === "tokens") {
          window.opener?.postMessage(
            { type: "FLOW_OAUTH_TOKENS", access_token: payload.access_token, refresh_token: payload.refresh_token },
            window.location.origin
          );
          return;
        }

        window.opener?.postMessage(
          {
            type: payload.type === "done" ? "FLOW_OAUTH_DONE" : "FLOW_OAUTH_ERROR",
            message: payload.type === "error" ? payload.message : undefined,
          },
          window.location.origin
        );
      } catch {
        // ignore
      }
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

        // In this top-level window (opened from /oauth/start), we can safely exchange
        // the code for a session because the PKCE verifier lives in this same context.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          const { data } = await supabase.auth.getSession();
          const session = data.session;
          if (!session) throw new Error("No session found after redirect.");

          postResult({
            type: "tokens",
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        } else {
          const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            postResult({ type: "tokens", access_token: accessToken, refresh_token: refreshToken });
          } else {
            throw new Error("Missing OAuth response.");
          }
        }

        if (cancelled) return;
        setStatus("success");
        setMessage("Signed in. You can close this window.");

        window.setTimeout(() => {
          try {
            window.close();
          } catch {
            // ignore
          }
        }, 250);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        if (cancelled) return;
        setStatus("error");
        setMessage(msg);
        postResult({ type: "error", message: msg });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
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
