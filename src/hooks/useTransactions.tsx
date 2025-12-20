import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
  user_id: string;
  household_id: string | null;
  is_recurring?: boolean;
  recurring_interval?: string | null;
  parent_transaction_id?: string | null;
  goal_id?: string | null;
  tag?: string | null;
  payment_method?: string | null;
  paid_date?: string | null;
  created_at: string;
  updated_at: string;
}

interface UseTransactionsOptions {
  enabled?: boolean;
}

// Query key factory for consistent cache keys
export const transactionKeys = {
  all: ["transactions"] as const,
  list: (userId: string | undefined, householdId: string | null | undefined, isShared: boolean) => 
    [...transactionKeys.all, "list", { userId, householdId, isShared }] as const,
};

/**
 * Centralized hook for fetching transactions with React Query caching.
 * - Caches transactions for 5 minutes (staleTime)
 * - Keeps cache for 30 minutes (gcTime)
 * - Automatically refetches when user/household changes
 * - Provides invalidation method for mutations
 */
export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const { user } = useAuth();
  const { isShared, householdId, loading: householdLoading } = useSharedHousehold();
  const queryClient = useQueryClient();

  const queryKey = transactionKeys.list(user?.id, householdId, isShared);

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) return [];

      let supabaseQuery = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (isShared && householdId) {
        // Shared household: get all household transactions
        supabaseQuery = supabaseQuery.eq("household_id", householdId);
      } else {
        // Individual: get only user's transactions
        supabaseQuery = supabaseQuery.eq("user_id", user.id);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      return (data as Transaction[]) || [];
    },
    enabled: !!user && !householdLoading && options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce calls
  });

  // Helper to invalidate cache after mutations
  const invalidateTransactions = () => {
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  };

  // Helper to optimistically update cache
  const updateTransactionInCache = (updatedTransaction: Partial<Transaction> & { id: string }) => {
    queryClient.setQueryData<Transaction[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((t) =>
        t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t
      );
    });
  };

  // Helper to add transaction to cache
  const addTransactionToCache = (newTransaction: Transaction) => {
    queryClient.setQueryData<Transaction[]>(queryKey, (oldData) => {
      if (!oldData) return [newTransaction];
      return [newTransaction, ...oldData];
    });
  };

  // Helper to remove transaction from cache
  const removeTransactionFromCache = (transactionId: string) => {
    queryClient.setQueryData<Transaction[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return oldData.filter((t) => t.id !== transactionId);
    });
  };

  return {
    transactions: query.data || [],
    isLoading: query.isLoading || householdLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    invalidateTransactions,
    updateTransactionInCache,
    addTransactionToCache,
    removeTransactionFromCache,
  };
};
