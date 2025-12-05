import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePrices } from "@/hooks/usePrices";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Crown, Settings } from "lucide-react";
import { toast } from "sonner";

const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    subscribed,
    planType,
    loading,
    createCheckout,
    openCustomerPortal,
    checkSubscription
  } = useSubscription();
  const { prices, formatPrice } = usePrices();
  
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura realizada com sucesso!");
      checkSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Checkout cancelado.");
    }
  }, [searchParams, checkSubscription]);

  const handleSelectPlan = async (plan: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (plan === "free") {
      navigate("/");
      return;
    }
    
    const priceType = plan === "monthly" ? "monthly" : "annual";
    setCheckoutLoading(priceType);
    
    try {
      const url = await createCheckout(priceType);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("Erro ao iniciar checkout. Tente novamente.");
      }
    } finally {
      setCheckoutLoading(null);
    }
  };
  const handleManageSubscription = async () => {
    const url = await openCustomerPortal();
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Erro ao abrir portal. Tente novamente.");
    }
  };
  const features = ["Dashboard financeiro completo", "Relatórios e gráficos avançados", "Exportação de dados (CSV, PDF)", "Previsões de fluxo de caixa", "Integrações com bancos", "Suporte prioritário", "Múltiplas contas", "Backup automático"];
  const isCurrentPlan = (plan: string) => {
    if (plan === "free" && !subscribed) return true;
    if (plan === "monthly" && subscribed && planType === "monthly") return true;
    if (plan === "annual" && subscribed && planType === "annual") return true;
    return false;
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-green-900 items-center justify-center font-bold text-xl sm:text-2xl flex flex-row bg-[#0f7be7] shadow-sm">
              CF
            </div>
            <div className="flex flex-col text-left">
              <div className="text-lg sm:text-xl font-bold tracking-tight">Club FinanceTrack </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.14em]">
                Dashboard Financeiro
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Desbloqueie todo o potencial do FinTrack Pro com previsões avançadas,
            exportação de dados e integrações automáticas.
          </p>

          {subscribed && <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/50 text-primary">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">
                Você é assinante Pro {planType === "annual" ? "Anual" : "Mensal"}
              </span>
            </div>}
        </div>

        {/* Manage Subscription Button */}
        {subscribed && <div className="flex justify-center mb-8">
            <Button variant="outline" onClick={handleManageSubscription} className="gap-2">
              <Settings className="w-4 h-4" />
              Gerenciar Assinatura
            </Button>
          </div>}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Free Plan */}
          <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border ${isCurrentPlan("free") ? "border-primary/60" : "border-secondary"} shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-6`}>
            <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.05),transparent_55%)] pointer-events-none"></div>
            
            {isCurrentPlan("free") && <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                <span className="text-[10px] sm:text-[11px] px-2 sm:px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-green-200">
                  Seu plano
                </span>
              </div>}
            
            <div className="relative z-10">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Gratuito</h3>
              <div className="flex items-baseline gap-1 mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl font-bold">R$ 0</span>
                <span className="text-sm text-muted-foreground">/ mês</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Perfeito para começar a organizar suas finanças.
              </p>
              
              <Button variant="outline" className="w-full mb-4 sm:mb-6" onClick={() => handleSelectPlan("free")} disabled={isCurrentPlan("free")}>
                {isCurrentPlan("free") ? "Plano atual" : "Começar grátis"}
              </Button>

              <ul className="space-y-2 sm:space-y-3">
                {features.slice(0, 3).map((feature, i) => <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>)}
              </ul>
            </div>
          </div>

          {/* Monthly Plan */}
          <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border ${isCurrentPlan("monthly") ? "border-primary/60" : "border-secondary"} shadow-[0_18px_45px_rgba(3,7,18,0.65)] p-4 sm:p-6`}>
            <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.08),transparent_55%)] pointer-events-none"></div>
            
            {isCurrentPlan("monthly") && <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                <span className="text-[10px] sm:text-[11px] px-2 sm:px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-green-200">
                  Seu plano
                </span>
              </div>}
            
            <div className="relative z-10">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Mensal</h3>
              <div className="flex items-baseline gap-1 mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl font-bold">R$ {formatPrice(prices.monthly.amount)}</span>
                <span className="text-sm text-muted-foreground">/ mês</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Cancele quando quiser. Ideal para testar.
              </p>
              
              <Button variant="outline" className="w-full mb-4 sm:mb-6 border-primary/50 hover:bg-primary/10" onClick={() => handleSelectPlan("monthly")} disabled={checkoutLoading !== null || isCurrentPlan("monthly")}>
                {checkoutLoading === "monthly" ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrentPlan("monthly") ? "Plano atual" : "Assinar mensal"}
              </Button>

              <ul className="space-y-2 sm:space-y-3">
                {features.slice(0, 6).map((feature, i) => <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>)}
              </ul>
            </div>
          </div>

          {/* Annual Plan */}
          <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-bl from-background to-black border ${isCurrentPlan("annual") ? "border-primary" : "border-primary/60"} shadow-[0_0_60px_rgba(34,197,94,0.25)] p-4 sm:p-6`}>
            <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.12),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.1),transparent_52%)] pointer-events-none"></div>
            
            {/* Popular badge */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
              <span className="text-[10px] sm:text-[11px] px-2 sm:px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-green-200">
                {isCurrentPlan("annual") ? "Seu plano" : "Mais popular"}
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Anual</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl sm:text-3xl font-bold">R$ {formatPrice(prices.annual.amount)}</span>
                <span className="text-sm text-muted-foreground">/ ano</span>
              </div>
              <p className="text-[10px] sm:text-xs text-primary mb-3 sm:mb-4">
                Equivale a ~R$ {formatPrice(prices.annual.monthlyEquivalent)}/mês • Economize {prices.annual.savings}%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Perfeito para quem leva os números a sério.
              </p>
              
              <Button className="w-full mb-4 sm:mb-6 bg-gradient-to-r from-primary to-green-600 text-primary-foreground shadow-[0_8px_25px_rgba(34,197,94,0.5)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.6)]" onClick={() => handleSelectPlan("annual")} disabled={checkoutLoading !== null || isCurrentPlan("annual")}>
                {checkoutLoading === "annual" ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrentPlan("annual") ? "Plano atual" : "Assinar anual ⭐"}
              </Button>

              <ul className="space-y-2 sm:space-y-3">
                {features.map((feature, i) => <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar para o dashboard
          </button>
        </div>
      </div>
    </div>;
};
export default Plans;