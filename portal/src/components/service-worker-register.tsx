"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            logger.info({ scope: registration.scope }, "ServiceWorker registration successful");
          },
          (err) => {
            logger.error({ err }, "ServiceWorker registration failed");
          }
        );
      });
    }
  }, []);

  return null;
}
