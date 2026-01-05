import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/contexts/AppModeContext";
import { useModulePreferences } from "@/hooks/useModulePreferences";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import CashflowChart from "@/components/CashflowChart";
import ExpenseChart from "@/components/ExpenseChart";
import PlansCard from "@/components/PlansCard";
import TransactionsTable from "@/components/TransactionsTable";
import GoalWidget from "@/components/goals/GoalWidget";
import { QuickAddInput } from "@/components/QuickAddInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCards } from "@/hooks/useCards";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { differenceInDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Receipt, TrendingUp } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const [period, setPeriod] = useState(30);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(startOfMonth(today));
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(endOfMonth(today));
  const { setMode } = useAppMode();
  const { modules } = useModulePreferences();
  
  // Calculate actual period for custom dates
  const effectivePeriod = customDateFrom && customDateTo 
    ? Math.max(1, differenceInDays(customDateTo, customDateFrom) + 1)
    : period;
    
  const { metrics, cashflowData, expensesByCategory, pendingExpenses, pendingIncomes, refetch } = useDashboardData(effectivePeriod, customDateFrom, customDateTo);

  const { cards } = useCards({ enabled: modules.creditCards });
  const totalCurrentCardBill = cards.reduce((sum, c) => sum + Number(c.currentBill || 0), 0);
  const totalAvailableCardLimit = cards.reduce((sum, c) => sum + Number(c.availableLimit || 0), 0);

  const { accounts } = useBankAccounts();
  const topAccounts = accounts.slice(0, 3);

  // Check if any widget-related module is active
  const showGoalsWidget = modules.budgets;

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
          
          {/* Visão geral */}
          <section className="grid grid-cols-1 gap-4">
            <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur card-shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Visão geral</p>
                    <p className="text-lg font-semibold text-foreground">Saldo geral</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-secondary text-muted-foreground border border-border/50">
                    {getPeriodLabel()}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                    {formatCurrency(metrics.currentBalance)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Previsto: <span className="font-semibold text-foreground">{formatCurrency(metrics.projectedBalance)}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-prosperity-emerald" />
                      <p className="text-[11px] text-muted-foreground">Entradas</p>
                    </div>
                    <p className="mt-1 text-base font-semibold text-prosperity-emerald">{formatCurrency(metrics.monthlyIncome)}</p>
                    <p className="text-[10px] text-muted-foreground">Previsto: {formatCurrency(metrics.monthlyIncomePending)}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-destructive" />
                      <p className="text-[11px] text-muted-foreground">Saídas</p>
                    </div>
                    <p className="mt-1 text-base font-semibold text-destructive">{formatCurrency(metrics.monthlyExpenses)}</p>
                    <p className="text-[10px] text-muted-foreground">Previsto: {formatCurrency(metrics.monthlyExpensesPending)}</p>
                  </div>
                </div>

                {modules.bankAccounts && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Minhas contas</p>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => navigate("/accounts")}>Ver</Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {topAccounts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhuma conta cadastrada</p>
                      ) : (
                        topAccounts.map((a) => (
                          <div key={a.id} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-foreground truncate">{a.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{a.bank_name}</p>
                            </div>
                            <p className={`text-[12px] font-semibold tabular-nums ${a.balance >= 0 ? "text-prosperity-emerald" : "text-destructive"}`}>
                              {formatCurrency(a.balance)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {modules.creditCards && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Meus cartões</p>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => navigate("/cards")}>Ver</Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {cards.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhum cartão cadastrado</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">Fatura do mês</p>
                            <p className="text-[12px] font-semibold tabular-nums text-foreground">{formatCurrency(totalCurrentCardBill)}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">Limite disponível</p>
                            <p className="text-[12px] font-semibold tabular-nums text-foreground">{formatCurrency(totalAvailableCardLimit)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur card-shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Próx. {effectivePeriod}d</p>
                    <p className="text-sm font-semibold text-foreground">A pagar</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{metrics.pendingCount} pendentes</p>
                </div>
                <div className="mt-3 space-y-2">
                  {pendingExpenses.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nada pendente no período</p>
                  ) : (
                    pendingExpenses.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{t.description}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(t.date + "T00:00:00"), "dd/MM")}</p>
                        </div>
                        <p className="text-[12px] font-semibold tabular-nums text-destructive">{formatCurrency(Number(t.amount))}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/transactions")}>Ver lançamentos</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur card-shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Próx. {effectivePeriod}d</p>
                    <p className="text-sm font-semibold text-foreground">A receber</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{pendingIncomes.length} itens</p>
                </div>
                <div className="mt-3 space-y-2">
                  {pendingIncomes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nada pendente no período</p>
                  ) : (
                    pendingIncomes.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{t.description}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(t.date + "T00:00:00"), "dd/MM")}</p>
                        </div>
                        <p className="text-[12px] font-semibold tabular-nums text-prosperity-emerald">{formatCurrency(Number(t.amount))}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/transactions")}>Ver lançamentos</Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Charts Row */}
          <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
            <CashflowChart data={cashflowData} />
            
            <div className="flex flex-col gap-4">
              {showGoalsWidget && <GoalWidget />}
              <ExpenseChart data={expensesByCategory} period={effectivePeriod} />
              <PlansCard />
            </div>
          </section>

          {/* Transactions */}
          <section>
            <TransactionsTable
              onRefresh={refetch}
              periodDays={effectivePeriod}
              customDateFrom={customDateFrom}
              customDateTo={customDateTo}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
