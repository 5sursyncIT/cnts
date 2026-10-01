import { redirect } from "next/navigation";

import { Button, Card, IconBubble, SectionTitle } from "@/components/cnts/primitives";
import { getCurrentPatient } from "@/lib/auth/current-user";
import { ESPACE_PATIENT_OUVERT } from "@/lib/espace-patient";

export const metadata = {
  title: "Espace donneur — CNTS Sénégal",
  description: "Votre espace donneur CNTS : rendez-vous, historique de vos dons, carte de donneur et date de votre prochain don.",
};

const FONCTIONS: { icon: string; t: string; d: string; tone: "tint" | "sun" | "red" }[] = [
  { icon: "calendarCheck", t: "Prendre rendez-vous", d: "Réservez un créneau au siège de Fann ou au CRTS de Kaolack, et annulez en un clic.", tone: "red" },
  { icon: "clock", t: "Mon prochain don", d: "La date à partir de laquelle vous pouvez donner à nouveau, calculée d'après votre dernier don.", tone: "sun" },
  { icon: "drop", t: "Historique de mes dons", d: "Tous vos dons enregistrés au CNTS, année par année.", tone: "tint" },
  { icon: "idcard", t: "Carte de donneur", d: "Votre carte numérique, votre groupe sanguin et vos points de fidélité.", tone: "tint" },
  { icon: "user", t: "Mes coordonnées", d: "Tenez à jour votre téléphone et votre email pour être prévenu en cas de besoin.", tone: "sun" },
  { icon: "shield", t: "Confidentialité", d: "Aucun résultat d'analyse n'est affiché en ligne. Vos documents de santé restent soumis à votre accord.", tone: "tint" },
];

function EspaceEnConstruction() {
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div aria-hidden className="blob" style={{ width: 460, height: 460, right: -120, top: -160, background: "var(--acc2-soft)" }} />
      <div className="stag" style={{ position: "relative", maxWidth: 820, margin: "0 auto", padding: "72px var(--gutter) 88px", minWidth: 0 }}>
        <div className="kicker" style={{ marginBottom: 14 }}>
          Espace patient
        </div>
        <h1 className="font-serif" style={{ fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
          Cet espace est <span className="hl serif-it" style={{ color: "var(--brand)" }}>en construction.</span>
        </h1>
        <Card pad={28} style={{ marginTop: 28 }}>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
            <IconBubble icon="clock" tone="sun" size={52} />
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--ink-700)" }}>
                Nous préparons un espace personnel et sécurisé pour suivre vos rendez-vous, l&apos;historique de vos dons et
                votre carte de donneur. Il n&apos;est pas encore ouvert : la connexion et la création de compte sont
                temporairement indisponibles.
              </p>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--ink-600)", marginTop: 12 }}>
                En attendant, pour prendre rendez-vous ou pour toute question, contactez directement le CNTS ou rendez-vous
                à l&apos;une de nos collectes. Merci de votre patience.
              </p>
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Button size="lg" icon="calendarCheck" href="/collectes">
            Voir les collectes
          </Button>
          <Button size="lg" variant="outline" iconRight="arrowR" href="/contact">
            Nous contacter
          </Button>
        </div>
      </div>
    </section>
  );
}

export default async function PatientAreaHome() {
  if (!ESPACE_PATIENT_OUVERT) return <EspaceEnConstruction />;
  if (await getCurrentPatient()) redirect("/espace-patient/tableau-de-bord");

  return (
    <div>
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div aria-hidden className="blob" style={{ width: 460, height: 460, right: -120, top: -160, background: "var(--acc2-soft)" }} />
        <div className="stag" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "64px var(--gutter) 56px", minWidth: 0 }}>
          <div className="kicker" style={{ marginBottom: 14 }}>
            Espace donneur
          </div>
          <h1 className="font-serif" style={{ fontSize: "clamp(38px, 5.4vw, 64px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: 760 }}>
            Votre engagement, <span className="hl serif-it" style={{ color: "var(--brand)" }}>suivi pas à pas.</span>
          </h1>
          <p style={{ marginTop: 18, fontSize: 18, lineHeight: 1.55, color: "var(--ink-700)", maxWidth: 560 }}>
            Rendez-vous, historique de vos dons, carte de donneur : tout votre parcours au CNTS dans un espace personnel et sécurisé.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
            <Button size="lg" href="/espace-patient/connexion">
              Se connecter
            </Button>
            <Button size="lg" variant="outline" iconRight="arrowR" href="/espace-patient/inscription">
              Activer mon espace
            </Button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "24px var(--gutter) 72px" }}>
        <SectionTitle kicker="Ce que vous y trouvez" title="Tout votre parcours de donneur" />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 18 }}>
          {FONCTIONS.map((f) => (
            <Card key={f.t} pad={26} hover>
              <IconBubble icon={f.icon} tone={f.tone} size={52} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "18px 0 6px" }}>{f.t}</h3>
              <p style={{ color: "var(--ink-600)", fontSize: 14.5, lineHeight: 1.55 }}>{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 560 }}>
            <h2 className="font-serif" style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.12 }}>
              Pas encore donneur ? Votre espace s&apos;ouvre après votre premier don.
            </h2>
          </div>
          <Button size="lg" variant="light" icon="drop" href="/donner-sang/devenir-donneur">
            Devenir donneur
          </Button>
        </div>
      </section>
    </div>
  );
}
