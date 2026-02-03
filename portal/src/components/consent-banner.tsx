"use client";

import { useState } from "react";

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length < 2) return null;
  return parts.pop()?.split(";").shift() ?? null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax`;
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof document === "undefined") return false;
    return getCookie("cnts_gdpr_consent") == null;
  });

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white px-4 py-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-zinc-800">
          <p className="font-medium">Consentement GDPR</p>
          <p className="mt-1 text-xs text-zinc-600">
            Ce site peut traiter des données de santé dans l’espace patient. Votre consentement explicite est requis.
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
            J’accepte
          </button>
          <button
            type="button"
            onClick={() => {
              setCookie("cnts_gdpr_consent", "declined", 180);
              setVisible(false);
            }}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            Je refuse
          </button>
        </div>
      </div>
    </div>
  );
}
