import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface HouseholdContextData {
  householdId: string | null;
  isShared: boolean;
  memberCount: number;
}

// Query key factory for consistent cache keys
export const householdKeys = {
  all: ["household"] as const,
  context: (userId: string | undefined) => [...householdKeys.all, "context", userId] as const,
};

/**
 * Unified hook for household context with React Query caching.
 * Combines functionality from useHouseholdId and useSharedHousehold.
 * - Caches household data for 10 minutes (staleTime)
 * - Keeps cache for 30 minutes (gcTime)
 * - Single query fetches both householdId and member count
 */
export const useHouseholdContext = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = householdKeys.context(user?.id);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<HouseholdContextData> => {
      if (!user) {
        return { householdId: null, isShared: false, memberCount: 1 };
      }

      // Get user's household_id from profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile?.household_id) {
        return { householdId: null, isShared: false, memberCount: 1 };
      }

      // Count members in the household
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("household_id", profile.household_id);

      if (countError) throw countError;

      const memberCount = count || 1;
      const isShared = memberCount > 1;

      return {
        householdId: profile.household_id,
        isShared,
        memberCount,
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes - household data changes rarely
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  // Helper to invalidate cache
  const invalidateHousehold = () => {
    queryClient.invalidateQueries({ queryKey: householdKeys.all });
  };

  const data = query.data || { householdId: null, isShared: false, memberCount: 1 };

  return {
    householdId: data.householdId,
    isShared: data.isShared,
    memberCount: data.memberCount,
    loading: query.isLoading,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    invalidateHousehold,
  };
};
