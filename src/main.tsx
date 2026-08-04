import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./index.css";

// Limpa cache antigo de fontes (Space Grotesk / 1-year CacheFirst) uma única vez
if ("caches" in window) {
  caches.delete("google-fonts-cache").catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
