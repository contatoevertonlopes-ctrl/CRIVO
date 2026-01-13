import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface AppLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

const AppLogo = ({ size = 32, className, color }: AppLogoProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Para ficar 1:1 com o ícone do app instalado (PWA), usamos o mesmo asset.
  // O `color` fica sem efeito aqui por ser um PNG.
  void color;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-[22%] bg-[#0B1217]",
        // No tema escuro, a borda branca geralmente é um halo de antialiasing.
        // Recortar + dar um leve zoom remove o halo sem mudar o ícone.
        isDark && "ring-1 ring-white/10",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="FinTrack"
    >
      <img
        src="/pwa-512x512.png"
        width={size}
        height={size}
        alt=""
        className={cn("block h-full w-full", isDark && "scale-[1.03]")}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </span>
  );
};

export default AppLogo;
