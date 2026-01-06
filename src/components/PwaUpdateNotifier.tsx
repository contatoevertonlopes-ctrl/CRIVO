import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";

import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export function PwaUpdateNotifier() {
  const { toast, dismiss } = useToast();
  const toastIdRef = useRef<string | null>(null);
  const hasShownRef = useRef(false);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
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
    };
  }, [dismiss, toast]);

  return null;
}
