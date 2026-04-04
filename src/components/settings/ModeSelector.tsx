import { Shield, Rocket } from "lucide-react";
import { useAppMode, AppMode } from "@/contexts/AppModeContext";
import { cn } from "@/lib/utils";

const modes = [
  {
    id: "survival" as AppMode,
    icon: Shield,
    title: "Modo Sobrevivência",
    description: "Focado em controle de dívidas, gastos essenciais e gestão de emergências. Ideal para quem precisa organizar as finanças e sair do vermelho.",
    color: "survival",
  },
  {
    id: "prosperity" as AppMode,
    icon: Rocket,
    title: "Modo Prosperidade",
    description: "Focado em investimentos, metas de patrimônio e crescimento financeiro. Ideal para quem já está organizado e quer multiplicar seu dinheiro.",
    color: "prosperity",
  },
];

const ModeSelector = () => {
  const { mode, setMode } = useAppMode();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">Modo de Exibição</h3>
        <p className="text-xs text-muted-foreground">
          Escolha o modo que melhor se adapta ao seu momento financeiro
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modes.map((m) => {
          const isActive = mode === m.id;
          const Icon = m.icon;
          
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.98]",
                isActive
                  ? m.color === "survival"
                    ? "border-survival-primary bg-survival-primary/10 shadow-lg shadow-survival-primary/20"
                    : "border-prosperity-primary bg-prosperity-primary/10 shadow-lg shadow-prosperity-primary/20"
                  : "border-border/70 bg-card/50 hover:border-border"
              )}
            >
              {isActive && (
                <div className="absolute top-2 right-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    m.color === "survival"
                      ? "bg-survival-primary/20 text-survival-primary"
                      : "bg-prosperity-primary/20 text-prosperity-primary"
                  )}>
                    Ativo
                  </span>
                </div>
              )}
              
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                m.color === "survival"
                  ? "bg-survival-primary/20"
                  : "bg-prosperity-primary/20"
              )}>
                <Icon className={cn(
                  "w-6 h-6",
                  m.color === "survival"
                    ? "text-survival-primary"
                    : "text-prosperity-primary"
                )} />
              </div>
              
              <h4 className="font-semibold mb-1">{m.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {m.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
