import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Auto-update Service Worker whenever a new deployment is pushed to production
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  },
});

// Check for live updates when user returns to app / switches tab on phone
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
