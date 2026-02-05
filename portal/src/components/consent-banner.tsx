"use client";

import { useState, useEffect } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length < 2) return null;
  return parts.pop()?.split(";").shift() ?? null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=strict${secure}`;
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check consent only on client side after mount to avoid hydration mismatch
    const hasConsent = getCookie("cnts_gdpr_consent");
    if (hasConsent === null) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white px-4 py-4 shadow-lg animate-in slide-in-from-bottom-5"
      role="region"
      aria-label="Consentement cookies"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-zinc-800">
          <p id="consent-title" className="font-medium">Consentement RGPD</p>
          <p id="consent-desc" className="mt-1 text-xs text-zinc-600">
            Ce site utilise des cookies essentiels pour sécuriser votre espace patient. Aucune donnée n'est partagée à des tiers publicitaires.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCookie("cnts_gdpr_consent", "accepted", 180);
              setVisible(false);
            }}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            Accepter et fermer
          </button>
        </div>
      </div>
    </div>
  );
}
