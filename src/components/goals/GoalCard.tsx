import { useState } from "react";
import { useAppMode } from "@/contexts/AppModeContext";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Target, 
  Plane, 
  Home, 
  Heart, 
  Car, 
  GraduationCap, 
  Briefcase,
  Gift,
  Sparkles,
  ChevronRight,
  Calendar,
  TrendingUp,
  MoreVertical,
  Trash2,
  Edit2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Goal } from "@/hooks/useGoals";

const iconMap: Record<string, typeof Target> = {
  target: Target,
  plane: Plane,
  home: Home,
  heart: Heart,
  car: Car,
  graduation: GraduationCap,
  briefcase: Briefcase,
  gift: Gift,
  sparkles: Sparkles,
};

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const GoalCard = ({ goal, onClick, onEdit, onDelete }: GoalCardProps) => {
  const { mode } = useAppMode();
  const isSurvival = mode === "survival";
  
  const Icon = iconMap[goal.icon] || Target;
  const currentAmount = goal.current_amount || 0;
  const progress = goal.target_amount > 0 
    ? Math.min((currentAmount / goal.target_amount) * 100, 100) 
    : 0;
  
  const remaining = goal.target_amount - currentAmount;
  const daysLeft = goal.deadline 
    ? differenceInDays(new Date(goal.deadline), new Date()) 
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getProgressColor = () => {
    if (progress >= 100) return isSurvival ? "bg-survival-excellent" : "bg-prosperity-gold";
    if (progress >= 75) return isSurvival ? "bg-survival-good" : "bg-prosperity-emerald";
    if (progress >= 50) return isSurvival ? "bg-survival-warning" : "bg-prosperity-accent";
    return isSurvival ? "bg-survival-primary" : "bg-prosperity-emerald";
  };

  return (
    <div 
      className={cn(
        "relative rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer card-shadow-soft group",
        isSurvival 
          ? "bg-survival-card border-survival-border/50" 
          : "bg-prosperity-card border-prosperity-border/50"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isSurvival ? "bg-survival-primary/15" : "bg-prosperity-emerald/15"
            )}
          >
            <Icon className={cn(
              "w-6 h-6",
              isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{goal.title}</h3>
            {goal.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(goal.deadline), "dd MMM yyyy", { locale: ptBR })}</span>
              </div>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger 
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-secondary"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className={cn(
            "text-2xl font-bold",
            isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
          )}>
            {formatCurrency(currentAmount)}
          </span>
          <span className="text-sm text-muted-foreground">
            de {formatCurrency(goal.target_amount)}
          </span>
        </div>
        
        <div className="relative h-2.5 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", getProgressColor())}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            progress >= 100 
              ? isSurvival ? "bg-survival-excellent/15 text-survival-excellent" : "bg-prosperity-gold/15 text-prosperity-gold"
              : "bg-muted text-muted-foreground"
          )}>
            {Math.round(progress)}% completo
          </span>
          
          {daysLeft !== null && daysLeft > 0 && (
            <span className="text-xs text-muted-foreground">
              {daysLeft} dias restantes
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Faltam {formatCurrency(Math.max(remaining, 0))}</span>
        </div>
        
        {(goal.items_count ?? 0) > 0 && (
          <span className="text-xs text-muted-foreground">
            {goal.items_paid}/{goal.items_count} itens
          </span>
        )}
        
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default GoalCard;
