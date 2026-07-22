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
        // Auto-reload once per tab session when SW has a new version.
        // Uses sessionStorage (survives page reload within the same tab) to
        // prevent an infinite reload loop: if the SW still reports needsRefresh
        // after the reload, we show a toast instead of reloading again.
        const SESSION_KEY = "crivo_sw_reloaded";
        const alreadyReloaded = !!sessionStorage.getItem(SESSION_KEY);
        if (!alreadyReloaded) {
          sessionStorage.setItem(SESSION_KEY, "1");
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
