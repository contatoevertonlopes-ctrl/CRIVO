import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSharedHousehold } from "@/hooks/useSharedHousehold";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
  user_id: string;
  household_id: string | null;
}

interface AdaptiveModeData {
  // Survival Mode
  currentBalance: number;
  dailyExpenseAverage: number;
  essentialExpenseAverage: number;
  daysOfOxygen: number;
  
  // Prosperity Mode
  monthlyIncome: number;
  monthlyExpenses: number;
  freedomRate: number;
  surplus: number;
  daysOfFreedomEarned: number;
  
  loading: boolean;
}

// Essential categories for survival calculation
const ESSENTIAL_CATEGORIES = [
  "moradia",
  "alimentação",
  "saúde",
  "transporte",
  "educação",
  "contas",
  "utilities",
  "housing",
  "health",
  "groceries",
  "food",
  "rent",
  "bills",
];

export const useAdaptiveModeData = (
  period: number = 30,
  customDateFrom?: Date,
  customDateTo?: Date
) => {
  const { user } = useAuth();
  const { isShared, householdId, loading: householdLoading } = useSharedHousehold();
  const [data, setData] = useState<AdaptiveModeData>({
    currentBalance: 0,
    dailyExpenseAverage: 0,
    essentialExpenseAverage: 0,
    daysOfOxygen: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    freedomRate: 0,
    surplus: 0,
    daysOfFreedomEarned: 0,
    loading: true,
  });

  const fetchData = useCallback(async () => {
    if (!user || householdLoading) {
      setData(prev => ({ ...prev, loading: !householdLoading }));
      return;
    }

    try {
      // Build query with user_id or household_id filter
      let query = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (isShared && householdId) {
        // Shared household: get all household transactions
        query = query.eq("household_id", householdId);
      } else {
        // Individual: get only user's transactions
        query = query.eq("user_id", user.id);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      const allTransactions = (transactions as Transaction[]) || [];

      // Calculate date range based on period or custom dates
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (customDateFrom && customDateTo) {
        startDate = new Date(customDateFrom);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customDateTo);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = now;
        startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
      }

      // Calculate days in period for averages
      const daysInPeriod = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

      // Calculate total balance (all time confirmed transactions)
      const totalIncome = allTransactions
        .filter((t) => t.type === "income" && ["pagamento_concluido", "paid", "confirmed"].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = allTransactions
        .filter((t) => t.type === "expense" && ["pagamento_concluido", "paid", "confirmed"].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const currentBalance = totalIncome - totalExpenses;

      // Filter transactions for the selected period
      const recentTransactions = allTransactions.filter((t) => {
        const txDate = new Date(t.date + "T00:00:00");
        return txDate >= startDate && txDate <= endDate;
      });

      // Calculate expenses for the period
      const recentExpenses = recentTransactions
        .filter((t) => t.type === "expense" && ["pagamento_concluido", "paid", "confirmed"].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dailyExpenseAverage = recentExpenses / daysInPeriod;

      // Calculate essential expenses average
      const essentialExpenses = recentTransactions
        .filter((t) => 
          t.type === "expense" && 
          ["pagamento_concluido", "paid", "confirmed"].includes(t.status) &&
          ESSENTIAL_CATEGORIES.some(cat => t.category.toLowerCase().includes(cat))
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const essentialExpenseAverage = essentialExpenses / daysInPeriod;

      // Calculate days of oxygen
      const daysOfOxygen = dailyExpenseAverage > 0 
        ? Math.floor(currentBalance / dailyExpenseAverage) 
        : 999;

      // Calculate income for the period
      const periodIncome = recentTransactions
        .filter((t) => t.type === "income" && ["pagamento_concluido", "paid", "confirmed"].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const surplus = periodIncome - recentExpenses;
      
      const freedomRate = periodIncome > 0 
        ? Math.round((surplus / periodIncome) * 100) 
        : 0;

      const daysOfFreedomEarned = dailyExpenseAverage > 0 && surplus > 0
        ? Math.floor(surplus / dailyExpenseAverage)
        : 0;

      setData({
        currentBalance,
        dailyExpenseAverage,
        essentialExpenseAverage,
        daysOfOxygen,
        monthlyIncome: periodIncome,
        monthlyExpenses: recentExpenses,
        freedomRate,
        surplus,
        daysOfFreedomEarned,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching adaptive mode data:", error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user, isShared, householdId, householdLoading, period, customDateFrom, customDateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refetch: fetchData };
};
