import { Heart, TrendingUp } from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";

const ModeToggle = () => {
  const { mode, toggleMode } = useAppMode();
  const isSurvival = mode === "survival";

  return (
    <button
      onClick={toggleMode}
      className={`
        relative flex items-center gap-1 px-1 py-1 rounded-full 
        border transition-all duration-300
        ${isSurvival 
          ? "bg-survival-card border-survival-border" 
          : "bg-prosperity-card border-prosperity-border"
        }
      `}
    >
      {/* Survival Button */}
      <div
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          transition-all duration-300
          ${isSurvival 
            ? "bg-survival-warning/20 text-survival-warning" 
            : "text-muted-foreground hover:text-foreground"
          }
        `}
      >
        <Heart className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sobrevivência</span>
      </div>

      {/* Prosperity Button */}
      <div
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          transition-all duration-300
          ${!isSurvival 
            ? "bg-prosperity-primary/20 text-prosperity-primary" 
            : "text-muted-foreground hover:text-foreground"
          }
        `}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Prosperidade</span>
      </div>
    </button>
  );
};

export default ModeToggle;
