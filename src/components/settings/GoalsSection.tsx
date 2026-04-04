import { useState, useEffect } from "react";
import { useAppMode } from "@/contexts/AppModeContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Target, Wallet, TrendingUp, Coins } from "lucide-react";

interface Goals {
  totalDebt: string;
  monthlyDebtPayment: string;
  monthlyInvestment: string;
  financialFreedomTarget: string;
}

const GoalsSection = () => {
  const { mode } = useAppMode();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goals>({
    totalDebt: "",
    monthlyDebtPayment: "",
    monthlyInvestment: "",
    financialFreedomTarget: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("financialGoals");
    if (saved) {
      setGoals(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    localStorage.setItem("financialGoals", JSON.stringify(goals));
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Metas salvas",
        description: "Suas metas financeiras foram atualizadas.",
      });
    }, 500);
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, "");
    const formatted = (Number(number) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return formatted;
  };

  const handleCurrencyChange = (field: keyof Goals, value: string) => {
    const number = value.replace(/\D/g, "");
    setGoals((prev) => ({ ...prev, [field]: number }));
  };

  if (mode === "survival") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-1">Metas de Sobrevivência</h3>
          <p className="text-xs text-muted-foreground">
            Configure suas metas para sair das dívidas
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="totalDebt" className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-survival-primary" />
              Total de dívidas
            </Label>
            <Input
              id="totalDebt"
              type="text"
              value={goals.totalDebt ? formatCurrency(goals.totalDebt) : ""}
              onChange={(e) => handleCurrencyChange("totalDebt", e.target.value)}
              placeholder="R$ 0,00"
              className="bg-secondary/50 border-border/70"
            />
            <p className="text-xs text-muted-foreground">
              Soma de todas as suas dívidas atuais
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyDebtPayment" className="flex items-center gap-2">
              <Target className="w-4 h-4 text-survival-primary" />
              Capacidade mensal de pagamento
            </Label>
            <Input
              id="monthlyDebtPayment"
              type="text"
              value={goals.monthlyDebtPayment ? formatCurrency(goals.monthlyDebtPayment) : ""}
              onChange={(e) => handleCurrencyChange("monthlyDebtPayment", e.target.value)}
              placeholder="R$ 0,00"
              className="bg-secondary/50 border-border/70"
            />
            <p className="text-xs text-muted-foreground">
              Quanto você consegue separar por mês para pagar dívidas
            </p>
          </div>
        </div>

        {goals.totalDebt && goals.monthlyDebtPayment && (
          <div className="p-4 rounded-lg bg-survival-primary/10 border border-survival-primary/30">
            <p className="text-sm">
              <span className="font-semibold text-survival-primary">Previsão:</span>{" "}
              Com esse ritmo, você liquida suas dívidas em aproximadamente{" "}
              <span className="font-bold">
                {Math.ceil(Number(goals.totalDebt) / Number(goals.monthlyDebtPayment))} meses
              </span>
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-survival-primary to-survival-accent"
        >
          {loading ? "Salvando..." : "Salvar metas"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-1">Metas de Prosperidade</h3>
        <p className="text-xs text-muted-foreground">
          Configure suas metas de crescimento patrimonial
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="monthlyInvestment" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-prosperity-primary" />
            Aporte mensal
          </Label>
          <Input
            id="monthlyInvestment"
            type="text"
            value={goals.monthlyInvestment ? formatCurrency(goals.monthlyInvestment) : ""}
            onChange={(e) => handleCurrencyChange("monthlyInvestment", e.target.value)}
            placeholder="R$ 0,00"
            className="bg-secondary/50 border-border/70"
          />
          <p className="text-xs text-muted-foreground">
            Quanto você pretende investir todo mês
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="financialFreedomTarget" className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-prosperity-primary" />
            Meta de liberdade financeira
          </Label>
          <Input
            id="financialFreedomTarget"
            type="text"
            value={goals.financialFreedomTarget ? formatCurrency(goals.financialFreedomTarget) : ""}
            onChange={(e) => handleCurrencyChange("financialFreedomTarget", e.target.value)}
            placeholder="R$ 0,00"
            className="bg-secondary/50 border-border/70"
          />
          <p className="text-xs text-muted-foreground">
            Patrimônio alvo para viver de renda
          </p>
        </div>
      </div>

      {goals.monthlyInvestment && goals.financialFreedomTarget && (
        <div className="p-4 rounded-lg bg-prosperity-primary/10 border border-prosperity-primary/30">
          <p className="text-sm">
            <span className="font-semibold text-prosperity-primary">Previsão:</span>{" "}
            Com aportes constantes (sem considerar juros), você atinge sua meta em{" "}
            <span className="font-bold">
              {Math.ceil(Number(goals.financialFreedomTarget) / Number(goals.monthlyInvestment) / 12)} anos
            </span>
          </p>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={loading}
        className="bg-gradient-to-r from-prosperity-primary to-prosperity-accent"
      >
        {loading ? "Salvando..." : "Salvar metas"}
      </Button>
    </div>
  );
};

export default GoalsSection;
