import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./index.css";

// Limpa caches antigos do SW (Space Grotesk, builds velhos) para forçar nova identidade visual
if ("caches" in window) {
  caches.delete("google-fonts-cache").catch(() => {});
}
// Desregistra SWs antigos agressivos (skipWaiting/clientsClaim) que bloqueavam atualizações
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
