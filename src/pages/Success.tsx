import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const Success = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();
  const [showContent, setShowContent] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Ativando sua assinatura...");

  useEffect(() => {
    // Simulate loading phases
    const messages = [
      "Ativando sua assinatura...",
      "Desbloqueando recursos premium...",
      "Preparando sua experiência personalizada..."
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < messages.length) {
        setLoadingMessage(messages[currentIndex]);
      }
    }, 800);

    // Show content after loading animation
    const timer = setTimeout(() => {
      clearInterval(interval);
      setShowContent(true);
      checkSubscription();
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkSubscription]);

  const handleGoToDashboard = () => {
    navigate("/");
  };

  if (!showContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <p className="text-lg text-muted-foreground animate-pulse">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(34,197,94,0.4)] animate-in zoom-in duration-500">
            <Check className="w-12 h-12 text-primary-foreground" strokeWidth={3} />
          </div>
          
          {/* Decorative circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }}></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '2.5s' }}></div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            Parabéns! 🎉
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Você acaba de desbloquear o potencial máximo do
          </p>
          <p className="text-xl font-semibold text-primary mb-6">
            FinTrack Premium
          </p>
          
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Agora você tem acesso a:
            </p>
            <ul className="space-y-3 text-left">
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Importação ilimitada de CSV</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Modos Adaptativos Avançados</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Relatórios PDF profissionais</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>Suporte prioritário 24/7</span>
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleGoToDashboard}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all text-lg py-6"
          >
            Explorar meu Dashboard
          </Button>
          
          <p className="text-xs text-muted-foreground mt-6">
            Um e-mail de confirmação foi enviado para você.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Success;
