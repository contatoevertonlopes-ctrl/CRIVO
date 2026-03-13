import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";

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

const COMPLETED_STATUSES = ["paid", "pagamento_concluido", "confirmed"];

export const useAdaptiveModeData = (
  period: number = 30,
  customDateFrom?: Date,
  customDateTo?: Date
) => {
  const { transactions, isLoading, refetch } = useTransactions();

  const data = useMemo((): AdaptiveModeData => {
    if (transactions.length === 0) {
      return {
        currentBalance: 0,
        dailyExpenseAverage: 0,
        essentialExpenseAverage: 0,
        daysOfOxygen: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        freedomRate: 0,
        surplus: 0,
        daysOfFreedomEarned: 0,
        loading: isLoading,
      };
    }

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
    const totalIncome = transactions
      .filter((t) => t.type === "income" && COMPLETED_STATUSES.includes(t.status))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense" && COMPLETED_STATUSES.includes(t.status))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentBalance = totalIncome - totalExpenses;

    // Filter transactions for the selected period
    const recentTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date + "T00:00:00");
      return txDate >= startDate && txDate <= endDate;
    });

    // Calculate expenses for the period
    const recentExpenses = recentTransactions
      .filter((t) => t.type === "expense" && COMPLETED_STATUSES.includes(t.status))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const dailyExpenseAverage = recentExpenses / daysInPeriod;

    // Calculate essential expenses average
    const essentialExpenses = recentTransactions
      .filter((t) => 
        t.type === "expense" && 
        COMPLETED_STATUSES.includes(t.status) &&
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
      .filter((t) => t.type === "income" && COMPLETED_STATUSES.includes(t.status))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const surplus = periodIncome - recentExpenses;
    
    const freedomRate = periodIncome > 0 
      ? Math.round((surplus / periodIncome) * 100) 
      : 0;

    const daysOfFreedomEarned = dailyExpenseAverage > 0 && surplus > 0
      ? Math.floor(surplus / dailyExpenseAverage)
      : 0;

    return {
      currentBalance,
      dailyExpenseAverage,
      essentialExpenseAverage,
      daysOfOxygen,
      monthlyIncome: periodIncome,
      monthlyExpenses: recentExpenses,
      freedomRate,
      surplus,
      daysOfFreedomEarned,
      loading: isLoading,
    };
  }, [transactions, isLoading, period, customDateFrom, customDateTo]);

  return { ...data, refetch };
};
