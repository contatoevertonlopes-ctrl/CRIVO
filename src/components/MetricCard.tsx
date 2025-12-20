import { LucideIcon } from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  pill: string;
  trend: string;
  trendUp?: boolean;
  icon?: LucideIcon;
}

const MetricCard = ({ title, value, pill, trend, trendUp = true, icon: Icon }: MetricCardProps) => {
  const { mode } = useAppMode();
  const isSurvival = mode === "survival";

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02]",
        isSurvival 
          ? "bg-survival-card border-survival-border/50 card-shadow-soft" 
          : "bg-prosperity-card border-prosperity-border/50 card-shadow-soft"
      )}
    >
      {/* Subtle gradient overlay */}
      <div 
        className={cn(
          "absolute inset-0 opacity-30",
          isSurvival 
            ? "bg-gradient-to-br from-survival-primary/5 to-transparent" 
            : "bg-gradient-to-br from-prosperity-emerald/5 to-transparent"
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
                    ? "bg-survival-primary/15" 
                    : "bg-prosperity-emerald/15"
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
            <span className="text-xs text-muted-foreground font-medium">{title}</span>
          </div>
          <span 
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
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
            "text-xl lg:text-2xl font-bold tracking-tight mb-2",
            isSurvival ? "text-foreground" : "text-foreground"
          )}
        >
          {value}
        </div>
        
        {/* Trend */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium",
            trendUp 
              ? isSurvival 
                ? "bg-survival-good/15 text-survival-good" 
                : "bg-prosperity-emerald/15 text-prosperity-emerald"
              : "bg-destructive/10 text-destructive"
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
