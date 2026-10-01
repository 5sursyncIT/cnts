import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { org, partenaires } from "@/components/cnts/data";
import { NationalNetworkMap } from "@/components/cnts/national-network-map";
import { getStructures } from "@/lib/cms";
import { STRUCTURES } from "@/components/cnts/structures";

export const metadata = {
  title: "Le CNTS — CNTS Sénégal",
  description:
    "Mission, organisation et partenaires du Centre National de Transfusion Sanguine du Sénégal — bien plus qu’une banque de sang.",
};

function MaxWrap({ children, w = 1180 }: { children: React.ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

const featuredPartnerLogos = [
  "/images/partenaires/ministere-sante.png",
  "/images/partenaires/oms.png",
  "/images/partenaires/efs.png",
  "/images/partenaires/isbt.png",
  "/images/partenaires/ucad.png",
  "/images/partenaires/pasteur.png",
  "/images/partenaires/hopital-principal.jpeg",
  "/images/partenaires/andobes.jpeg",
];

const featuredPartners = featuredPartnerLogos.flatMap((logo) => {
  const partner = partenaires.find((item) => item.logo_url === logo);
  return partner ? [{ ...partner, logo_url: logo }] : [];
});

export const dynamic = "force-dynamic";

export default async function QuiSommesNousPage() {
  // Structures de la carte : CMS Strapi, sinon cartographie Excel embarquée.
  const structures = (await getStructures()) ?? STRUCTURES;
  return (
    <div>
      <PageBanner
        kicker="Le CNTS"
        title="Bien plus qu’une banque de sang."
        sub={`Le Centre National de Transfusion Sanguine assure la disponibilité et la sécurité des produits sanguins pour tous les patients du Sénégal depuis plus de ${org.years} ans.`}
      />

      {/* Chiffres clés */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div
          className="grid-4"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "32px var(--gutter)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
        >
          {org.stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                className="font-serif"
                style={{ fontSize: 40, fontWeight: 600, color: "var(--brand)", letterSpacing: "-0.02em" }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink-600)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission, two-col */}
      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Notre mission
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
              Un approvisionnement sûr, accessible à tous
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65, marginBottom: 16 }}>
              {org.mission}
            </p>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65 }}>
              <strong style={{ color: "var(--ink-800)" }}>Notre vision — </strong>
              {org.vision}
            </p>
          </div>
          <div style={{ height: 320, borderRadius: "var(--r-lg)", position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}>
            <Image src="/images/labo_cnts.webp" alt="Laboratoire du CNTS" fill style={{ objectFit: "cover" }} />
          </div>
        </div>
      </MaxWrap>

      {/* Valeurs */}
      <MaxWrap>
        <SectionTitle kicker="Nos valeurs" title="Ce qui guide notre action" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          {org.values.map((v) => {
            const ic =
              ({ Solidarité: "users", Qualité: "award", Sécurité: "shield", Transparence: "search", Innovation: "sparkles" } as Record<string, string>)[v] ??
              "check";
            return (
              <Card key={v} pad={20} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Icon name={ic} size={23} />
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>{v}</div>
              </Card>
            );
          })}
        </div>
      </MaxWrap>

      {/* 4 missions */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle kicker="Nos domaines d’expertise" title="Quatre piliers, une exigence de sécurité" />
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            {org.missions.map((m, i) => (
              <Card key={i} pad={22}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Icon name={m.icon} size={23} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 7 }}>{m.t}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5 }}>{m.d}</p>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      {/* Organisation & réseau */}
      <MaxWrap>
        <SectionTitle
          kicker="Organisation & réseau"
          title="Un maillage national"
          sub={`${org.regions.length} régions couvertes par un réseau de banques régionales et de postes de collecte, coordonnés depuis le siège de Dakar.`}
        />
        <NationalNetworkMap regions={org.regions} structures={structures}>
          <div style={{ width: "100%", marginTop: 8 }}>
            <Button href="/qui-sommes-nous/organisation" variant="outline" iconRight="arrowR">
              Organisation & réseau national
            </Button>
          </div>
        </NationalNetworkMap>
      </MaxWrap>

      {/* Partenaires */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Partenaires"
            title="Ensemble pour la santé publique"
            action={
              <Button href="/qui-sommes-nous/partenaires" variant="outline" size="sm" iconRight="arrowR">
                Tous nos partenaires
              </Button>
            }
          />
          <div className="featured-partners-grid">
            {featuredPartners.map((partner) => (
              <figure key={partner.name} className="featured-partner-card">
                <div className="featured-partner-logo">
                  {partner.logo_url.endsWith("ministere-sante.png") ? (
                    <div className="partner-ministry-mark">
                      <Image src={partner.logo_url} alt="" width={269} height={68} style={{ maxWidth: "none" }} />
                    </div>
                  ) : (
                    <Image
                      src={partner.logo_url}
                      alt=""
                      fill
                      sizes="(max-width: 760px) 45vw, 230px"
                      style={{ objectFit: "contain" }}
                    />
                  )}
                </div>
                <figcaption>
                  <span className="featured-partner-category">{partner.category}</span>
                  <h3 className="featured-partner-name">{partner.name}</h3>
                </figcaption>
              </figure>
            ))}
          </div>
        </MaxWrap>
      </section>

      {/* Pour aller plus loin */}
      <MaxWrap>
        <SectionTitle kicker="Pour aller plus loin" title="Découvrir le CNTS" />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {[
            { href: "/qui-sommes-nous/organisation", icon: "building", t: "Organisation & réseau", d: "Direction, services et réseau national des structures de transfusion sanguine." },
            { href: "/qui-sommes-nous/textes-reference", icon: "shield", t: "Textes de référence", d: "Le cadre juridique et réglementaire de la transfusion sanguine au Sénégal." },
            { href: "/qui-sommes-nous/partenaires", icon: "users", t: "Nos partenaires", d: "Les partenaires nationaux et internationaux qui accompagnent le CNTS." },
          ].map((l) => (
            <Card key={l.href} href={l.href} pad={22}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  background: "var(--red-50)",
                  color: "var(--brand)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Icon name={l.icon} size={23} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                {l.t} <Icon name="arrowR" size={15} style={{ color: "var(--brand)" }} />
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5 }}>{l.d}</p>
            </Card>
          ))}
        </div>
      </MaxWrap>
    </div>
  );
}
