import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Web Push requires signing JWT with VAPID private key
async function generateVapidJwt(
  audience: string,
  subject: string,
  privateKeyJwk: JsonWebKey
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsignedToken = `${encode(header)}.${encode(payload)}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${unsignedToken}.${sigBase64}`;
}

// Only allow safe relative URLs, or same-origin absolute URLs
function sanitizeUrl(input: unknown): string {
  if (typeof input !== "string" || input.length === 0 || input.length > 512) return "/";
  // Disallow protocol-relative and javascript: URIs
  if (input.startsWith("//") || /^[a-z]+:/i.test(input)) return "/";
  if (!input.startsWith("/")) return "/";
  return input;
}

function sanitizeText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  return input.slice(0, max);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // AUTH: only allow calls from server-side callers holding the service-role key
    // (edge functions such as check-notifications) or an approved cron secret.
    const cronSecret = Deno.env.get("CRON_SECRET");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const providedCron = req.headers.get("x-cron-secret") ?? "";

    const isServiceCall = !!serviceRoleKey && bearer === serviceRoleKey;
    const isCronCall = !!cronSecret && (providedCron === cronSecret || bearer === cronSecret);

    if (!isServiceCall && !isCronCall) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey!, {
      auth: { persistSession: false },
    });

    const payloadIn = await req.json().catch(() => null);
    if (!payloadIn || typeof payloadIn !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = typeof payloadIn.user_id === "string" ? payloadIn.user_id : "";
    const title = sanitizeText(payloadIn.title, 200);
    const body = sanitizeText(payloadIn.body, 500);
    const url = sanitizeUrl(payloadIn.url);
    const tag = sanitizeText(payloadIn.tag, 64) || "notification";

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: vapidData } = await supabase
      .from("vapid_keys")
      .select("*")
      .limit(1)
      .single();

    if (!vapidData) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const privateKeyJwk = JSON.parse(vapidData.private_key);
    const publicKeyBase64 = vapidData.public_key;

    const payload = JSON.stringify({
      title,
      body,
      icon: "/pwa-192x192.png",
      url,
      tag,
    });

    let sent = 0;
    const failed: string[] = [];

    for (const sub of subscriptions) {
      try {
        const endpoint = new URL(sub.endpoint);
        const audience = `${endpoint.protocol}//${endpoint.host}`;

        const jwt = await generateVapidJwt(
          audience,
          "mailto:contato@crivoapp.com",
          privateKeyJwk
        );

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            TTL: "86400",
            Authorization: `vapid t=${jwt}, k=${publicKeyBase64}`,
          },
          body: new TextEncoder().encode(payload),
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 410 || response.status === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          failed.push(`${sub.id}: expired`);
        } else {
          failed.push(`${sub.id}: ${response.status}`);
        }
      } catch (_err) {
        failed.push(`${sub.id}: send_error`);
      }
    }

    console.log(`[SEND-PUSH] Sent ${sent}/${subscriptions.length} for user ${user_id}`);

    return new Response(JSON.stringify({ sent, total: subscriptions.length, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[SEND-PUSH] Error:", msg);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
