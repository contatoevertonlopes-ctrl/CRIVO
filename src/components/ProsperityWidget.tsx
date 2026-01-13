import { TrendingUp, Sparkles, Target, Award, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface ProsperityWidgetProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  loading?: boolean;
  variant?: "full" | "compact";
}

const ProsperityWidget = ({ 
  monthlyIncome, 
  monthlyExpenses, 
  loading = false,
  variant = "full",
}: ProsperityWidgetProps) => {
  // Calculate financial freedom rate
  const surplus = monthlyIncome - monthlyExpenses;
  const freedomRate = monthlyIncome > 0 
    ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) 
    : 0;

  // Target is 20% savings rate
  const targetRate = 20;
  const progressToTarget = Math.min((freedomRate / targetRate) * 100, 100);

  // Days of freedom earned this month
  const dailyExpense = monthlyExpenses / 30;
  const daysOfFreedomEarned = dailyExpense > 0 ? Math.floor(surplus / dailyExpense) : 0;

  // Determine status
  const getStatus = () => {
    if (freedomRate >= 30) return { level: "exceptional", label: "Excepcional", color: "text-prosperity-gold", bgColor: "bg-prosperity-gold/15" };
    if (freedomRate >= 20) return { level: "excellent", label: "Excelente", color: "text-prosperity-emerald", bgColor: "bg-prosperity-emerald/15" };
    if (freedomRate >= 10) return { level: "good", label: "Bom", color: "text-prosperity-emerald", bgColor: "bg-prosperity-emerald/15" };
    if (freedomRate > 0) return { level: "building", label: "Construindo", color: "text-prosperity-accent", bgColor: "bg-prosperity-accent/15" };
    return { level: "attention", label: "Atenção", color: "text-destructive", bgColor: "bg-destructive/15" };
  };

  const status = getStatus();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Data for circular progress chart
  const chartData = [
    { name: "Taxa", value: Math.max(freedomRate, 0), color: "hsl(var(--prosperity-emerald))" },
    { name: "Restante", value: Math.max(100 - freedomRate, 0), color: "hsl(var(--prosperity-muted))" },
  ];

  if (loading) {
    return (
      <div className="min-w-0 bg-prosperity-card border border-prosperity-border/70 rounded-2xl p-6 animate-pulse card-shadow-soft">
        <div className="h-6 bg-prosperity-muted rounded w-1/3 mb-4"></div>
        <div className="h-36 bg-prosperity-muted rounded-full w-36 mx-auto mb-4"></div>
        <div className="h-4 bg-prosperity-muted rounded w-2/3 mx-auto"></div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="min-w-0 bg-prosperity-card border border-prosperity-border/70 rounded-2xl p-4 transition-all duration-300 card-shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-prosperity-emerald/15">
              <TrendingUp className="w-4 h-4 text-prosperity-emerald" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Taxa de Liberdade</h3>
              <p className="text-[11px] text-muted-foreground">Quanto você está guardando</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${status.bgColor} ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-prosperity-emerald leading-none">{freedomRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">Meta: {targetRate}%</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Sobra do mês</p>
            <p className={`text-base font-semibold ${surplus >= 0 ? "text-prosperity-gold" : "text-destructive"}`}>
              {surplus >= 0 ? "+" : ""}{formatCurrency(surplus)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid min-w-0 grid-cols-2 gap-3">
          <div className="min-w-0 p-3 rounded-xl bg-prosperity-secondary/50">
            <p className="text-[10px] text-muted-foreground mb-1">Receita</p>
            <p className="text-sm font-semibold text-prosperity-emerald break-words">{formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="min-w-0 p-3 rounded-xl bg-prosperity-secondary/50">
            <p className="text-[10px] text-muted-foreground mb-1">Despesas</p>
            <p className="text-sm font-semibold text-destructive break-words">{formatCurrency(monthlyExpenses)}</p>
          </div>
        </div>

        {freedomRate < 0 && (
          <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive">
              Este mês você gastou mais do que ganhou.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 bg-prosperity-card border border-prosperity-border/70 rounded-2xl p-4 md:p-5 transition-all duration-300 card-shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-prosperity-emerald/15">
            <TrendingUp className="w-5 h-5 text-prosperity-emerald" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Taxa de Liberdade</h3>
            <p className="text-[11px] text-muted-foreground">Quanto você está guardando</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${status.bgColor} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Circular Chart */}
      <div className="relative mx-auto w-28 h-28 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={34}
              outerRadius={48}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-prosperity-emerald">
            {freedomRate}%
          </span>
          <span className="text-[10px] text-muted-foreground">de sobra</span>
        </div>
      </div>

      {/* Target Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-muted-foreground">Meta: {targetRate}% de economia</span>
          <span className="text-prosperity-emerald font-medium">
            {freedomRate >= targetRate ? "Atingida!" : `${Math.round(progressToTarget)}%`}
          </span>
        </div>
        <div className="h-2 bg-prosperity-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-prosperity-emerald to-prosperity-gold rounded-full transition-all duration-500"
            style={{ width: `${progressToTarget}%` }}
          />
        </div>
      </div>

      {/* Freedom Days Card */}
      {daysOfFreedomEarned > 0 && (
        <div className="p-3 rounded-xl bg-prosperity-gold/10 border border-prosperity-gold/20 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-prosperity-gold/15">
              <Sparkles className="w-4 h-4 text-prosperity-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Você garantiu <span className="text-prosperity-gold font-bold">{daysOfFreedomEarned} dias</span> de liberdade
              </p>
              <p className="text-[11px] text-muted-foreground">
                Com o excedente deste mês
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid min-w-0 grid-cols-2 gap-3 pt-3 border-t border-prosperity-border/70">
        <div className="min-w-0 p-3 rounded-xl bg-prosperity-secondary/50">
          <p className="text-[10px] text-muted-foreground mb-1">Receita mensal</p>
          <p className="text-sm sm:text-base font-semibold text-prosperity-emerald break-words">
            {formatCurrency(monthlyIncome)}
          </p>
        </div>
        <div className="min-w-0 p-3 rounded-xl bg-prosperity-secondary/50">
          <p className="text-[10px] text-muted-foreground mb-1">Sobra do mês</p>
          <p className={`text-sm sm:text-base font-semibold break-words ${surplus >= 0 ? "text-prosperity-gold" : "text-destructive"}`}>
            {surplus >= 0 ? "+" : ""}{formatCurrency(surplus)}
          </p>
        </div>
      </div>

      {/* Negative Message */}
      {freedomRate < 0 && (
        <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive">
            Este mês você gastou mais do que ganhou. Considere revisar seus gastos.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProsperityWidget;
