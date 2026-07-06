import { LucideIcon } from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import { cn } from "@/lib/utils";

type MetricCardBreakdownItem = {
  label: string;
  value: string;
  valueClassName?: string;
};

interface MetricCardProps {
  title: string;
  value: string;
  pill: string;
  trend: string;
  trendUp?: boolean;
  icon?: LucideIcon;
  valueClassName?: string;
  breakdown?: MetricCardBreakdownItem[];
}

const MetricCard = ({ title, value, pill, trend, trendUp = true, icon: Icon, valueClassName, breakdown }: MetricCardProps) => {
  const { mode } = useAppMode();
  const isSurvival = mode === "survival";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:brightness-[1.04] card-shadow-soft",
        isSurvival
          ? "bg-survival-card border-survival-border/60"
          : "bg-prosperity-card border-prosperity-border/60"
      )}
    >
      {/* Subtle gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-20 pointer-events-none",
          isSurvival
            ? "bg-gradient-to-br from-survival-primary/8 to-transparent"
            : "bg-gradient-to-br from-prosperity-emerald/8 to-transparent"
        )}
      />
      
      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center",
                  isSurvival
                    ? "bg-survival-primary/12 ring-1 ring-survival-primary/20"
                    : "bg-prosperity-emerald/12 ring-1 ring-prosperity-emerald/20"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
                  )}
                />
              </div>
            )}
            <span className="text-sm text-muted-foreground font-medium">{title}</span>
          </div>
          <span 
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
              isSurvival 
                ? "bg-survival-secondary text-survival-primary/80 border border-survival-border/30" 
                : "bg-prosperity-secondary text-prosperity-emerald/80 border border-prosperity-border/30"
            )}
          >
            {pill}
          </span>
        </div>
        
        {/* Value */}
        <div
          className={cn(
            "text-xl lg:text-2xl font-bold tracking-tight mb-2 text-foreground finance-value",
            valueClassName
          )}
        >
          {value}
        </div>

        {breakdown && breakdown.length > 0 && (
          <div className="mb-2 space-y-1">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">{item.label}</span>
                <span className={cn("font-semibold tabular-nums", item.valueClassName)}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Trend */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold",
            trendUp
              ? isSurvival
                ? "bg-survival-good/15 text-survival-good ring-1 ring-survival-good/20"
                : "bg-prosperity-emerald/15 text-prosperity-emerald ring-1 ring-prosperity-emerald/20"
              : "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
          )}
        >
          <span 
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              trendUp 
                ? isSurvival ? "bg-survival-good" : "bg-prosperity-emerald"
                : "bg-destructive"
            )}
          />
          {trend}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
