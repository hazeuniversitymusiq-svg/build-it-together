// supabase/functions/oauth-bridge/index.ts
//
// OAuth redirect bridge for native apps.
// The auth provider redirects back to this HTTPS endpoint (allowed redirect),
// then we bounce into the app via the custom scheme deep link (flow://...).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function htmlPage(params: {
  deepLink: string;
  title: string;
  message: string;
}) {
  const { deepLink, title, message } = params;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="robots" content="noindex,nofollow" />
  <style>
    :root { color-scheme: light dark; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 24px; }
    .card { max-width: 520px; margin: 0 auto; padding: 20px; border-radius: 16px; border: 1px solid rgba(127,127,127,.25); }
    h1 { margin: 0 0 8px; font-size: 18px; }
    p { margin: 0 0 16px; opacity: .85; line-height: 1.4; }
    a.btn { display: inline-block; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(127,127,127,.35); text-decoration: none; font-weight: 600; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>

    <a class="btn" id="open" href="${deepLink}">Open the app</a>

    <p style="margin-top: 16px; font-size: 12px; opacity: .75;">
      If nothing happens, tap <strong>Open the app</strong> above.
      <br />
      <span>Link:</span> <code>${deepLink}</code>
    </p>
  </div>

  <script>
    (function () {
      var link = ${JSON.stringify(deepLink)};
      // Try to auto-open quickly; some browsers require user interaction, so the button remains as fallback.
      try { window.location.replace(link); } catch (e) {}
    })();
  </script>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // OAuth providers / the auth server can return either:
  // - PKCE code in query params
  // - OR access/refresh tokens in hash fragment (rare; but handle defensively)
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription =
    url.searchParams.get("error_description") || url.searchParams.get("error_description") || error;

  let deepLink = "flow://auth/callback";

  if (code) {
    deepLink += `?code=${encodeURIComponent(code)}`;
  } else if (url.hash) {
    const hash = url.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const at = hashParams.get("access_token");
    const rt = hashParams.get("refresh_token");
    if (at && rt) {
      deepLink += `#access_token=${encodeURIComponent(at)}&refresh_token=${encodeURIComponent(rt)}`;
    }
  }

  const isError = Boolean(errorDescription) && !code;
  const body = htmlPage({
    deepLink,
    title: isError ? "Sign-in failed" : "Finishing sign-in…",
    message: isError
      ? `We couldn't complete sign-in: ${String(errorDescription)}`
      : "If the app doesn't open automatically, tap the button below.",
  });

  return new Response(body, {
    headers: {
      ...corsHeaders,
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
    status: 200,
  });
});
