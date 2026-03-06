import { useEffect } from "react";

// Injetado em build-time pelo vite.config.ts via `define`
declare const __APP_BUILD_ID__: string;

const VERSION_KEY = "app:buildId";

/**
 * Opção 5 — Verifica no startup se o build mudou comparando o BUILD_ID
 * armazenado no localStorage com o atual. Se mudou, limpa todos os caches
 * do Service Worker e força um reload completo.
 *
 * Funciona como fallback independente do ciclo do SW, garantindo que mesmo
 * que o SW não detecte a atualização automaticamente, o app será atualizado.
 */
export function useVersionCheck() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VERSION_KEY);
      const current = __APP_BUILD_ID__;

      // Sempre persiste a versão atual
      localStorage.setItem(VERSION_KEY, current);

      // Primeira visita — nada a fazer
      if (!stored) return;

      // Mesma versão — nada a fazer
      if (stored === current) return;

      // Nova versão detectada: limpa todos os caches do SW e recarrega
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .then(() => { window.location.reload(); });
      } else {
        (window as Window).location.reload();
      }
    } catch {
      // localStorage pode falhar em modo privado ou com storage cheio
    }
  }, []);
}
