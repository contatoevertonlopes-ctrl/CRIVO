interface MetricCardProps {
  title: string;
  value: string;
  pill: string;
  trend: string;
  trendUp?: boolean;
}

const MetricCard = ({ title, value, pill, trend, trendUp = true }: MetricCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm p-4 hover:border-border/80 transition-colors">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-xs text-muted-foreground">{title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/30 whitespace-nowrap">
            {pill}
          </span>
        </div>
        
        <div className="text-xl lg:text-2xl font-semibold tracking-tight mb-2">
          {value}
        </div>
        
        <div
          className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full ${
            trendUp 
              ? "bg-primary/10 text-primary" 
              : "bg-destructive/10 text-destructive"
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
