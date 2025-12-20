import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  value: number;
}

interface ExpenseChartProps {
  data?: CategoryData[];
  period?: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(217 91% 60%)", "hsl(48 96% 53%)", "hsl(var(--destructive))"];

const ExpenseChart = ({ data = [], period = 30 }: ExpenseChartProps) => {
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
    <div className="relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm p-4">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div>
            <h3 className="text-sm font-medium">Despesas por categoria</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Principais gastos
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground border border-border/30">
            {getPeriodLabel()}
          </span>
        </div>

        <div className="h-[160px]">
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
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  formatter={(value: number) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
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
