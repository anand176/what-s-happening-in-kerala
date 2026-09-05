"use client";

import { useEffect } from "react";

/** Registers the service worker that makes the dashboard installable and offline-capable. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Dev builds change chunks constantly; only register for real deployments.
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* installability is a progressive enhancement — ignore failures */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
