import { Card, CardContent } from "@/components/ui/card";
import { Wallet, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealBalanceWidgetProps {
  currentBalance: number;
  totalOpenBills: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const RealBalanceWidget = ({ currentBalance, totalOpenBills }: RealBalanceWidgetProps) => {
  const realBalance = currentBalance - totalOpenBills;
  const isNegative = realBalance < 0;
  const isHealthy = realBalance > 0 && realBalance > currentBalance * 0.3;

  return (
    <Card className={cn(
      "border-2 transition-all",
      isNegative 
        ? "bg-destructive/5 border-destructive/30" 
        : isHealthy 
          ? "bg-primary/5 border-primary/30"
          : "bg-warning/5 border-warning/30"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wallet className={cn(
                "w-5 h-5",
                isNegative ? "text-destructive" : isHealthy ? "text-primary" : "text-warning"
              )} />
              <h3 className="font-semibold">Saldo Real</h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              Este é o dinheiro que realmente sobra após quitar seus compromissos de crédito.
            </p>
          </div>
          
          {isNegative ? (
            <AlertCircle className="w-6 h-6 text-destructive" />
          ) : isHealthy ? (
            <CheckCircle className="w-6 h-6 text-primary" />
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Saldo em contas:</span>
            <span className="font-medium">{formatCurrency(currentBalance)}</span>
          </div>
          
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">(-) Faturas abertas:</span>
            <span className="font-medium text-destructive">- {formatCurrency(totalOpenBills)}</span>
          </div>

          <div className="h-px bg-border my-2" />

          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Saldo Real:</span>
            <span className={cn(
              "text-2xl font-bold",
              isNegative ? "text-destructive" : isHealthy ? "text-primary" : "text-warning"
            )}>
              {formatCurrency(realBalance)}
            </span>
          </div>

          <p className={cn(
            "text-xs text-center p-2 rounded-lg mt-2",
            isNegative 
              ? "bg-destructive/10 text-destructive" 
              : isHealthy 
                ? "bg-primary/10 text-primary"
                : "bg-warning/10 text-warning"
          )}>
            {isNegative 
              ? "⚠️ Você está comprometido além do seu saldo atual!" 
              : isHealthy
                ? "✓ Suas finanças estão saudáveis!"
                : "💡 Atenção: boa parte do seu saldo está comprometida."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealBalanceWidget;
