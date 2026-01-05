import { useMemo } from "react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import {
  calculateTransactionTotals,
  isTransferTransaction,
  PAID_STATUSES,
  PENDING_STATUSES,
} from "@/utils/transactionTotals";

interface DashboardMetrics {
  currentBalance: number;
  projectedBalance: number;
  monthlyIncome: number;
  monthlyIncomePending: number;
  monthlyExpenses: number;
  monthlyExpensesPending: number;
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

type DashboardPendingItem = Pick<Transaction, "id" | "date" | "description" | "amount" | "status" | "type">;

// Exclude transfers from expense/income calculations to avoid double counting
const isTransfer = (t: Transaction) => isTransferTransaction(t);

export const useDashboardData = (period: number = 30, customDateFrom?: Date, customDateTo?: Date) => {
  const { transactions, isLoading: transactionsLoading, refetch } = useTransactions();
  const { accounts, isLoading: accountsLoading, totalPatrimony } = useBankAccounts();

  const result = useMemo(() => {
    if (transactions.length === 0) {
      return {
        metrics: {
          currentBalance: 0,
          projectedBalance: 0,
          monthlyIncome: 0,
          monthlyIncomePending: 0,
          monthlyExpenses: 0,
          monthlyExpensesPending: 0,
          futureCommitments: 0,
          pendingCount: 0,
          balanceChange: 0,
          incomeChange: 0,
          expenseChange: 0,
        },
        cashflowData: [],
        expensesByCategory: [{ name: "Sem dados", value: 100 }],
        pendingExpenses: [] as DashboardPendingItem[],
        pendingIncomes: [] as DashboardPendingItem[],
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

    const currentPeriodTotals = calculateTransactionTotals(currentPeriodTransactions, {
      excludeTransfers: true,
    });
    const previousPeriodTotals = calculateTransactionTotals(previousPeriodTransactions, {
      excludeTransfers: true,
    });

    const periodIncome = currentPeriodTotals.incomePaid;
    const periodExpenses = currentPeriodTotals.expensePaid;

    const periodIncomePending = currentPeriodTotals.pendingIncome;
    const periodExpensesPending = currentPeriodTotals.pendingExpense;

    const previousPeriodIncome = previousPeriodTotals.incomePaid;
    const previousPeriodExpenses = previousPeriodTotals.expensePaid;

    // Saldo total: se houver contas bancárias, usa o patrimônio (saldo real do banco).
    // Caso contrário, faz fallback para o saldo do período (entradas pagas - saídas pagas).
    const hasBankAccounts = (accounts?.length ?? 0) > 0;
    const balanceFromPeriod = currentPeriodTotals.balancePaid;
    const currentBalance = hasBankAccounts ? totalPatrimony : balanceFromPeriod;

    // Saldo previsto: saldo atual + (entradas pendentes - saídas pendentes) no período selecionado.
    const projectedBalance = currentBalance + periodIncomePending - periodExpensesPending;

    // Commitments (pending expenses within the selected period)
    const commitmentTransactions = currentPeriodTransactions.filter(
      (t) =>
        t.type === "expense" &&
        PENDING_STATUSES.includes(t.status as (typeof PENDING_STATUSES)[number]) &&
        !isTransfer(t)
    );

    const pendingExpenses = commitmentTransactions
      .slice()
      .sort((a, b) => new Date(a.date + "T00:00:00").getTime() - new Date(b.date + "T00:00:00").getTime())
      .slice(0, 4)
      .map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: Number(t.amount),
        status: t.status,
        type: t.type,
      }));

    const pendingIncomes = currentPeriodTransactions
      .filter(
        (t) =>
          t.type === "income" &&
          PENDING_STATUSES.includes(t.status as (typeof PENDING_STATUSES)[number]) &&
          !isTransfer(t)
      )
      .slice()
      .sort((a, b) => new Date(a.date + "T00:00:00").getTime() - new Date(b.date + "T00:00:00").getTime())
      .slice(0, 4)
      .map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: Number(t.amount),
        status: t.status,
        type: t.type,
      }));

    const futureCommitments = commitmentTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const pendingCount = commitmentTransactions.length;

    // Calculate changes compared to previous period
    const previousBalance = previousPeriodTotals.balancePaid;
    const currentPeriodBalance = currentPeriodTotals.balancePaid;
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
      projectedBalance,
      monthlyIncome: periodIncome,
      monthlyIncomePending: periodIncomePending,
      monthlyExpenses: periodExpenses,
      monthlyExpensesPending: periodExpensesPending,
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
        .filter((t) => t.type === "income" && PAID_STATUSES.includes(t.status as (typeof PAID_STATUSES)[number]) && !isTransfer(t))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const despesas = monthTransactions
        .filter((t) => t.type === "expense" && PAID_STATUSES.includes(t.status as (typeof PAID_STATUSES)[number]) && !isTransfer(t))
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
      pendingExpenses,
      pendingIncomes,
    };
  }, [transactions, period, customDateFrom, customDateTo]);

  return {
    loading: transactionsLoading || accountsLoading,
    metrics: result.metrics,
    cashflowData: result.cashflowData,
    expensesByCategory: result.expensesByCategory,
    pendingExpenses: result.pendingExpenses,
    pendingIncomes: result.pendingIncomes,
    refetch,
  };
};
