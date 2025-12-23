import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, TrendingDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FutureCommitmentsChartProps {
  data: { month: string; amount: number }[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl">
        <p className="text-sm font-semibold mb-1">{label}</p>
        <p className="text-primary font-bold text-lg">
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          em parcelas acumuladas
        </p>
      </div>
    );
  }
  return null;
};

const FutureCommitmentsChart = ({ data }: FutureCommitmentsChartProps) => {
  const maxAmount = useMemo(() => {
    return Math.max(...data.map((d) => d.amount), 1);
  }, [data]);

  const avgAmount = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.amount, 0) / data.length;
  }, [data]);

  // Find the month with lowest commitment (best month)
  const lowestMonthIndex = useMemo(() => {
    if (data.length === 0) return -1;
    let minIndex = 0;
    let minValue = data[0].amount;
    data.forEach((d, i) => {
      if (d.amount < minValue) {
        minValue = d.amount;
        minIndex = i;
      }
    });
    return minIndex;
  }, [data]);

  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return 0;
    const firstHalf = data.slice(0, 3).reduce((sum, d) => sum + d.amount, 0) / 3;
    const secondHalf = data.slice(3).reduce((sum, d) => sum + d.amount, 0) / 3;
    return ((secondHalf - firstHalf) / firstHalf) * 100;
  }, [data]);

  const totalCommitments = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/20 border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
              Projeção de Faturas
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Comprometimento futuro com parcelas nos próximos 6 meses
            </p>
          </div>
          
          {trend !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend < 0 
                ? "bg-emerald-500/20 text-emerald-500" 
                : "bg-amber-500/20 text-amber-500"
            )}>
              <TrendingDown className={cn("w-3 h-3", trend > 0 && "rotate-180")} />
              {Math.abs(trend).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total 6 meses</p>
            <p className="text-sm font-bold text-primary">{formatCurrency(totalCommitments)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Média mensal</p>
            <p className="text-sm font-bold">{formatCurrency(avgAmount)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Menor mês</p>
            <p className="text-sm font-bold text-primary">
              {lowestMonthIndex >= 0 ? data[lowestMonthIndex].month : "-"}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="barGradientBest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(value) => 
                  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
                }
                width={45}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.2, radius: 4 }} />
              <ReferenceLine 
                y={avgAmount} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5" 
                opacity={0.5}
              />
              <Bar
                dataKey="amount"
                radius={[8, 8, 0, 0]}
                maxBarSize={55}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === lowestMonthIndex ? "url(#barGradientBest)" : "url(#barGradient)"}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {lowestMonthIndex >= 0 && (
          <div className={cn(
            "flex items-center justify-center gap-2 text-xs mt-4 p-2.5 rounded-lg",
            data[lowestMonthIndex]?.amount === 0 
              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
              : "bg-primary/10 text-primary border border-primary/20"
          )}>
            <Sparkles className="w-3.5 h-3.5" />
            {data[lowestMonthIndex]?.amount === 0 
              ? `${data[lowestMonthIndex].month}: Orçamento livre!`
              : `${data[lowestMonthIndex].month}: Menor comprometimento (${formatCurrency(data[lowestMonthIndex].amount)})`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FutureCommitmentsChart;
