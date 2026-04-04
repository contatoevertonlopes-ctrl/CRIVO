import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardWithBill, CardTransaction, cardKeys } from "@/hooks/useCards";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholdId } from "@/hooks/useHouseholdId";
import { useBankAccounts, bankAccountKeys } from "@/hooks/useBankAccounts";
import { transactionKeys } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  Calendar, 
  Receipt, 
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Trash2,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addMonths, format, parseISO, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import EditCardTransactionDialog from "./EditCardTransactionDialog";
import { toast } from "sonner";

interface CardDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardWithBill | null;
  transactions: CardTransaction[];
  onEdit: () => void;
  onDelete: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const getProgressColor = (percent: number) => {
  if (percent <= 30) return "bg-emerald-500";
  if (percent <= 60) return "bg-amber-500";
  if (percent <= 80) return "bg-orange-500";
  return "bg-red-500";
};

const CardDetailsDrawer = ({ 
  open, 
  onOpenChange, 
  card, 
  transactions,
  onEdit,
  onDelete
}: CardDetailsDrawerProps) => {
  const { user } = useAuth();
  const { householdId } = useHouseholdId();
  const { accounts } = useBankAccounts();
  const [activeTab, setActiveTab] = useState("installments");
  const [editingTransaction, setEditingTransaction] = useState<CardTransaction | null>(null);
  const [payingMonth, setPayingMonth] = useState<string | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payDialogMonth, setPayDialogMonth] = useState<string | null>(null);
  const [payDialogAmount, setPayDialogAmount] = useState<number>(0);
  const [payDialogLabel, setPayDialogLabel] = useState<string>("");
  const [payDialogTransactionIds, setPayDialogTransactionIds] = useState<string[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");
  const queryClient = useQueryClient();

  // Filter and group transactions for this card
  const cardTransactions = useMemo(() => {
    if (!card) return [];
    return transactions.filter(tx => tx.card_id === card.id);
  }, [transactions, card]);

  // Installment purchases (grouped by parent)
  const installmentPurchases = useMemo(() => {
    const purchases: Map<string, CardTransaction[]> = new Map();
    
    cardTransactions.forEach(tx => {
      // Group by parent transaction or by itself if no parent
      const key = tx.parent_card_transaction_id || tx.id;
      const existing = purchases.get(key) || [];
      existing.push(tx);
      purchases.set(key, existing);
    });
    // Convert to array and sort by purchase date
    return Array.from(purchases.entries())
      .map(([key, txs]) => {
        const sorted = txs.sort((a, b) => a.installment_number - b.installment_number);
        const firstTx = sorted[0];
        const paidCount = sorted.filter(t => t.is_paid).length;
        
        // Clean description (remove installment suffix)
        const cleanDescription = firstTx.description.replace(/\s*\(\d+\/\d+\)\s*$/, "");
        
        return {
          id: key,
          description: cleanDescription,
          totalAmount: firstTx.amount * firstTx.total_installments,
          installmentAmount: firstTx.amount,
          purchaseDate: firstTx.purchase_date,
          totalInstallments: firstTx.total_installments,
          paidInstallments: paidCount,
          currentInstallment: sorted.find(t => !t.is_paid)?.installment_number || firstTx.total_installments,
          installments: sorted,
          isFullyPaid: paidCount === firstTx.total_installments,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.purchaseDate + "T00:00:00").getTime() -
          new Date(a.purchaseDate + "T00:00:00").getTime()
      );
  }, [cardTransactions]);

  // Group transactions by billing month for history
  const billsHistory = useMemo(() => {
    const grouped: Map<string, { transactions: CardTransaction[]; total: number; isPast: boolean }> = new Map();
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    
    cardTransactions.forEach(tx => {
      const month = tx.billing_month.substring(0, 7); // YYYY-MM
      const existing = grouped.get(month) || { transactions: [], total: 0, isPast: false };
      existing.transactions.push(tx);
      existing.total += Number(tx.amount);
      // Avoid timezone issues: compare YYYY-MM strings
      existing.isPast = month < currentMonthKey;
      grouped.set(month, existing);
    });

    return Array.from(grouped.entries())
      .map(([month, data]) => ({
        month,
        label: format(parseISO(`${month}-01`), "MMMM yyyy", { locale: ptBR }),
        ...data,
        paidCount: data.transactions.filter(t => t.is_paid).length,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [cardTransactions]);

  const getErrorMessage = (err: unknown) => {
    if (!err) return "Erro desconhecido";
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message || "Erro";

    const maybe = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) return maybe.message;
    if (typeof maybe.details === "string" && maybe.details.trim()) return maybe.details;
    if (typeof maybe.hint === "string" && maybe.hint.trim()) return maybe.hint;
    if (typeof maybe.code === "string" && maybe.code.trim()) return maybe.code;

    try {
      return JSON.stringify(err);
    } catch {
      return "Erro";
    }
  };

  const getBillingMonthRange = (monthKey: string) => {
    const start = `${monthKey}-01`; // yyyy-MM-dd
    const endExclusive = format(addMonths(parseISO(start), 1), "yyyy-MM-dd");
    return { start, endExclusive };
  };

  const payBillMonth = async (params: {
    month: string;
    amount: number;
    label: string;
    bankAccountId: string | null;
    linkedTransactionIds: string[];
  }) => {
    if (!card) return;
    if (!user) {
      toast.error("Você precisa estar logado para pagar a fatura");
      return;
    }

    setPayingMonth(params.month);
    try {
      const { start, endExclusive } = getBillingMonthRange(params.month);

      const { error } = await supabase
        .from("card_transactions")
        .update({ is_paid: true })
        .eq("card_id", card.id)
        .gte("billing_month", start)
        .lt("billing_month", endExclusive);

      if (error) throw error;

      // Mark linked purchase transactions as paid so they stop counting as pending in the dashboard.
      if (params.linkedTransactionIds.length > 0) {
        const { error: txError } = await supabase
          .from("transactions")
          .update({
            status: "pagamento_concluido",
            paid_date: new Date().toISOString().split("T")[0],
          })
          .in("id", params.linkedTransactionIds);
        if (txError) throw txError;
      }

      // Create a single bank debit transaction (if user selected an account)
      let billPaymentTransactionId: string | null = null;
      if (params.bankAccountId) {
        const todayStr = new Date().toISOString().split("T")[0];
        const { data: created, error: createError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            household_id: householdId,
            description: `Pagamento fatura ${card.name} • ${params.label}`,
            category: "Fatura Cartão",
            type: "expense",
            amount: params.amount,
            status: "pagamento_concluido",
            date: todayStr,
            paid_date: todayStr,
            payment_method: "bank_transfer",
            bank_account_id: params.bankAccountId,
          })
          .select("id")
          .single();

        if (createError) throw createError;
        billPaymentTransactionId = (created?.id as string | undefined) ?? null;
      }

      // Best-effort: update consolidated bill row, if it exists.
      await supabase
        .from("card_bills")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          transaction_id: billPaymentTransactionId,
        })
        .eq("card_id", card.id)
        .gte("billing_month", start)
        .lt("billing_month", endExclusive);

      toast.success("Fatura marcada como paga!");
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
    } catch (err) {
      console.error("Error paying bill month:", {
        err,
        month: params.month,
        cardId: card.id,
        linkedTransactionIdsCount: params.linkedTransactionIds.length,
        bankAccountId: params.bankAccountId,
      });
      toast.error(`Erro ao pagar fatura: ${getErrorMessage(err)}`);
    } finally {
      setPayingMonth((cur) => (cur === params.month ? null : cur));
    }
  };

  if (!card) return null;

  const usagePercent = card.credit_limit > 0 
    ? ((card.credit_limit - card.availableLimit) / card.credit_limit) * 100 
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header with card visual */}
        <div 
          className="relative p-6 text-white"
          style={{
            background: `linear-gradient(145deg, ${card.color}ee, ${card.color}aa)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
          
          <SheetHeader className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] opacity-60 uppercase tracking-widest">Cartão de Crédito</p>
                <SheetTitle className="text-white text-xl font-bold mt-1">
                  {card.name}
                </SheetTitle>
                {card.last_four_digits && (
                  <p className="text-sm opacity-70 mt-1 font-mono tracking-widest">
                    •••• {card.last_four_digits}
                  </p>
                )}
              </div>
              
              {card.isBestDayToBuy && (
                <Badge className="bg-amber-400 text-amber-950 text-[10px] animate-pulse">
                  ⭐ Melhor Dia
                </Badge>
              )}
            </div>

            {/* Limit bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="opacity-70">Limite usado</span>
                <span className="font-bold">{usagePercent.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", getProgressColor(usagePercent))}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs pt-1">
                <span className="whitespace-nowrap">
                  <span className="opacity-70">Fatura: </span>
                  <span className="font-bold">{formatCurrency(card.currentBill)}</span>
                </span>
                <span className="whitespace-nowrap">
                  <span className="opacity-70">Disponível: </span>
                  <span className="font-bold">{formatCurrency(card.availableLimit)}</span>
                </span>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 bg-secondary/50">
            <TabsTrigger value="installments" className="flex-1 gap-1.5">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Parcelas</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Faturas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 gap-1.5">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            {/* Installments Tab */}
            <TabsContent value="installments" className="mt-0 space-y-3">
              {installmentPurchases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma compra parcelada encontrada</p>
                </div>
              ) : (
                installmentPurchases.map(purchase => (
                  <div 
                    key={purchase.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all group",
                      purchase.isFullyPaid 
                        ? "bg-secondary/30 border-border/30 opacity-60"
                        : "bg-card border-border/70 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{purchase.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(purchase.purchaseDate), "dd/MM/yyyy")}
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm">{formatCurrency(purchase.totalAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {purchase.totalInstallments}x {formatCurrency(purchase.installmentAmount)}
                          </p>
                        </div>
                        
                        {!purchase.isFullyPaid && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => setEditingTransaction(purchase.installments[0])}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Installment progress */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex gap-0.5">
                          {Array.from({ length: purchase.totalInstallments }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-all",
                                i < purchase.paidInstallments 
                                  ? "bg-emerald-500" 
                                  : i === purchase.paidInstallments
                                    ? "bg-primary animate-pulse"
                                    : "bg-secondary"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <Badge 
                        variant={purchase.isFullyPaid ? "secondary" : "default"}
                        className={cn(
                          "text-[10px] font-bold",
                          purchase.isFullyPaid && "bg-emerald-500/20 text-emerald-500"
                        )}
                      >
                        {purchase.isFullyPaid ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Quitado
                          </>
                        ) : (
                          `${purchase.currentInstallment}/${purchase.totalInstallments}`
                        )}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0 space-y-3">
              {billsHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma fatura encontrada</p>
                </div>
              ) : (
                billsHistory.map(bill => {
                  const isCurrent = isSameMonth(parseISO(`${bill.month}-01`), new Date());
                  const allPaid = bill.paidCount === bill.transactions.length;
                  const canPay = !allPaid && bill.transactions.length > 0;
                  const linkedTransactionIds = bill.transactions
                    .map((t) => t.transaction_id)
                    .filter((id): id is string => !!id);
                  
                  return (
                    <div 
                      key={bill.month}
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        isCurrent 
                          ? "bg-primary/5 border-primary/30"
                          : allPaid
                            ? "bg-secondary/30 border-border/30"
                            : "bg-card border-border/70"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isCurrent 
                              ? "bg-primary/20 text-primary"
                              : allPaid
                                ? "bg-emerald-500/20 text-emerald-500"
                                : "bg-secondary text-muted-foreground"
                          )}>
                            {allPaid ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : isCurrent ? (
                              <Clock className="w-5 h-5" />
                            ) : (
                              <AlertCircle className="w-5 h-5" />
                            )}
                          </div>
                          
                          <div>
                            <p className="font-medium text-sm capitalize">{bill.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {bill.transactions.length} lançamento{bill.transactions.length !== 1 && "s"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={cn(
                            "font-bold",
                            isCurrent ? "text-primary" : ""
                          )}>
                            {formatCurrency(bill.total)}
                          </p>
                          {canPay && (
                            <div className="mt-2 flex justify-end">
                              <Button
                                size="sm"
                                className="h-7 px-3 text-[11px]"
                                disabled={payingMonth === bill.month}
                                onClick={() => {
                                  if (!card) return;
                                  if (accounts.length > 1) {
                                    setPayDialogMonth(bill.month);
                                    setPayDialogAmount(bill.total);
                                    setPayDialogLabel(bill.label);
                                    setPayDialogTransactionIds(linkedTransactionIds);
                                    setSelectedBankAccountId(accounts[0]?.id ?? "");
                                    setPayDialogOpen(true);
                                    return;
                                  }

                                  const bankAccountId = accounts.length === 1 ? accounts[0].id : null;
                                  payBillMonth({
                                    month: bill.month,
                                    amount: bill.total,
                                    label: bill.label,
                                    bankAccountId,
                                    linkedTransactionIds,
                                  });
                                }}
                              >
                                {payingMonth === bill.month ? "Pagando..." : "Pagar fatura"}
                              </Button>
                            </div>
                          )}
                          {isCurrent && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              Atual
                            </Badge>
                          )}
                          {allPaid && !isCurrent && (
                            <Badge className="text-[10px] mt-1 bg-emerald-500/20 text-emerald-500 border-0">
                              Paga
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Transaction list for this month */}
                      {isCurrent && bill.transactions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/70 space-y-2">
                          {bill.transactions.slice(0, 3).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate flex-1">
                                {tx.description}
                              </span>
                              <span className="font-medium ml-2">
                                {formatCurrency(tx.amount)}
                              </span>
                            </div>
                          ))}
                          {bill.transactions.length > 3 && (
                            <p className="text-[10px] text-muted-foreground text-center pt-1">
                              +{bill.transactions.length - 3} outros lançamentos
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0 space-y-4">
              <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3">
                <h4 className="text-sm font-medium">Informações do Cartão</h4>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Limite Total</p>
                    <p className="font-bold">{formatCurrency(card.credit_limit)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Bandeira</p>
                    <p className="font-bold capitalize">{card.brand}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Fechamento</p>
                    <p className="font-bold">Dia {card.closing_day}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className="font-bold">Dia {card.due_day}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={onEdit}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Editar Cartão
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>

      <EditCardTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      <AlertDialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pagar fatura</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione em qual conta bancária debitar o pagamento.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} • {a.bank_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!payDialogMonth || !selectedBankAccountId}
              onClick={() => {
                if (!payDialogMonth) return;
                payBillMonth({
                  month: payDialogMonth,
                  amount: payDialogAmount,
                  label: payDialogLabel,
                  bankAccountId: selectedBankAccountId,
                  linkedTransactionIds: payDialogTransactionIds,
                });
              }}
            >
              Pagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};

export default CardDetailsDrawer;
