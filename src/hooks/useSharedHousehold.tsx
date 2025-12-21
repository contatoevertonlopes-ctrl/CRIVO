import { useHouseholdContext } from "./useHouseholdContext";

/**
 * @deprecated Use useHouseholdContext instead for better performance and caching.
 * This hook is kept for backward compatibility.
 */
export const useSharedHousehold = () => {
  const { isShared, memberCount, householdId, loading, refetch, invalidateHousehold } = useHouseholdContext();

  return {
    isShared,
    memberCount,
    householdId,
    loading,
    refetch,
    invalidateHousehold,
  };
};
