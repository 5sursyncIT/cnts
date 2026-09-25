import type { ReactNode } from "react";
import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { communiques, org } from "@/components/cnts/data";

export const metadata = {
  title: "Publications & abstracts — CNTS Sénégal",
  description:
    "Le CNTS valorise la production scientifique de ses équipes : articles, rapports et résumés de recherche issus de ses travaux et de ses partenariats.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

export default function PublicationsPage() {
  return (
    <div>
      <PageBanner
        kicker="Recherche & Innovation"
        title="Publications & abstracts"
        sub="Les connaissances partagées au service de la santé publique."
      />

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <SectionTitle kicker="Production scientifique" title="Valoriser les travaux de nos équipes" />
            <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.65 }}>
              Le CNTS valorise la production scientifique de ses équipes à travers la diffusion d’articles, de rapports
              et de résumés de recherche issus de ses travaux et de ses partenariats. Chaque service est encouragé à
              partager ses publications pour contribuer à l’avancement du savoir médical et à la promotion de la
              recherche collaborative.
            </p>
          </div>
          <Image
            src="/images/labo_cnts.webp"
            alt="Laboratoire du CNTS"
            width={560}
            height={400}
            priority
            style={{ width: "100%", height: "auto", borderRadius: "var(--r-lg)", objectFit: "cover" }}
          />
        </div>

        <section style={{ marginTop: 44 }}>
          <SectionTitle kicker="Publications récentes" title="Rapports et études du CNTS" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {communiques.map((c) => (
              <Card key={c.title} pad={24}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="flask" size={22} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}>{c.title}</h3>
                    <div
                      style={{
                        display: "flex",
                        gap: 14,
                        flexWrap: "wrap",
                        marginTop: 6,
                        fontSize: 13.5,
                        color: "var(--ink-500)",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Icon name="building" size={15} />
                        {c.source}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Icon name="calendar" size={15} />
                        Publié le {frDate(c.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </MaxWrap>

      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <MaxWrap>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 600 }}>
              <h2
                className="font-serif"
                style={{ fontSize: "clamp(22px,2.6vw,28px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}
              >
                Obtenir une publication
              </h2>
              <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.6 }}>
                Pour toute demande concernant ces documents, contactez le service communication du CNTS :{" "}
                <a href={`mailto:${org.emailCommunication}`} style={{ color: "var(--brand)", fontWeight: 600 }}>
                  {org.emailCommunication}
                </a>
                .
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button variant="outline" icon="chevL" href="/recherche">
                Recherche & Innovation
              </Button>
              <Button variant="primary" icon="users" href="/recherche/appels">
                Collaborer avec le CNTS
              </Button>
            </div>
          </div>
        </MaxWrap>
      </section>
    </div>
  );
}
