import React, { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Lock, Tag, ListOrdered, CreditCard, Landmark, Wallet, AlertCircle, ChevronRight, Calendar } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCards } from "@/hooks/useCards";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { detectCategory } from "@/utils/categorySuggestion";
import CurrencyInput from "@/components/CurrencyInput";
import CategoryPicker from "@/components/CategoryPicker";
import { useTransactionCategories } from "@/hooks/useTransactionCategories";
import { CATEGORY_ICONS, findCategoryByName } from "@/lib/transactionCategories";

export interface TransactionFormData {
  description: string;
  amount: string;
  category: string;
  type: "income" | "expense";
  status: string;
  date: string;
  is_recurring: boolean;
  recurring_interval: string;
  frequency: string;
  paid_date: string;
  tag: string;
  is_installment: boolean;
  installment_count: string;
  installment_interval: string;
  payment_method: string;
  bank_account_id?: string;
  card_id?: string;
}

interface TransactionFormProps {
  formData: TransactionFormData;
  setFormData: (data: TransactionFormData) => void;
  onSubmit: () => void;
  submitLabel: string;
  subscribed: boolean;
  showInstallment?: boolean;
  variant?: "full" | "compact";
}

interface ValidationErrors {
  description: boolean;
  amount: boolean;
  category: boolean;
  payment_method: boolean;
  bank_account_id: boolean;
  card_id: boolean;
}

