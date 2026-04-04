import { useState, useEffect } from "react";
import { useAppMode } from "@/contexts/AppModeContext";
import { cn } from "@/lib/utils";
import { Check, Plus, Trash2, Link2, ChevronDown, ChevronUp, Edit2, Store, Key, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { GoalItem, useGoalItems } from "@/hooks/useGoals";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}

interface GoalItemsListProps {
  goalId: string;
  onGoalUpdate?: () => void;
}

const GoalItemsList = ({ goalId, onGoalUpdate }: GoalItemsListProps) => {
  const { mode } = useAppMode();
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const isSurvival = mode === "survival";
  const { items, loading, createItem, updateItem, deleteItem, fetchItems } = useGoalItems(goalId);
  
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<{ id: string; value: string } | null>(null);
  const [editingPix, setEditingPix] = useState<{ id: string; value: string } | null>(null);
  
  // Link transaction dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null);
  const [availableTransactions, setAvailableTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

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

  const fetchAvailableTransactions = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      let query = supabase
        .from("transactions")
        .select("id, description, amount, date, status")
        .eq("type", "expense")
        .is("goal_id", null)
        .order("date", { ascending: false })
        .limit(50);

      if (householdId) {
        query = query.eq("household_id", householdId);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAvailableTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setAvailableTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleOpenLinkDialog = (itemId: string) => {
    setLinkingItemId(itemId);
    setLinkDialogOpen(true);
    fetchAvailableTransactions();
  };

  const handleLinkTransaction = async (transactionId: string) => {
    if (!linkingItemId) return;

    try {
      // Update the goal item with the transaction_id and mark as paid
      const itemSuccess = await updateItem(linkingItemId, { 
        transaction_id: transactionId,
        is_paid: true 
      });

      if (!itemSuccess) throw new Error("Failed to update item");

      // Update the transaction to link it to this goal
      const { error: txError } = await supabase
        .from("transactions")
        .update({ goal_id: goalId })
        .eq("id", transactionId);

      if (txError) throw txError;

      toast.success("Transação vinculada com sucesso!");
      setLinkDialogOpen(false);
      setLinkingItemId(null);
      await fetchItems();
      onGoalUpdate?.();
    } catch (error) {
      console.error("Error linking transaction:", error);
      toast.error("Erro ao vincular transação");
    }
  };

  const handleUnlinkTransaction = async (item: GoalItem) => {
    if (!item.transaction_id) return;

    try {
      // Remove the goal_id from the transaction
      const { error: txError } = await supabase
        .from("transactions")
        .update({ goal_id: null })
        .eq("id", item.transaction_id);

      if (txError) throw txError;

      // Update the goal item to remove the transaction link
      const success = await updateItem(item.id, { 
        transaction_id: null,
        is_paid: false 
      });

      if (success) {
        toast.success("Vínculo removido");
        onGoalUpdate?.();
      }
    } catch (error) {
      console.error("Error unlinking transaction:", error);
      toast.error("Erro ao remover vínculo");
    }
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

  const handleSaveSupplier = async (id: string) => {
    if (!editingSupplier) return;
    const success = await updateItem(id, { supplier: editingSupplier.value });
    if (success) {
      setEditingSupplier(null);
      toast.success("Fornecedor salvo!");
    }
  };

  const handleSavePix = async (id: string) => {
    if (!editingPix) return;
    const success = await updateItem(id, { pix_key: editingPix.value });
    if (success) {
      setEditingPix(null);
      toast.success("Chave PIX salva!");
    }
  };

  const totalEstimated = items.reduce((sum, item) => sum + item.estimated_amount, 0);
  const totalPaid = items.filter(i => i.is_paid).reduce((sum, item) => sum + item.estimated_amount, 0);
  const paidCount = items.filter(i => i.is_paid).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Checklist de Pagamentos</h4>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">
            {paidCount}/{items.length} itens • {formatCurrency(totalPaid)} / {formatCurrency(totalEstimated)}
          </span>
        </div>
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          placeholder="Ex: Fotógrafo"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          className="flex-1 h-9 text-sm bg-background border-border/70"
          onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
        />
        <Input
          placeholder="R$ 0,00"
          value={newItemAmount}
          onChange={(e) => setNewItemAmount(formatCurrencyInput(e.target.value))}
          className="w-28 h-9 text-sm bg-background border-border/70"
          onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
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
            <Collapsible
              key={item.id}
              open={expandedItem === item.id}
              onOpenChange={(open) => setExpandedItem(open ? item.id : null)}
            >
              <div
                className={cn(
                  "rounded-xl border transition-all",
                  item.is_paid 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-secondary/30 border-border/30"
                )}
              >
                <div className="flex items-center gap-3 p-3">
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
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.supplier && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {item.supplier}
                        </span>
                      )}
                      {item.transaction_id && (
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          Vinculado
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <span className={cn(
                    "text-sm font-medium shrink-0",
                    item.is_paid 
                      ? isSurvival ? "text-survival-good" : "text-prosperity-emerald"
                      : "text-foreground"
                  )}>
                    {formatCurrency(item.estimated_amount)}
                  </span>

                  {/* Link/Unlink transaction button */}
                  {item.transaction_id ? (
                    <button
                      onClick={() => handleUnlinkTransaction(item)}
                      className="p-1.5 rounded-lg hover:bg-orange-500/10 text-orange-400 transition-colors"
                      title="Desvincular transação"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenLinkDialog(item.id)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Vincular transação"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <CollapsibleTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                      {expandedItem === item.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/30">
                    {/* Supplier */}
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
                        <Store className="w-3 h-3" /> Fornecedor
                      </label>
                      {editingSupplier?.id === item.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingSupplier.value}
                            onChange={(e) => setEditingSupplier({ id: item.id, value: e.target.value })}
                            placeholder="Nome do fornecedor"
                            className="h-8 text-xs"
                            autoFocus
                          />
                          <Button size="sm" className="h-8 px-2" onClick={() => handleSaveSupplier(item.id)}>
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingSupplier({ id: item.id, value: item.supplier || "" })}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {item.supplier || "Adicionar fornecedor"}
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    {/* PIX Key */}
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
                        <Key className="w-3 h-3" /> Chave PIX
                      </label>
                      {editingPix?.id === item.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingPix.value}
                            onChange={(e) => setEditingPix({ id: item.id, value: e.target.value })}
                            placeholder="Chave PIX para pagamento"
                            className="h-8 text-xs"
                            autoFocus
                          />
                          <Button size="sm" className="h-8 px-2" onClick={() => handleSavePix(item.id)}>
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingPix({ id: item.id, value: item.pix_key || "" })}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {item.pix_key || "Adicionar chave PIX"}
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Link Transaction Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Transação</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {loadingTransactions ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Carregando transações...
              </div>
            ) : availableTransactions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Nenhuma transação disponível</p>
                <p className="text-xs mt-1">Crie uma transação de despesa para vincular</p>
              </div>
            ) : (
              availableTransactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => handleLinkTransaction(tx.id)}
                  className="w-full p-3 rounded-lg border border-border/70 bg-secondary/30 hover:bg-secondary/60 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      (tx.status === "paid" || tx.status === "pagamento_concluido") ? "text-primary" : "text-foreground"
                    )}>
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalItemsList;