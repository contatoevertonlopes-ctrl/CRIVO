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
  user_id?: string;
}

interface DashboardMetrics {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  futureCommitments: number;
  pendingCount: number;
  balanceChange: number;
  incomeChange: number;
  expenseChange: number;
}

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

interface CategoryData {
  name: string;
  value: number;
}

export const useDashboardData = (period: number = 30, customDateFrom?: Date, customDateTo?: Date) => {
  const { user } = useAuth();
  const { isShared, householdId, loading: householdLoading } = useSharedHousehold();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    futureCommitments: 0,
    pendingCount: 0,
    balanceChange: 0,
    incomeChange: 0,
    expenseChange: 0,
  });
  const [cashflowData, setCashflowData] = useState<MonthlyData[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user || householdLoading) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get current date info
      const now = new Date();
      
      // Use custom dates if provided, otherwise use period
      const periodStartDate = customDateFrom 
        ? new Date(customDateFrom.getTime())
        : new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
      
      const periodEndDate = customDateTo
        ? new Date(customDateTo.getTime() + 24 * 60 * 60 * 1000) // Include end date
        : now;
        
      const periodDays = customDateFrom && customDateTo
        ? Math.ceil((periodEndDate.getTime() - periodStartDate.getTime()) / (24 * 60 * 60 * 1000))
        : period;
        
      const previousPeriodStart = new Date(periodStartDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousPeriodEnd = new Date(periodStartDate.getTime());
      const futureDate = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

      let query = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      // If NOT in a shared household, only fetch user's own transactions
      if (!isShared) {
        query = query.eq("user_id", user.id);
      } else if (householdId) {
        // If in a shared household, fetch all household transactions
        query = query.eq("household_id", householdId);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      const allTransactions = (transactions as Transaction[]) || [];

      // Filter transactions for current period
      const currentPeriodTransactions = allTransactions.filter(
        (t) => {
          const tDate = new Date(t.date + "T00:00:00");
          return tDate >= periodStartDate && tDate <= periodEndDate;
        }
      );
      
      // Filter transactions for previous period (for comparison)
      const previousPeriodTransactions = allTransactions.filter(
        (t) => {
          const tDate = new Date(t.date + "T00:00:00");
          return tDate >= previousPeriodStart && tDate < previousPeriodEnd;
        }
      );

      // Current period income/expenses
      const periodIncome = currentPeriodTransactions
        .filter((t) => t.type === "income" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const periodExpenses = currentPeriodTransactions
        .filter((t) => t.type === "expense" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Previous period for comparison
      const previousPeriodIncome = previousPeriodTransactions
        .filter((t) => t.type === "income" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const previousPeriodExpenses = previousPeriodTransactions
        .filter((t) => t.type === "expense" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Total balance (all time income - expenses)
      const totalIncome = allTransactions
        .filter((t) => t.type === "income" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = allTransactions
        .filter((t) => t.type === "expense" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const currentBalance = totalIncome - totalExpenses;

      // Future commitments (pending/upcoming transactions in next X days)
      const futureCommitments = allTransactions
        .filter((t) => {
          const tDate = new Date(t.date + "T00:00:00");
          return (
            t.type === "expense" &&
            (t.status === "em_aberto" || t.status === "a_vencer" || t.status === "pending") &&
            tDate >= now &&
            tDate <= futureDate
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const pendingCount = allTransactions.filter(
        (t) =>
          t.type === "expense" &&
          (t.status === "em_aberto" || t.status === "a_vencer" || t.status === "pending")
      ).length;

      // Calculate changes compared to previous period
      const previousBalance = previousPeriodIncome - previousPeriodExpenses;
      const currentPeriodBalance = periodIncome - periodExpenses;
      const balanceChange =
        previousBalance !== 0
          ? ((currentPeriodBalance - previousBalance) / Math.abs(previousBalance)) * 100
          : 0;
      const incomeChange =
        previousPeriodIncome !== 0
          ? ((periodIncome - previousPeriodIncome) / previousPeriodIncome) * 100
          : 0;
      const expenseChange =
        previousPeriodExpenses !== 0
          ? ((periodExpenses - previousPeriodExpenses) / previousPeriodExpenses) * 100
          : 0;

      setMetrics({
        currentBalance,
        monthlyIncome: periodIncome,
        monthlyExpenses: periodExpenses,
        futureCommitments,
        pendingCount,
        balanceChange,
        incomeChange,
        expenseChange,
      });

      // Calculate cashflow data for last 6 months
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const last6Months: MonthlyData[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthTransactions = allTransactions.filter((t) => {
          const tDate = new Date(t.date);
          return tDate >= monthDate && tDate <= monthEnd;
        });

        const receitas = monthTransactions
          .filter((t) => t.type === "income" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const despesas = monthTransactions
          .filter((t) => t.type === "expense" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
          .reduce((sum, t) => sum + Number(t.amount), 0);

        last6Months.push({
          month: monthNames[monthDate.getMonth()],
          receitas,
          despesas,
        });
      }

      setCashflowData(last6Months);

      // Calculate expenses by category
      const categoryMap = new Map<string, number>();
      currentPeriodTransactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const current = categoryMap.get(t.category) || 0;
          categoryMap.set(t.category, current + Number(t.amount));
        });

      const categories: CategoryData[] = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);

      // If no categories, show placeholder
      if (categories.length === 0) {
        categories.push({ name: "Sem dados", value: 100 });
      }

      setExpensesByCategory(categories);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, period, isShared, householdId, householdLoading, customDateFrom, customDateTo]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    metrics,
    cashflowData,
    expensesByCategory,
    refetch: fetchDashboardData,
  };
};
