import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import MetricCard from "@/components/MetricCard";
import CashflowChart from "@/components/CashflowChart";
import ExpenseChart from "@/components/ExpenseChart";
import PlansCard from "@/components/PlansCard";
import TransactionsTable from "@/components/TransactionsTable";
import { useDashboardData } from "@/hooks/useDashboardData";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(30);
  const { metrics, cashflowData, expensesByCategory, refetch } = useDashboardData(period);

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
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-5 lg:p-6 flex flex-col gap-5 min-w-0">
        <DashboardHeader period={period} onPeriodChange={setPeriod} />
        
        {/* Summary Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Saldo atual"
            value={formatCurrency(metrics.currentBalance)}
            pill="Conta consolidada"
            trend={`${formatPercent(metrics.balanceChange)} vs mês passado`}
            trendUp={metrics.balanceChange >= 0}
          />
          <MetricCard
            title="Entradas no mês"
            value={formatCurrency(metrics.monthlyIncome)}
            pill="Receitas"
            trend={`${formatPercent(metrics.incomeChange)} vs. mês passado`}
            trendUp={metrics.incomeChange >= 0}
          />
          <MetricCard
            title="Saídas no mês"
            value={formatCurrency(metrics.monthlyExpenses)}
            pill="Despesas"
            trend={`${formatPercent(metrics.expenseChange)} vs. mês passado`}
            trendUp={metrics.expenseChange <= 0}
          />
          <MetricCard
            title="Compromissos futuros"
            value={formatCurrency(metrics.futureCommitments)}
            pill={`Próximos ${period} dias`}
            trend={`${metrics.pendingCount} despesas pendentes`}
            trendUp={false}
          />
        </section>

        {/* Charts & Plans */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.7fr_1.3fr] gap-5">
          <CashflowChart data={cashflowData} />
          
          <div className="flex flex-col gap-5">
            <ExpenseChart data={expensesByCategory} />
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
