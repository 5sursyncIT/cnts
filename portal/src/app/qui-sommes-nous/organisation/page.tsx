import Image from "next/image";
import type { ReactNode } from "react";
import { Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { org, organisation, reseau } from "@/components/cnts/data";
import { ReseauMap } from "@/components/cnts/reseau-map";
import { getStructures } from "@/lib/cms";
import { STRUCTURES } from "@/components/cnts/structures";

export const metadata = {
  title: "Organisation & réseau — CNTS Sénégal",
  description:
    "Organisation du Centre National de Transfusion Sanguine du Sénégal — direction, équipe de coordination, services — et réseau national de 33 structures de transfusion sanguine.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

function IconTile({ name, mb = 16 }: { name: string; mb?: number }) {
  return (
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 13,
        background: "var(--red-50)",
        color: "var(--brand)",
        display: "grid",
        placeItems: "center",
        marginBottom: mb,
        flexShrink: 0,
      }}
    >
      <Icon name={name} size={23} />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function OrganisationPage() {
  // Structures de la carte : CMS Strapi, sinon cartographie Excel embarquée.
  const structures = (await getStructures()) ?? STRUCTURES;
  return (
    <div>
      <PageBanner
        kicker="Le CNTS · Organisation"
        title="Organisation & réseau national"
        sub={`Un Directeur, une équipe de coordination, cinq services et un réseau de ${org.structures} structures de transfusion sanguine à travers tout le Sénégal.`}
      />

      {/* Organisation interne */}
      <MaxWrap>
        <div
          className="two-col"
          style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 40, alignItems: "start" }}
        >
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Organisation du CNTS
            </div>
            <h2
              className="font-serif"
              style={{
                fontSize: "clamp(24px,3vw,33px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.12,
                marginBottom: 16,
              }}
            >
              Une direction, une coordination, des services spécialisés
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65, marginBottom: 14 }}>
              {organisation.intro}
            </p>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65 }}>
              Cette organisation garantit la coordination et la sécurité des activités transfusionnelles dans tout le
              pays.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card pad={20}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid var(--line)",
                    flexShrink: 0,
                  }}
                >
                  <Image src={org.director.photo} alt={org.director.name} fill sizes="64px" style={{ objectFit: "cover" }} />
                </div>
                <div>
                  <div className="kicker" style={{ marginBottom: 4 }}>
                    Direction
                  </div>
                  <div style={{ fontSize: 16.5, fontWeight: 700, color: "var(--ink-900)" }}>{org.director.name}</div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-600)" }}>{org.director.title}</div>
                </div>
              </div>
            </Card>
            <Card pad={20}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <IconTile name="users" mb={0} />
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)" }}>Équipe de coordination</div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5 }}>
                    Entoure le Directeur dans la conduite du centre, structuré en services et divisions techniques, médicales et administratives.
                  </div>
                </div>
              </div>
            </Card>
            <Card pad={20}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <IconTile name="building" mb={0} />
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)" }}>Tutelle</div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5 }}>{org.tutelle}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </MaxWrap>

      {/* Services */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Nos services"
            title="Cinq services au cœur de la chaîne transfusionnelle"
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
            {organisation.services.map((s) => (
              <Card key={s.t} pad={22} href={s.href} style={{ display: "flex", flexDirection: "column" }}>
                <IconTile name={s.icon} />
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 7, color: "var(--ink-900)" }}>{s.t}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5, flex: 1 }}>{s.d}</p>
                {s.href && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 14,
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--brand)",
                    }}
                  >
                    En savoir plus <Icon name="arrowR" size={15} />
                  </span>
                )}
              </Card>
            ))}
          </div>

          {/* Organigramme */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              padding: "18px 20px",
              borderRadius: "var(--r-lg)",
              background: "var(--surface)",
              border: "1px dashed var(--line-strong)",
            }}
          >
            <div style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }}>
              <Icon name="info" size={20} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Organigramme</div>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>
                La représentation officielle de la structure interne du CNTS est issue du document d’organisation validé
                par le Conseil d’Administration. Le nouvel organigramme officiel sera publié prochainement.
              </p>
            </div>
          </div>
        </MaxWrap>
      </section>

      {/* Réseau national */}
      <MaxWrap>
        <SectionTitle
          kicker="Réseau national"
          title="Réseau national des structures de sang"
          sub={reseau.intro}
        />
        <ReseauMap structures={structures} />

        <div
          className="grid-3"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 28 }}
        >
          {reseau.types.map((t) => (
            <Card key={t.short} pad={22}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 11px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--red-50)",
                  color: "var(--brand)",
                  fontSize: 12.5,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  marginBottom: 12,
                }}
              >
                {t.short}
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--ink-900)" }}>{t.t}</h3>
              <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.55 }}>{t.d}</p>
            </Card>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            padding: "20px 22px",
            borderRadius: "var(--r-lg)",
            background: "var(--red-50)",
          }}
        >
          <div style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }}>
            <Icon name="trend" size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>
              Un réseau en expansion
            </div>
            <p style={{ fontSize: 14.5, color: "var(--ink-700)", lineHeight: 1.6 }}>{reseau.expansion}</p>
          </div>
        </div>
      </MaxWrap>
    </div>
  );
}
