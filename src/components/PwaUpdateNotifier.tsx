import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";

import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export function PwaUpdateNotifier() {
  const { toast, dismiss } = useToast();
  const toastIdRef = useRef<string | null>(null);
  const hasShownRef = useRef(false);
  const hasAutoReloadedThisSessionRef = useRef(false);

  useEffect(() => {
    let updateInterval: number | undefined;
    let removeListeners: (() => void) | undefined;

    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        const checkForUpdate = () => {
          // `registration.update()` força o browser a revalidar o sw.js.
          registration.update().catch(() => {
            // Silencioso: falhas aqui são comuns (offline / throttling) e não devem incomodar o usuário.
          });
        };

        // Checa quando o usuário volta pra aba e a cada alguns minutos.
        const onVisibilityOrFocus = () => {
          if (document.visibilityState === "visible") checkForUpdate();
        };

        window.addEventListener("focus", onVisibilityOrFocus);
        document.addEventListener("visibilitychange", onVisibilityOrFocus);

        removeListeners = () => {
          window.removeEventListener("focus", onVisibilityOrFocus);
          document.removeEventListener("visibilitychange", onVisibilityOrFocus);
        };

        // Intervalo leve para não depender só de reload.
        updateInterval = window.setInterval(checkForUpdate, 5 * 60 * 1000);

        // Primeira checagem logo após registrar.
        checkForUpdate();

      },
      onNeedRefresh() {
        // "Sempre na última versão": aplica o update e recarrega automaticamente.
        // Observação: o SW pode atualizar em background, mas o código JS em memória só muda com reload.
        // A proteção contra loop é feita apenas pelo ref em memória — sessionStorage não é usado
        // pois ele persiste durante reloads e bloquearia updates legítimos em sessões longas.
        if (!hasAutoReloadedThisSessionRef.current) {
          hasAutoReloadedThisSessionRef.current = true;
          updateSW(true);
          return;
        }

        if (hasShownRef.current) return;
        hasShownRef.current = true;

        const shown = toast({
          title: "Nova versão disponível",
          description: "Atualize para carregar a versão mais recente.",
          action: (
            <ToastAction
              altText="Atualizar aplicativo"
              onClick={() => {
                if (toastIdRef.current) dismiss(toastIdRef.current);
                updateSW(true);
              }}
            >
              Atualizar
            </ToastAction>
          ),
          duration: 60 * 60 * 1000,
        });

        toastIdRef.current = shown.id;
      },
    });

    return () => {
      if (toastIdRef.current) dismiss(toastIdRef.current);
      if (updateInterval) window.clearInterval(updateInterval);
      if (removeListeners) removeListeners();
    };
  }, [dismiss, toast]);

  return null;
}
