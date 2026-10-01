"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";

/**
 * Bouton d'envoi des formulaires HTML natifs (POST vers une route) : affiche un
 * état « en cours » et empêche le double envoi.
 */
export function SubmitButton({ children, pendingLabel = "Veuillez patienter…" }: { children: React.ReactNode; pendingLabel?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onSubmit = () => setPending(true);
    // Retour arrière depuis la page suivante : réactiver le bouton.
    const onShow = () => setPending(false);
    form.addEventListener("submit", onSubmit);
    window.addEventListener("pageshow", onShow);
    return () => {
      form.removeEventListener("submit", onSubmit);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  return (
    <button ref={ref} type="submit" disabled={pending} aria-busy={pending} className={buttonClasses("primary", "md", "w-full")}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
