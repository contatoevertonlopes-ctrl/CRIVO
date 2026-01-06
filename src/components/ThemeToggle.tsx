import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

type ThemeToggleProps = {
  className?: string;
};

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = useMemo(() => {
    if (!mounted) return true;
    return resolvedTheme === "dark";
  }, [mounted, resolvedTheme]);

  return (
    <button
      type="button"
      aria-label="Alternar tema (claro/escuro)"
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors",
        "border border-border/30",
        className,
      )}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
