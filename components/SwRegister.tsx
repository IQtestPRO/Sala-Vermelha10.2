"use client";

import { useEffect } from "react";

// Registra o service worker (necessario para Web Push e instalacao PWA).
export default function SwRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* silencioso: sw.js pode ainda nao existir em dev */
      });
    }
  }, []);
  return null;
}
