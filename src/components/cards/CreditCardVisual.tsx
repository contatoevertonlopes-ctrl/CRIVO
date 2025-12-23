import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CardWithBill } from "@/hooks/useCards";
import { Sparkles, Star } from "lucide-react";

interface CreditCardVisualProps {
  card: CardWithBill;
  onClick?: () => void;
}

const brandLogos: Record<string, string> = {
  visa: "VISA",
  mastercard: "MC",
  elo: "ELO",
  amex: "AMEX",
  generic: "💳",
};

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
        "group relative w-full aspect-[1.586/1] rounded-2xl p-5 cursor-pointer transition-all duration-500",
        "hover:scale-[1.03] hover:shadow-2xl hover:-translate-y-1",
        "border border-white/20 overflow-hidden"
      )}
      style={{
        background: `linear-gradient(145deg, ${card.color}ee, ${card.color}aa, ${card.color}66)`,
        boxShadow: `0 10px 40px -10px ${card.color}80, 0 0 0 1px ${card.color}30`,
      }}
    >
      {/* Glassmorphism layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Animated shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div 
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
          }}
        />
      </div>
      
      {/* Noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Best day to buy animated badge */}
      {card.isBestDayToBuy && (
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] px-2.5 py-1 font-semibold shadow-lg animate-pulse border-0"
          >
            <Star className="w-3 h-3 mr-1 fill-current" />
            Melhor Dia
          </Badge>
        </div>
      )}

      {/* Card content */}
      <div className="relative h-full flex flex-col justify-between text-white z-10">
        {/* Top: Card name and brand */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] opacity-60 uppercase tracking-widest font-medium">Cartão de Crédito</p>
            <h3 className="text-lg font-bold mt-0.5 drop-shadow-sm">{card.name}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold opacity-80 tracking-wide">
              {brandLogos[card.brand || "generic"]}
            </span>
          </div>
        </div>

        {/* Middle: Last four digits (if available) */}
        {card.last_four_digits && (
          <div className="text-sm tracking-[0.3em] opacity-70 font-mono">
            •••• •••• •••• {card.last_four_digits}
          </div>
        )}

        {/* Bottom: Limits and bill info */}
        <div className="space-y-3">
          {/* Colored usage bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="opacity-60 uppercase tracking-wider">Limite usado</span>
              <span className="font-bold">{usagePercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getProgressColor(usagePercent)
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Info row */}
          <div className="flex justify-between items-end text-xs">
            <div>
              <p className="opacity-60 text-[10px] uppercase tracking-wider">Fatura atual</p>
              <p className="text-lg font-bold drop-shadow-sm">{formatCurrency(card.currentBill)}</p>
            </div>
            <div className="text-right">
              <p className="opacity-60 text-[10px] uppercase tracking-wider">Disponível</p>
              <p className="text-base font-semibold">{formatCurrency(card.availableLimit)}</p>
            </div>
          </div>

          {/* Due date info */}
          {daysUntilDue !== null && card.currentBill > 0 && (
            <div className={cn(
              "text-[10px] text-center py-1.5 px-3 rounded-lg border border-white/20 backdrop-blur-sm",
              daysUntilDue <= 5 ? "bg-red-500/30 text-red-100" : "bg-white/10"
            )}>
              {daysUntilDue <= 0 
                ? "⚠️ Vencida!" 
                : daysUntilDue === 1 
                  ? "Vence amanhã"
                  : `Vence em ${daysUntilDue} dias (Dia ${card.due_day})`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditCardVisual;
