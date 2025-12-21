import { useHouseholdContext } from "./useHouseholdContext";

/**
 * @deprecated Use useHouseholdContext instead for better performance and caching.
 * This hook is kept for backward compatibility.
 */
export const useHouseholdId = () => {
  const { householdId, loading, refetch, invalidateHousehold } = useHouseholdContext();

  return { 
    householdId, 
    loading, 
    refetch,
    invalidateHousehold,
  };
};
