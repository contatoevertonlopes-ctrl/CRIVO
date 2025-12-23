import { Card, CardContent } from "@/components/ui/card";
import { Wallet, AlertCircle, CheckCircle, TrendingUp, Shield, Heart } from "lucide-react";
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
  const healthPercent = currentBalance > 0 ? Math.max(0, Math.min(100, (realBalance / currentBalance) * 100)) : 0;

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300",
      isNegative 
        ? "bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border-destructive/40" 
        : isHealthy 
          ? "bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/40"
          : "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background border-amber-500/40"
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
        {isNegative ? (
          <AlertCircle className="w-full h-full" />
        ) : isHealthy ? (
          <Shield className="w-full h-full" />
        ) : (
          <Heart className="w-full h-full" />
        )}
      </div>

      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              isNegative 
                ? "bg-destructive/20" 
                : isHealthy 
                  ? "bg-primary/20"
                  : "bg-amber-500/20"
            )}>
              <Wallet className={cn(
                "w-6 h-6",
                isNegative ? "text-destructive" : isHealthy ? "text-primary" : "text-amber-500"
              )} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Saúde Financeira</h3>
              <p className="text-xs text-muted-foreground">
                Visão real do seu poder de compra
              </p>
            </div>
          </div>
          
          {isNegative ? (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-xs font-medium">Alerta</span>
            </div>
          ) : isHealthy ? (
            <div className="flex items-center gap-1.5 text-primary">
              <CheckCircle className="w-5 h-5" />
              <span className="text-xs font-medium">Saudável</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-500">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-medium">Atenção</span>
            </div>
          )}
        </div>

        {/* Main balance display */}
        <div className={cn(
          "text-center py-4 px-6 rounded-xl mb-5",
          isNegative 
            ? "bg-destructive/10 border border-destructive/20" 
            : isHealthy 
              ? "bg-primary/10 border border-primary/20"
              : "bg-amber-500/10 border border-amber-500/20"
        )}>
          <p className="text-xs text-muted-foreground mb-1">
            Se você pagasse tudo hoje, restaria:
          </p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            isNegative ? "text-destructive" : isHealthy ? "text-primary" : "text-amber-500"
          )}>
            {formatCurrency(realBalance)}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Saldo em contas
            </span>
            <span className="font-semibold">{formatCurrency(currentBalance)}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              Faturas em aberto
            </span>
            <span className="font-semibold text-destructive">- {formatCurrency(totalOpenBills)}</span>
          </div>

          {/* Health bar */}
          <div className="pt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Índice de saúde</span>
              <span className="font-medium">{healthPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isNegative 
                    ? "bg-destructive" 
                    : isHealthy 
                      ? "bg-gradient-to-r from-primary to-emerald-500"
                      : "bg-gradient-to-r from-amber-500 to-orange-500"
                )}
                style={{ width: `${Math.max(0, healthPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status message */}
        <p className={cn(
          "text-xs text-center p-3 rounded-lg mt-4 font-medium",
          isNegative 
            ? "bg-destructive/10 text-destructive border border-destructive/20" 
            : isHealthy 
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
        )}>
          {isNegative 
            ? "⚠️ Você está comprometido além do seu saldo atual!" 
            : isHealthy
              ? "✨ Suas finanças estão excelentes! Continue assim."
              : "💡 Atenção: boa parte do seu saldo está comprometida."}
        </p>
      </CardContent>
    </Card>
  );
};

export default RealBalanceWidget;
