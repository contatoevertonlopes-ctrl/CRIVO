import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SharedHouseholdState {
  isShared: boolean;
  memberCount: number;
  householdId: string | null;
  loading: boolean;
}

export const useSharedHousehold = () => {
  const { user } = useAuth();
  const [state, setState] = useState<SharedHouseholdState>({
    isShared: false,
    memberCount: 1,
    householdId: null,
    loading: true,
  });

  const checkSharedStatus = useCallback(async () => {
    if (!user) {
      setState({ isShared: false, memberCount: 1, householdId: null, loading: false });
      return;
    }

    try {
      // Get user's household_id from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.household_id) {
        setState({ isShared: false, memberCount: 1, householdId: null, loading: false });
        return;
      }

      // Count members in the household
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("household_id", profile.household_id);

      if (error) throw error;

      const memberCount = count || 1;
      const isShared = memberCount > 1;

      setState({
        isShared,
        memberCount,
        householdId: profile.household_id,
        loading: false,
      });
    } catch (error) {
      console.error("Error checking shared household status:", error);
      setState({ isShared: false, memberCount: 1, householdId: null, loading: false });
    }
  }, [user]);

  useEffect(() => {
    checkSharedStatus();
  }, [checkSharedStatus]);

  return {
    ...state,
    refetch: checkSharedStatus,
  };
};
