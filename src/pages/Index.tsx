import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/contexts/AppModeContext";
import { useModulePreferences } from "@/hooks/useModulePreferences";
import { useSubscription } from "@/hooks/useSubscription";
import { useTheme } from "next-themes";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import CashflowChart from "@/components/CashflowChart";
import ExpenseChart from "@/components/ExpenseChart";
import PlansCard from "@/components/PlansCard";
import GoalWidget from "@/components/goals/GoalWidget";
import { QuickAddInput } from "@/components/QuickAddInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCards } from "@/hooks/useCards";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import BankAvatar from "@/components/BankAvatar";
import { addMonths, differenceInDays, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { Receipt, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Responsive, WidthProvider, type Layout, type Layouts } from "react-grid-layout";

import { supabase } from "@/integrations/supabase/client";

const ResponsiveGridLayout = WidthProvider(Responsive);

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const today = new Date();
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(startOfMonth(today));
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(endOfMonth(today));
  const { setMode, mode } = useAppMode();
  const { modules } = useModulePreferences();
  const { subscribed, loading: subscriptionLoading } = useSubscription();

  const isSurvival = mode === "survival";
  
  // Calculate actual period for custom dates
  const effectivePeriod = customDateFrom && customDateTo 
    ? Math.max(1, differenceInDays(customDateTo, customDateFrom) + 1)
    : 30;
    
  const { metrics, cashflowData, expensesByCategory, pendingExpenses, pendingIncomes, refetch } = useDashboardData(effectivePeriod, customDateFrom, customDateTo);

  const { cards } = useCards({ enabled: modules.creditCards });
  const totalCurrentCardBill = cards.reduce((sum, c) => sum + Number(c.currentBill || 0), 0);
  const totalAvailableCardLimit = cards.reduce((sum, c) => sum + Number(c.availableLimit || 0), 0);

  const { accounts } = useBankAccounts();
  const topAccounts = accounts.slice(0, 3);

  // Check if any widget-related module is active
  const showGoalsWidget = modules.budgets;
  const showPlansWidget = !subscriptionLoading && !subscribed;

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

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const normalized = hex.trim().replace("#", "");
    if (normalized.length === 3) {
      const r = parseInt(normalized[0] + normalized[0], 16);
      const g = parseInt(normalized[1] + normalized[1], 16);
      const b = parseInt(normalized[2] + normalized[2], 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      return { r, g, b };
    }
    if (normalized.length === 6) {
      const r = parseInt(normalized.substring(0, 2), 16);
      const g = parseInt(normalized.substring(2, 4), 16);
      const b = parseInt(normalized.substring(4, 6), 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      return { r, g, b };
    }
    return null;
  };

  const rgbaFromHex = (hex: string, alpha: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`;
  };

  // Returns the color adjusted for visibility — lightens very dark colors in dark mode
  const getAccentColor = (hex: string): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    if (resolvedTheme === "dark" && luminance < 0.15) {
      // Blend 65% white so black/very-dark colors become visible
      const blend = (c: number) => Math.round(c * 0.35 + 255 * 0.65);
      return `rgb(${blend(rgb.r)}, ${blend(rgb.g)}, ${blend(rgb.b)})`;
    }
    return hex;
  };

  const storageKey = user ? `dashboard_layout_v1:${user.id}` : null;

  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [wiggleOnce, setWiggleOnce] = useState(false);

  const getDefaultLgLayout = (): Layout[] => {
    const base: Layout[] = [
      { i: "balance", x: 0, y: 0, w: 8, h: 7, minW: 6, minH: 6 },
      { i: "pay", x: 0, y: 7, w: 4, h: 6, minW: 3, minH: 5 },
      { i: "receive", x: 4, y: 7, w: 4, h: 6, minW: 3, minH: 5 },
      { i: "cashflow", x: 0, y: 13, w: 8, h: 11, minW: 6, minH: 10 },
      { i: "expense", x: 8, y: 13, w: 4, h: 8, minW: 3, minH: 6 },
    ];

    if (modules.bankAccounts) {
      base.push({ i: "accounts", x: 8, y: 0, w: 4, h: 6, minW: 3, minH: 5 });
    }

    if (modules.creditCards) {
      base.push({ i: "cards", x: 8, y: 6, w: 4, h: 7, minW: 3, minH: 6 });
    }

    if (showGoalsWidget) {
      base.push({ i: "goals", x: 8, y: 21, w: 4, h: 4, minW: 3, minH: 3 });
    }

    if (showPlansWidget) {
      base.push({ i: "plans", x: 8, y: 25, w: 4, h: 6, minW: 3, minH: 5 });
    }
    return base;
  };

  const normalizeLgLayout = (candidate: Layout[] | undefined | null): Layout[] => {
    const defaults = getDefaultLgLayout();
    const defaultsById = new Map(defaults.map((l) => [l.i, l]));
    const validIds = new Set(defaults.map((l) => l.i));

    const sanitized: Layout[] = (candidate || [])
      .filter((l) => validIds.has(l.i))
      .map((l) => ({
        ...defaultsById.get(l.i)!,
        ...l,
      }));

    for (const d of defaults) {
      if (!sanitized.some((s) => s.i === d.i)) sanitized.push(d);
    }

    return sanitized;
  };

  const [persistedLayouts, setPersistedLayouts] = useState<Layouts>(() => ({ lg: getDefaultLgLayout() }));
  const [draftLayouts, setDraftLayouts] = useState<Layouts>(() => ({ lg: getDefaultLgLayout() }));

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        const defaults = { lg: getDefaultLgLayout() };
        setPersistedLayouts(defaults);
        setDraftLayouts(defaults);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<Layouts>;
      const next = {
        lg: normalizeLgLayout(parsed.lg),
      };
      setPersistedLayouts(next);
      setDraftLayouts(next);
    } catch {
      const defaults = { lg: getDefaultLgLayout() };
      setPersistedLayouts(defaults);
      setDraftLayouts(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, modules.bankAccounts, modules.creditCards, showGoalsWidget, showPlansWidget]);

  useEffect(() => {
    if (!isEditingLayout) return;
    setWiggleOnce(true);
    const t = window.setTimeout(() => setWiggleOnce(false), 650);
    return () => window.clearTimeout(t);
  }, [isEditingLayout]);

  const getPeriodLabel = () => {
    if (!customDateFrom || !customDateTo) return "Este mês";

    const thisStart = startOfMonth(today);
    const thisEnd = endOfMonth(today);
    const prevRef = subMonths(today, 1);
    const prevStart = startOfMonth(prevRef);
    const prevEnd = endOfMonth(prevRef);
    const nextRef = addMonths(today, 1);
    const nextStart = startOfMonth(nextRef);
    const nextEnd = endOfMonth(nextRef);

    if (isSameDay(customDateFrom, prevStart) && isSameDay(customDateTo, prevEnd)) return "Mês anterior";
    if (isSameDay(customDateFrom, thisStart) && isSameDay(customDateTo, thisEnd)) return "Este mês";
    if (isSameDay(customDateFrom, nextStart) && isSameDay(customDateTo, nextEnd)) return "Próximo mês";

    return "Personalizado";
  };

  const PayReceiveCards = ({ className }: { className?: string }) => {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className ?? ""}`.trim()}>
        <Card className="rounded-2xl border-border/70 bg-card/50 backdrop-blur card-shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
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

        <Card className="rounded-2xl border-border/70 bg-card/50 backdrop-blur card-shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
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
      </div>
    );
  };

  const OverlayGrip = () => (
    <div className="dashboard-drag-handle absolute top-2 left-1/2 -translate-x-1/2 z-20 hidden lg:block">
      <div
        className="w-12 h-5 rounded-full border border-border/60 bg-background cursor-move shadow-sm"
        aria-hidden="true"
      />
    </div>
  );

  const BalanceCard = (
    <Card
      className={
        [
          "rounded-2xl border-border/70 bg-card/50 backdrop-blur card-shadow-soft h-full relative",
          isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {isEditingLayout && <OverlayGrip />}
      <CardContent className="p-5 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">Visão geral</p>
            <p className="text-lg font-semibold text-foreground">Saldo geral</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-secondary text-muted-foreground border border-border/70">
            {getPeriodLabel()}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground finance-value">
            {formatCurrency(metrics.currentBalance)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Previsto: <span className="font-semibold text-foreground finance-value">{formatCurrency(metrics.projectedBalance)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/70 bg-background/40 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-prosperity-emerald" />
              <p className="text-[11px] text-muted-foreground">Entradas</p>
            </div>
            <p className="mt-1 text-base font-semibold text-prosperity-emerald finance-value">{formatCurrency(metrics.monthlyIncome)}</p>
            <p className="text-[10px] text-muted-foreground finance-value">Prev: {formatCurrency(metrics.monthlyIncomePending)}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/40 p-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-destructive" />
              <p className="text-[11px] text-muted-foreground">Saídas</p>
            </div>
            <p className="mt-1 text-base font-semibold text-destructive finance-value">{formatCurrency(metrics.monthlyExpenses)}</p>
            <p className="text-[10px] text-muted-foreground finance-value">Prev: {formatCurrency(metrics.monthlyExpensesPending)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AccountsCard = (
    <Card
      className={
        [
          "rounded-2xl border-border/70 bg-card/50 backdrop-blur card-shadow-soft h-full relative",
          isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {isEditingLayout && <OverlayGrip />}
      <CardContent className="p-5 h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <p className="text-sm font-semibold text-foreground">Minhas Contas</p>
          <Button variant="ghost" size="sm" className="dashboard-no-drag h-8 px-2 text-xs" onClick={() => navigate("/accounts")}>Ver</Button>
        </div>
        <ScrollArea className="mt-3 flex-1 min-h-0">
          <div className="space-y-2.5 pr-3">
          {topAccounts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma conta cadastrada</p>
          ) : (
            topAccounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 transition-colors"
                style={a.color ? {
                  borderLeftColor: getAccentColor(a.color),
                  borderLeftWidth: "3px",
                  paddingLeft: "10px",
                } : undefined}
              >
                <BankAvatar bankName={a.bank_name || a.name} color={a.color} size={36} />
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground truncate leading-tight">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{a.bank_name}</p>
                </div>
                {/* Balance */}
                <p className={`text-[13px] font-semibold tabular-nums shrink-0 ${
                  a.balance >= 0 ? "text-income" : "text-expense"
                }`}>
                  {a.balance < 0 ? "-" : ""}{formatCurrency(Math.abs(a.balance))}
                </p>
              </div>
            ))
          )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const CardsCard = (
    <Card
      className={
        [
          "rounded-2xl border-border/70 bg-card/50 backdrop-blur card-shadow-soft h-full relative",
          isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {isEditingLayout && <OverlayGrip />}
      <CardContent className="p-5 h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <p className="text-sm font-semibold text-foreground">Meus Cartões</p>
          <Button variant="ghost" size="sm" className="dashboard-no-drag h-8 px-2 text-xs" onClick={() => navigate("/cards")}>Ver</Button>
        </div>

        <div className="mt-3 flex flex-col gap-3 overflow-hidden flex-1 min-h-0">
          {cards.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum cartão cadastrado</p>
          ) : (
            <>
              <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">Fatura do mês</p>
                  <p className="text-[12px] font-semibold tabular-nums text-foreground">{formatCurrency(totalCurrentCardBill)}</p>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">Limite disponível</p>
                  <p className="text-[12px] font-semibold tabular-nums text-foreground">{formatCurrency(totalAvailableCardLimit)}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-2 pr-3">
                {cards.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 transition-colors"
                    style={c.color ? {
                      borderLeftColor: getAccentColor(c.color),
                      borderLeftWidth: "3px",
                      paddingLeft: "10px",
                    } : undefined}
                  >
                    <BankAvatar bankName={c.name} color={c.color} size={36} />
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-foreground truncate leading-tight">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Limite: <span className="font-medium text-foreground/80">{formatCurrency(Number(c.availableLimit ?? 0))}</span>
                      </p>
                    </div>
                    {/* Bill amount — pill when > 0, plain when zero */}
                    {Number(c.currentBill ?? 0) > 0 ? (
                      <span
                        className="text-[12px] font-semibold tabular-nums px-2.5 py-1 rounded-full shrink-0"
                        style={c.color ? {
                          backgroundColor: rgbaFromHex(c.color, resolvedTheme === "dark" ? 0.25 : 0.14) ?? undefined,
                          color: getAccentColor(c.color),
                        } : undefined}
                      >
                        {formatCurrency(Number(c.currentBill))}
                      </span>
                    ) : (
                      <p className="text-[12px] font-semibold tabular-nums text-muted-foreground shrink-0">
                        {formatCurrency(0)}
                      </p>
                    )}
                  </div>
                ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const PayCard = (
    <Card
      className={
        [
          "rounded-2xl border-border/70 bg-card/50 backdrop-blur card-shadow-soft h-full relative",
          isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {isEditingLayout && <OverlayGrip />}
      <CardContent className="p-5 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
            <p className="text-sm font-semibold text-foreground">A pagar</p>
          </div>
          <p className="text-xs text-muted-foreground">{metrics.pendingCount} pendentes</p>
        </div>
        <ScrollArea className="mt-3 flex-1 min-h-0">
          <div className="space-y-2 pr-3">
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
        </ScrollArea>
        <div className="mt-4 shrink-0">
          <Button variant="outline" size="sm" className="dashboard-no-drag w-full" onClick={() => navigate("/transactions?type=expense&status=pending")}>Ver lançamentos</Button>
        </div>
      </CardContent>
    </Card>
  );

  const ReceiveCard = (
    <Card
      className={
        [
          "rounded-2xl border-border/70 bg-card/50 backdrop-blur card-shadow-soft h-full relative",
          isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      {isEditingLayout && <OverlayGrip />}
      <CardContent className="p-5 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
            <p className="text-sm font-semibold text-foreground">A receber</p>
          </div>
          <p className="text-xs text-muted-foreground">{pendingIncomes.length} itens</p>
        </div>
        <ScrollArea className="mt-3 flex-1 min-h-0">
          <div className="space-y-2 pr-3">
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
        </ScrollArea>
        <div className="mt-4 shrink-0">
          <Button variant="outline" size="sm" className="dashboard-no-drag w-full" onClick={() => navigate("/transactions?type=income&status=pending")}>Ver lançamentos</Button>
        </div>
      </CardContent>
    </Card>
  );

  const CashflowWidget = (
    <div className="h-full relative">
      {isEditingLayout && <OverlayGrip />}
      <div
        className={
          [
            "h-full dashboard-no-drag",
            isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
      >
        <CashflowChart data={cashflowData} periodLabel={getPeriodLabel()} fitHeight />
      </div>
    </div>
  );

  const ExpenseWidget = (
    <div className="h-full relative">
      {isEditingLayout && <OverlayGrip />}
      <div
        className={
          [
            "h-full dashboard-no-drag",
            isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
      >
        <ExpenseChart data={expensesByCategory} period={effectivePeriod} periodLabel={getPeriodLabel()} fitHeight />
      </div>
    </div>
  );

  const GoalsWidget = showGoalsWidget ? (
    <div className="h-full relative">
      {isEditingLayout && <OverlayGrip />}
      <div
        className={
          [
            "h-full dashboard-no-drag",
            isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
      >
        <GoalWidget className="h-full" />
      </div>
    </div>
  ) : null;

  const PlansWidget = showPlansWidget ? (
    <div className="h-full relative">
      {isEditingLayout && <OverlayGrip />}
      <div
        className={
          [
            "h-full dashboard-no-drag",
            isEditingLayout && wiggleOnce ? "dashboard-edit-wiggle-card" : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
      >
        <PlansCard />
      </div>
    </div>
  ) : null;

  
  const handleCustomDateChange = (from: Date | undefined, to: Date | undefined) => {
    // Se limpar a seleção, volta para o padrão (este mês)
    if (!from || !to) {
      setCustomDateFrom(startOfMonth(today));
      setCustomDateTo(endOfMonth(today));
      return;
    }

    setCustomDateFrom(from);
    setCustomDateTo(to);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-16 pb-nav-safe lg:pt-0 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-6 lg:py-6 flex flex-col gap-4 lg:gap-5">
          {/* Header */}
          <DashboardHeader 
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            onCustomDateChange={handleCustomDateChange}
          />
          
          {/* Quick Add Input */}
          <div className="max-w-2xl">
            <QuickAddInput onTransactionAdded={refetch} />
          </div>

          {/* Controles de layout (desktop) */}
          <div className="hidden lg:flex items-center justify-end gap-2">
            {isEditingLayout ? (
              <>
                <span className="text-xs text-muted-foreground mr-auto">Modo edição de layout</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="dashboard-no-drag"
                  onClick={() => {
                    setDraftLayouts(persistedLayouts);
                    setIsEditingLayout(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="dashboard-no-drag"
                  onClick={() => {
                    const normalized = { lg: normalizeLgLayout(draftLayouts.lg) };
                    setPersistedLayouts(normalized);
                    setDraftLayouts(normalized);
                    try {
                      if (storageKey) localStorage.setItem(storageKey, JSON.stringify({ lg: normalized.lg }));
                    } catch {
                      // ignore
                    }
                    setIsEditingLayout(false);
                  }}
                >
                  Salvar layout
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="dashboard-no-drag"
                onClick={() => {
                  setDraftLayouts(persistedLayouts);
                  setIsEditingLayout(true);
                }}
              >
                Editar layout
              </Button>
            )}
          </div>

          {/* Desktop: grid arrastável/redimensionável */}
          <section className="hidden lg:block">
            <ResponsiveGridLayout
              className="layout"
              breakpoints={{ lg: 1024 }}
              cols={{ lg: 12 }}
              rowHeight={24}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              layouts={{ lg: (isEditingLayout ? draftLayouts.lg : persistedLayouts.lg) ?? getDefaultLgLayout() }}
              isDraggable={isEditingLayout}
              isResizable={isEditingLayout}
              draggableHandle=".dashboard-drag-handle"
              draggableCancel=".dashboard-no-drag,button,a,input,textarea,select,option"
              compactType="vertical"
              preventCollision={false}
              onLayoutChange={(_, all) => {
                if (!isEditingLayout) return;
                setDraftLayouts({ lg: normalizeLgLayout(all.lg) });
              }}
            >
              <div key="balance" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{BalanceCard}</div>
              {modules.bankAccounts && (
                <div key="accounts" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{AccountsCard}</div>
              )}
              {modules.creditCards && (
                <div key="cards" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{CardsCard}</div>
              )}
              <div key="pay" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{PayCard}</div>
              <div key="receive" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{ReceiveCard}</div>
              <div key="cashflow" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{CashflowWidget}</div>
              <div key="expense" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{ExpenseWidget}</div>
              {showGoalsWidget && (
                <div key="goals" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{GoalsWidget}</div>
              )}
              {showPlansWidget && (
                <div key="plans" className={isEditingLayout ? "min-h-0 overflow-hidden rounded-2xl ring-1 ring-primary/20" : "min-h-0 overflow-hidden"}>{PlansWidget}</div>
              )}
            </ResponsiveGridLayout>
          </section>

          {/* Mobile/Tablet: layout estático com stagger animation */}
          <section className="lg:hidden flex flex-col gap-4">
            <div className="stagger-child" style={{ "--i": 0 } as React.CSSProperties}>{BalanceCard}</div>
            {(modules.bankAccounts || modules.creditCards) && (
              <div className="flex flex-col gap-4 stagger-child" style={{ "--i": 1 } as React.CSSProperties}>
                {modules.bankAccounts && AccountsCard}
                {modules.creditCards && CardsCard}
              </div>
            )}
            <div className="stagger-child" style={{ "--i": 2 } as React.CSSProperties}><PayReceiveCards /></div>
            <div className="stagger-child" style={{ "--i": 3 } as React.CSSProperties}><CashflowChart data={cashflowData} periodLabel={getPeriodLabel()} /></div>
            {showGoalsWidget && <div className="stagger-child" style={{ "--i": 4 } as React.CSSProperties}><GoalWidget /></div>}
            <div className="stagger-child" style={{ "--i": 5 } as React.CSSProperties}><ExpenseChart data={expensesByCategory} period={effectivePeriod} periodLabel={getPeriodLabel()} /></div>
            {showPlansWidget && <div className="stagger-child" style={{ "--i": 6 } as React.CSSProperties}><PlansCard /></div>}
          </section>

          {/* Charts Row (desktop agora é no grid) */}

          {/* Transactions no desktop fica dentro do grid */}
        </div>
      </main>
    </div>
  );
};

export default Index;
