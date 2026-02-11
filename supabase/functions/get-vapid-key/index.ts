import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Check if VAPID keys exist
    const { data: existing } = await supabase
      .from("vapid_keys")
      .select("public_key")
      .limit(1)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ publicKey: existing.public_key }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate VAPID keys using Web Crypto API
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    // Convert to URL-safe base64
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Store private key as JWK JSON string
    const privateKeyStr = JSON.stringify(privateKeyJwk);

    await supabase.from("vapid_keys").insert({
      public_key: publicKeyBase64,
      private_key: privateKeyStr,
    });

    return new Response(JSON.stringify({ publicKey: publicKeyBase64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[GET-VAPID-KEY] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
