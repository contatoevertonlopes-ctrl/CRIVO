import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Lock, Tag, ListOrdered } from "lucide-react";

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
}

interface TransactionFormProps {
  formData: TransactionFormData;
  setFormData: (data: TransactionFormData) => void;
  onSubmit: () => void;
  submitLabel: string;
  subscribed: boolean;
  showInstallment?: boolean;
}

const TransactionForm = ({ formData, setFormData, onSubmit, submitLabel, subscribed, showInstallment = true }: TransactionFormProps) => {
  const isInstallment = formData.is_installment || false;
  const installmentCount = formData.installment_count || "2";
  const installmentInterval = formData.installment_interval || "monthly";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Descrição *</Label>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Salário, Aluguel..."
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{isInstallment ? "Valor Total *" : "Valor *"}</Label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0,00"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Ex: Serviços"
            autoComplete="off"
          />
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
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Data de Pagamento</Label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            type="date"
            value={formData.paid_date}
            onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
          />
        </div>
      </div>
      
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
        <Button onClick={onSubmit}>
          {isInstallment && parseInt(installmentCount) > 1 
            ? `Criar ${installmentCount} parcelas` 
            : submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default TransactionForm;
