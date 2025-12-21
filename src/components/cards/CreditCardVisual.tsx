import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CardWithBill } from "@/hooks/useCards";

interface CreditCardVisualProps {
  card: CardWithBill;
  onClick?: () => void;
}

const brandLogos: Record<string, string> = {
  visa: "💳",
  mastercard: "💳",
  elo: "💳",
  amex: "💳",
  generic: "💳",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const CreditCardVisual = ({ card, onClick }: CreditCardVisualProps) => {
  const usagePercent = card.credit_limit > 0 
    ? ((card.credit_limit - card.availableLimit) / card.credit_limit) * 100 
    : 0;

  const daysUntilDue = card.nextDueDate 
    ? Math.ceil((card.nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full aspect-[1.586/1] rounded-2xl p-5 cursor-pointer transition-all duration-300",
        "bg-gradient-to-br hover:scale-[1.02] hover:shadow-xl",
        "border border-border/30 backdrop-blur-sm overflow-hidden"
      )}
      style={{
        background: `linear-gradient(135deg, ${card.color}dd, ${card.color}99)`,
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Best day to buy badge */}
      {card.isBestDayToBuy && (
        <Badge 
          className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5"
        >
          ✨ Melhor dia para compra
        </Badge>
      )}

      {/* Card content */}
      <div className="relative h-full flex flex-col justify-between text-white">
        {/* Top: Card name and brand */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs opacity-70 uppercase tracking-wider">Cartão de Crédito</p>
            <h3 className="text-lg font-semibold mt-0.5">{card.name}</h3>
          </div>
          <span className="text-2xl">{brandLogos[card.brand] || brandLogos.generic}</span>
        </div>

        {/* Middle: Last four digits (if available) */}
        {card.last_four_digits && (
          <div className="text-sm tracking-widest opacity-80">
            •••• •••• •••• {card.last_four_digits}
          </div>
        )}

        {/* Bottom: Limits and bill info */}
        <div className="space-y-3">
          {/* Usage bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Limite usado</span>
              <span className="font-medium">{usagePercent.toFixed(0)}%</span>
            </div>
            <Progress 
              value={usagePercent} 
              className="h-1.5 bg-white/20"
            />
          </div>

          {/* Info row */}
          <div className="flex justify-between items-end text-xs">
            <div>
              <p className="opacity-70">Fatura atual</p>
              <p className="text-base font-bold">{formatCurrency(card.currentBill)}</p>
            </div>
            <div className="text-right">
              <p className="opacity-70">Disponível</p>
              <p className="text-base font-semibold">{formatCurrency(card.availableLimit)}</p>
            </div>
          </div>

          {/* Due date info */}
          {daysUntilDue !== null && card.currentBill > 0 && (
            <div className="text-xs opacity-80 text-center pt-1 border-t border-white/20">
              Vence em {daysUntilDue} dias (Dia {card.due_day})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditCardVisual;
