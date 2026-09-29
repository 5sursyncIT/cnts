import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/cnts/primitives";
import { Alert, LoginForm } from "@/components/patient/forms";
import { getCurrentPatient } from "@/lib/auth/current-user";

export const metadata = { title: "Connexion — Espace patient" };

const MESSAGES: Record<string, { tone: "ok" | "info" | "warn"; text: string }> = {
  created: { tone: "ok", text: "Votre compte est créé. Connectez-vous avec votre email et votre mot de passe." },
  logout: { tone: "info", text: "Vous êtes déconnecté." },
  expired: { tone: "warn", text: "Votre session a expiré. Merci de vous reconnecter." },
};

export default async function PatientLoginPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = (await props.searchParams) ?? {};
  const next = typeof sp.next === "string" ? sp.next : "/espace-patient/tableau-de-bord";
  const key = sp.created ? "created" : sp.logout ? "logout" : sp.error === "expired" ? "expired" : null;

  // Déjà connecté (et pas une session expirée) → directement au tableau de bord.
  if (!key && (await getCurrentPatient())) redirect(next);

  return (
    <section style={{ padding: "40px var(--gutter) 80px" }}>
      <div className="two-col" style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
        <div>
          <div className="kicker" style={{ marginBottom: 12 }}>
            Espace donneur
          </div>
          <h1 className="font-serif" style={{ fontSize: "clamp(32px, 4.4vw, 48px)", fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.08 }}>
            Heureux de vous <span className="serif-it" style={{ color: "var(--brand)" }}>revoir</span>.
          </h1>
          <p style={{ marginTop: 14, fontSize: 16.5, color: "var(--ink-600)", lineHeight: 1.6, maxWidth: 420 }}>
            Retrouvez vos rendez-vous, l&apos;historique de vos dons, votre carte de donneur et la date de votre prochain don possible.
          </p>
        </div>
        <Card pad={30} style={{ display: "grid", gap: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Connexion</h2>
          {key && <Alert tone={MESSAGES[key].tone}>{MESSAGES[key].text}</Alert>}
          <LoginForm next={next} />
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, fontSize: 14, color: "var(--ink-600)", display: "grid", gap: 6 }}>
            <span>
              Déjà donneur au CNTS mais pas encore de compte ? <Link href="/espace-patient/inscription" style={{ fontWeight: 700 }}>Activer mon espace</Link>
            </span>
            <span>
              Mot de passe oublié ? <Link href="/contact">Contactez le CNTS</Link>
            </span>
          </div>
        </Card>
      </div>
    </section>
  );
}
