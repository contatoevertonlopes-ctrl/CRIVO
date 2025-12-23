import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardTransaction } from "@/hooks/useCards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditCardTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: CardTransaction | null;
}

const EditCardTransactionDialog = ({
  open,
  onOpenChange,
  transaction,
}: EditCardTransactionDialogProps) => {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      // Clean description (remove installment suffix)
      const cleanDesc = transaction.description.replace(/\s*\(\d+\/\d+\)\s*$/, "");
      setDescription(cleanDesc);
      setAmount(String(transaction.amount * transaction.total_installments));
      setPurchaseDate(transaction.purchase_date);
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setIsLoading(true);
    try {
      const numericAmount = parseFloat(amount) || 0;
      const newInstallmentAmount = numericAmount / transaction.total_installments;

      // Get the parent transaction id (the first installment)
      const parentId = transaction.parent_card_transaction_id || transaction.id;

      // Update all related installments
      const { error } = await supabase
        .from("card_transactions")
        .update({
          amount: newInstallmentAmount,
          purchase_date: purchaseDate,
        })
        .or(`id.eq.${parentId},parent_card_transaction_id.eq.${parentId}`);

      if (error) throw error;

      // Update descriptions separately (they have different installment numbers)
      const { data: relatedTxs } = await supabase
        .from("card_transactions")
        .select("id, installment_number, total_installments")
        .or(`id.eq.${parentId},parent_card_transaction_id.eq.${parentId}`);

      if (relatedTxs) {
        for (const tx of relatedTxs) {
          const newDesc = tx.total_installments > 1 
            ? `${description} (${tx.installment_number}/${tx.total_installments})`
            : description;

          await supabase
            .from("card_transactions")
            .update({ description: newDesc })
            .eq("id", tx.id);
        }
      }

      toast.success("Transação atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Erro ao atualizar transação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;

    setIsLoading(true);
    try {
      const parentId = transaction.parent_card_transaction_id || transaction.id;

      // Delete all related installments
      const { error } = await supabase
        .from("card_transactions")
        .delete()
        .or(`id.eq.${parentId},parent_card_transaction_id.eq.${parentId}`);

      if (error) throw error;

      toast.success("Transação excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Erro ao excluir transação");
    } finally {
      setIsLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da compra"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Valor Total</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
              {transaction.total_installments > 1 && (
                <p className="text-xs text-muted-foreground">
                  {transaction.total_installments}x de R$ {((parseFloat(amount) || 0) / transaction.total_installments).toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Data da Compra</Label>
              <Input
                id="edit-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
              <p className="text-muted-foreground">
                Parcela atual: <span className="font-medium text-foreground">{transaction.installment_number}/{transaction.total_installments}</span>
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isLoading || !description || !amount}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá excluir todas as {transaction.total_installments} parcelas desta compra. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditCardTransactionDialog;
