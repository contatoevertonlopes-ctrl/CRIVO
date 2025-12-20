import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppMode } from "@/contexts/AppModeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Rocket, Shield, ArrowRight, Lock, Sparkles, 
  TrendingUp, AlertTriangle, Loader2
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;
type AppModeType = "survival" | "prosperity";

interface OnboardingData {
  mode: AppModeType;
  currentBalance: number;
  monthlyIncome: number;
}

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { setMode } = useAppMode();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    mode: "survival",
    currentBalance: 0,
    monthlyIncome: 0,
  });
  const [saving, setSaving] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        navigate("/dashboard");
      }
    };

    checkOnboarding();
  }, [user, navigate]);

  const progress = ((step - 1) / 4) * 100;

  const handleModeSelect = (mode: AppModeType) => {
    setData(prev => ({ ...prev, mode }));
    setStep(3);
  };

  const handleDataSubmit = () => {
    if (data.currentBalance < 0) {
      toast({
        title: "Valor inválido",
        description: "O saldo não pode ser negativo.",
        variant: "destructive",
      });
      return;
    }
    setStep(4);
  };

  const calculateOxygenDays = () => {
    if (data.monthlyIncome <= 0) return 0;
    const dailyExpense = data.monthlyIncome / 30;
    return dailyExpense > 0 ? Math.floor(data.currentBalance / dailyExpense) : 0;
  };

  const handleFinish = async () => {
    if (!user) return;
    
    setSaving(true);
    setShowPersonalization(true);

    try {
      // Simulate personalization effect
      await new Promise(resolve => setTimeout(resolve, 2500));

      const { error } = await supabase
        .from("profiles")
        .update({
          current_balance: data.currentBalance,
          monthly_income: data.monthlyIncome,
          app_mode: data.mode,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Set the app mode
      setMode(data.mode);

      // Create initial balance transaction if balance > 0
      if (data.currentBalance > 0) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          description: "Saldo inicial",
          amount: data.currentBalance,
          type: "income",
          category: "Saldo Inicial",
          status: "pagamento_concluido",
          date: new Date().toISOString().split("T")[0],
        });
      }

      toast({
        title: "Tudo pronto!",
        description: "Seu dashboard foi personalizado com sucesso.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving onboarding:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
      setShowPersonalization(false);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Personalization Loading Screen
  if (showPersonalization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-black p-4">
        <div className="text-center max-w-md animate-in fade-in duration-500">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            data.mode === "survival" 
              ? "bg-gradient-to-br from-survival-primary to-survival-accent" 
              : "bg-gradient-to-br from-prosperity-primary to-prosperity-accent"
          }`}>
            {data.mode === "survival" ? (
              <Shield className="w-10 h-10 text-white animate-pulse" />
            ) : (
              <Rocket className="w-10 h-10 text-black animate-pulse" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mb-3">
            {data.mode === "survival" 
              ? "Customizando para o Modo Sobrevivência..." 
              : "Preparando suas metas de Investimento..."}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Estamos preparando uma experiência única para você.
          </p>
          
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-black">
      {/* Progress Bar */}
      <div className="p-4">
        <Progress value={progress} className="h-1.5 bg-secondary" />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Passo {step} de 4
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary via-primary to-green-900 flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.5)]">
                <span className="text-4xl font-bold text-white">F</span>
              </div>
              
              <h1 className="text-3xl font-bold mb-3">
                Bem-vindo ao ClubFinanceTrack
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                Onde seu dinheiro ganha um propósito.
              </p>
              
              <Button 
                size="lg" 
                onClick={() => setStep(2)}
                className="w-full max-w-xs bg-gradient-to-r from-primary to-green-600 shadow-[0_8px_25px_rgba(34,197,94,0.4)]"
              >
                Vamos começar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Profile Selection */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-center mb-2">
                Como você se sente em relação às suas finanças hoje?
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                Isso nos ajuda a personalizar sua experiência.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleModeSelect("survival")}
                  className="w-full p-6 rounded-2xl border-2 border-survival-primary/30 bg-gradient-to-br from-survival-primary/10 to-survival-accent/5 hover:border-survival-primary/60 hover:shadow-[0_0_30px_rgba(0,149,199,0.2)] transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-survival-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-6 h-6 text-survival-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">No sufoco</h3>
                      <p className="text-sm text-muted-foreground">
                        Dívidas acumuladas, preciso organizar minha vida financeira urgente.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect("prosperity")}
                  className="w-full p-6 rounded-2xl border-2 border-prosperity-primary/30 bg-gradient-to-br from-prosperity-primary/10 to-prosperity-accent/5 hover:border-prosperity-primary/60 hover:shadow-[0_0_30px_rgba(168,148,75,0.2)] transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-prosperity-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-prosperity-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Organizado</h3>
                      <p className="text-sm text-muted-foreground">
                        Quero investir e construir minha liberdade financeira.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Basic Data */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-center mb-2">
                Vamos conhecer seus números
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                Isso nos ajuda a calcular sua situação atual.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo atual em conta (R$)</Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="0,00"
                    value={data.currentBalance || ""}
                    onChange={(e) => setData(prev => ({ 
                      ...prev, 
                      currentBalance: parseFloat(e.target.value) || 0 
                    }))}
                    className="h-12 text-lg bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income">Renda mensal média (R$)</Label>
                  <Input
                    id="income"
                    type="number"
                    placeholder="0,00"
                    value={data.monthlyIncome || ""}
                    onChange={(e) => setData(prev => ({ 
                      ...prev, 
                      monthlyIncome: parseFloat(e.target.value) || 0 
                    }))}
                    className="h-12 text-lg bg-secondary/50"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span>Seus dados são criptografados e privados.</span>
                </div>

                <Button 
                  size="lg" 
                  onClick={handleDataSubmit}
                  className="w-full bg-gradient-to-r from-primary to-green-600"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: First Insight */}
          {step === 4 && (
            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-2xl font-bold mb-2">Perfeito!</h2>
              
              <div className="my-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-muted-foreground mb-2">Você começa com uma reserva de</p>
                <p className="text-5xl font-bold text-primary mb-2">
                  {calculateOxygenDays()}
                </p>
                <p className="text-lg text-muted-foreground">dias de oxigênio</p>
              </div>

              <p className="text-sm text-muted-foreground mb-8">
                {data.mode === "survival" 
                  ? "Vamos trabalhar juntos para aumentar essa reserva!"
                  : "Ótimo ponto de partida para construir sua liberdade!"}
              </p>

              <Button 
                size="lg" 
                onClick={handleFinish}
                disabled={saving}
                className="w-full max-w-xs bg-gradient-to-r from-primary to-green-600 shadow-[0_8px_25px_rgba(34,197,94,0.4)]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Explorar meu Dashboard
                    <Rocket className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
