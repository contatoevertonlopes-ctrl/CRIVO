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

export const useDashboardData = (period: number = 30) => {
  const { user } = useAuth();
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
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get current date info
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const futureDate = new Date(now.getTime() + period * 24 * 60 * 60 * 1000);

      // Fetch all transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      const allTransactions = (transactions as Transaction[]) || [];

      // Calculate metrics
      const currentMonthTransactions = allTransactions.filter(
        (t) => new Date(t.date) >= startOfMonth
      );
      const lastMonthTransactions = allTransactions.filter(
        (t) => new Date(t.date) >= startOfLastMonth && new Date(t.date) <= endOfLastMonth
      );

      // Current month income/expenses
      const monthlyIncome = currentMonthTransactions
        .filter((t) => t.type === "income" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpenses = currentMonthTransactions
        .filter((t) => t.type === "expense" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Last month for comparison
      const lastMonthIncome = lastMonthTransactions
        .filter((t) => t.type === "income" && (t.status === "pagamento_concluido" || t.status === "paid" || t.status === "confirmed"))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const lastMonthExpenses = lastMonthTransactions
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

      // Future commitments (pending/upcoming transactions in next 30 days)
      const futureCommitments = allTransactions
        .filter((t) => {
          const tDate = new Date(t.date);
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

      // Calculate changes
      const lastMonthBalance = lastMonthIncome - lastMonthExpenses;
      const currentMonthBalance = monthlyIncome - monthlyExpenses;
      const balanceChange =
        lastMonthBalance !== 0
          ? ((currentMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100
          : 0;
      const incomeChange =
        lastMonthIncome !== 0
          ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100
          : 0;
      const expenseChange =
        lastMonthExpenses !== 0
          ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
          : 0;

      setMetrics({
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
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
      currentMonthTransactions
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
  }, [user, period]);

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
