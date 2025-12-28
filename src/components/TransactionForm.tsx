import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Lock, Tag, ListOrdered, CreditCard, Landmark, Wallet, AlertCircle } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useCards } from "@/hooks/useCards";
import { cn } from "@/lib/utils";

interface TransactionFormData {
  description: string;
  amount: string;
  category: string;
  type: "income" | "expense";
  status: string;
  date: string;
  is_recurring: boolean;
  recurring_interval: string;
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
}

interface ValidationErrors {
  description: boolean;
  amount: boolean;
  category: boolean;
  payment_method: boolean;
  bank_account_id: boolean;
  card_id: boolean;
}

const TransactionForm = ({ formData, setFormData, onSubmit, submitLabel, subscribed, showInstallment = true }: TransactionFormProps) => {
  const { accounts } = useBankAccounts();
  const { cards } = useCards();
  const isInstallment = formData.is_installment || false;
  const installmentCount = formData.installment_count || "2";
  const installmentInterval = formData.installment_interval || "monthly";

  // Validation state - tracks which fields have been touched
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Determine if we should show bank account or card selector
  const requiresBankAccount = ["pix", "bank_transfer", "debit_card"].includes(formData.payment_method);
  const requiresCard = formData.payment_method === "credit_card";

  // Compute validation errors
  const errors: ValidationErrors = {
    description: touched.description && !formData.description.trim(),
    amount: touched.amount && (!formData.amount || parseFloat(formData.amount) <= 0),
    category: touched.category && !formData.category.trim(),
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

  const handleSubmit = () => {
    // Mark all required fields as touched
    const allTouched = {
      description: true,
      amount: true,
      category: true,
      payment_method: true,
      bank_account_id: requiresBankAccount,
      card_id: requiresCard,
    };
    setTouched(allTouched);

    // Validate all fields
    const hasErrors = !formData.description.trim() || 
      !formData.amount || 
      parseFloat(formData.amount) <= 0 || 
      !formData.category.trim() ||
      !formData.payment_method ||
      (requiresBankAccount && accounts.length > 0 && !formData.bank_account_id) ||
      (requiresCard && cards.length > 0 && !formData.card_id);

    if (hasErrors) {
      return;
    }

    onSubmit();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className={cn(errors.description && "text-destructive")}>
          Descrição <span className="text-destructive">*</span>
        </Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          onBlur={() => handleBlur("description")}
          placeholder="Ex: Salário, Aluguel..."
          autoComplete="off"
          className={cn(errors.description && "border-destructive focus-visible:ring-destructive")}
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
          <Label className={cn(errors.amount && "text-destructive")}>
            {isInstallment ? "Valor Total" : "Valor"} <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            onBlur={() => handleBlur("amount")}
            placeholder="0,00"
            autoComplete="off"
            className={cn(errors.amount && "border-destructive focus-visible:ring-destructive")}
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
          <Input
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            onBlur={() => handleBlur("category")}
            placeholder="Ex: Serviços"
            autoComplete="off"
            className={cn(errors.category && "border-destructive focus-visible:ring-destructive")}
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
              <SelectItem value="em_aberto">Em aberto</SelectItem>
              <SelectItem value="a_vencer">A vencer</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="pagamento_concluido">Pagamento concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
      
      {/* Payment Method field */}
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

      {/* Bank Account Selector - shows for PIX, Transfer, Debit */}
      {requiresBankAccount && (
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
      {requiresCard && (
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

      {/* Installment Mode - Pro Feature */}
      {showInstallment && (
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
      {!isInstallment && (
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