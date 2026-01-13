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
        // Proteção anti-loop: se por algum motivo já recarregamos nesta sessão, cai no modo "prompt".
        if (!hasAutoReloadedThisSessionRef.current) {
          hasAutoReloadedThisSessionRef.current = true;

          try {
            const key = "pwa:autoReloaded";
            const alreadyReloaded = sessionStorage.getItem(key) === "1";

            if (!alreadyReloaded) {
              sessionStorage.setItem(key, "1");
              updateSW(true);
              return;
            }
          } catch {
            // sessionStorage pode falhar em alguns contextos (ex: modo privado).
            updateSW(true);
            return;
          }
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
