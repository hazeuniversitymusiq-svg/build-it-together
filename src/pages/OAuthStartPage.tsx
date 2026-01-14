import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CircleX } from "lucide-react";

export default function OAuthStartPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const redirectTo = `${window.location.origin}/oauth/callback`;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            // We control the navigation so we can show a deterministic loading UI.
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;
        if (!data?.url) throw new Error("Missing OAuth URL");

        // Continue the OAuth flow in this top-level window.
        window.location.assign(data.url);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to start Google sign-in";
        setError(msg);
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
        {!error ? (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            <h1 className="mt-4 text-lg font-semibold text-foreground">Opening Google…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please complete sign-in in this tab.</p>
          </>
        ) : (
          <>
            <CircleX className="mx-auto h-6 w-6 text-destructive" />
            <h1 className="mt-4 text-lg font-semibold text-foreground">Sign-in error</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </>
        )}
      </section>
    </main>
  );
}
