import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardWithBill } from "@/hooks/useCards";

interface NextBillWidgetProps {
  cards: CardWithBill[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const NextBillWidget = ({ cards }: NextBillWidgetProps) => {
  // Find the card with the next due date and has a bill
  const cardsWithBills = cards.filter((c) => c.currentBill > 0);
  
  if (cardsWithBills.length === 0) return null;

  // Sort by next due date
  const sortedCards = [...cardsWithBills].sort((a, b) => {
    if (!a.nextDueDate) return 1;
    if (!b.nextDueDate) return -1;
    return a.nextDueDate.getTime() - b.nextDueDate.getTime();
  });

  const nextCard = sortedCards[0];
  const daysUntilDue = nextCard.nextDueDate
    ? Math.ceil((nextCard.nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isUrgent = daysUntilDue <= 5;
  const isWarning = daysUntilDue <= 10;

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-xl border transition-all",
      isUrgent 
        ? "bg-destructive/10 border-destructive/30" 
        : isWarning 
          ? "bg-warning/10 border-warning/30"
          : "bg-card border-border/50"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center",
        isUrgent 
          ? "bg-destructive/20" 
          : isWarning 
            ? "bg-warning/20"
            : "bg-primary/20"
      )}>
        <CreditCard className={cn(
          "w-5 h-5",
          isUrgent 
            ? "text-destructive" 
            : isWarning 
              ? "text-warning"
              : "text-primary"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">Próxima fatura</p>
        <p className="font-semibold truncate">
          {formatCurrency(nextCard.currentBill)}
          <span className="text-xs text-muted-foreground ml-2">
            ({nextCard.name})
          </span>
        </p>
      </div>

      <div className={cn(
        "text-right",
        isUrgent ? "text-destructive" : isWarning ? "text-warning" : "text-muted-foreground"
      )}>
        <p className="text-xs">Vence em</p>
        <p className="font-semibold">{daysUntilDue} dias</p>
      </div>
    </div>
  );
};

export default NextBillWidget;
