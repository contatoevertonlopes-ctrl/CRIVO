import { getSupabaseAdminClient } from "./supabaseAdmin.ts";

export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<boolean> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: params.key,
    p_limit: params.limit,
    p_window_seconds: params.windowSeconds,
  });

  if (error) {
    throw new Error(`rate_limit rpc error: ${error.message}`);
  }

  return Boolean(data);
}

export async function enforceRateLimit(
  corsHeaders: Record<string, string>,
  params: { key: string; limit: number; windowSeconds: number }
): Promise<Response | null> {
  const ok = await checkRateLimit(params);
  if (ok) return null;

  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
