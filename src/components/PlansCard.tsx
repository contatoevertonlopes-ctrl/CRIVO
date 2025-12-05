import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

const PlansCard = () => {
  const navigate = useNavigate();
  const { subscribed, loading } = useSubscription();

  // Não mostrar o card para usuários Pro
  if (loading || subscribed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-background via-background to-black border border-primary/40 shadow-[0_0_60px_rgba(34,197,94,0.3)] p-5">
      {/* Gradient ghost effect */}
      <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.16),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.16),transparent_52%)] opacity-40 pointer-events-none blur-sm"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start gap-2 mb-4">
          <div>
            <h3 className="text-[15px] font-semibold mb-0.5">Planos FinTrack Pro</h3>
            <p className="text-xs text-muted-foreground">
              Desbloqueie previsões avançadas, exportação e integrações automáticas.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 border border-primary/50 text-green-200">
            💰 Economize no anual
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {/* Mensal */}
          <div className="relative overflow-hidden rounded-2xl p-3 border border-border/40 bg-secondary/98">
            <div className="text-xs text-muted-foreground mb-1">Plano Mensal</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-xl font-bold">R$ 15,90</span>
              <span className="text-[11px] text-muted-foreground">/ mês</span>
            </div>
            <div className="text-[11px] text-muted-foreground mb-2">
              Cancela quando quiser. Ideal para testar.
            </div>
            <button 
              onClick={() => navigate("/plans")}
              className="w-full text-xs py-2 px-3 rounded-full bg-secondary/90 text-foreground border border-border/60 hover:bg-secondary hover:border-border transition-all font-medium"
            >
              Assinar mensal
            </button>
          </div>

          {/* Anual */}
          <div className="relative overflow-hidden rounded-2xl p-3 border border-primary/80 bg-secondary/98 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
            <div className="text-xs text-muted-foreground mb-1">Plano Anual</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-xl font-bold">R$ 139</span>
              <span className="text-[11px] text-muted-foreground">/ ano</span>
            </div>
            <div className="text-[11px] text-muted-foreground mb-2">
              Equivale a <strong>~R$ 11,58/mês</strong>. Perfeito para quem leva os números a sério.
            </div>
            <button 
              onClick={() => navigate("/plans")}
              className="w-full text-xs py-2 px-3 rounded-full bg-gradient-to-r from-primary to-green-600 text-primary-foreground shadow-[0_8px_25px_rgba(34,197,94,0.5)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.6)] transition-all font-medium"
            >
              Assinar anual ⭐
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-muted-foreground">
          <span>✔ Acesso a dashboards premium e previsões.</span>
          <span>✔ Atualizações incluídas enquanto o plano estiver ativo.</span>
        </div>
      </div>
    </div>
  );
};

export default PlansCard;
