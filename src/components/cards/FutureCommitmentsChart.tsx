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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

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
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-primary font-semibold">
          {formatCurrency(payload[0].value)}
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

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          Próximas Faturas (6 meses)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Comprometimento futuro com parcelas
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === lowestMonthIndex
                        ? "hsl(var(--primary))"
                        : `hsl(var(--primary) / ${0.3 + (entry.amount / maxAmount) * 0.5})`
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {lowestMonthIndex >= 0 && data[lowestMonthIndex]?.amount === 0 && (
          <p className="text-xs text-primary text-center mt-2">
            ✨ {data[lowestMonthIndex].month}: Orçamento livre!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FutureCommitmentsChart;
