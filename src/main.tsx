import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA: registra el service worker solo en web (http/https) y fuera de Capacitor
const isCapacitor = Boolean((window as unknown as { Capacitor?: unknown }).Capacitor);
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !isCapacitor) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sin SW seguimos funcionando como web normal */
    });
  });
}
