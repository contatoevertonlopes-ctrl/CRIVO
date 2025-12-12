import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  value: number;
}

interface ExpenseChartProps {
  data?: CategoryData[];
  period?: number;
}

const COLORS = ["hsl(142 76% 45%)", "hsl(217 91% 60%)", "hsl(48 96% 53%)", "hsl(0 84% 60%)"];

const ExpenseChart = ({ data = [], period = 30 }: ExpenseChartProps) => {
  const hasData = data.length > 0 && data[0].name !== "Sem dados";

  const getPeriodLabel = () => {
    switch (period) {
      case 7: return "Últimos 7 dias";
      case 30: return "Últimos 30 dias";
      case 90: return "Últimos 90 dias";
      case 365: return "Último ano";
      default: return `Últimos ${period} dias`;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-5">
      {/* Gradient ghost effect */}
      <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.16),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.16),transparent_52%)] opacity-30 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-medium mb-0.5">Distribuição das despesas</h3>
            <p className="text-[11px] text-muted-foreground">
              Categorias que mais pesam no seu orçamento.
            </p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-secondary/90 border border-border/50">
            {getPeriodLabel()}
          </span>
        </div>

        <div className="h-[180px] mt-2">
          {!hasData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Adicione despesas para visualizar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
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
                    backgroundColor: "hsl(222 47% 5%)",
                    border: "1px solid hsl(217 33% 17%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "white",
                  }}
                  itemStyle={{ color: "white" }}
                  labelStyle={{ color: "white" }}
                  formatter={(value: number) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                />
                <Legend 
                  wrapperStyle={{ fontSize: "11px" }} 
                  iconType="circle"
                  formatter={(value) => <span style={{ color: "hsl(210 17% 98%)" }}>{value}</span>}
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
