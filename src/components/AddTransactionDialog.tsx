import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
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
import { Plus, RefreshCw, Lock } from "lucide-react";

interface AddTransactionDialogProps {
  onSuccess: () => void;
}

const AddTransactionDialog = ({ onSuccess }: AddTransactionDialogProps) => {
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("em_aberto");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("monthly");

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
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        description,
        category,
        type,
        amount: parseFloat(amount),
        status,
        date,
      });

      if (error) throw error;

      toast({
        title: "Transação adicionada",
        description: "A transação foi salva com sucesso.",
      });

      // Reset form
      setDescription("");
      setCategory("");
      setType("expense");
      setAmount("");
      setStatus("em_aberto");
      setDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(false);
      setRecurringInterval("monthly");
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

  const statusOptions = [
    { value: "em_aberto", label: "Em aberto" },
    { value: "a_vencer", label: "A vencer" },
    { value: "vencido", label: "Vencido" },
    { value: "pagamento_concluido", label: "Pagamento concluído" },
  ];

  return (
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
      <DialogContent className="bg-background border-secondary">
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
              <Label htmlFor="amount">Valor (R$)</Label>
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

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-secondary/50 border-border/50"
            />
          </div>

          {/* Recurring Transaction - Pro Feature */}
          {subscribed ? (
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
              {loading ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
