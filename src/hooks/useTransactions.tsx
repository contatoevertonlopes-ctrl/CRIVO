import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { supabase } from "@/integrations/supabase/client";

const EMPTY_TRANSACTIONS: Transaction[] = [];

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
  bank_account_id?: string | null;
  card_id?: string | null;
  is_recurring?: boolean;
  recurring_interval?: string | null;
  parent_transaction_id?: string | null;
  recurring_series_id?: string | null;
  goal_id?: string | null;
  tag?: string | null;
  payment_method?: string | null;
  due_date?: string | null;
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
      if (!user) return EMPTY_TRANSACTIONS;

      const PAGE_SIZE = 1000;
      let allData: Transaction[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        let supabaseQuery = supabase
          .from("transactions")
          .select(
            "id,user_id,household_id,date,description,category,type,amount,status,is_recurring,recurring_interval,parent_transaction_id,recurring_series_id,goal_id,tag,payment_method,bank_account_id,card_id,paid_date,created_at,updated_at"
          )
          .order("date", { ascending: false })
          .order("id", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (householdId) {
          supabaseQuery = supabaseQuery.or(
            `household_id.eq.${householdId},user_id.eq.${user.id}`
          );
        } else {
          supabaseQuery = supabaseQuery.eq("user_id", user.id);
        }

        const { data, error } = await supabaseQuery;
        if (error) throw error;

        const page = (data as Transaction[]) || [];
        allData = allData.concat(page);

        hasMore = page.length === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      const uniqueTransactions = Array.from(
        new Map(allData.map((transaction) => [transaction.id, transaction])).values()
      );

      return uniqueTransactions.length > 0 ? uniqueTransactions : EMPTY_TRANSACTIONS;
    },
    enabled: !!user && !householdLoading && options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    refetchOnMount: false, // Don't refetch on mount to prevent automatic updates
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce calls
  });

  // Helper to invalidate cache after mutations
  const invalidateTransactions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  }, [queryClient]);

  // Helper to clear frontend transaction cache and force a fresh fetch
  const resetTransactions = useCallback(() => {
    queryClient.setQueryData<Transaction[]>(queryKey, EMPTY_TRANSACTIONS);
    queryClient.invalidateQueries({ queryKey, exact: true });
  }, [queryClient, queryKey]);

  // Helper to optimistically update cache
  const updateTransactionInCache = useCallback(
    (updatedTransaction: Partial<Transaction> & { id: string }) => {
      queryClient.setQueryData<Transaction[]>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((t) =>
          t.id === updatedTransaction.id ? { ...t, ...updatedTransaction } : t
        );
      });
    },
    [queryClient, queryKey]
  );

  // Helper to add transaction to cache
  const addTransactionToCache = useCallback(
    (newTransaction: Transaction) => {
      queryClient.setQueryData<Transaction[]>(queryKey, (oldData) => {
        if (!oldData) return [newTransaction];
        return [newTransaction, ...oldData];
      });
    },
    [queryClient, queryKey]
  );

  // Helper to remove transaction from cache
  const removeTransactionFromCache = useCallback(
    (transactionId: string) => {
      queryClient.setQueryData<Transaction[]>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((t) => t.id !== transactionId);
      });
    },
    [queryClient, queryKey]
  );

  return {
    transactions: query.data ?? EMPTY_TRANSACTIONS,
    isLoading: query.isLoading || householdLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    resetTransactions,
    invalidateTransactions,
    updateTransactionInCache,
    addTransactionToCache,
    removeTransactionFromCache,
  };
};
