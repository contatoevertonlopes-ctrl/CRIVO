import { useState } from "react";
import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft, Loader2 } from "lucide-react";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const TransferDialog = ({ open, onOpenChange }: TransferDialogProps) => {
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const { accounts, invalidateAccounts } = useBankAccounts();
  const { toast } = useToast();
  
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);
  
  // Filter out the selected "from" account from "to" options
  const toAccountOptions = accounts.filter(a => a.id !== fromAccountId);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !fromAccountId || !toAccountId || !amount) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para realizar a transferência.",
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "O valor da transferência deve ser maior que zero.",
      });
      return;
    }

    if (fromAccount && transferAmount > fromAccount.balance) {
      toast({
        variant: "destructive",
        title: "Saldo insuficiente",
        description: `A conta de origem tem apenas ${formatCurrency(fromAccount.balance)} disponível.`,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const transferDescription = description || `Transferência entre contas`;
      const today = new Date().toISOString().split("T")[0];

      // Create two transactions: one expense (from) and one income (to)
      // Both marked with category "Transferência" and tag "transferencia" to be excluded from reports
      const { error: txError } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          household_id: householdId,
          description: `${transferDescription} → ${toAccount?.bank_name}`,
          category: "Transferência",
          type: "expense",
          amount: transferAmount,
          status: "pagamento_concluido",
          date: today,
          paid_date: today,
          payment_method: "bank_transfer",
          bank_account_id: fromAccountId,
          tag: "transferencia",
        },
        {
          user_id: user.id,
          household_id: householdId,
          description: `${transferDescription} ← ${fromAccount?.bank_name}`,
          category: "Transferência",
          type: "income",
          amount: transferAmount,
          status: "paid",
          date: today,
          paid_date: today,
          payment_method: "bank_transfer",
          bank_account_id: toAccountId,
          tag: "transferencia",
        },
      ]);

      if (txError) throw txError;

      // The trigger will automatically update the balances
      invalidateAccounts();

      toast({
        title: "Transferência realizada",
        description: `${formatCurrency(transferAmount)} transferido de ${fromAccount?.bank_name} para ${toAccount?.bank_name}.`,
      });

      // Reset form
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setDescription("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na transferência",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Transferência entre Contas
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleTransfer} className="space-y-4 mt-4">
          {/* From Account */}
          <div className="space-y-2">
            <Label>Conta de Origem</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: account.color }}
                        />
                        <span>{account.bank_name} - {account.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromAccount && (
              <p className="text-xs text-muted-foreground">
                Saldo disponível: <span className="font-medium text-foreground">{formatCurrency(fromAccount.balance)}</span>
              </p>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-primary rotate-90" />
            </div>
          </div>

          {/* To Account */}
          <div className="space-y-2">
            <Label>Conta de Destino</Label>
            <Select 
              value={toAccountId} 
              onValueChange={setToAccountId}
              disabled={!fromAccountId}
            >
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder={fromAccountId ? "Selecione a conta de destino" : "Selecione primeiro a origem"} />
              </SelectTrigger>
              <SelectContent>
                {toAccountOptions.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <span>{account.bank_name} - {account.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={fromAccount?.balance || undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
              className="bg-secondary/50 border-border/50 text-lg font-semibold"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Reserva de emergência"
              className="bg-secondary/50 border-border/50"
            />
          </div>

          {/* Summary */}
          {fromAccount && toAccount && amount && parseFloat(amount) > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-center">
                Transferir <span className="font-bold text-primary">{formatCurrency(parseFloat(amount))}</span>
              </p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                de <span className="font-medium">{fromAccount.bank_name}</span> para <span className="font-medium">{toAccount.bank_name}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !fromAccountId || !toAccountId || !amount}
              className="flex-1 bg-gradient-to-r from-primary to-green-600 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transferindo...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Transferir
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
