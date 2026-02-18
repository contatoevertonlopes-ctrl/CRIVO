import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePrices } from "@/hooks/usePrices";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Crown, Settings, CreditCard, Shield, Lock, Zap, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
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
  } = useSubscription();
  const { prices, loading: pricesLoading, formatPrice } = usePrices();

  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      navigate("/success");
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Checkout cancelado. Você pode tentar novamente quando quiser.");
    }
  }, [searchParams, navigate]);

  const handleSelectPlan = async (plan: "free" | "monthly" | "annual") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (plan === "free") {
      navigate("/");
      return;
    }
    setCheckoutLoading(plan);
    try {
      const url = await createCheckout(plan);
      if (url) {
        window.location.href = url;
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

  /** Returns true when this plan is the user's active plan — button will be disabled */
  const isCurrentPlan = (plan: "free" | "monthly" | "annual") => {
    if (plan === "free" && !subscribed) return true;
    if (plan === "monthly" && subscribed && planType === "monthly") return true;
    if (plan === "annual"  && subscribed && planType === "annual")  return true;
    return false;
  };

  const freeFeatures = [
    "Dashboard financeiro básico",
    "Até 50 transações/mês",
    "Relatórios simples",
    "1 conta bancária",
  ];

  const premiumFeatures = [
    "Importação ilimitada de CSV",
    "Modos Adaptativos Avançados",
    "Relatórios PDF profissionais",
    "Suporte prioritário",
    "Dashboard completo",
    "Contas ilimitadas",
    "Previsões de fluxo de caixa",
    "Backup automático na nuvem",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center font-bold text-xl sm:text-2xl text-primary-foreground shadow-lg">
              CF
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Desbloqueie seu potencial financeiro
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6">
            Escolha o plano que melhor se adapta à sua jornada.
            Cancele quando quiser, sem compromisso.
          </p>

          {subscribed && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/50 text-primary mb-4">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">
                Você é assinante Pro {planType === "annual" ? "Anual" : "Mensal"}
              </span>
            </div>
          )}
        </div>

        {/* ── Manage subscription (only when subscribed) ── */}
        {subscribed && (
          <div className="flex justify-center mb-8">
            <Button variant="outline" onClick={handleManageSubscription} className="gap-2">
              <Settings className="w-4 h-4" />
              Gerenciar Assinatura
            </Button>
          </div>
        )}

        {/* ── Plans grid: Free · Monthly · Annual ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 items-start">

          {/* Free */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border p-6 sm:p-8 transition-all hover:border-primary/40",
            isCurrentPlan("free") ? "border-primary/60" : "border-border",
          )}>
            {isCurrentPlan("free") && (
              <div className="absolute top-4 right-4">
                <span className="text-xs px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-primary">
                  Seu plano
                </span>
              </div>
            )}
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Plano Básico</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl sm:text-4xl font-bold">R$ 0</span>
                <span className="text-sm text-muted-foreground">/ mês</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4 h-4">Sempre gratuito</p>
              <p className="text-sm text-muted-foreground mb-6">
                Perfeito para começar a organizar suas finanças.
              </p>
              <Button
                variant="outline"
                className="w-full mb-6"
                onClick={() => handleSelectPlan("free")}
                disabled={isCurrentPlan("free")}
              >
                {isCurrentPlan("free") ? "Plano atual" : "Continuar grátis"}
              </Button>
              <ul className="space-y-3">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Monthly */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border-2 p-6 sm:p-8 transition-all",
            isCurrentPlan("monthly") ? "border-primary" : "border-primary/40",
          )}>
            <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.06),transparent_55%)] pointer-events-none" />
            <div className="absolute top-4 right-4">
              <span className="text-xs px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-primary flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {isCurrentPlan("monthly") ? "Seu plano" : "Flexível"}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Pro Mensal</h3>
              <div className="flex items-baseline gap-1 mb-1">
                {pricesLoading ? (
                  <span className="h-10 w-28 rounded-lg bg-muted animate-pulse inline-block" />
                ) : (
                  <>
                    <span className="text-3xl sm:text-4xl font-bold">R$ {formatPrice(prices.monthly.amount)}</span>
                    <span className="text-sm text-muted-foreground">/ mês</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4 h-4">
                Cobrança mensal • Cancele quando quiser
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Tudo que você precisa, com flexibilidade total.
              </p>
              <Button
                className="w-full mb-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={() => handleSelectPlan("monthly")}
                disabled={checkoutLoading !== null || isCurrentPlan("monthly") || loading}
              >
                {checkoutLoading === "monthly" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrentPlan("monthly") ? (
                  "Plano atual"
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Assinar mensal
                  </>
                )}
              </Button>
              <ul className="space-y-3">
                {premiumFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Annual — featured */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border-2 p-6 sm:p-8 transition-all shadow-[0_0_60px_rgba(34,197,94,0.15)]",
            isCurrentPlan("annual") ? "border-primary" : "border-primary/60",
          )}>
            <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.09),transparent_55%)] pointer-events-none" />
            <div className="absolute top-4 right-4">
              <span className="text-xs px-3 py-1 rounded-full bg-primary/20 border border-primary/50 text-primary flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {isCurrentPlan("annual") ? "Seu plano" : "Mais popular"}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Pro Anual</h3>
              <div className="flex items-baseline gap-1 mb-1">
                {pricesLoading ? (
                  <span className="h-10 w-28 rounded-lg bg-muted animate-pulse inline-block" />
                ) : (
                  <>
                    <span className="text-3xl sm:text-4xl font-bold">R$ {formatPrice(prices.annual.amount)}</span>
                    <span className="text-sm text-muted-foreground">/ ano</span>
                  </>
                )}
              </div>
              <p className="text-xs text-primary mb-4 h-4">
                {pricesLoading ? (
                  <span className="h-3 w-44 rounded bg-muted animate-pulse inline-block" />
                ) : (
                  <>≈ R$ {formatPrice(prices.annual.monthlyEquivalent)}/mês · Economize {prices.annual.savings}%</>
                )}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Máxima economia para quem quer comprometimento.
              </p>
              <Button
                className="w-full mb-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={() => handleSelectPlan("annual")}
                disabled={checkoutLoading !== null || isCurrentPlan("annual") || loading}
              >
                {checkoutLoading === "annual" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrentPlan("annual") ? (
                  "Plano atual"
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Assinar anual
                  </>
                )}
              </Button>
              <ul className="space-y-3">
                {[...premiumFeatures, "2 meses grátis"].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>{/* /.grid */}

        {/* ── Trust signals ── */}
        <div className="bg-card/50 rounded-2xl border border-border p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4 text-primary" />
              <span>Pagamento 100% seguro</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Cancelamento fácil a qualquer momento</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-3">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 opacity-60" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5 opacity-60" />
              <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-secondary rounded">PIX</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Pagamento processado com segurança pelo Stripe
          </p>
        </div>

        {/* ── Back link ── */}
        <div className="text-center">
          <button
            onClick={() => navigate(user ? "/" : "/landing")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {user ? "Voltar para o dashboard" : "Voltar para o início"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Plans;
