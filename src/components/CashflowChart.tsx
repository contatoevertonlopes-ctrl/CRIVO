import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

interface CashflowChartProps {
  data?: MonthlyData[];
  periodLabel?: string;
  fitHeight?: boolean;
}

const CashflowChart = ({ data = [], periodLabel, fitHeight = false }: CashflowChartProps) => {
  const hasData = data.some((d) => d.receitas > 0 || d.despesas > 0);

  return (
    <div
      className={
        fitHeight
          ? "relative overflow-hidden rounded-xl bg-card border border-border/70 shadow-sm p-4 h-full flex flex-col"
          : "relative overflow-hidden rounded-xl bg-card border border-border/70 shadow-sm p-4"
      }
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

      <div className={fitHeight ? "relative z-10 h-full flex flex-col" : "relative z-10"}>
        <div className="flex justify-between items-start gap-2 mb-4">
          <div>
            <h3 className="text-sm font-medium">Fluxo de caixa</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Receitas vs despesas (período)
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground border border-border/30">
            {periodLabel ?? "Período"}
          </span>
        </div>

        <div className={fitHeight ? "flex-1 min-h-[200px]" : "h-[200px]"}>
          {!hasData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              Adicione transações para visualizar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
                  axisLine={{ stroke: "hsl(var(--border) / 0.5)" }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
                  axisLine={{ stroke: "hsl(var(--border) / 0.5)" }}
                  tickLine={false}
                  width={50}
                />
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
                  wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }} 
                  iconType="circle"
                  iconSize={6}
                />
                <Line
                  type="monotone"
                  dataKey="receitas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Receitas"
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--destructive))", r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Despesas"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashflowChart;
