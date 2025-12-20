import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Lock, ListOrdered, CreditCard } from "lucide-react";
import { addMonths, addWeeks, addDays } from "date-fns";
import GoalItemLinkDialog from "./GoalItemLinkDialog";

interface AddTransactionDialogProps {
  onSuccess: () => void;
}

const AddTransactionDialog = ({ onSuccess }: AddTransactionDialogProps) => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { householdId } = useHouseholdId();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("em_aberto");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidDate, setPaidDate] = useState("");
  const [tag, setTag] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("monthly");
  
  // Installment mode
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState("2");
  const [installmentInterval, setInstallmentInterval] = useState("monthly");
  
  // Goal item link
  const [showGoalItemLink, setShowGoalItemLink] = useState(false);
  const [pendingTransactionData, setPendingTransactionData] = useState<{
    amount: number;
    description: string;
  } | null>(null);

  const getNextInstallmentDate = (baseDate: Date, index: number, interval: string) => {
    switch (interval) {
      case "weekly":
        return addWeeks(baseDate, index);
      case "biweekly":
        return addDays(baseDate, index * 15);
      case "monthly":
      default:
        return addMonths(baseDate, index);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Não autorizado",
        description: "Você precisa estar logado para adicionar transações.",
      });
      return;
    }

    setLoading(true);
    try {
      if (isInstallment && parseInt(installmentCount) > 1) {
        // Create multiple transactions for installments
        const totalAmount = parseFloat(amount);
        const numInstallments = parseInt(installmentCount);
        const installmentAmount = Math.round((totalAmount / numInstallments) * 100) / 100;
        const baseDate = new Date(date);
        
        const transactions = [];
        for (let i = 0; i < numInstallments; i++) {
          const installmentDate = getNextInstallmentDate(baseDate, i, installmentInterval);
          transactions.push({
            user_id: user.id,
            household_id: householdId,
            description: `${description} ${i + 1}/${numInstallments}`,
            category,
            type,
            amount: installmentAmount,
            status: i === 0 ? status : "em_aberto",
            date: installmentDate.toISOString().split("T")[0],
            paid_date: i === 0 && paidDate ? paidDate : null,
            tag: tag || null,
            payment_method: paymentMethod || null,
            is_recurring: false,
            recurring_interval: null,
          });
        }

        const { error } = await supabase.from("transactions").insert(transactions);
        if (error) throw error;

        toast({
          title: "Parcelas criadas",
          description: `${numInstallments} parcelas de R$ ${installmentAmount.toFixed(2)} foram criadas.`,
        });
      } else {
        // Single transaction
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id,
          household_id: householdId,
          description,
          category,
          type,
          amount: parseFloat(amount),
          status,
          date,
          paid_date: paidDate || null,
          tag: tag || null,
          payment_method: paymentMethod || null,
          is_recurring: subscribed ? isRecurring : false,
          recurring_interval: isRecurring ? recurringInterval : null,
        });

        if (error) throw error;

        // If it's an expense, show goal item link dialog
        if (type === "expense") {
          setPendingTransactionData({
            amount: parseFloat(amount),
            description,
          });
          setShowGoalItemLink(true);
        }

        toast({
          title: "Transação adicionada",
          description: "A transação foi salva com sucesso.",
        });
      }

      // Reset form
      setDescription("");
      setCategory("");
      setType("expense");
      setAmount("");
      setStatus("em_aberto");
      setDate(new Date().toISOString().split("T")[0]);
      setPaidDate("");
      setTag("");
      setPaymentMethod("");
      setIsRecurring(false);
      setRecurringInterval("monthly");
      setIsInstallment(false);
      setInstallmentCount("2");
      setInstallmentInterval("monthly");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoalItem = async (goalItemId: string) => {
    try {
      // Mark the goal item as paid
      await supabase
        .from("goal_items")
        .update({ is_paid: true })
        .eq("id", goalItemId);

      toast({
        title: "Item vinculado",
        description: "O item do objetivo foi marcado como pago.",
      });
    } catch (error) {
      console.error("Error linking goal item:", error);
    } finally {
      setShowGoalItemLink(false);
      setPendingTransactionData(null);
    }
  };

  const statusOptions = [
    { value: "em_aberto", label: "Em aberto" },
    { value: "a_vencer", label: "A vencer" },
    { value: "vencido", label: "Vencido" },
    { value: "pagamento_concluido", label: "Pagamento concluído" },
  ];

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-gradient-to-r from-primary to-green-600 text-primary-foreground shadow-[0_4px_15px_rgba(34,197,94,0.4)]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nova transação
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background border-secondary max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pagamento cliente X"
              required
              className="bg-secondary/50 border-border/50"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{isInstallment ? "Valor Total (R$)" : "Valor (R$)"}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
                className="bg-secondary/50 border-border/50"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Serviços"
                required
                className="bg-secondary/50 border-border/50"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{isInstallment ? "Data 1ª Parcela" : "Data de Vencimento"}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-secondary/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidDate">Data de Pagamento</Label>
              <Input
                id="paidDate"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Forma de Pagamento
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="Selecione a forma (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Tag</Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger className="bg-secondary/50 border-border/50">
                <SelectValue placeholder="Selecione uma tag (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixa">Fixa</SelectItem>
                <SelectItem value="variavel">Variável</SelectItem>
                <SelectItem value="esporadica">Esporádica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Installment Mode - Pro Feature */}
          {subscribed ? (
            <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/5">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="installment-dashboard"
                  checked={isInstallment}
                  onCheckedChange={(checked) => {
                    setIsInstallment(!!checked);
                    if (checked) setIsRecurring(false);
                  }}
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-blue-500" />
                  <Label htmlFor="installment-dashboard" className="text-sm cursor-pointer">
                    Parcelamento
                  </Label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Pro</span>
                </div>
              </div>
              {isInstallment && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Parcelas</Label>
                      <Input
                        type="number"
                        min="2"
                        max="48"
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(e.target.value)}
                        className="bg-secondary/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Intervalo</Label>
                      <Select value={installmentInterval} onValueChange={setInstallmentInterval}>
                        <SelectTrigger className="bg-secondary/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {amount && parseInt(installmentCount) > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Valor por parcela: R$ {(parseFloat(amount) / parseInt(installmentCount)).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative p-3 rounded-xl border border-border bg-secondary/20">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-1">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Plano Pro</span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <Checkbox disabled checked={false} />
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Parcelamento</span>
                </div>
              </div>
            </div>
          )}

          {/* Recurring Transaction - Pro Feature */}
          {!isInstallment && (
            subscribed ? (
              <div className="p-3 rounded-xl border border-primary/40 bg-primary/5">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="recurring-dashboard"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(!!checked)}
                  />
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    <Label htmlFor="recurring-dashboard" className="text-sm cursor-pointer">
                      Transação recorrente
                    </Label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">Pro</span>
                  </div>
                </div>
                {isRecurring && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">Intervalo</Label>
                    <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative p-3 rounded-xl border border-border bg-secondary/20">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-1">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Plano Pro</span>
                </div>
                <div className="flex items-center gap-3 opacity-50">
                  <Checkbox disabled checked={false} />
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Transação recorrente</span>
                  </div>
                </div>
              </div>
            )
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-green-600 text-primary-foreground"
            >
              {loading ? "Salvando..." : isInstallment ? `Criar ${installmentCount} parcelas` : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Goal Item Link Dialog */}
    <GoalItemLinkDialog
      open={showGoalItemLink}
      onOpenChange={(open) => {
        setShowGoalItemLink(open);
        if (!open) setPendingTransactionData(null);
      }}
      transactionAmount={pendingTransactionData?.amount || 0}
      transactionDescription={pendingTransactionData?.description || ""}
      onLink={handleLinkGoalItem}
    />
    </>
  );
};

export default AddTransactionDialog;
