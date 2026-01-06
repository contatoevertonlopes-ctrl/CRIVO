import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";

import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export function PwaUpdateNotifier() {
  const { toast, dismiss } = useToast();
  const toastIdRef = useRef<string | null>(null);
  const hasShownRef = useRef(false);

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
        if (hasShownRef.current) return;
        hasShownRef.current = true;

        const shown = toast({
          title: "Nova versão disponível",
          description: "Clique em Atualizar para carregar a versão mais recente.",
          action: (
            <ToastAction
              altText="Atualizar aplicativo"
              onClick={() => {
                // Fecha o toast antes de atualizar, para evitar UI travada.
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
