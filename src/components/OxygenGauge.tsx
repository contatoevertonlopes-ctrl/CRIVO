import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface OxygenGaugeProps {
  days: number;
  maxDays?: number;
  size?: "sm" | "md" | "lg";
}

const OxygenGauge = ({ days, maxDays = 180, size = "md" }: OxygenGaugeProps) => {
  const percentage = Math.min((days / maxDays) * 100, 100);
  
  // Determine color based on days
  const getColor = () => {
    if (days >= 90) return "hsl(var(--survival-excellent))";
    if (days >= 30) return "hsl(var(--survival-warning))";
    if (days >= 10) return "hsl(var(--survival-critical))";
    return "hsl(var(--survival-emergency))";
  };

  const chartData = [
    { name: "Days", value: percentage, color: getColor() },
    { name: "Remaining", value: 100 - percentage, color: "hsl(var(--survival-muted))" },
  ];

  const sizes = {
    sm: { container: "w-24 h-24", inner: 28, outer: 40, text: "text-xl", subtext: "text-[8px]" },
    md: { container: "w-36 h-36", inner: 42, outer: 58, text: "text-3xl", subtext: "text-[10px]" },
    lg: { container: "w-44 h-44", inner: 55, outer: 75, text: "text-4xl", subtext: "text-xs" },
  };

  const config = sizes[size];

  return (
    <div className={`relative ${config.container}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={config.inner}
            outerRadius={config.outer}
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
        <span className={`${config.text} font-bold text-foreground`}>
          {days > 365 ? "365+" : days}
        </span>
        <span className={`${config.subtext} text-muted-foreground`}>dias</span>
      </div>
    </div>
  );
};

export default OxygenGauge;
