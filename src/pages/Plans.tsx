import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = (plan: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // TODO: Implement payment flow
    console.log("Selected plan:", plan);
  };

  const features = [
    "Dashboard financeiro completo",
    "Relatórios e gráficos avançados",
    "Exportação de dados (CSV, PDF)",
    "Previsões de fluxo de caixa",
    "Integrações com bancos",
    "Suporte prioritário",
    "Múltiplas contas",
    "Backup automático",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-black p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-green-900 flex items-center justify-center font-bold text-2xl shadow-[0_0_40px_rgba(34,197,94,0.7)]">
              F
            </div>
            <div className="flex flex-col text-left">
              <div className="text-xl font-bold tracking-tight">FinTrack Pro</div>
              <div className="text-xs text-muted-foreground uppercase tracking-[0.14em]">
                Dashboard Fintech
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Desbloqueie todo o potencial do FinTrack Pro com previsões avançadas,
            exportação de dados e integrações automáticas.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Free Plan */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-6">
            <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.05),transparent_55%)] pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2">Gratuito</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">R$ 0</span>
                <span className="text-muted-foreground">/ mês</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Perfeito para começar a organizar suas finanças.
              </p>
              
              <Button
                variant="outline"
                className="w-full mb-6"
                onClick={() => handleSelectPlan("free")}
              >
                Começar grátis
              </Button>

              <ul className="space-y-3">
                {features.slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Monthly Plan */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-background to-black border border-secondary shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-6">
            <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.08),transparent_55%)] pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2">Mensal</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">R$ 29</span>
                <span className="text-muted-foreground">/ mês</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Cancele quando quiser. Ideal para testar.
              </p>
              
              <Button
                variant="outline"
                className="w-full mb-6 border-primary/50 hover:bg-primary/10"
                onClick={() => handleSelectPlan("monthly")}
              >
                Assinar mensal
              </Button>

              <ul className="space-y-3">
                {features.slice(0, 6).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Annual Plan */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-background to-black border border-primary/60 shadow-[0_0_60px_rgba(34,197,94,0.25)] p-6">
            <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.12),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.1),transparent_52%)] pointer-events-none"></div>
            
            {/* Popular badge */}
            <div className="absolute top-4 right-4">
              <span className="text-[11px] px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-green-200">
                Mais popular
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-2">Anual</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold">R$ 269</span>
                <span className="text-muted-foreground">/ ano</span>
              </div>
              <p className="text-xs text-primary mb-4">
                Equivale a ~R$ 22,42/mês • Economize 23%
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Perfeito para quem leva os números a sério.
              </p>
              
              <Button
                className="w-full mb-6 bg-gradient-to-r from-primary to-green-600 text-primary-foreground shadow-[0_8px_25px_rgba(34,197,94,0.5)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.6)]"
                onClick={() => handleSelectPlan("annual")}
              >
                Assinar anual ⭐
              </Button>

              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para o dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Plans;
