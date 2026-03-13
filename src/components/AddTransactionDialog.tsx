import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCards } from "@/hooks/useCards";
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
import { Plus, RefreshCw, Lock, ListOrdered, CreditCard, Landmark, Wallet, AlertCircle } from "lucide-react";
import { addMonths, addWeeks, addDays, format } from "date-fns";
import { getNextRecurringDate, getRecurringGenerationCount } from "@/utils/recurringGeneration";
import { createRecurringSeries as createRecurringSeriesInDb } from "@/hooks/useRecurringSeries";
import GoalItemLinkDialog from "./GoalItemLinkDialog";
import { cn } from "@/lib/utils";

interface AddTransactionDialogProps {
  onSuccess: () => void;
}

const AddTransactionDialog = ({ onSuccess }: AddTransactionDialogProps) => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { householdId } = useHouseholdId();
  const { accounts } = useBankAccounts();
  const { cards } = useCards();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("pending");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidDate, setPaidDate] = useState("");
  const [tag, setTag] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("monthly");
  
  // Bank account / Card selection
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  
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

  // Validation state - tracks which fields have been touched
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Determine if we should show bank account or card selector
  const requiresBankAccount = ["pix", "bank_transfer", "debit_card"].includes(paymentMethod);
  const requiresCard = paymentMethod === "credit_card";

  // Compute validation errors
  const errors = {
    description: touched.description && !description.trim(),
    amount: touched.amount && (!amount || parseFloat(amount) <= 0),
    category: touched.category && !category.trim(),
    paymentMethod: touched.paymentMethod && !paymentMethod,
    bankAccount: touched.bankAccount && requiresBankAccount && accounts.length > 0 && !selectedBankAccountId,
    card: touched.card && requiresCard && cards.length > 0 && !selectedCardId,
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

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

  const createCardTransactionsSeries = async (params: {
    cardId: string;
    purchaseDateStr: string;
    description: string;
    totalAmount: number;
    installments: number;
    transactionIds?: string[];
  }) => {
    if (!user) throw new Error("User not authenticated");

    const card = cards.find((c) => c.id === params.cardId);
    if (!card) throw new Error("Cartão não encontrado");

    const purchaseDate = new Date(params.purchaseDateStr + "T00:00:00");
    const purchaseDay = purchaseDate.getDate();

    let firstBillingMonth = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), 1);
    if (purchaseDay > card.closing_day) {
      firstBillingMonth.setMonth(firstBillingMonth.getMonth() + 1);
    }

    const installmentAmount = Math.round((params.totalAmount / params.installments) * 100) / 100;
    const firstDescription = params.installments > 1
      ? `${params.description} (1/${params.installments})`
      : params.description;

    const { data: root, error: rootError } = await supabase
      .from("card_transactions")
      .insert({
        card_id: params.cardId,
        transaction_id: params.transactionIds?.[0] ?? null,
        user_id: user.id,
        household_id: householdId,
        description: firstDescription,
        amount: installmentAmount,
        purchase_date: params.purchaseDateStr,
        installment_number: 1,
        total_installments: params.installments,
        billing_month: firstBillingMonth.toISOString().split("T")[0],
      })
      .select("id")
      .single();

    if (rootError) throw rootError;
    const rootId = root?.id as string | undefined;
    if (!rootId) throw new Error("Falha ao criar gasto no cartão");

    if (params.installments > 1) {
      const rows: any[] = [];
      for (let i = 2; i <= params.installments; i++) {
        const billingMonth = new Date(firstBillingMonth);
        billingMonth.setMonth(billingMonth.getMonth() + (i - 1));
        rows.push({
          card_id: params.cardId,
          transaction_id: params.transactionIds?.[i - 1] ?? null,
          user_id: user.id,
          household_id: householdId,
          description: `${params.description} (${i}/${params.installments})`,
          amount: installmentAmount,
          purchase_date: params.purchaseDateStr,
          installment_number: i,
          total_installments: params.installments,
          parent_card_transaction_id: rootId,
          billing_month: billingMonth.toISOString().split("T")[0],
        });
      }

      const { error: rowsError } = await supabase.from("card_transactions").insert(rows);
      if (rowsError) throw rowsError;
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const computeUnpaidStatus = (dateStr: string) => {
    if (dateStr > todayStr) return "upcoming";
    if (dateStr < todayStr) return "overdue";
    return "pending";
  };

  const createRecurringSeries = async (root: {
    description: string;
    amount: number;
    category: string;
    type: "income" | "expense";
    status: string;
    date: string;
    recurring_interval: string;
    tag: string | null;
    paid_date: string | null;
    payment_method: string | null;
    bank_account_id: string | null;
    card_id: string | null;
  }) => {
    if (!user) throw new Error("Missing user");

    const interval = root.recurring_interval as "weekly" | "biweekly" | "monthly" | "yearly";
    const generationCount = getRecurringGenerationCount(interval);
    const baseDate = new Date(root.date + "T00:00:00");

    const occurrences = Array.from({ length: generationCount }, (_, i) => {
      const d = getNextRecurringDate(baseDate, i, interval);
      const dateStr = d.toISOString().split("T")[0];
      const isFirst = i === 0;
      return {
        date: dateStr,
        status: isFirst ? root.status : computeUnpaidStatus(dateStr),
        paid_date: isFirst ? root.paid_date : null,
      };
    });

    return createRecurringSeriesInDb(
      {
        user_id: user.id,
        household_id: householdId,
        description: root.description,
        amount: root.amount,
        category: root.category,
        type: root.type,
        interval,
        start_date: root.date,
        tag: root.tag,
        payment_method: root.payment_method,
        bank_account_id: root.bank_account_id,
        card_id: root.card_id,
      },
      occurrences,
      user.id,
      householdId,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all required fields as touched
    setTouched({
      description: true,
      amount: true,
      category: true,
      paymentMethod: true,
      bankAccount: requiresBankAccount,
      card: requiresCard,
    });

    if (!user) {
      toast({
        variant: "destructive",
        title: "Não autorizado",
        description: "Você precisa estar logado para adicionar transações.",
      });
      return;
    }

    // Validate all required fields
    const hasErrors = !description.trim() || 
      !amount || 
      parseFloat(amount) <= 0 || 
      !category.trim() ||
      !paymentMethod ||
      (requiresBankAccount && accounts.length > 0 && !selectedBankAccountId) ||
      (requiresCard && cards.length > 0 && !selectedCardId);

    if (hasErrors) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
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

        const firstInstallmentDate = getNextInstallmentDate(baseDate, 0, installmentInterval);
        const firstDateStr = firstInstallmentDate.toISOString().split("T")[0];

        const { data: rootTx, error: rootTxError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            household_id: householdId,
            description: `${description} 1/${numInstallments}`,
            category,
            type,
            amount: installmentAmount,
            status,
            date: firstDateStr,
            paid_date: paidDate || null,
            tag: tag || null,
            payment_method: paymentMethod || null,
            is_recurring: false,
            recurring_interval: null,
            frequency: null,
            bank_account_id: requiresBankAccount ? (selectedBankAccountId || null) : null,
            card_id: requiresCard ? (selectedCardId || null) : null,
          })
          .select("id")
          .single();

        if (rootTxError) throw rootTxError;
        const rootTransactionId = rootTx?.id as string | undefined;
        if (!rootTransactionId) throw new Error("Falha ao criar transação raiz do parcelamento");

        const childRows: any[] = [];
        for (let i = 1; i < numInstallments; i++) {
          const installmentDate = getNextInstallmentDate(baseDate, i, installmentInterval);
          childRows.push({
            user_id: user.id,
            household_id: householdId,
            description: `${description} ${i + 1}/${numInstallments}`,
            category,
            type,
            amount: installmentAmount,
            status: "pending",
            date: installmentDate.toISOString().split("T")[0],
            paid_date: null,
            tag: tag || null,
            payment_method: paymentMethod || null,
            is_recurring: false,
            recurring_interval: null,
            frequency: null,
            parent_transaction_id: rootTransactionId,
            bank_account_id: requiresBankAccount ? (selectedBankAccountId || null) : null,
            card_id: requiresCard ? (selectedCardId || null) : null,
          });
        }

        let transactionIds: string[] = [rootTransactionId];
        if (childRows.length > 0) {
          const { data: insertedChildren, error: childrenError } = await supabase
            .from("transactions")
            .insert(childRows)
            .select("id");
          if (childrenError) throw childrenError;
          transactionIds = transactionIds.concat((insertedChildren || []).map((r: any) => r.id));
        }

        // Also register into card_transactions so it appears on Cards screen
        if (requiresCard && selectedCardId) {
          await createCardTransactionsSeries({
            cardId: selectedCardId,
            purchaseDateStr: date,
            description,
            totalAmount,
            installments: numInstallments,
            transactionIds,
          });
        }

        toast({
          title: "Parcelas criadas",
          description: `${numInstallments} parcelas de R$ ${installmentAmount.toFixed(2)} foram criadas.`,
        });
      } else {
        // Single transaction
        let createdTransactionId: string | null = null;
        if (subscribed && isRecurring) {
          createdTransactionId = await createRecurringSeries({
            description,
            category,
            type,
            amount: parseFloat(amount),
            status,
            date,
            paid_date: paidDate || null,
            tag: tag || null,
            payment_method: paymentMethod || null,
            recurring_interval: recurringInterval,
            bank_account_id: requiresBankAccount ? (selectedBankAccountId || null) : null,
            card_id: requiresCard ? (selectedCardId || null) : null,
          });
        } else {
          const { data: created, error } = await supabase
            .from("transactions")
            .insert({
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
            is_recurring: false,
            recurring_interval: null,
            frequency: null,
            bank_account_id: requiresBankAccount ? (selectedBankAccountId || null) : null,
            card_id: requiresCard ? (selectedCardId || null) : null,
            })
            .select("id")
            .single();

          if (error) throw error;
          createdTransactionId = (created?.id as string | undefined) ?? null;
        }

        // If it's a credit-card purchase, also register into card_transactions
        if (requiresCard && selectedCardId) {
          await createCardTransactionsSeries({
            cardId: selectedCardId,
            purchaseDateStr: date,
            description,
            totalAmount: parseFloat(amount),
            installments: 1,
            transactionIds: createdTransactionId ? [createdTransactionId] : undefined,
          });
        }

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
      setStatus("pending");
      setDate(new Date().toISOString().split("T")[0]);
      setPaidDate("");
      setTag("");
      setPaymentMethod("");
      setSelectedBankAccountId("");
      setSelectedCardId("");
      setIsRecurring(false);
      setRecurringInterval("monthly");
      setIsInstallment(false);
      setInstallmentCount("2");
      setInstallmentInterval("monthly");
      setTouched({});
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
    { value: "pending", label: "Em aberto" },
    { value: "upcoming", label: "A vencer" },
    { value: "overdue", label: "Vencido" },
    { value: "paid", label: "Pagamento concluído" },
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
            <Label htmlFor="description" className={cn(errors.description && "text-destructive")}>
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleBlur("description")}
              placeholder="Ex: Pagamento cliente X"
              className={cn("bg-secondary/50 border-border/50", errors.description && "border-destructive focus-visible:ring-destructive")}
              autoComplete="off"
            />
            {errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Descrição é obrigatória
              </p>
            )}
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
              <Label htmlFor="amount" className={cn(errors.amount && "text-destructive")}>
                {isInstallment ? "Valor Total (R$)" : "Valor (R$)"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => handleBlur("amount")}
                placeholder="0,00"
                className={cn("bg-secondary/50 border-border/50", errors.amount && "border-destructive focus-visible:ring-destructive")}
                autoComplete="off"
              />
              {errors.amount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Valor inválido
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className={cn(errors.category && "text-destructive")}>
                Categoria <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onBlur={() => handleBlur("category")}
                placeholder="Ex: Serviços"
                className={cn("bg-secondary/50 border-border/50", errors.category && "border-destructive focus-visible:ring-destructive")}
                autoComplete="off"
              />
              {errors.category && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Categoria é obrigatória
                </p>
              )}
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
            <Label htmlFor="paymentMethod" className={cn("flex items-center gap-2", errors.paymentMethod && "text-destructive")}>
              <Wallet className="w-4 h-4" />
              Forma de Pagamento <span className="text-destructive">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={(value) => {
              setPaymentMethod(value);
              setSelectedBankAccountId("");
              setSelectedCardId("");
              setTouched(prev => ({ ...prev, paymentMethod: true }));
            }}>
              <SelectTrigger className={cn("bg-secondary/50 border-border/50", errors.paymentMethod && "border-destructive focus:ring-destructive")}>
                <SelectValue placeholder="Selecione a forma de pagamento" />
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
            {errors.paymentMethod && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Forma de pagamento é obrigatória
              </p>
            )}
          </div>

          {/* Bank Account Selector - shows for PIX, Transfer, Debit */}
          {requiresBankAccount && (
            <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <Label className={cn("flex items-center gap-2", errors.bankAccount && "text-destructive")}>
                <Landmark className="w-4 h-4 text-primary" />
                Selecionar Conta <span className="text-destructive">*</span>
              </Label>
              {accounts.length > 0 ? (
                <>
                  <Select value={selectedBankAccountId} onValueChange={(v) => {
                    setSelectedBankAccountId(v);
                    setTouched(prev => ({ ...prev, bankAccount: true }));
                  }}>
                    <SelectTrigger className={cn("bg-secondary/50 border-border/50", errors.bankAccount && "border-destructive focus:ring-destructive")}>
                      <SelectValue placeholder="Escolha a conta bancária" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account.color || "#6366f1" }} />
                            {account.bank_name} - {account.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bankAccount && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Selecione uma conta bancária
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  Nenhuma conta bancária cadastrada.
                </p>
              )}
            </div>
          )}

          {/* Card Selector - shows for Credit Card */}
          {requiresCard && (
            <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <Label className={cn("flex items-center gap-2", errors.card && "text-destructive")}>
                <CreditCard className="w-4 h-4 text-primary" />
                Selecionar Cartão <span className="text-destructive">*</span>
              </Label>
              {cards.length > 0 ? (
                <>
                  <Select value={selectedCardId} onValueChange={(v) => {
                    setSelectedCardId(v);
                    setTouched(prev => ({ ...prev, card: true }));
                  }}>
                    <SelectTrigger className={cn("bg-secondary/50 border-border/50", errors.card && "border-destructive focus:ring-destructive")}>
                      <SelectValue placeholder="Escolha o cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: card.color || "#8B5CF6" }} />
                            {card.name} {card.last_four_digits && `•••• ${card.last_four_digits}`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.card && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Selecione um cartão
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  Nenhum cartão cadastrado.
                </p>
              )}
            </div>
          )}

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
