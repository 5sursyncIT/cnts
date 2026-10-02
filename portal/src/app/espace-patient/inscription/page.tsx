import Link from "next/link";

import { Icon } from "@/components/cnts/icon";
import { Card } from "@/components/cnts/primitives";
import { RegisterForm } from "@/components/patient/forms";

export const metadata = { title: "Activer mon espace — Espace patient" };

const ETAPES = [
  { icon: "idcard", t: "Votre dossier existe déjà", d: "L'espace est réservé aux personnes ayant déjà donné au CNTS : votre dossier a été créé lors de votre premier don." },
  { icon: "shield", t: "Vérification de votre identité", d: "Votre numéro de CNI et votre date de naissance doivent correspondre à votre dossier. La CNI n'est jamais stockée en clair." },
  {
    icon: "mail",
    t: "Confirmation par email ou SMS",
    d: "Avec l'email donné au centre, un lien suffit. Sinon, un code est envoyé par SMS au téléphone de votre dossier, puis un lien à votre email.",
  },
];

export default function RegisterPage() {
  return (
    <section style={{ padding: "40px var(--gutter) 80px" }}>
      <div className="two-col" style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 40, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 22 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 12 }}>
              Espace donneur
            </div>
            <h1 className="font-serif" style={{ fontSize: "clamp(32px, 4.4vw, 46px)", fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.08 }}>
              Activer mon <span className="serif-it" style={{ color: "var(--brand)" }}>espace donneur</span>
            </h1>
          </div>
          {ETAPES.map((e) => (
            <div key={e.t} style={{ display: "flex", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 999, background: "var(--tint)", color: "var(--brand)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name={e.icon} size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{e.t}</div>
                <div style={{ fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.55 }}>{e.d}</div>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 14, color: "var(--ink-600)" }}>
            Jamais donné ? <Link href="/donner-sang/devenir-donneur" style={{ fontWeight: 700 }}>Devenir donneur</Link> : votre dossier sera créé
            lors de votre premier don.
          </p>
        </div>
        <Card pad={30} style={{ display: "grid", gap: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Création du compte</h2>
          <RegisterForm />
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, fontSize: 14, color: "var(--ink-600)" }}>
            Déjà un compte ? <Link href="/espace-patient/connexion" style={{ fontWeight: 700 }}>Se connecter</Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
