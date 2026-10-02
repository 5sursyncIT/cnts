"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button, IconBubble } from "@/components/cnts/primitives";
import { ESPACE_PATIENT_OUVERT } from "@/lib/espace-patient";

// Tant que l'espace patient est fermé, tout lien vers /espace-patient… ouvre
// cette fenêtre au lieu de naviguer (les boutons restent visibles sur le site).
export function EspacePatientGate() {
  // Page sur laquelle la fenêtre a été ouverte : elle se ferme d'elle-même après
  // une navigation (ex. clic sur « Nous contacter »).
  const [openOn, setOpenOn] = useState<string | null>(null);
  const pathname = usePathname();
  const open = openOn === pathname;
  const close = () => setOpenOn(null);
  const closeRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ESPACE_PATIENT_OUVERT) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a) return;
      const url = new URL(a.getAttribute("href") ?? "", window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/espace-patient")) return;
      e.preventDefault();
      e.stopPropagation();
      setOpenOn(window.location.pathname);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const precedent = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab" || !dialogRef.current) return;
      // Tabulation bouclée dans la boîte de dialogue.
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier?.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    closeRef.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      precedent?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={() => close()}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20, 10, 12, 0.55)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ep-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--surface, #fff)",
          borderRadius: "var(--r-xl, 20px)",
          padding: "28px clamp(20px, 4vw, 32px)",
          boxShadow: "0 24px 60px rgba(0,0,0,.25)",
        }}
      >
        <IconBubble icon="clock" tone="sun" size={52} />
        <h2 id="ep-modal-title" className="font-serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "18px 0 10px" }}>
          Espace patient en construction
        </h2>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--ink-700)" }}>
          Nous préparons un espace personnel et sécurisé pour suivre vos rendez-vous, l&apos;historique de vos dons et votre
          carte de donneur. Il n&apos;est pas encore ouvert.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-600)", marginTop: 10 }}>
          En attendant, pour prendre rendez-vous ou pour toute question, contactez le CNTS ou rendez-vous à l&apos;une de nos
          collectes. Merci de votre patience.
        </p>
        <div ref={closeRef} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
          <Button onClick={() => close()}>J&apos;ai compris</Button>
          <Button variant="outline" iconRight="arrowR" href="/contact">
            Nous contacter
          </Button>
        </div>
      </div>
    </div>
  );
}
