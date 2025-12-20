import { useState } from "react";
import { useAppMode } from "@/contexts/AppModeContext";
import { cn } from "@/lib/utils";
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
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal } from "@/hooks/useGoals";

const icons = [
  { id: "target", icon: Target, label: "Meta" },
  { id: "plane", icon: Plane, label: "Viagem" },
  { id: "home", icon: Home, label: "Casa" },
  { id: "heart", icon: Heart, label: "Casamento" },
  { id: "car", icon: Car, label: "Carro" },
  { id: "graduation", icon: GraduationCap, label: "Educação" },
  { id: "briefcase", icon: Briefcase, label: "Negócio" },
  { id: "gift", icon: Gift, label: "Presente" },
  { id: "sparkles", icon: Sparkles, label: "Especial" },
];

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSave: (data: {
    title: string;
    icon: string;
    target_amount: number;
    deadline: string | null;
  }) => void;
}

const GoalDialog = ({ open, onOpenChange, goal, onSave }: GoalDialogProps) => {
  const { mode } = useAppMode();
  const isSurvival = mode === "survival";
  
  const [title, setTitle] = useState(goal?.title || "");
  const [selectedIcon, setSelectedIcon] = useState(goal?.icon || "target");
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || "");
  const [deadline, setDeadline] = useState(goal?.deadline || "");

  const handleSave = () => {
    if (!title.trim() || !targetAmount) return;
    
    onSave({
      title: title.trim(),
      icon: selectedIcon,
      target_amount: parseFloat(targetAmount.replace(/[^\d.,]/g, "").replace(",", ".")),
      deadline: deadline || null,
    });
    
    // Reset form
    setTitle("");
    setSelectedIcon("target");
    setTargetAmount("");
    setDeadline("");
    onOpenChange(false);
  };

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    if (!numericValue) return "";
    
    const number = parseInt(numericValue, 10) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-md border rounded-2xl",
        isSurvival 
          ? "bg-survival-card border-survival-border" 
          : "bg-prosperity-card border-prosperity-border"
      )}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {goal ? "Editar Objetivo" : "Novo Objetivo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Icon Selection */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Ícone</Label>
            <div className="grid grid-cols-5 gap-2">
              {icons.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedIcon(id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                    selectedIcon === id
                      ? isSurvival 
                        ? "bg-survival-primary/20 border-2 border-survival-primary" 
                        : "bg-prosperity-emerald/20 border-2 border-prosperity-emerald"
                      : "bg-secondary/50 border-2 border-transparent hover:bg-secondary"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5",
                    selectedIcon === id 
                      ? isSurvival ? "text-survival-primary" : "text-prosperity-emerald"
                      : "text-muted-foreground"
                  )} />
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-xs text-muted-foreground">
              Nome do objetivo
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Casamento 2026"
              className="mt-1.5 bg-background border-border/50"
            />
          </div>

          {/* Target Amount */}
          <div>
            <Label htmlFor="target" className="text-xs text-muted-foreground">
              Valor total
            </Label>
            <Input
              id="target"
              value={targetAmount}
              onChange={(e) => setTargetAmount(formatCurrencyInput(e.target.value))}
              placeholder="R$ 0,00"
              className="mt-1.5 bg-background border-border/50"
            />
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline" className="text-xs text-muted-foreground">
              Data limite (opcional)
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1.5 bg-background border-border/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className={cn(
                "flex-1",
                isSurvival 
                  ? "bg-survival-primary hover:bg-survival-primary/90" 
                  : "bg-prosperity-emerald hover:bg-prosperity-emerald/90"
              )}
              onClick={handleSave}
              disabled={!title.trim() || !targetAmount}
            >
              {goal ? "Salvar" : "Criar Objetivo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalDialog;
