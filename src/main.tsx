// DM Sans (variable) + DM Mono — auto-hospedado, sem dependência do Google Fonts
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/dm-sans/opsz.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./index.css";

// Força light mode para todos os usuários — reset de identidade de marca v1
if (!localStorage.getItem("crivo-brand-v1")) {
  localStorage.removeItem("crivo-theme");
  localStorage.removeItem("crivo-theme-v2");
  localStorage.setItem("crivo-brand-v1", "1");
}

// Limpa caches de fontes antigas (Space Grotesk via Google Fonts)
if ("caches" in window) {
  caches.delete("google-fonts-cache").catch(() => {});
  caches.delete("google-fonts-cache-v2").catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
