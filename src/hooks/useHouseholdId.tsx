import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useHouseholdId = () => {
  const { user } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHouseholdId = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("profiles")
          .select("household_id")
          .eq("user_id", user.id)
          .single();

        setHouseholdId(data?.household_id || null);
      } catch (error) {
        console.error("Error fetching household_id:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHouseholdId();
  }, [user]);

  return { householdId, loading };
};
