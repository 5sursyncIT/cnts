import Image from "next/image";
import type { ReactNode } from "react";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { laboratoires, org } from "@/components/cnts/data";

export const metadata = {
  title: "Laboratoires — CNTS Sénégal",
  description:
    "Les laboratoires du CNTS : qualification biologique de chaque don de sang et examens spécialisés d’hématologie et d’immuno-hématologie pour les patients.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

function PoleCard({
  icon,
  kicker,
  title,
  desc,
  items,
}: {
  icon: string;
  kicker: string;
  title: string;
  desc: string;
  items: string[];
}) {
  return (
    <Card pad={28} style={{ height: "100%" }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "var(--red-50)",
          color: "var(--brand)",
          display: "grid",
          placeItems: "center",
          marginBottom: 16,
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <div className="kicker" style={{ marginBottom: 6 }}>
        {kicker}
      </div>
      <h3 className="font-serif" style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 10 }}>
        {title}
      </h3>
      <p style={{ fontSize: 15, color: "var(--ink-600)", lineHeight: 1.6, marginBottom: 18 }}>{desc}</p>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((t) => (
          <div key={t} style={{ display: "flex", gap: 10, fontSize: 14.5, color: "var(--ink-700)", alignItems: "flex-start" }}>
            <Icon name="check" size={17} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
            {t}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function LaboratoiresPage() {
  const { qualification, patients } = laboratoires;
  return (
    <div>
      <PageBanner
        kicker="Services · Laboratoires"
        title="Les laboratoires du CNTS"
        sub="Un rôle crucial dans la sécurité transfusionnelle et le diagnostic médical."
      />

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Deux pôles complémentaires
            </div>
            <h2
              className="font-serif"
              style={{ fontSize: "clamp(24px,3vw,33px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}
            >
              Sécuriser chaque don, accompagner chaque patient
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65, marginBottom: 14 }}>{laboratoires.intro}</p>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65 }}>
              Le laboratoire de qualification biologique des poches de sang et le laboratoire d’analyses pour patients.
            </p>
          </div>
          <div
            style={{ height: 320, borderRadius: "var(--r-lg)", position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}
          >
            <Image src="/images/labo_cnts.webp" alt="Laboratoire du CNTS" fill style={{ objectFit: "cover" }} />
          </div>
        </div>
      </MaxWrap>

      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle kicker="Nos laboratoires" title="Qualification des dons et analyses pour patients" />
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <PoleCard
              icon="shield"
              kicker="Sécurité transfusionnelle"
              title={qualification.t}
              desc={qualification.d}
              items={qualification.tests}
            />
            <PoleCard
              icon="flask"
              kicker="Diagnostic médical"
              title={patients.t}
              desc={patients.d}
              items={patients.tests}
            />
          </div>
        </MaxWrap>
      </section>

      <MaxWrap>
        <Card pad={28} style={{ background: "var(--red-50)", borderColor: "var(--red-100)" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 420px" }}>
              <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 8 }}>
                Besoin d’une analyse ?
              </h2>
              <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.6 }}>
                Choisissez le service souhaité, sélectionnez la date et l’heure qui vous conviennent : un membre de notre
                équipe vous contactera pour confirmer le rendez-vous.
              </p>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12, fontSize: 14, color: "var(--ink-700)" }}>
                <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                  <Icon name="clock" size={16} style={{ color: "var(--brand)" }} />
                  {org.hours}
                </span>
                <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                  <Icon name="phone" size={16} style={{ color: "var(--brand)" }} />
                  {org.phone}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button href="/espace-patient/rendez-vous" icon="calendarCheck">
                Prendre rendez-vous
              </Button>
              <Button href="/services" variant="outline" iconRight="arrowR">
                Tous les services
              </Button>
            </div>
          </div>
        </Card>
      </MaxWrap>
    </div>
  );
}