const TransactionForm = ({ formData, setFormData, onSubmit, submitLabel, subscribed, showInstallment = true, variant = "full" }: TransactionFormProps) => {
  const { accounts } = useBankAccounts();
  const { cards } = useCards();
  const isInstallment = formData.is_installment || false;
  const installmentCount = formData.installment_count || "2";
  const installmentInterval = formData.installment_interval || "monthly";
  const isCompact = variant === "compact";
  const { categories: transactionCategories } = useTransactionCategories();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const computeUnpaidStatusLocal = (dateStr: string) => {
    const date = dateStr || todayStr;
    if (date > todayStr) return "a_vencer";
    if (date < todayStr) return "vencido";
    return "em_aberto";
  };

  const isPaid = formData.status === "paid";

  // Validation state - tracks which fields have been touched
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Determine if we should show bank account or card selector
  const requiresBankAccount = ["pix", "bank_transfer", "debit_card"].includes(formData.payment_method);
  const requiresCard = formData.payment_method === "credit_card";

  // Compute validation errors
  const errors: ValidationErrors = {
    description: touched.description && !formData.description.trim(),
    amount: touched.amount && (!formData.amount || parseFloat(formData.amount) <= 0),
    category: !isCompact && touched.category && !formData.category.trim(),
    payment_method: touched.payment_method && !formData.payment_method,
    bank_account_id: touched.bank_account_id && requiresBankAccount && accounts.length > 0 && !formData.bank_account_id,
    card_id: touched.card_id && requiresCard && cards.length > 0 && !formData.card_id,
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Reset bank_account_id and card_id when payment method changes
  useEffect(() => {
    if (!requiresBankAccount && formData.bank_account_id) {
      setFormData({ ...formData, bank_account_id: "" });
    }
    if (!requiresCard && formData.card_id) {
      setFormData({ ...formData, card_id: "" });
    }
  }, [formData.payment_method]);

  // Auto-select the only bank account / card when applicable.
  useEffect(() => {
    const updates: Partial<TransactionFormData> = {};
    if (requiresBankAccount && accounts.length === 1 && !formData.bank_account_id) {
      updates.bank_account_id = accounts[0].id;
    }
    if (requiresCard && cards.length === 1 && !formData.card_id) {
      updates.card_id = cards[0].id;
    }

    if (Object.keys(updates).length > 0) {
      setFormData({ ...formData, ...updates });
    }
  }, [requiresBankAccount, requiresCard, accounts, cards]);

  // Compact mode: auto-compute status from date only if not manually set to paid.
  const [statusManuallySet, setStatusManuallySet] = React.useState(false);
  useEffect(() => {
    if (!isCompact) return;
    if (statusManuallySet) return;
    if (formData.status === "paid") return;
    const nextStatus = computeUnpaidStatusLocal(formData.date);
    if (formData.status !== nextStatus) {
      setFormData({ ...formData, status: nextStatus });
    }
  }, [isCompact, formData.date]);

  // Auto-fill category from description when user hasn't set one.
  useEffect(() => {
    const description = formData.description.trim();
    if (!description) return;
    if (touched.category) return;

    const currentCategory = (formData.category || "").trim();
    const canAutoFill = !currentCategory || currentCategory.toLowerCase() === "outros";
    if (!canAutoFill) return;

    const suggested = detectCategory(description);
    if (suggested && suggested !== "Outros" && suggested !== formData.category) {
      setFormData({ ...formData, category: suggested });
    }
  }, [formData.description]);

  const handleSubmit = () => {
    // Mark all required fields as touched
    const allTouched = {
      description: true,
      amount: true,
      category: !isCompact,
      payment_method: true,
      bank_account_id: requiresBankAccount,
      card_id: requiresCard,
    };
    setTouched(allTouched);

    // Normalize compact-mode fields before validating
    const normalizedCategory = (formData.category || "").trim() || (isCompact ? "Outros" : "");
    const normalizedStatus = formData.status || (isCompact ? computeUnpaidStatusLocal(formData.date) : "pending");
    const normalizedPaidDate = normalizedStatus === "paid"
      ? (formData.paid_date || todayStr)
      : formData.paid_date;

    // Validate all fields
    const hasErrors = !formData.description.trim() || 
      !formData.amount || 
      parseFloat(formData.amount) <= 0 || 
      (!isCompact && !formData.category.trim()) ||
      !formData.payment_method ||
      (requiresBankAccount && accounts.length > 0 && !formData.bank_account_id) ||
      (requiresCard && cards.length > 0 && !formData.card_id);

    if (hasErrors) {
      return;
    }

    // Ensure normalized values are reflected in the external state (best-effort).
    const nextFormData: TransactionFormData = {
      ...formData,
      category: normalizedCategory,
      status: normalizedStatus,
      paid_date: normalizedPaidDate,
    };

    if (
      nextFormData.category !== formData.category ||
      nextFormData.status !== formData.status ||
      nextFormData.paid_date !== formData.paid_date
    ) {
      setFormData(nextFormData);
    }

    onSubmit();
  };

  const repeatMode: "none" | "recurring" | "installment" =
    formData.is_installment ? "installment" : formData.is_recurring ? "recurring" : "none";

  const selectedCategory = useMemo(() => {
    const current = (formData.category || "").trim() || "Outros";
    return (
      findCategoryByName(transactionCategories, current) ??
      findCategoryByName(transactionCategories, "Outros")
    );
  }, [transactionCategories, formData.category]);

  const SelectedCategoryIcon = selectedCategory ? CATEGORY_ICONS[selectedCategory.icon] : null;

  return (
    <div className={cn("space-y-4", isCompact && "space-y-3")}> 
      {isCompact && (
        <div className="space-y-2">
          <Label className="text-sm">Tipo</Label>
          <Tabs
            value={formData.type}
            onValueChange={(v) => setFormData({ ...formData, type: v as "income" | "expense" })}
          >
            <TabsList className="w-full h-11 bg-secondary/40">
              <TabsTrigger
                value="expense"
                className="flex-1 text-sm font-medium data-[state=active]:bg-red-500/15 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300"
              >
                Despesa
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="flex-1 text-sm font-medium data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300"
              >
                Receita
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className={cn("space-y-2", isCompact && "space-y-1.5")}>
        <Label className={cn(errors.description && "text-destructive")}>
          Descrição <span className="text-destructive">*</span>
        </Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          onBlur={() => handleBlur("description")}
          placeholder="Ex: Salário, Aluguel..."
          autoComplete="off"
          className={cn(
            errors.description && "border-destructive focus-visible:ring-destructive",
            isCompact && "h-12 text-base"
          )}
        />
        {errors.description && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Descrição é obrigatória
          </p>
        )}
      </div>
      {isCompact ? (
        <>
          {/* Valor */}
          <div className="space-y-1.5">
            <Label className={cn("text-sm", errors.amount && "text-destructive")}>
              {isInstallment ? "Valor Total" : "Valor"} <span className="text-destructive">*</span>
            </Label>
            <CurrencyInput
              value={formData.amount}
              onValueChange={(v) => setFormData({ ...formData, amount: v })}
              placeholder="0,00"
              inputClassName={cn(
                errors.amount && "border-destructive focus-visible:ring-destructive",
                "h-12 text-xl font-semibold tracking-tight"
              )}
              onBlur={() => handleBlur("amount")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Valor inválido
              </p>
            )}
          </div>

          {/* Data de Vencimento + Data de Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {isInstallment ? "Data 1ª Parcela" : "Vencimento"}
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Data de Pagamento
              </Label>
              <Input
                type="date"
                value={formData.paid_date}
                onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Status + Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Status</Label>
              <Select
                value={formData.status || computeUnpaidStatusLocal(formData.date)}
                onValueChange={(v) => {
                  setStatusManuallySet(true);
                  setFormData({
                    ...formData,
                    status: v,
                    paid_date: v === "paid" ? (formData.paid_date || todayStr) : formData.paid_date,
                  });
                }}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Em aberto</SelectItem>
                  <SelectItem value="upcoming">A vencer</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Classificação</Label>
              <Select
                value={formData.tag || "none"}
                onValueChange={(v) => setFormData({ ...formData, tag: v === "none" ? "" : v })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="fixa">Fixa</SelectItem>
                  <SelectItem value="variavel">Variável</SelectItem>
                  <SelectItem value="esporadica">Esporádica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <Label className={cn("text-sm", errors.category && "text-destructive")}>
              Categoria <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <CategoryPicker
              value={(formData.category || "").trim() || "Outros"}
              onValueChange={(v) => {
                setFormData({ ...formData, category: v });
                setTouched((prev) => ({ ...prev, category: true }));
              }}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-between items-center h-11 px-3",
                    errors.category && "border-destructive focus-visible:ring-destructive"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: selectedCategory?.color ?? "#22C55E" }}
                    >
                      {SelectedCategoryIcon ? <SelectedCategoryIcon className="h-4 w-4 text-white" /> : null}
                    </div>
                    <span className="text-sm leading-none truncate">
                      {selectedCategory?.name ?? ((formData.category || "").trim() || "Outros")}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Button>
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={cn("flex items-center gap-2 text-sm", errors.payment_method && "text-destructive")}>
                <Wallet className="w-4 h-4" />
                Forma de Pagamento <span className="text-destructive">*</span>
              </Label>
              <ToggleGroup
                type="single"
                className="justify-start"
                value={requiresCard ? "credit_card" : (requiresBankAccount ? "bank" : "")}
                onValueChange={(v) => {
                  const nextPaymentMethod = v === "credit_card" ? "credit_card" : (v === "bank" ? "bank_transfer" : "");
                  setFormData({ ...formData, payment_method: nextPaymentMethod, bank_account_id: "", card_id: "" });
                  setTouched(prev => ({ ...prev, payment_method: true }));
                }}
              >
                <ToggleGroupItem value="bank" aria-label="Pago pelo banco" className="gap-2 h-10 px-3 text-sm">
                  <Landmark className="w-4 h-4" />
                  Banco
                </ToggleGroupItem>
                <ToggleGroupItem value="credit_card" aria-label="Pago no cartão de crédito" className="gap-2 h-10 px-3 text-sm">
                  <CreditCard className="w-4 h-4" />
                  Cartão
                </ToggleGroupItem>
              </ToggleGroup>
              {errors.payment_method && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Forma de pagamento é obrigatória
                </p>
              )}

              {requiresBankAccount && (
                <div className="space-y-1.5 pt-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <Label className={cn("flex items-center gap-2 text-sm", errors.bank_account_id && "text-destructive")}>
                    <Landmark className="w-4 h-4 text-primary" />
                    Selecionar Conta <span className="text-destructive">*</span>
                  </Label>
                  {accounts.length > 0 ? (
                    <>
                      <Select
                        value={formData.bank_account_id || ""}
                        onValueChange={(v) => {
                          setFormData({ ...formData, bank_account_id: v });
                          setTouched(prev => ({ ...prev, bank_account_id: true }));
                        }}
                      >
                        <SelectTrigger className={cn("h-11", errors.bank_account_id && "border-destructive focus:ring-destructive")}>
                          <SelectValue placeholder="Escolha a conta bancária" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: account.color || "#6366f1" }}
                                />
                                {account.bank_name} - {account.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.bank_account_id && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Selecione uma conta bancária
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      Nenhuma conta bancária cadastrada. Cadastre uma conta em "Contas Bancárias".
                    </p>
                  )}
                </div>
              )}

              {requiresCard && (
                <div className="space-y-1.5 pt-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <Label className={cn("flex items-center gap-2 text-sm", errors.card_id && "text-destructive")}>
                    <CreditCard className="w-4 h-4 text-primary" />
                    Selecionar Cartão <span className="text-destructive">*</span>
                  </Label>
                  {cards.length > 0 ? (
                    <>
                      <Select
                        value={formData.card_id || ""}
                        onValueChange={(v) => {
                          setFormData({ ...formData, card_id: v });
                          setTouched(prev => ({ ...prev, card_id: true }));
                        }}
                      >
                        <SelectTrigger className={cn("h-11", errors.card_id && "border-destructive focus:ring-destructive")}>
                          <SelectValue placeholder="Escolha o cartão" />
                        </SelectTrigger>
                        <SelectContent>
                          {cards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: card.color || "#8B5CF6" }}
                                />
                                {card.name} {card.last_four_digits && `•••• ${card.last_four_digits}`}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.card_id && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Selecione um cartão
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      Nenhum cartão cadastrado. Cadastre um cartão em "Cartões de Crédito".
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Transação recorrente</Label>
                {subscribed ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={repeatMode === "recurring" ? "default" : "outline"}
                      className="h-9 px-3"
                      onClick={() => {
                        if (repeatMode === "recurring") {
                          setFormData({ ...formData, is_recurring: false, is_installment: false });
                          return;
                        }
                        setFormData({
                          ...formData,
                          is_recurring: true,
                          recurring_interval: formData.recurring_interval || "monthly",
                          is_installment: false,
                        });
                      }}
                    >
                      Fixo
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={repeatMode === "installment" ? "default" : "outline"}
                      className="h-9 px-3"
                      onClick={() => {
                        if (repeatMode === "installment") {
                          setFormData({ ...formData, is_recurring: false, is_installment: false });
                          return;
                        }
                        setFormData({
                          ...formData,
                          is_installment: true,
                          installment_count: formData.installment_count || "2",
                          installment_interval: formData.installment_interval || "monthly",
                          is_recurring: false,
                        });
                      }}
                    >
                      Parcelado
                    </Button>
                  </div>
                ) : null}
              </div>

              {subscribed ? (
                <>
                  {repeatMode === "recurring" && (
                    <div className="pt-1">
                      <Select
                        value={formData.recurring_interval}
                        onValueChange={(v) => setFormData({ ...formData, recurring_interval: v })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {repeatMode === "installment" && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Input
                        type="number"
                        min="2"
                        max="48"
                        value={installmentCount}
                        onChange={(e) => setFormData({ ...formData, installment_count: e.target.value })}
                        className="h-11"
                      />
                      <Select
                        value={installmentInterval}
                        onValueChange={(v) => setFormData({ ...formData, installment_interval: v })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative p-3 rounded-xl border border-border bg-secondary/20">
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-1">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Plano Pro</span>
                  </div>
                  <div className="flex gap-2 opacity-50">
                    <Button type="button" variant="outline" size="sm" disabled>
                      Fixo
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled>
                      Parcelado
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={cn("grid gap-4", "grid-cols-2")}>
            <div className="space-y-2">
              <Label className={cn(errors.amount && "text-destructive")}>
                {isInstallment ? "Valor Total" : "Valor"} <span className="text-destructive">*</span>
              </Label>
              <CurrencyInput
                value={formData.amount}
                onValueChange={(v) => setFormData({ ...formData, amount: v })}
                placeholder="0,00"
                inputClassName={cn(errors.amount && "border-destructive focus-visible:ring-destructive")}
                onBlur={() => handleBlur("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Valor inválido
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={cn(errors.category && "text-destructive")}>
                Categoria <span className="text-destructive">*</span>
              </Label>
              <CategoryPicker
                value={(formData.category || "").trim() || "Outros"}
                onValueChange={(v) => {
                  setFormData({ ...formData, category: v });
                  setTouched((prev) => ({ ...prev, category: true }));
                }}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between",
                      errors.category && "border-destructive focus-visible:ring-destructive"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: selectedCategory?.color ?? "#22C55E" }}
                      >
                        {SelectedCategoryIcon ? <SelectedCategoryIcon className="h-4 w-4 text-white" /> : null}
                      </div>
                      <span className="text-sm">
                        {selectedCategory?.name ?? ((formData.category || "").trim() || "Outros")}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Button>
                }
              />
              {errors.category && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Categoria é obrigatória
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as "income" | "expense" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Em aberto</SelectItem>
                  <SelectItem value="upcoming">A vencer</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="paid">Pagamento concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={cn("grid gap-4", "grid-cols-2")}>
            <div className="space-y-2">
              <Label>{isInstallment ? "Data 1ª Parcela" : "Data de Vencimento"}</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Input
                type="date"
                value={formData.paid_date}
                onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
              />
            </div>
          </div>

          {/* Payment Method field (full) */}
          <div className="space-y-2">
            <Label className={cn("flex items-center gap-2", errors.payment_method && "text-destructive")}>
              <Wallet className="w-4 h-4" />
              Forma de Pagamento <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.payment_method || "none"} 
              onValueChange={(v) => {
                setFormData({ ...formData, payment_method: v === "none" ? "" : v, bank_account_id: "", card_id: "" });
                setTouched(prev => ({ ...prev, payment_method: true }));
              }}
            >
              <SelectTrigger className={cn(errors.payment_method && "border-destructive focus:ring-destructive")}>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Forma de pagamento é obrigatória
              </p>
            )}
          </div>
        </>
      )}


      {/* Bank Account Selector - shows for PIX, Transfer, Debit */}
      {!isCompact && requiresBankAccount && (
        <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <Label className={cn("flex items-center gap-2", errors.bank_account_id && "text-destructive")}>
            <Landmark className="w-4 h-4 text-primary" />
            Selecionar Conta <span className="text-destructive">*</span>
          </Label>
          {accounts.length > 0 ? (
            <>
              <Select 
                value={formData.bank_account_id || ""} 
                onValueChange={(v) => {
                  setFormData({ ...formData, bank_account_id: v });
                  setTouched(prev => ({ ...prev, bank_account_id: true }));
                }}
              >
                <SelectTrigger className={cn(errors.bank_account_id && "border-destructive focus:ring-destructive")}>
                  <SelectValue placeholder="Escolha a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: account.color || "#6366f1" }}
                        />
                        {account.bank_name} - {account.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bank_account_id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Selecione uma conta bancária
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              Nenhuma conta bancária cadastrada. Cadastre uma conta em "Contas Bancárias".
            </p>
          )}
        </div>
      )}

      {/* Card Selector - shows for Credit Card */}
      {!isCompact && requiresCard && (
        <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <Label className={cn("flex items-center gap-2", errors.card_id && "text-destructive")}>
            <CreditCard className="w-4 h-4 text-primary" />
            Selecionar Cartão <span className="text-destructive">*</span>
          </Label>
          {cards.length > 0 ? (
            <>
              <Select 
                value={formData.card_id || ""} 
                onValueChange={(v) => {
                  setFormData({ ...formData, card_id: v });
                  setTouched(prev => ({ ...prev, card_id: true }));
                }}
              >
                <SelectTrigger className={cn(errors.card_id && "border-destructive focus:ring-destructive")}>
                  <SelectValue placeholder="Escolha o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: card.color || "#8B5CF6" }}
                        />
                        {card.name} {card.last_four_digits && `•••• ${card.last_four_digits}`}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.card_id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Selecione um cartão
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              Nenhum cartão cadastrado. Cadastre um cartão em "Cartões de Crédito".
            </p>
          )}
        </div>
      )}

      {/* Tag field */}
      {!isCompact && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Classificação
          </Label>
          <Select value={formData.tag || "none"} onValueChange={(v) => setFormData({ ...formData, tag: v === "none" ? "" : v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma classificação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              <SelectItem value="fixa">Fixa</SelectItem>
              <SelectItem value="variavel">Variável</SelectItem>
              <SelectItem value="esporadica">Esporádica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Installment Mode - Pro Feature */}
      {!isCompact && showInstallment && (
        subscribed ? (
          <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="installment-form"
                checked={isInstallment}
                onCheckedChange={(checked) => {
                  setFormData({ 
                    ...formData, 
                    is_installment: !!checked,
                    is_recurring: checked ? false : formData.is_recurring
                  });
                }}
                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-blue-500" />
                <Label htmlFor="installment-form" className="text-sm cursor-pointer">
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
                      onChange={(e) => setFormData({ ...formData, installment_count: e.target.value })}
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Intervalo</Label>
                    <Select 
                      value={installmentInterval} 
                      onValueChange={(v) => setFormData({ ...formData, installment_interval: v })}
                    >
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
                {formData.amount && parseInt(installmentCount) > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Valor por parcela: R$ {(parseFloat(formData.amount) / parseInt(installmentCount)).toFixed(2)}
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
        )
      )}
      
      {/* Recurring Transaction - Pro Feature */}
      {!isCompact && !isInstallment && (
        subscribed ? (
          <div className="p-4 rounded-xl border border-primary/40 bg-primary/5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: !!checked })}
              />
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <Label htmlFor="recurring" className="text-sm cursor-pointer">
                  Transação recorrente
                </Label>
              </div>
            </div>
            {formData.is_recurring && (
              <div className="mt-3 ml-7">
                <Select
                  value={formData.recurring_interval}
                  onValueChange={(v) => setFormData({ ...formData, recurring_interval: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                     <SelectItem value="monthly">Mensal</SelectItem>
                     <SelectItem value="quarterly">Trimestral</SelectItem>
                     <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-muted bg-muted/30 relative overflow-hidden">
            <div className="flex items-center gap-3 opacity-50">
              <Checkbox disabled id="recurring-disabled" />
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm text-muted-foreground">Transação recorrente</Label>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>Exclusivo Pro</span>
              </div>
            </div>
          </div>
        )
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={handleSubmit}>
          {isInstallment && parseInt(installmentCount) > 1 
            ? `Criar ${installmentCount} parcelas` 
            : submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default TransactionForm;