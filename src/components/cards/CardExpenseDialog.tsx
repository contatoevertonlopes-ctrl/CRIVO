import { useState, useMemo } from "react";
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
import { CardWithBill } from "@/hooks/useCards";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardWithBill[];
  onSave: (
    cardId: string,
    description: string,
    amount: number,
    purchaseDate: Date,
    installments: number
  ) => void;
  monthlyIncome?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const CardExpenseDialog = ({
  open,
  onOpenChange,
  cards,
  onSave,
  monthlyIncome = 0,
}: CardExpenseDialogProps) => {
  const [cardId, setCardId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [installments, setInstallments] = useState("1");

  const selectedCard = cards.find((c) => c.id === cardId);
  const numericAmount = parseFloat(amount) || 0;
  const numInstallments = parseInt(installments) || 1;
  const installmentAmount = numericAmount / numInstallments;

  // Calculate which billing month the first installment falls into
  const firstBillingMonth = useMemo(() => {
    if (!selectedCard || !purchaseDate) return null;
    
    const purchase = new Date(purchaseDate);
    const purchaseDay = purchase.getDate();
    
    let billingMonth = new Date(purchase.getFullYear(), purchase.getMonth(), 1);
    if (purchaseDay > selectedCard.closing_day) {
      billingMonth.setMonth(billingMonth.getMonth() + 1);
    }
    
    return billingMonth;
  }, [selectedCard, purchaseDate]);

  // Impact calculations
  const impactPercent = selectedCard && selectedCard.credit_limit > 0
    ? ((numericAmount / selectedCard.credit_limit) * 100)
    : 0;

  const monthlyImpactPercent = monthlyIncome > 0
    ? ((installmentAmount / monthlyIncome) * 100)
    : 0;

  const isHighImpact = monthlyImpactPercent > 30;
  const isDangerous = monthlyImpactPercent > 50;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardId || !description || !numericAmount) return;

    onSave(
      cardId,
      description,
      numericAmount,
      new Date(purchaseDate),
      numInstallments
    );

    // Reset form
    setCardId("");
    setDescription("");
    setAmount("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setInstallments("1");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Gasto em Cartão</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Cartão</Label>
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cartão" />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: card.color }}
                        />
                        <span>{card.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Disp: {formatCurrency(card.availableLimit)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compra de eletrônicos"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Total</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x {n > 1 && numericAmount > 0 ? `de ${formatCurrency(numericAmount / n)}` : "(à vista)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data da Compra</Label>
            <Input
              id="date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>

          {/* Impact Widget */}
          {selectedCard && numericAmount > 0 && (
            <div className={cn(
              "p-4 rounded-lg border",
              isDangerous 
                ? "bg-destructive/10 border-destructive/30" 
                : isHighImpact 
                  ? "bg-warning/10 border-warning/30"
                  : "bg-secondary/50 border-border"
            )}>
              <div className="flex items-center gap-2 mb-3">
                {isDangerous ? (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                ) : isHighImpact ? (
                  <TrendingDown className="w-4 h-4 text-warning" />
                ) : null}
                <span className="text-sm font-medium">Impacto da Compra</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor por parcela:</span>
                  <span className="font-medium">{formatCurrency(installmentAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impacto no limite:</span>
                  <span className="font-medium">{impactPercent.toFixed(1)}%</span>
                </div>

                {firstBillingMonth && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primeira fatura:</span>
                    <span className="font-medium">
                      {firstBillingMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                )}

                {monthlyIncome > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">% da renda mensal:</span>
                    <span className={cn(
                      "font-medium",
                      isDangerous ? "text-destructive" : isHighImpact ? "text-warning" : ""
                    )}>
                      {monthlyImpactPercent.toFixed(1)}%
                    </span>
                  </div>
                )}

                {isDangerous && (
                  <p className="text-xs text-destructive mt-2 pt-2 border-t border-destructive/20">
                    ⚠️ Esta parcela reduz consideravelmente seu fôlego financeiro mensal!
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!cardId || !description || !numericAmount}
            >
              Registrar Gasto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CardExpenseDialog;
