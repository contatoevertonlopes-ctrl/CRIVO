interface MetricCardProps {
  title: string;
  value: string;
  pill: string;
  trend: string;
  trendUp?: boolean;
}

const MetricCard = ({ title, value, pill, trend, trendUp = true }: MetricCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/80 to-background border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4">
      {/* Gradient ghost effect */}
      <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.16),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.16),transparent_52%)] opacity-40 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <div className="text-[13px] text-muted-foreground mb-1">{title}</div>
            <div className="text-xl font-semibold">{value}</div>
          </div>
          <div className="text-[11px] px-2 py-1 rounded-full border border-border/40 text-muted-foreground">
            {pill}
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-secondary/90 mt-1 ${
            trendUp ? "text-green-200" : "text-red-200"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${trendUp ? "bg-primary" : "bg-destructive"}`}></span>
          {trend}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
