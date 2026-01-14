"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const swUrl = "/sw.js";
    navigator.serviceWorker
      .register(swUrl)
      .catch((err) => console.error("[SW] registration failed", err));
  }, []);

  return null;
}
