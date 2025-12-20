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
import GoalWidget from "@/components/goals/GoalWidget";
import { QuickAddInput } from "@/components/QuickAddInput";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAdaptiveModeData } from "@/hooks/useAdaptiveModeData";
import { differenceInDays } from "date-fns";
import { Wallet, TrendingUp, TrendingDown, Clock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(30);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const { mode, setMode } = useAppMode();
  
  // Calculate actual period for custom dates
  const effectivePeriod = customDateFrom && customDateTo 
    ? Math.max(1, differenceInDays(customDateTo, customDateFrom) + 1)
    : period;
    
  const { metrics, cashflowData, expensesByCategory, refetch } = useDashboardData(effectivePeriod, customDateFrom, customDateTo);
  const adaptiveData = useAdaptiveModeData(effectivePeriod, customDateFrom, customDateTo);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
      return;
    }

    const checkUserProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, app_mode")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.onboarding_completed) {
        navigate("/onboarding", { replace: true });
        return;
      }

      if (profile?.app_mode) {
        setMode(profile.app_mode as "survival" | "prosperity");
      }
    };

    checkUserProfile();
  }, [user, loading, navigate, setMode]);

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
    if (customDateFrom && customDateTo) {
      return `${effectivePeriod}d`;
    }
    switch (period) {
      case 7: return "7 dias";
      case 30: return "30 dias";
      case 90: return "90 dias";
      case 365: return "1 ano";
      default: return `${period}d`;
    }
  };

  const getPreviousPeriodLabel = () => {
    if (customDateFrom && customDateTo) {
      return "vs. período ant.";
    }
    switch (period) {
      case 7: return "vs. semana ant.";
      case 30: return "vs. mês ant.";
      case 90: return "vs. trim. ant.";
      case 365: return "vs. ano ant.";
      default: return "vs. período ant.";
    }
  };
  
  const handlePeriodChange = (newPeriod: number) => {
    setPeriod(newPeriod);
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
  };
  
  const handleCustomDateChange = (from: Date | undefined, to: Date | undefined) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);
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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-16 pb-24 lg:pt-0 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-6 lg:py-6 flex flex-col gap-4 lg:gap-5">
          {/* Header */}
          <DashboardHeader 
            period={period} 
            onPeriodChange={handlePeriodChange}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            onCustomDateChange={handleCustomDateChange}
          />
          
          {/* Quick Add Input */}
          <div className="max-w-2xl">
            <QuickAddInput onTransactionAdded={refetch} />
          </div>
          
          {/* Adaptive Widget + Metrics Grid */}
          <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
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
            
            {/* Metrics Grid - 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                title="Saldo atual"
                value={formatCurrency(metrics.currentBalance)}
                pill="Consolidado"
                trend={`${formatPercent(metrics.balanceChange)} ${getPreviousPeriodLabel()}`}
                trendUp={metrics.balanceChange >= 0}
              />
              <MetricCard
                title="Entradas"
                value={formatCurrency(metrics.monthlyIncome)}
                pill={getPeriodLabel()}
                trend={`${formatPercent(metrics.incomeChange)} ${getPreviousPeriodLabel()}`}
                trendUp={metrics.incomeChange >= 0}
              />
              <MetricCard
                title="Saídas"
                value={formatCurrency(metrics.monthlyExpenses)}
                pill={getPeriodLabel()}
                trend={`${formatPercent(metrics.expenseChange)} ${getPreviousPeriodLabel()}`}
                trendUp={metrics.expenseChange <= 0}
              />
              <MetricCard
                title="Compromissos"
                value={formatCurrency(metrics.futureCommitments)}
                pill={`Próx. ${period}d`}
                trend={`${metrics.pendingCount} pendentes`}
                trendUp={false}
              />
            </div>
          </section>

          {/* Charts Row */}
          <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
            <CashflowChart data={cashflowData} />
            
            <div className="flex flex-col gap-4">
              <GoalWidget />
              <ExpenseChart data={expensesByCategory} period={period} />
              <PlansCard />
            </div>
          </section>

          {/* Transactions */}
          <section>
            <TransactionsTable onRefresh={refetch} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
