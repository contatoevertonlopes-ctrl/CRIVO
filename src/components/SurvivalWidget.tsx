import { AlertTriangle, Heart, Shield, Scissors } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SurvivalWidgetProps {
  currentBalance: number;
  dailyExpenseAverage: number;
  essentialExpenseAverage?: number;
  loading?: boolean;
}

const SurvivalWidget = ({ 
  currentBalance, 
  dailyExpenseAverage,
  essentialExpenseAverage,
  loading = false 
}: SurvivalWidgetProps) => {
  const [showCutSimulation, setShowCutSimulation] = useState(false);
  
  // Calculate days of oxygen
  const daysOfOxygen = dailyExpenseAverage > 0 
    ? Math.floor(currentBalance / dailyExpenseAverage) 
    : 999;

  // Calculate days if cutting non-essential expenses
  const daysWithCuts = essentialExpenseAverage && essentialExpenseAverage > 0
    ? Math.floor(currentBalance / essentialExpenseAverage)
    : daysOfOxygen;

  const extraDaysWithCuts = daysWithCuts - daysOfOxygen;

  // Determine status based on days
  const getStatus = (days: number) => {
    if (days >= 180) return { level: "excellent", color: "survival-excellent", label: "Excelente" };
    if (days >= 90) return { level: "good", color: "survival-good", label: "Bom" };
    if (days >= 30) return { level: "warning", color: "survival-warning", label: "Atenção" };
    if (days >= 10) return { level: "critical", color: "survival-critical", label: "Crítico" };
    return { level: "emergency", color: "survival-emergency", label: "Emergência" };
  };

  const status = getStatus(daysOfOxygen);
  const progressValue = Math.min((daysOfOxygen / 180) * 100, 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-survival-card border border-survival-border rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-muted rounded mb-4"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-survival-card border border-survival-border rounded-2xl p-6 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${status.color}/20`}>
            <Heart className={`w-5 h-5 text-${status.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Dias de Oxigênio</h3>
            <p className="text-xs text-muted-foreground">Reserva de sobrevivência</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${status.color}/20 text-${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Main Display */}
      <div className="text-center mb-6">
        <div className={`text-6xl font-bold text-${status.color} mb-2`}>
          {daysOfOxygen > 365 ? "365+" : daysOfOxygen}
        </div>
        <p className="text-muted-foreground text-sm">
          {daysOfOxygen >= 180 
            ? "dias de liberdade financeira" 
            : daysOfOxygen >= 30 
              ? "dias até precisar de renda"
              : "dias de oxigênio financeiro"}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>0 dias</span>
          <span>30 dias</span>
          <span>90 dias</span>
          <span>180 dias</span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 bg-gradient-to-r ${
              daysOfOxygen >= 90 
                ? "from-survival-good to-survival-excellent" 
                : daysOfOxygen >= 30 
                  ? "from-survival-warning to-survival-good" 
                  : "from-survival-emergency to-survival-critical"
            }`}
            style={{ width: `${progressValue}%` }}
          />
          {/* Markers */}
          <div className="absolute inset-0 flex justify-between px-0">
            <div className="w-px h-full bg-muted-foreground/30" style={{ marginLeft: '16.6%' }} />
            <div className="w-px h-full bg-muted-foreground/30" style={{ marginLeft: '33.3%' }} />
            <div className="w-px h-full bg-muted-foreground/30" style={{ marginLeft: '50%' }} />
          </div>
        </div>
      </div>

      {/* Dynamic Message */}
      <div className={`p-4 rounded-xl mb-4 ${
        daysOfOxygen < 10 
          ? "bg-survival-emergency/10 border border-survival-emergency/30" 
          : daysOfOxygen < 30 
            ? "bg-survival-warning/10 border border-survival-warning/30"
            : "bg-survival-good/10 border border-survival-good/30"
      }`}>
        {daysOfOxygen < 10 ? (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-survival-emergency shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-survival-emergency mb-1">
                Atenção: Seu oxigênio financeiro está baixo
              </p>
              <p className="text-xs text-muted-foreground">
                Se você parar de ganhar dinheiro hoje, suas reservas cobrem apenas {daysOfOxygen} dias das suas contas.
              </p>
            </div>
          </div>
        ) : daysOfOxygen < 30 ? (
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-survival-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-survival-warning mb-1">
                Reserva em construção
              </p>
              <p className="text-xs text-muted-foreground">
                Você tem {daysOfOxygen} dias de reserva. Ideal é ter pelo menos 90 dias para emergências.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-survival-good shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-survival-good mb-1">
                {daysOfOxygen >= 180 ? "Parabéns! Você está financeiramente seguro" : "Sua reserva está saudável"}
              </p>
              <p className="text-xs text-muted-foreground">
                {daysOfOxygen >= 180 
                  ? `Você tem ${Math.floor(daysOfOxygen / 30)} meses de liberdade financeira. Considere investir o excedente!`
                  : `Você tem ${daysOfOxygen} dias de tranquilidade. Continue construindo sua reserva.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cut Simulation Button */}
      {essentialExpenseAverage && essentialExpenseAverage < dailyExpenseAverage && (
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-survival-warning/30 text-survival-warning hover:bg-survival-warning/10"
            onClick={() => setShowCutSimulation(!showCutSimulation)}
          >
            <Scissors className="w-4 h-4 mr-2" />
            E se eu cortar o supérfluo?
          </Button>

          {showCutSimulation && (
            <div className="p-4 rounded-xl bg-survival-warning/10 border border-survival-warning/30 animate-in slide-in-from-top-2">
              <p className="text-sm text-foreground mb-2">
                Cortando gastos não essenciais:
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-survival-good">{daysWithCuts}</span>
                <span className="text-sm text-muted-foreground">dias de reserva</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-survival-good/20 text-survival-good">
                  +{extraDaysWithCuts} dias
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Economia de {formatCurrency((dailyExpenseAverage - essentialExpenseAverage) * 30)}/mês
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-survival-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Custo de vida real</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(dailyExpenseAverage * 30)}<span className="text-xs text-muted-foreground">/mês</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Reserva atual</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(currentBalance)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurvivalWidget;
