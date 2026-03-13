import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useHouseholdContext } from "./useHouseholdContext";
import { supabase } from "@/integrations/supabase/client";

export interface Goal {
  id: string;
  household_id: string | null;
  user_id: string;
  title: string;
  icon: string;
  target_amount: number;
  deadline: string | null;
  status: string;
  color: string | null;
  created_at: string;
  updated_at: string;
  current_amount?: number;
  items_count?: number;
  items_paid?: number;
}

export interface GoalItem {
  id: string;
  goal_id: string;
  title: string;
  estimated_amount: number;
  transaction_id: string | null;
  is_paid: boolean;
  supplier?: string | null;
  pix_key?: string | null;
  due_date?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

// Query key factory for consistent cache keys
export const goalKeys = {
  all: ["goals"] as const,
  list: (userId: string | undefined) => [...goalKeys.all, "list", userId] as const,
  items: (goalId: string | null) => [...goalKeys.all, "items", goalId] as const,
};

/**
 * Centralized hook for fetching goals with React Query caching.
 * - Caches goals for 5 minutes (staleTime)
 * - Keeps cache for 30 minutes (gcTime)
 * - Provides invalidation method for mutations
 */
export const useGoals = () => {
  const { user } = useAuth();
  const { householdId, loading: householdLoading } = useHouseholdContext();
  const queryClient = useQueryClient();

  const queryKey = goalKeys.list(user?.id);

  // Fetch goals
  const goalsQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<Goal[]> => {
      if (!user) return [];

      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select(`
          *,
          goal_items (id, is_paid, estimated_amount),
          transactions!transactions_goal_id_fkey (amount, type, status)
        `)
        .order("created_at", { ascending: false });

      if (goalsError) throw goalsError;

      // Process goals with aggregated amounts
      return (goalsData || []).map((goal: any) => {
        const transactions = goal.transactions || [];
        const items = goal.goal_items || [];

        const transactionTotal = transactions
          .filter((t: any) => (t.status === "paid" || t.status === "pagamento_concluido") && t.type === "expense")
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const itemsPaid = items.filter((i: any) => i.is_paid).length;
        const itemsPaidAmount = items
          .filter((i: any) => i.is_paid)
          .reduce((sum: number, i: any) => sum + Number(i.estimated_amount), 0);

        const { goal_items, transactions: _, ...cleanGoal } = goal;

        return {
          ...cleanGoal,
          current_amount: transactionTotal + itemsPaidAmount,
          items_count: items.length,
          items_paid: itemsPaid,
        };
      });
    },
    enabled: !!user && !householdLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Invalidate cache
  const invalidateGoals = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: goalKeys.all });
  }, [queryClient]);

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async ({
      goal,
      templateItems,
    }: {
      goal: Omit<Goal, "id" | "created_at" | "updated_at" | "user_id"> & {
        template_type?: string;
        car_value?: number;
        event_date?: string | null;
      };
      templateItems?: { title: string; category: string; estimated_amount: number }[];
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("goals")
        .insert({
          ...goal,
          user_id: user.id,
          household_id: householdId,
        })
        .select()
        .single();

      if (error) throw error;

      if (templateItems && templateItems.length > 0 && data) {
        const items = templateItems.map((item) => ({
          goal_id: data.id,
          title: item.title,
          category: item.category,
          estimated_amount: item.estimated_amount,
          is_paid: false,
        }));

        const { error: itemsError } = await supabase.from("goal_items").insert(items);

        if (itemsError) {
          console.error("Error creating template items:", itemsError);
        }
      }

      return data;
    },
    onSuccess: () => {
      invalidateGoals();
    },
    onError: (error) => {
      console.error("Error creating goal:", error);
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      const { error } = await supabase.from("goals").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGoals();
    },
    onError: (error) => {
      console.error("Error updating goal:", error);
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGoals();
    },
    onError: (error) => {
      console.error("Error deleting goal:", error);
    },
  });

  // Wrapper functions for backward compatibility
  const createGoal = async (
    goal: Omit<Goal, "id" | "created_at" | "updated_at" | "user_id"> & {
      template_type?: string;
      car_value?: number;
      event_date?: string | null;
    },
    templateItems?: { title: string; category: string; estimated_amount: number }[]
  ) => {
    try {
      return await createGoalMutation.mutateAsync({ goal, templateItems });
    } catch {
      return null;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      await updateGoalMutation.mutateAsync({ id, updates });
      return true;
    } catch {
      return false;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteGoalMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const loading = goalsQuery.isLoading || householdLoading;
  const fetchGoals = invalidateGoals;

  return {
    goals: goalsQuery.data || [],
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    invalidateGoals,
    isLoading: loading,
    isFetching: goalsQuery.isFetching,
    error: goalsQuery.error,
  };
};

/**
 * Hook for fetching goal items with React Query caching.
 */
export const useGoalItems = (goalId: string | null) => {
  const queryClient = useQueryClient();

  const queryKey = goalKeys.items(goalId);

  // Fetch items
  const itemsQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<GoalItem[]> => {
      if (!goalId) return [];

      const { data, error } = await supabase
        .from("goal_items")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as GoalItem[]) || [];
    },
    enabled: !!goalId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Invalidate cache
  const invalidateItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: goalKeys.items(goalId) });
    // Also invalidate goals list since items affect goal totals
    queryClient.invalidateQueries({ queryKey: goalKeys.all });
  }, [queryClient, goalId]);

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (item: Omit<GoalItem, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("goal_items").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateItems();
    },
    onError: (error) => {
      console.error("Error creating item:", error);
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GoalItem> }) => {
      const { error } = await supabase.from("goal_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateItems();
    },
    onError: (error) => {
      console.error("Error updating item:", error);
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goal_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateItems();
    },
    onError: (error) => {
      console.error("Error deleting item:", error);
    },
  });

  // Wrapper functions for backward compatibility
  const createItem = async (item: Omit<GoalItem, "id" | "created_at" | "updated_at">) => {
    try {
      return await createItemMutation.mutateAsync(item);
    } catch {
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<GoalItem>) => {
    try {
      await updateItemMutation.mutateAsync({ id, updates });
      return true;
    } catch {
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteItemMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const fetchItems = invalidateItems;

  return {
    items: itemsQuery.data || [],
    loading: itemsQuery.isLoading,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    invalidateItems,
    isLoading: itemsQuery.isLoading,
    isFetching: itemsQuery.isFetching,
    error: itemsQuery.error,
  };
};
