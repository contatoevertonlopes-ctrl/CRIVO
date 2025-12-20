import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
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

export const useAdaptiveModeData = (period: number = 30) => {
  const { user } = useAuth();
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
    if (!user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      const allTransactions = (transactions as Transaction[]) || [];

      // Calculate total balance (all time)
      const totalIncome = allTransactions
        .filter((t) => t.type === "income" && ["pagamento_concluido", "paid", "confirmed"].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = allTransactions
        .filter((t) => t.type === "expense" && ["pagamento_concluido", "paid", "confirmed"].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const currentBalance = totalIncome - totalExpenses;

      // Last 30 days transactions for averages
      const recentTransactions = allTransactions.filter(
        (t) => new Date(t.date + "T00:00:00") >= thirtyDaysAgo
      );

      // Calculate daily expense average (last 30 days)
      const recentExpenses = recentTransactions
        .filter((t) => t.type === "expense" && ["pagamento_concluido", "paid", "confirmed"].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const dailyExpenseAverage = recentExpenses / 30;

      // Calculate essential expenses average
      const essentialExpenses = recentTransactions
        .filter((t) => 
          t.type === "expense" && 
          ["pagamento_concluido", "paid", "confirmed"].includes(t.status) &&
          ESSENTIAL_CATEGORIES.some(cat => t.category.toLowerCase().includes(cat))
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const essentialExpenseAverage = essentialExpenses / 30;

      // Calculate days of oxygen
      const daysOfOxygen = dailyExpenseAverage > 0 
        ? Math.floor(currentBalance / dailyExpenseAverage) 
        : 999;

      // Calculate monthly income and expenses for prosperity mode
      const monthlyIncome = recentTransactions
        .filter((t) => t.type === "income" && ["pagamento_concluido", "paid", "confirmed"].includes(t.status))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpenses = recentExpenses;
      const surplus = monthlyIncome - monthlyExpenses;
      
      const freedomRate = monthlyIncome > 0 
        ? Math.round((surplus / monthlyIncome) * 100) 
        : 0;

      const daysOfFreedomEarned = dailyExpenseAverage > 0 && surplus > 0
        ? Math.floor(surplus / dailyExpenseAverage)
        : 0;

      setData({
        currentBalance,
        dailyExpenseAverage,
        essentialExpenseAverage,
        daysOfOxygen,
        monthlyIncome,
        monthlyExpenses,
        freedomRate,
        surplus,
        daysOfFreedomEarned,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching adaptive mode data:", error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refetch: fetchData };
};
