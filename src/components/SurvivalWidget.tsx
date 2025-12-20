import { AlertTriangle, Heart, Shield, Scissors, Droplets } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import OxygenGauge from "./OxygenGauge";

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
    if (days >= 180) return { level: "excellent", color: "text-survival-excellent", bgColor: "bg-survival-excellent/15", label: "Excelente" };
    if (days >= 90) return { level: "good", color: "text-survival-good", bgColor: "bg-survival-good/15", label: "Bom" };
    if (days >= 30) return { level: "warning", color: "text-survival-warning", bgColor: "bg-survival-warning/15", label: "Atenção" };
    if (days >= 10) return { level: "critical", color: "text-survival-critical", bgColor: "bg-survival-critical/15", label: "Crítico" };
    return { level: "emergency", color: "text-survival-emergency", bgColor: "bg-survival-emergency/15", label: "Emergência" };
  };

  const status = getStatus(daysOfOxygen);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-survival-card border border-survival-border/50 rounded-2xl p-6 animate-pulse card-shadow-soft">
        <div className="h-6 bg-survival-muted rounded w-1/3 mb-4"></div>
        <div className="h-36 bg-survival-muted rounded-full w-36 mx-auto mb-4"></div>
        <div className="h-4 bg-survival-muted rounded w-2/3 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-survival-card border border-survival-border/50 rounded-2xl p-5 md:p-6 transition-all duration-300 card-shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-survival-primary/15">
            <Droplets className="w-5 h-5 text-survival-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Dias de Oxigênio</h3>
            <p className="text-[11px] text-muted-foreground">Sua reserva de sobrevivência</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Gauge Display */}
      <div className="flex flex-col items-center mb-5">
        <OxygenGauge days={daysOfOxygen} size="lg" />
        <p className="text-muted-foreground text-sm mt-3 text-center">
          {daysOfOxygen >= 180 
            ? "dias de liberdade financeira" 
            : daysOfOxygen >= 30 
              ? "dias até precisar de renda"
              : "dias de oxigênio financeiro"}
        </p>
      </div>

      {/* Progress Scale */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 px-1">
          <span>0</span>
          <span>30</span>
          <span>90</span>
          <span>180</span>
        </div>
        <div className="relative h-2 bg-survival-muted/50 rounded-full overflow-hidden">
          <div 
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
              daysOfOxygen >= 90 
                ? "bg-gradient-to-r from-survival-good to-survival-excellent" 
                : daysOfOxygen >= 30 
                  ? "bg-gradient-to-r from-survival-warning to-survival-good" 
                  : "bg-gradient-to-r from-survival-emergency to-survival-critical"
            }`}
            style={{ width: `${Math.min((daysOfOxygen / 180) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-3.5 rounded-xl mb-4 border ${
        daysOfOxygen < 10 
          ? "bg-survival-emergency/10 border-survival-emergency/20" 
          : daysOfOxygen < 30 
            ? "bg-survival-warning/10 border-survival-warning/20"
            : "bg-survival-good/10 border-survival-good/20"
      }`}>
        {daysOfOxygen < 10 ? (
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-survival-emergency shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-survival-emergency mb-0.5">
                Oxigênio financeiro baixo
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Suas reservas cobrem apenas {daysOfOxygen} dias de gastos.
              </p>
            </div>
          </div>
        ) : daysOfOxygen < 30 ? (
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-survival-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-survival-warning mb-0.5">
                Reserva em construção
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {daysOfOxygen} dias de reserva. Ideal: 90+ dias.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-survival-good shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-survival-good mb-0.5">
                {daysOfOxygen >= 180 ? "Financeiramente seguro" : "Reserva saudável"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {daysOfOxygen >= 180 
                  ? `${Math.floor(daysOfOxygen / 30)} meses de liberdade.`
                  : `${daysOfOxygen} dias de tranquilidade.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cut Simulation */}
      {essentialExpenseAverage && essentialExpenseAverage < dailyExpenseAverage && (
        <div className="space-y-2.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-survival-accent/30 text-survival-accent hover:bg-survival-accent/10 rounded-xl h-9"
            onClick={() => setShowCutSimulation(!showCutSimulation)}
          >
            <Scissors className="w-3.5 h-3.5 mr-2" />
            E se eu cortar o supérfluo?
          </Button>

          {showCutSimulation && (
            <div className="p-3.5 rounded-xl bg-survival-accent/10 border border-survival-accent/20 animate-in slide-in-from-top-2">
              <p className="text-xs text-muted-foreground mb-2">
                Cortando gastos não essenciais:
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-survival-good">{daysWithCuts}</span>
                <span className="text-sm text-muted-foreground">dias</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-survival-good/15 text-survival-good">
                  +{extraDaysWithCuts} dias
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Economia de {formatCurrency((dailyExpenseAverage - essentialExpenseAverage) * 30)}/mês
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-survival-border/50">
        <div className="p-3 rounded-xl bg-survival-secondary/50">
          <p className="text-[10px] text-muted-foreground mb-1">Custo de vida</p>
          <p className="text-base font-semibold text-foreground">
            {formatCurrency(dailyExpenseAverage * 30)}
            <span className="text-[10px] text-muted-foreground font-normal">/mês</span>
          </p>
        </div>
        <div className="p-3 rounded-xl bg-survival-secondary/50">
          <p className="text-[10px] text-muted-foreground mb-1">Reserva atual</p>
          <p className="text-base font-semibold text-survival-primary">
            {formatCurrency(currentBalance)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurvivalWidget;
