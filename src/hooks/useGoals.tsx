import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useHouseholdId } from "./useHouseholdId";
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

export const useGoals = () => {
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch goals with items in a single query using relations
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
      const goalsWithAmounts = (goalsData || []).map((goal: any) => {
        const transactions = goal.transactions || [];
        const items = goal.goal_items || [];

        // Sum completed expense transactions linked to this goal
        const transactionTotal = transactions
          .filter((t: any) => t.status === "pagamento_concluido" && t.type === "expense")
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        // Sum paid items
        const itemsPaid = items.filter((i: any) => i.is_paid).length;
        const itemsPaidAmount = items
          .filter((i: any) => i.is_paid)
          .reduce((sum: number, i: any) => sum + Number(i.estimated_amount), 0);

        // Clean up the response object
        const { goal_items, transactions: _, ...cleanGoal } = goal;

        return {
          ...cleanGoal,
          current_amount: transactionTotal + itemsPaidAmount,
          items_count: items.length,
          items_paid: itemsPaid,
        };
      });

      setGoals(goalsWithAmounts);
    } catch (error) {
      console.error("Error fetching goals:", error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createGoal = async (
    goal: Omit<Goal, "id" | "created_at" | "updated_at" | "user_id"> & {
      template_type?: string;
      car_value?: number;
      event_date?: string | null;
    },
    templateItems?: { title: string; category: string; estimated_amount: number }[]
  ) => {
    if (!user) return null;

    try {
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

      // If template items are provided, create them
      if (templateItems && templateItems.length > 0 && data) {
        const items = templateItems.map(item => ({
          goal_id: data.id,
          title: item.title,
          category: item.category,
          estimated_amount: item.estimated_amount,
          is_paid: false,
        }));

        const { error: itemsError } = await supabase
          .from("goal_items")
          .insert(items);

        if (itemsError) {
          console.error("Error creating template items:", itemsError);
        }
      }

      await fetchGoals();
      return data;
    } catch (error) {
      console.error("Error creating goal:", error);
      return null;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const { error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      await fetchGoals();
      return true;
    } catch (error) {
      console.error("Error updating goal:", error);
      return false;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchGoals();
      return true;
    } catch (error) {
      console.error("Error deleting goal:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
};

export const useGoalItems = (goalId: string | null) => {
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!goalId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("goal_items")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching goal items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  const createItem = async (item: Omit<GoalItem, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("goal_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      await fetchItems();
      return data;
    } catch (error) {
      console.error("Error creating item:", error);
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<GoalItem>) => {
    try {
      const { error } = await supabase
        .from("goal_items")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      await fetchItems();
      return true;
    } catch (error) {
      console.error("Error updating item:", error);
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("goal_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchItems();
      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
};
