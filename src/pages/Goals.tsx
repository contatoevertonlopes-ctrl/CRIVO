import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/contexts/AppModeContext";
import { useGoals, Goal } from "@/hooks/useGoals";
import Sidebar from "@/components/Sidebar";
import GoalCard from "@/components/goals/GoalCard";
import GoalDialog from "@/components/goals/GoalDialog";
import GoalItemsList from "@/components/goals/GoalItemsList";
import { cn } from "@/lib/utils";
import { Plus, Target, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const Goals = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const { goals, loading, createGoal, updateGoal, deleteGoal, fetchGoals } = useGoals();
  const isSurvival = mode === "survival";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSaveGoal = async (data: {
    title: string;
    icon: string;
    target_amount: number;
    deadline: string | null;
    template_type?: string;
    car_value?: number;
    event_date?: string | null;
  }, templateItems?: { title: string; category: string; estimated_amount: number }[]) => {
    if (editingGoal) {
      const success = await updateGoal(editingGoal.id, {
        title: data.title,
        icon: data.icon,
        target_amount: data.target_amount,
        deadline: data.deadline,
      });
      if (success) {
        toast.success("Objetivo atualizado!");
        setEditingGoal(null);
      } else {
        toast.error("Erro ao atualizar objetivo");
      }
    } else {
      const result = await createGoal({
        ...data,
        household_id: null,
        status: "active",
        color: "primary",
      }, templateItems);
      if (result) {
        toast.success("Objetivo criado com sucesso!");
        if (templateItems && templateItems.length > 0) {
          toast.info(`${templateItems.length} itens foram adicionados ao checklist`);
        }
      } else {
        toast.error("Erro ao criar objetivo");
      }
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const success = await deleteGoal(id);
    if (success) {
      toast.success("Objetivo excluído");
      setDetailsOpen(false);
      setSelectedGoal(null);
    } else {
      toast.error("Erro ao excluir objetivo");
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleOpenDetails = (goal: Goal) => {
    setSelectedGoal(goal);
    setDetailsOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => {
    const current = g.current_amount || 0;
    return current >= g.target_amount || g.status === "completed";
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 min-w-0 pt-16 pb-24 lg:pt-0 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-6 lg:py-6 flex flex-col gap-4 lg:gap-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Meus Objetivos</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Planeje e acompanhe seus sonhos financeiros
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={() => {
                  setEditingGoal(null);
                  setDialogOpen(true);
                }}
                className={cn(
                  "gap-2",
                  isSurvival
                    ? "bg-survival-primary hover:bg-survival-primary/90"
                    : "bg-prosperity-emerald hover:bg-prosperity-emerald/90"
                )}
              >
                <Plus className="w-4 h-4" />
                Novo Objetivo
              </Button>
            </div>
          </div>

          {/* Goals Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-5 animate-pulse card-shadow-soft"
                >
                  <div className="h-12 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-8 text-center card-shadow-soft">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
                isSurvival ? "bg-survival-primary/15" : "bg-prosperity-emerald/15"
              )}>
                <Target className={cn(
                  "w-8 h-8",
                  isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
                )} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Comece sua jornada</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Crie seu primeiro objetivo e comece a transformar seus sonhos em realidade.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className={cn(
                  isSurvival 
                    ? "bg-survival-primary hover:bg-survival-primary/90" 
                    : "bg-prosperity-emerald hover:bg-prosperity-emerald/90"
                )}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Objetivo
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Goals */}
              {activeGoals.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">
                    Em andamento ({activeGoals.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onClick={() => handleOpenDetails(goal)}
                        onEdit={() => handleEditGoal(goal)}
                        onDelete={() => handleDeleteGoal(goal.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Goals */}
              {completedGoals.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">
                    Concluídos ({completedGoals.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onClick={() => handleOpenDetails(goal)}
                        onEdit={() => handleEditGoal(goal)}
                        onDelete={() => handleDeleteGoal(goal.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />

      {/* Goal Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent 
          side="right" 
          className={cn(
            "w-full sm:max-w-lg border-l",
            isSurvival 
              ? "bg-survival-card border-survival-border" 
              : "bg-prosperity-card border-prosperity-border"
          )}
        >
          {selectedGoal && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-semibold">
                    {selectedGoal.title}
                  </SheetTitle>
                </div>
                
                {/* Progress Summary */}
                <div className="mt-4 p-4 rounded-xl bg-secondary/30">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
                    )}>
                      {formatCurrency(selectedGoal.current_amount || 0)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      de {formatCurrency(selectedGoal.target_amount)}
                    </span>
                  </div>
                  
                  <div className="relative h-2.5 bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isSurvival 
                          ? "bg-gradient-to-r from-survival-primary to-survival-good" 
                          : "bg-gradient-to-r from-prosperity-emerald to-prosperity-gold"
                      )}
                      style={{ 
                        width: `${Math.min(((selectedGoal.current_amount || 0) / selectedGoal.target_amount) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>
                      {Math.round(((selectedGoal.current_amount || 0) / selectedGoal.target_amount) * 100)}% completo
                    </span>
                    <span>
                      Faltam {formatCurrency(selectedGoal.target_amount - (selectedGoal.current_amount || 0))}
                    </span>
                  </div>
                </div>
              </SheetHeader>

              {/* Items Checklist */}
              <GoalItemsList goalId={selectedGoal.id} onGoalUpdate={fetchGoals} />

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-border/30">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEditGoal(selectedGoal)}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteGoal(selectedGoal.id)}
                >
                  Excluir
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Goals;
