import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown, PieChart, BarChart3, Lock, Crown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import Sidebar from "@/components/Sidebar";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  status: string;
}

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6months");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Process data for charts
  const getMonthlyData = () => {
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    
    transactions.forEach((t) => {
      const monthKey = t.date.substring(0, 7);
      const current = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
      if (t.type === "income") {
        current.income += t.amount;
      } else {
        current.expense += t.amount;
      }
      monthlyMap.set(monthKey, current);
    });

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short" }),
        entradas: data.income,
        saidas: data.expense,
        saldo: data.income - data.expense,
      }));
  };

  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

    const COLORS = ["hsl(142 76% 45%)", "hsl(217 91% 60%)", "hsl(48 96% 53%)", "hsl(0 84% 60%)", "hsl(280 65% 60%)", "hsl(30 100% 50%)"];
    
    return Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }));
  };

  const getStats = () => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const avgIncome = totalIncome / Math.max(1, transactions.filter((t) => t.type === "income").length);
    const avgExpense = totalExpense / Math.max(1, transactions.filter((t) => t.type === "expense").length);

    return { totalIncome, totalExpense, balance, avgIncome, avgExpense };
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();
  const stats = getStats();

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const ProFeatureOverlay = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {!subscribed && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-2xl">
          <Lock className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Recurso exclusivo do Plano Pro
          </p>
          <Button
            size="sm"
            onClick={() => navigate("/plans")}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Crown className="w-4 h-4" />
            Assinar Pro
          </Button>
        </div>
      )}
      <div className={!subscribed ? "filter blur-sm pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8 pl-12 lg:pl-0">
            <div>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Voltar</span>
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Relatórios & Gráficos</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                Análise detalhada das suas finanças
              </p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="12months">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">Total Entradas</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(stats.totalIncome)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                <p className="text-xs sm:text-sm text-muted-foreground">Total Saídas</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-destructive">{formatCurrency(stats.totalExpense)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                <p className="text-xs sm:text-sm text-muted-foreground">Saldo Total</p>
              </div>
              <p className={`text-lg sm:text-2xl font-bold ${stats.balance >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(stats.balance)}
              </p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-gradient-to-bl from-background to-black border border-secondary p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                <p className="text-xs sm:text-sm text-muted-foreground">Categorias</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold">{categoryData.length}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Area Chart - Fluxo de Caixa */}
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-5">
              <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Fluxo de Caixa Mensal</h3>
              {loading ? (
                <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 280}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 76% 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 76% 45%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                    <XAxis dataKey="month" stroke="hsl(220 9% 46%)" fontSize={10} />
                    <YAxis stroke="hsl(220 9% 46%)" fontSize={10} tickFormatter={(v) => `R$${v / 1000}k`} width={45} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222 47% 5%)",
                        border: "1px solid hsl(217 33% 17%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="entradas" stroke="hsl(142 76% 45%)" fill="url(#colorEntradas)" name="Entradas" />
                    <Area type="monotone" dataKey="saidas" stroke="hsl(0 84% 60%)" fill="url(#colorSaidas)" name="Saídas" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart - Despesas por Categoria */}
            <ProFeatureOverlay>
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-5">
                <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Despesas por Categoria</h3>
                {loading ? (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 160 : 200}>
                      <RechartsPie>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={window.innerWidth < 640 ? 35 : 50}
                          outerRadius={window.innerWidth < 640 ? 60 : 80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => {
                            return (
                              <text fill="white" fontSize={11}>
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                          labelLine={false}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(222 47% 5%)",
                            border: "1px solid hsl(217 33% 17%)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                    {/* Legenda detalhada */}
                    <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                      {categoryData.map((item) => {
                        const total = categoryData.reduce((acc, c) => acc + c.value, 0);
                        const percentage = ((item.value / total) * 100).toFixed(1);
                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-muted-foreground truncate max-w-[100px] sm:max-w-[140px]">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="font-medium">{formatCurrency(item.value)}</span>
                              <span className="text-muted-foreground w-12 text-right">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </ProFeatureOverlay>

            {/* Bar Chart - Comparativo Mensal */}
            <ProFeatureOverlay>
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-5">
                <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Comparativo de Saldo Mensal</h3>
                {loading ? (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 280}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                      <XAxis dataKey="month" stroke="hsl(220 9% 46%)" fontSize={10} />
                      <YAxis stroke="hsl(220 9% 46%)" fontSize={10} tickFormatter={(v) => `R$${v / 1000}k`} width={45} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(222 47% 5%)",
                          border: "1px solid hsl(217 33% 17%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="saldo" fill="hsl(217 91% 60%)" name="Saldo" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ProFeatureOverlay>

            {/* Médias */}
            <ProFeatureOverlay>
              <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-5">
                <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Análise de Médias</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Média por Entrada</p>
                    <p className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(stats.avgIncome)}</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Média por Saída</p>
                    <p className="text-lg sm:text-xl font-bold text-destructive">{formatCurrency(stats.avgExpense)}</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total de Transações</p>
                    <p className="text-lg sm:text-xl font-bold">{transactions.length}</p>
                  </div>
                </div>
              </div>
            </ProFeatureOverlay>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
