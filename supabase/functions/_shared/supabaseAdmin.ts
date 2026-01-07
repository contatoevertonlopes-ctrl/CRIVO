import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export function getSupabaseAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
