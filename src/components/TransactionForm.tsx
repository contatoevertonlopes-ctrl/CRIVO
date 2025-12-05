import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RefreshCw, Lock } from "lucide-react";

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
}

interface TransactionFormProps {
  formData: TransactionFormData;
  setFormData: (data: TransactionFormData) => void;
  onSubmit: () => void;
  submitLabel: string;
  subscribed: boolean;
}

const TransactionForm = ({ formData, setFormData, onSubmit, submitLabel, subscribed }: TransactionFormProps) => {
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
          <Label>Valor *</Label>
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
          <Label>Data de Vencimento</Label>
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
      
      {/* Recurring Transaction - Pro Feature */}
      {subscribed ? (
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
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
};

export default TransactionForm;
