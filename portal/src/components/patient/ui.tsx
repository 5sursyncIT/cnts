"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { consentAction, logoutAction } from "@/app/espace-patient/actions";
import { Icon } from "@/components/cnts/icon";

export const PATIENT_TABS = [
  { href: "/espace-patient/tableau-de-bord", label: "Tableau de bord", icon: "dash" },
  { href: "/espace-patient/rendez-vous", label: "Rendez-vous", icon: "calendar" },
  { href: "/espace-patient/historique", label: "Mes dons", icon: "drop" },
  { href: "/espace-patient/carte-donneur", label: "Carte donneur", icon: "idcard" },
  { href: "/espace-patient/documents", label: "Documents", icon: "flask" },
  { href: "/espace-patient/profil", label: "Mon profil", icon: "user" },
];

export function PatientTabs() {
  const pathname = usePathname();
  return (
    <nav className="pt-tabs" aria-label="Navigation de l'espace patient">
      {PATIENT_TABS.map((t) => {
        const on = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={"nav-link" + (on ? " on" : "")} style={{ gap: 7 }}>
            <Icon name={t.icon} size={16} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="cn-btn outline sm">
        <Icon name="logout" size={15} />
        Déconnexion
      </button>
    </form>
  );
}

export function ConsentCard({ current }: { current: "accepted" | "declined" | "unset" }) {
  const [pending, start] = useTransition();
  const save = (v: "accepted" | "declined") => start(() => consentAction(v));
  return (
    <div className="cn-card" style={{ padding: 24, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--tint)", color: "var(--brand)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="shield" size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Accès à vos documents de santé</h2>
          <p style={{ fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.55 }}>
            Vos documents (attestations, comptes-rendus) sont des données de santé. Leur affichage dans votre espace nécessite
            votre accord explicite, modifiable à tout moment depuis « Mon profil ».
          </p>
          {current === "declined" && (
            <p style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 6 }}>Vous avez refusé l&apos;accès pour le moment.</p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" disabled={pending} onClick={() => save("accepted")} className="cn-btn primary sm">
          <Icon name="check" size={16} />
          J&apos;accepte
        </button>
        {current !== "declined" && (
          <button type="button" disabled={pending} onClick={() => save("declined")} className="cn-btn outline sm">
            Je refuse
          </button>
        )}
      </div>
    </div>
  );
}

export function RevokeConsentButton() {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => consentAction("declined"))} className="cn-btn outline sm">
      Retirer mon accord
    </button>
  );
}
