import type { ReactNode } from "react";
import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { celluleRecherche, org, research } from "@/components/cnts/data";

export const metadata = {
  title: "Appels à collaboration — CNTS Sénégal",
  description:
    "Le CNTS ouvre régulièrement des appels à collaboration à destination des chercheurs, étudiants et institutions désireux de participer à ses projets de recherche ou d’en proposer de nouveaux.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

const publics = [
  { icon: "flask", t: "Chercheurs", d: "Participez à un projet de recherche du CNTS ou proposez-en un nouveau." },
  { icon: "award", t: "Étudiants", d: "Associez vos travaux aux projets menés en transfusion, hématologie et sécurité biologique." },
  { icon: "building", t: "Institutions", d: "Développez un partenariat scientifique national ou international avec le CNTS." },
];

const mailSubject = encodeURIComponent("Proposition de collaboration — Cellule de recherche");

export default function AppelsPage() {
  return (
    <div>
      <PageBanner
        kicker="Recherche & Innovation"
        title="Appels à collaboration"
        sub="La recherche progresse grâce au partage et à la coopération. Ensemble, construisons la transfusion de demain."
      />

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <SectionTitle kicker="Cellule de recherche" title="Collaborer avec le CNTS" />
            <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.65 }}>{celluleRecherche.appel}</p>
          </div>
          <Image
            src="/images/recherche-1.jpg"
            alt="Collaboration scientifique au CNTS"
            width={560}
            height={400}
            priority
            style={{ width: "100%", height: "auto", borderRadius: "var(--r-lg)", objectFit: "cover" }}
          />
        </div>

        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 36 }}>
          {publics.map((p) => (
            <Card key={p.t} pad={24}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--red-50)",
                  color: "var(--brand)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Icon name={p.icon} size={22} />
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 6 }}>{p.t}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>{p.d}</p>
            </Card>
          ))}
        </div>
      </MaxWrap>

      {/* Comment proposer */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "stretch" }}>
            <Card pad={28}>
              <div className="kicker" style={{ marginBottom: 10 }}>
                Proposer une collaboration
              </div>
              <h2
                className="font-serif"
                style={{ fontSize: "clamp(22px,2.6vw,28px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 10 }}
              >
                Rejoindre un projet ou soumettre une initiative
              </h2>
              <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.6 }}>
                Si vous souhaitez rejoindre un projet existant ou soumettre une nouvelle initiative, adressez votre
                proposition au CNTS. Les demandes sont examinées par la Cellule de recherche, qui en assure le suivi
                scientifique et administratif.
              </p>
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "var(--surface-1)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14.5,
                }}
              >
                <Icon name="mail" size={18} style={{ color: "var(--brand)" }} />
                <a href={`mailto:${org.email}?subject=${mailSubject}`} style={{ color: "var(--ink-900)", fontWeight: 600 }}>
                  {org.email}
                </a>
              </div>
              <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button variant="primary" icon="mail" href={`mailto:${org.email}?subject=${mailSubject}`}>
                  Proposer une collaboration
                </Button>
                <Button variant="outline" icon="phone" href="/contact">
                  Nous contacter
                </Button>
              </div>
            </Card>

            <Card pad={28}>
              <div className="kicker" style={{ marginBottom: 10 }}>
                Projets du CNTS
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Des projets déjà engagés</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {research.map((r, i) => (
                  <div
                    key={r.t}
                    style={{
                      display: "flex",
                      gap: 11,
                      padding: "10px 0",
                      borderBottom: i < research.length - 1 ? "1px solid var(--line-soft)" : "none",
                      fontSize: 14.5,
                      color: "var(--ink-700)",
                    }}
                  >
                    <Icon name="chevR" size={18} style={{ color: "var(--brand)", marginTop: 1 }} />
                    {r.t}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Button variant="outline" size="sm" iconRight="arrowR" href="/recherche/projets">
                  Voir les projets
                </Button>
              </div>
            </Card>
          </div>
        </MaxWrap>
      </section>

      <MaxWrap>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button variant="ghost" icon="chevL" href="/recherche">
            Retour à Recherche & Innovation
          </Button>
        </div>
      </MaxWrap>
    </div>
  );
}
