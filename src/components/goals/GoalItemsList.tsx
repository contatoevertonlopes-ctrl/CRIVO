import { useState } from "react";
import { useAppMode } from "@/contexts/AppModeContext";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { GoalItem, useGoalItems } from "@/hooks/useGoals";
import { toast } from "sonner";

interface GoalItemsListProps {
  goalId: string;
}

const GoalItemsList = ({ goalId }: GoalItemsListProps) => {
  const { mode } = useAppMode();
  const isSurvival = mode === "survival";
  const { items, loading, createItem, updateItem, deleteItem } = useGoalItems(goalId);
  
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !newItemAmount) return;

    const amount = parseFloat(newItemAmount.replace(/[^\d.,]/g, "").replace(",", "."));
    
    const result = await createItem({
      goal_id: goalId,
      title: newItemTitle.trim(),
      estimated_amount: amount,
      transaction_id: null,
      is_paid: false,
    });

    if (result) {
      setNewItemTitle("");
      setNewItemAmount("");
      toast.success("Item adicionado!");
    } else {
      toast.error("Erro ao adicionar item");
    }
  };

  const handleTogglePaid = async (item: GoalItem) => {
    const success = await updateItem(item.id, { is_paid: !item.is_paid });
    if (success) {
      toast.success(item.is_paid ? "Item desmarcado" : "Item marcado como pago!");
    }
  };

  const handleDeleteItem = async (id: string) => {
    const success = await deleteItem(id);
    if (success) {
      toast.success("Item removido");
    }
  };

  const totalEstimated = items.reduce((sum, item) => sum + item.estimated_amount, 0);
  const totalPaid = items.filter(i => i.is_paid).reduce((sum, item) => sum + item.estimated_amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Checklist de Pagamentos</h4>
        <span className="text-xs text-muted-foreground">
          {formatCurrency(totalPaid)} / {formatCurrency(totalEstimated)}
        </span>
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          placeholder="Ex: Fotógrafo"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          className="flex-1 h-9 text-sm bg-background border-border/50"
        />
        <Input
          placeholder="R$ 0,00"
          value={newItemAmount}
          onChange={(e) => setNewItemAmount(formatCurrencyInput(e.target.value))}
          className="w-28 h-9 text-sm bg-background border-border/50"
        />
        <Button
          size="sm"
          className={cn(
            "h-9 px-3",
            isSurvival 
              ? "bg-survival-primary hover:bg-survival-primary/90" 
              : "bg-prosperity-emerald hover:bg-prosperity-emerald/90"
          )}
          onClick={handleAddItem}
          disabled={!newItemTitle.trim() || !newItemAmount}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">Nenhum item ainda</p>
          <p className="text-xs mt-1">Adicione os itens que compõem seu objetivo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                item.is_paid 
                  ? "bg-primary/5 border-primary/20" 
                  : "bg-secondary/30 border-border/30"
              )}
            >
              <Checkbox
                checked={item.is_paid}
                onCheckedChange={() => handleTogglePaid(item)}
                className={cn(
                  "h-5 w-5 rounded-md",
                  isSurvival ? "border-survival-primary" : "border-prosperity-emerald"
                )}
              />
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  item.is_paid && "line-through text-muted-foreground"
                )}>
                  {item.title}
                </p>
                {item.transaction_id && (
                  <div className="flex items-center gap-1 text-[10px] text-primary mt-0.5">
                    <Link2 className="w-3 h-3" />
                    <span>Vinculado a transação</span>
                  </div>
                )}
              </div>
              
              <span className={cn(
                "text-sm font-medium shrink-0",
                item.is_paid 
                  ? isSurvival ? "text-survival-good" : "text-prosperity-emerald"
                  : "text-foreground"
              )}>
                {formatCurrency(item.estimated_amount)}
              </span>
              
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalItemsList;
