import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  value: number;
}

interface ExpenseChartProps {
  data?: CategoryData[];
  period?: number;
  periodLabel?: string;
  fitHeight?: boolean;
}

const COLORS = ["hsl(var(--primary))", "hsl(217 91% 60%)", "hsl(48 96% 53%)", "hsl(var(--destructive))"];

const ExpenseChart = ({ data = [], period = 30, periodLabel, fitHeight = false }: ExpenseChartProps) => {
  const hasData = data.length > 0 && data[0].name !== "Sem dados";

  const getPeriodLabel = () => {
    switch (period) {
      case 7: return "7 dias";
      case 30: return "30 dias";
      case 90: return "90 dias";
      case 365: return "1 ano";
      default: return `${period}d`;
    }
  };

  return (
    <div
      className={
        fitHeight
          ? "relative min-w-0 overflow-hidden rounded-xl glass-card p-4 h-full flex flex-col"
          : "relative min-w-0 overflow-hidden rounded-xl glass-card p-4"
      }
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

      <div className={fitHeight ? "relative z-10 h-full min-w-0 flex flex-col" : "relative z-10 min-w-0"}>
        <div className="flex min-w-0 justify-between items-start gap-2 mb-3">
          <div>
            <h3 className="text-sm font-medium">Despesas por categoria</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Principais gastos
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground border border-border/30">
            {periodLabel ?? getPeriodLabel()}
          </span>
        </div>

        <div className={fitHeight ? "flex-1 min-h-[160px]" : "h-[160px]"}>
          {!hasData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              Adicione despesas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "hsl(var(--foreground))",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  separator=" - "
                  formatter={(value: number, name: string) => [
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value),
                    name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }}
                  iconType="circle"
                  iconSize={6}
                  formatter={(value) => (
                    <span style={{ color: "hsl(var(--foreground))", fontSize: "10px" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;
