import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/50 backdrop-blur p-8 text-center card-shadow-soft">
        <div className="text-6xl font-bold mb-2">404</div>
        <p className="text-lg font-semibold">Página não encontrada</p>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço <span className="font-mono">{location.pathname}</span> não existe.
        </p>
        <div className="mt-6">
          <Button asChild className="w-full">
            <a href="/">Voltar ao Dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
