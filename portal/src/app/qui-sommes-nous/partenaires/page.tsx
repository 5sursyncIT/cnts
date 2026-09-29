import Image from "next/image";
import type { ReactNode } from "react";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { partenaires, type PartnerItem as Partner } from "@/components/cnts/data";
import { getPartners } from "@/lib/cms";

export const metadata = {
  title: "Nos partenaires — CNTS Sénégal",
  description:
    "Les partenaires nationaux et internationaux du CNTS : institutions, universités, organisations internationales et agences de développement.",
};

export const dynamic = "force-dynamic";

type PartnerSection = { category: string; partners: Partner[] };

const CATEGORY_ICONS: Record<string, string> = {
  Institutionnel: "building",
  International: "globe",
  Académique: "award",
};

const CATEGORY_LABELS: Record<string, string> = {
  Institutionnel: "Partenaires institutionnels",
  International: "Partenaires internationaux",
  Académique: "Partenaires académiques",
};

function groupByCategory(items: Partner[]): PartnerSection[] {
  const order: string[] = [];
  const map = new Map<string, Partner[]>();
  for (const item of items) {
    if (!map.has(item.category)) {
      map.set(item.category, []);
      order.push(item.category);
    }
    map.get(item.category)!.push(item);
  }
  return order.map((category) => ({ category, partners: map.get(category)! }));
}

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/[\s—-]+/)
    .filter((w) => w.length > 2 && /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 3)
    .map((w) => w[0])
    .join("");
}

function LogoTile({ p }: { p: Partner }) {
  return (
    <div
      style={{
        position: "relative",
        height: 96,
        borderRadius: "var(--r-md)",
        background: "#fff",
        border: "1px solid var(--line)",
        marginBottom: 16,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      {p.logo_url ? (
        <div style={{ position: "absolute", inset: 14 }}>
          <Image src={p.logo_url} alt={`Logo ${p.name}`} fill sizes="240px" style={{ objectFit: "contain" }} />
        </div>
      ) : (
        <span
          className="font-serif"
          aria-hidden
          style={{ fontSize: 26, fontWeight: 600, color: "var(--red-700)", letterSpacing: "0.02em" }}
        >
          {initials(p.name) || <Icon name="building" size={28} />}
        </span>
      )}
    </div>
  );
}

export default async function PartenairesPage() {
  const partners = (await getPartners()) ?? partenaires;

  const sections = groupByCategory(partners);

  return (
    <div>
      <PageBanner
        kicker="Le CNTS · Partenaires"
        title="Ensemble pour la sécurité transfusionnelle"
        sub="Le Centre National de Transfusion Sanguine collabore avec plusieurs partenaires nationaux et internationaux pour renforcer la sécurité transfusionnelle et promouvoir le don volontaire."
      />

      <MaxWrap w={920}>
        <p style={{ color: "var(--ink-600)", fontSize: 16.5, lineHeight: 1.65, textAlign: "center" }}>
          Ces collaborations permettent d’assurer la formation du personnel, la modernisation des infrastructures et la
          mise en œuvre des programmes de recherche et de sensibilisation.
        </p>
      </MaxWrap>

      {sections.map((section, si) => (
        <section
          key={section.category}
          style={
            si % 2 === 0
              ? { background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }
              : undefined
          }
        >
          <MaxWrap>
            <SectionTitle
              kicker={section.category}
              title={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "var(--brand)", display: "inline-flex" }}>
                    <Icon name={CATEGORY_ICONS[section.category] ?? "users"} size={26} />
                  </span>
                  {CATEGORY_LABELS[section.category] ?? section.category}
                </span>
              }
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
              {section.partners.map((p, idx) => (
                <Card key={p.name + idx} pad={18} style={{ display: "flex", flexDirection: "column" }}>
                  <LogoTile p={p} />
                  {p.type && (
                    <span
                      style={{
                        alignSelf: "flex-start",
                        padding: "3px 10px",
                        borderRadius: "var(--r-pill)",
                        background: "var(--red-50)",
                        color: "var(--brand)",
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {p.type}
                    </span>
                  )}
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.3 }}>{p.name}</h3>
                  {p.description && (
                    <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5, marginTop: 6, flex: 1 }}>
                      {p.description}
                    </p>
                  )}
                  {p.website_url && (
                    <a
                      href={p.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 12,
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: "var(--brand)",
                        textDecoration: "none",
                      }}
                    >
                      Visiter le site <Icon name="arrowR" size={14} />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </MaxWrap>
        </section>
      ))}

      <MaxWrap w={920}>
        <div
          style={{
            textAlign: "center",
            padding: "36px 28px",
            borderRadius: "var(--r-lg)",
            background: "var(--red-50)",
          }}
        >
          <div style={{ color: "var(--brand)", display: "inline-flex", marginBottom: 12 }}>
            <Icon name="heart" size={30} />
          </div>
          <p
            className="font-serif"
            style={{ fontSize: "clamp(18px, 2.2vw, 22px)", lineHeight: 1.45, color: "var(--ink-900)", marginBottom: 20 }}
          >
            Grâce à ce réseau de partenaires, le CNTS consolide sa place d’institution de référence et continue
            d’améliorer la disponibilité du sang sur tout le territoire national.
          </p>
          <Button href="/contact" iconRight="arrowR">
            Devenir partenaire — nous contacter
          </Button>
        </div>
      </MaxWrap>
    </div>
  );
}
