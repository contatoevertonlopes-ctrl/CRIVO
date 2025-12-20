import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/contexts/AppModeContext";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import MetricCard from "@/components/MetricCard";
import CashflowChart from "@/components/CashflowChart";
import ExpenseChart from "@/components/ExpenseChart";
import PlansCard from "@/components/PlansCard";
import TransactionsTable from "@/components/TransactionsTable";
import SurvivalWidget from "@/components/SurvivalWidget";
import ProsperityWidget from "@/components/ProsperityWidget";
import { QuickAddInput } from "@/components/QuickAddInput";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdaptiveModeData } from "@/hooks/useAdaptiveModeData";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(30);
  const { mode } = useAppMode();
  const { metrics, cashflowData, expensesByCategory, refetch } = useDashboardData(period);
  const adaptiveData = useAdaptiveModeData(period);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 7: return "últimos 7 dias";
      case 30: return "últimos 30 dias";
      case 90: return "últimos 90 dias";
      case 365: return "último ano";
      default: return `últimos ${period} dias`;
    }
  };

  const getPreviousPeriodLabel = () => {
    switch (period) {
      case 7: return "vs. semana anterior";
      case 30: return "vs. mês anterior";
      case 90: return "vs. trimestre anterior";
      case 365: return "vs. ano anterior";
      default: return `vs. período anterior`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${
      mode === "survival" ? "bg-[var(--gradient-survival)]" : ""
    }`}>
      <Sidebar />
      
      <main className="flex-1 p-4 sm:p-5 lg:p-4 flex flex-col gap-4 sm:gap-5 min-w-0">
        <div className="pl-12 lg:pl-0">
          <DashboardHeader period={period} onPeriodChange={setPeriod} />
        </div>
        
        {/* Quick Add Input - Magic Bar */}
        <div className="max-w-2xl">
          <QuickAddInput onTransactionAdded={refetch} />
        </div>
        
        {/* Adaptive Mode Widget */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          {mode === "survival" ? (
            <SurvivalWidget
              currentBalance={adaptiveData.currentBalance}
              dailyExpenseAverage={adaptiveData.dailyExpenseAverage}
              essentialExpenseAverage={adaptiveData.essentialExpenseAverage}
              loading={adaptiveData.loading}
            />
          ) : (
            <ProsperityWidget
              monthlyIncome={adaptiveData.monthlyIncome}
              monthlyExpenses={adaptiveData.monthlyExpenses}
              loading={adaptiveData.loading}
            />
          )}
          
          {/* Summary Metrics - Condensed for widget layout */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Saldo atual"
              value={formatCurrency(metrics.currentBalance)}
              pill="Consolidado"
              trend={`${formatPercent(metrics.balanceChange)} ${getPreviousPeriodLabel()}`}
              trendUp={metrics.balanceChange >= 0}
            />
            <MetricCard
              title={`Entradas`}
              value={formatCurrency(metrics.monthlyIncome)}
              pill={getPeriodLabel()}
              trend={`${formatPercent(metrics.incomeChange)} ${getPreviousPeriodLabel()}`}
              trendUp={metrics.incomeChange >= 0}
            />
            <MetricCard
              title={`Saídas`}
              value={formatCurrency(metrics.monthlyExpenses)}
              pill={getPeriodLabel()}
              trend={`${formatPercent(metrics.expenseChange)} ${getPreviousPeriodLabel()}`}
              trendUp={metrics.expenseChange <= 0}
            />
            <MetricCard
              title="Compromissos"
              value={formatCurrency(metrics.futureCommitments)}
              pill={`Próximos ${period}d`}
              trend={`${metrics.pendingCount} pendentes`}
              trendUp={false}
            />
          </div>
        </section>

        {/* Charts & Plans */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.7fr_1.3fr] gap-5">
          <CashflowChart data={cashflowData} />
          
          <div className="flex flex-col gap-5">
            <ExpenseChart data={expensesByCategory} period={period} />
            <PlansCard />
          </div>
        </section>

        {/* Transactions Table */}
        <section>
          <TransactionsTable onRefresh={refetch} />
        </section>
      </main>
    </div>
  );
};

export default Index;
