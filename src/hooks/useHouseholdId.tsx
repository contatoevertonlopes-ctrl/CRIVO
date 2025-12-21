import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useHouseholdId = () => {
  const { user } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHouseholdId = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("[useHouseholdId] User:", user.id, "Profile data:", data, "Error:", error);
      
      setHouseholdId(data?.household_id || null);
    } catch (error) {
      console.error("Error fetching household_id:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHouseholdId();
  }, [fetchHouseholdId]);

  // Refresh when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchHouseholdId();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchHouseholdId]);

  return { householdId, loading, refetch: fetchHouseholdId };
};
