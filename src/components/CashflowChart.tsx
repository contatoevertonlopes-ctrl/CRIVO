import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
}

interface CashflowChartProps {
  data?: MonthlyData[];
}

const CashflowChart = ({ data = [] }: CashflowChartProps) => {
  const hasData = data.some((d) => d.receitas > 0 || d.despesas > 0);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-5">
      {/* Gradient ghost effect */}
      <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.16),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.16),transparent_52%)] opacity-30 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-medium mb-0.5">Fluxo de caixa – últimos 6 meses</h3>
            <p className="text-[11px] text-muted-foreground">
              Comparação entre receitas e despesas ao longo do tempo.
            </p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-secondary/90 border border-border/50">
            Visão consolidada
          </span>
        </div>

        <div className="h-[220px] mt-2">
          {!hasData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Adicione transações para visualizar o gráfico
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,41,55,0.6)" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 47% 5%)",
                    border: "1px solid hsl(217 33% 17%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
                <Line
                  type="monotone"
                  dataKey="receitas"
                  stroke="hsl(142 76% 45%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142 76% 45%)" }}
                  name="Receitas"
                />
                <Line
                  type="monotone"
                  dataKey="despesas"
                  stroke="hsl(0 84% 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(0 84% 60%)" }}
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
