import { useMemo } from "react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";

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

const COMPLETED_STATUSES = ["pagamento_concluido", "paid", "confirmed"];
const PENDING_STATUSES = ["em_aberto", "a_vencer", "pending"];
// Exclude transfers from expense/income calculations to avoid double counting
const isTransfer = (t: Transaction) => t.category === "Transferência" || t.tag === "transferencia";

export const useDashboardData = (period: number = 30, customDateFrom?: Date, customDateTo?: Date) => {
  const { transactions, isLoading, refetch } = useTransactions();

  const result = useMemo(() => {
    if (transactions.length === 0) {
      return {
        metrics: {
          currentBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          futureCommitments: 0,
          pendingCount: 0,
          balanceChange: 0,
          incomeChange: 0,
          expenseChange: 0,
        },
        cashflowData: [],
        expensesByCategory: [{ name: "Sem dados", value: 100 }],
      };
    }

    const now = new Date();
    
    // Use custom dates if provided, otherwise use period
    const periodStartDate = customDateFrom 
      ? new Date(customDateFrom.getTime())
      : new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    
    const periodEndDate = customDateTo
      ? new Date(customDateTo.getTime() + 24 * 60 * 60 * 1000)
      : now;
      
    const periodDays = customDateFrom && customDateTo
      ? Math.ceil((periodEndDate.getTime() - periodStartDate.getTime()) / (24 * 60 * 60 * 1000))
      : period;
      
    const previousPeriodStart = new Date(periodStartDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = new Date(periodStartDate.getTime());
    const futureDate = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    // Filter transactions for current period
    const currentPeriodTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date + "T00:00:00");
      return tDate >= periodStartDate && tDate <= periodEndDate;
    });
    
    // Filter transactions for previous period (for comparison)
    const previousPeriodTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date + "T00:00:00");
      return tDate >= previousPeriodStart && tDate < previousPeriodEnd;
    });

    // Current period income/expenses (excluding transfers)
    const periodIncome = currentPeriodTransactions
      .filter((t) => t.type === "income" && COMPLETED_STATUSES.includes(t.status) && !isTransfer(t))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const periodExpenses = currentPeriodTransactions
      .filter((t) => t.type === "expense" && COMPLETED_STATUSES.includes(t.status) && !isTransfer(t))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Previous period for comparison (excluding transfers)
    const previousPeriodIncome = previousPeriodTransactions
      .filter((t) => t.type === "income" && COMPLETED_STATUSES.includes(t.status) && !isTransfer(t))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousPeriodExpenses = previousPeriodTransactions
      .filter((t) => t.type === "expense" && COMPLETED_STATUSES.includes(t.status) && !isTransfer(t))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Total balance (all time income - expenses)
    const totalIncome = transactions
      .filter((t) => t.type === "income" && COMPLETED_STATUSES.includes(t.status))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense" && COMPLETED_STATUSES.includes(t.status))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentBalance = totalIncome - totalExpenses;

    // Future commitments (pending/upcoming transactions in next X days)
    const futureCommitments = transactions
      .filter((t) => {
        const tDate = new Date(t.date + "T00:00:00");
        return (
          t.type === "expense" &&
          PENDING_STATUSES.includes(t.status) &&
          tDate >= now &&
          tDate <= futureDate
        );
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingCount = transactions.filter(
      (t) => t.type === "expense" && PENDING_STATUSES.includes(t.status)
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

    const metrics: DashboardMetrics = {
      currentBalance,
      monthlyIncome: periodIncome,
      monthlyExpenses: periodExpenses,
      futureCommitments,
      pendingCount,
      balanceChange,
      incomeChange,
      expenseChange,
    };

    // Calculate cashflow data for last 6 months
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const last6Months: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date + "T00:00:00");
        return tDate >= monthDate && tDate <= monthEnd;
      });

      // Exclude transfers from cashflow calculations to avoid double counting
      const receitas = monthTransactions
        .filter((t) => t.type === "income" && COMPLETED_STATUSES.includes(t.status) && !isTransfer(t))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const despesas = monthTransactions
        .filter((t) => t.type === "expense" && COMPLETED_STATUSES.includes(t.status) && !isTransfer(t))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      last6Months.push({
        month: monthNames[monthDate.getMonth()],
        receitas,
        despesas,
      });
    }

    // Calculate expenses by category (excluding transfers)
    const categoryMap = new Map<string, number>();
    currentPeriodTransactions
      .filter((t) => t.type === "expense" && !isTransfer(t))
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

    return {
      metrics,
      cashflowData: last6Months,
      expensesByCategory: categories,
    };
  }, [transactions, period, customDateFrom, customDateTo]);

  return {
    loading: isLoading,
    metrics: result.metrics,
    cashflowData: result.cashflowData,
    expensesByCategory: result.expensesByCategory,
    refetch,
  };
};
