import Image from "next/image";
import type { ReactNode } from "react";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { hematologie, org } from "@/components/cnts/data";

export const metadata = {
  title: "Hématologie clinique — CNTS Sénégal",
  description:
    "Le service d’hématologie clinique du CNTS assure la prise en charge médicale des patients souffrant de maladies du sang : drépanocytose, hémophilie, anémies, leucémies.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

export default function HematologiePage() {
  return (
    <div>
      <PageBanner
        kicker="Services · Hématologie clinique"
        title="La prise en charge des maladies du sang"
        sub="Suivi médical, traitements spécialisés et accompagnement social pour les patients drépanocytaires, hémophiles et atteints d’autres affections hématologiques."
      />

      {/* Chiffres */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div
          className="two-col"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "32px var(--gutter)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {hematologie.chiffres.map((c) => (
            <div key={c.label} style={{ textAlign: "center" }}>
              <div className="font-serif" style={{ fontSize: 42, fontWeight: 600, color: "var(--brand)", letterSpacing: "-0.02em" }}>
                {c.value}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-600)", fontWeight: 600, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Notre service
            </div>
            <h2
              className="font-serif"
              style={{ fontSize: "clamp(24px,3vw,33px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}
            >
              Un suivi médical global, au plus près des patients
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65, marginBottom: 14 }}>{hematologie.intro}</p>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65 }}>
              Une collaboration étroite est maintenue avec le laboratoire pour adapter les transfusions.
            </p>
          </div>
          <div
            style={{ height: 320, borderRadius: "var(--r-lg)", position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}
          >
            <Image src="/images/cnts_image3.jpg" alt="Service d’hématologie clinique du CNTS" fill style={{ objectFit: "cover" }} />
          </div>
        </div>
      </MaxWrap>

      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle kicker="Nos pôles" title="Soins, suivi et transmission du savoir" />
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {hematologie.poles.map((p) => (
              <Card key={p.t} pad={24} style={{ height: "100%" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 13,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <Icon name={p.icon} size={24} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{p.t}</h3>
                <p style={{ fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.6 }}>{p.d}</p>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      <MaxWrap>
        <Card pad={28} style={{ background: "var(--red-50)" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 420px" }}>
              <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 8 }}>
                Une consultation hématologique ?
              </h2>
              <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.6 }}>
                Faites votre demande en ligne : un membre de notre équipe vous contactera pour confirmer le rendez-vous.
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
