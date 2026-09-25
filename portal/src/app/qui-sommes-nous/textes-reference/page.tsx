import type { ReactNode } from "react";
import { Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { textesReference } from "@/components/cnts/data";

export const metadata = {
  title: "Textes de référence — CNTS Sénégal",
  description:
    "Cadre juridique et réglementaire de la transfusion sanguine au Sénégal : arrêtés, lois et décrets de 1951 à nos jours, textes nationaux et internationaux.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

function TextList({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <Card pad={24} style={{ height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "var(--red-50)",
            color: "var(--brand)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={21} />
        </div>
        <h3 className="font-serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-900)" }}>
          {title}
        </h3>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it) => (
          <li key={it} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }}>
              <Icon name="check" size={16} />
            </span>
            <span style={{ fontSize: 14.5, color: "var(--ink-700)", lineHeight: 1.55 }}>{it}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function TextesReferencePage() {
  const items = textesReference.chronologie;
  return (
    <div>
      <PageBanner
        kicker="Le CNTS · Cadre réglementaire"
        title="Textes de référence et cadre réglementaire"
        sub="Le fonctionnement du CNTS est réglementé par un ensemble de textes nationaux et internationaux visant à garantir la qualité, la sécurité et l’accessibilité du sang pour tous les patients."
      />

      <MaxWrap w={920}>
        <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65, marginBottom: 32 }}>
          Ces références juridiques définissent le rôle du CNTS dans la politique de santé publique du Sénégal et
          confirment son statut d’établissement public de santé à caractère scientifique et technique. La plupart des
          textes réglementant la transfusion sanguine sont établis sous forme de lois, d’arrêtés et de décrets.
        </p>

        <SectionTitle kicker="Chronologie" title="De 1951 à nos jours" />

        <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }}>
          {items.map((e, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${e.ref}-${i}`} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 16 }}>
                {/* rail + dot */}
                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  {!last && (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: 20,
                        bottom: 0,
                        width: 2,
                        background: "var(--line)",
                      }}
                    />
                  )}
                  <span
                    aria-hidden
                    style={{
                      position: "relative",
                      marginTop: 4,
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      background: last || i === 0 ? "var(--brand)" : "var(--surface)",
                      border: "3px solid var(--brand)",
                      boxShadow: "0 0 0 4px var(--red-50)",
                    }}
                  />
                </div>
                <div style={{ paddingBottom: last ? 0 : 26 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 12px", marginBottom: 6 }}>
                    <span className="kicker">{e.date}</span>
                    <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)" }}>{e.ref}</span>
                  </div>
                  <p style={{ fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.6 }}>{e.t}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </MaxWrap>

      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle kicker="Références" title="Textes nationaux et internationaux" />
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <TextList icon="shield" title="Textes nationaux" items={textesReference.nationaux} />
            <TextList icon="globe" title="Textes internationaux" items={textesReference.internationaux} />
          </div>
        </MaxWrap>
      </section>

      <MaxWrap w={920}>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            padding: "22px 24px",
            borderRadius: "var(--r-lg)",
            background: "var(--red-50)",
          }}
        >
          <div style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }}>
            <Icon name="award" size={22} />
          </div>
          <p style={{ fontSize: 15.5, color: "var(--ink-800)", lineHeight: 1.65 }}>
            À travers ce cadre réglementaire, le CNTS inscrit ses actions dans les standards internationaux et dans les
            orientations du Ministère de la Santé et de l’Hygiène Publique, garantissant ainsi la sécurité
            transfusionnelle au niveau national.
          </p>
        </div>
      </MaxWrap>
    </div>
  );
}
