import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppMode } from "@/contexts/AppModeContext";
import { useGoals, Goal } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Target, ChevronRight, Sparkles, Calendar } from "lucide-react";

type GoalWidgetProps = {
  className?: string;
};

const GoalWidget = ({ className }: GoalWidgetProps) => {
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const { goals, loading } = useGoals();
  const isSurvival = mode === "survival";

  // Get the most relevant goal (closest deadline with progress < 100%)
  const activeGoals = goals
    .filter(g => g.status === "active" && (g.current_amount || 0) < g.target_amount)
    .sort((a, b) => {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return a.deadline ? -1 : 1;
    });

  const featuredGoal = activeGoals[0];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className={cn(
        "rounded-2xl glass-card p-4 animate-pulse",
        isSurvival
          ? "border-survival-border/40"
          : "border-prosperity-border/40",
        className
      )}>
        <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-muted rounded w-2/3 mb-2"></div>
        <div className="h-2 bg-muted rounded"></div>
      </div>
    );
  }

  if (!featuredGoal) {
    return (
      <div 
        onClick={() => navigate("/goals")}
        className={cn(
          "rounded-2xl glass-card p-4 transition-all hover:scale-[1.015] cursor-pointer",
          isSurvival
            ? "border-survival-border/40"
            : "border-prosperity-border/40",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isSurvival ? "bg-survival-primary/15" : "bg-prosperity-emerald/15"
            )}>
              <Target className={cn(
                "w-5 h-5",
                isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
              )} />
            </div>
            <div>
              <p className="text-sm font-medium">Crie seu primeiro objetivo</p>
              <p className="text-xs text-muted-foreground">Planeje seus sonhos</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const currentAmount = featuredGoal.current_amount || 0;
  const remaining = featuredGoal.target_amount - currentAmount;
  const progress = (currentAmount / featuredGoal.target_amount) * 100;
  const daysLeft = featuredGoal.deadline 
    ? differenceInDays(new Date(featuredGoal.deadline), new Date())
    : null;

  return (
    <div 
      onClick={() => navigate("/goals")}
      className={cn(
        "rounded-2xl border p-4 transition-all hover:scale-[1.02] cursor-pointer card-shadow-soft",
        isSurvival 
          ? "bg-survival-card border-survival-border/50" 
          : "bg-prosperity-card border-prosperity-border/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className={cn(
            "w-4 h-4",
            isSurvival ? "text-survival-accent" : "text-prosperity-gold"
          )} />
          <span className="text-xs font-medium text-muted-foreground">Seu Objetivo</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Goal Info */}
      <h4 className="font-semibold text-foreground mb-1">{featuredGoal.title}</h4>
      
      <div className="flex items-center gap-2 mb-3">
        {daysLeft !== null && daysLeft > 0 && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
            isSurvival 
              ? "bg-survival-warning/15 text-survival-warning" 
              : "bg-prosperity-accent/15 text-prosperity-accent"
          )}>
            <Calendar className="w-3 h-3" />
            {daysLeft} dias
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          Faltam {formatCurrency(remaining)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isSurvival 
              ? "bg-gradient-to-r from-survival-primary to-survival-good" 
              : "bg-gradient-to-r from-prosperity-emerald to-prosperity-gold"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs">
        <span className={cn(
          "font-medium",
          isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
        )}>
          {formatCurrency(currentAmount)}
        </span>
        <span className="text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

export default GoalWidget;
