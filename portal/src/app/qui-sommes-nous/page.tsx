import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { org } from "@/components/cnts/data";
import { SenegalMap, geoToSvg, REGION_POINTS } from "@/components/cnts/senegal-map";

export const metadata = {
  title: "Le CNTS — CNTS Sénégal",
  description:
    "Mission, organisation et partenaires du Centre National de Transfusion Sanguine du Sénégal — bien plus qu’une banque de sang.",
};

function MaxWrap({ children, w = 1180 }: { children: React.ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

export default function QuiSommesNousPage() {
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
        <div
          className="two-col"
          style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 30, alignItems: "center" }}
        >
          {/* Carte du Sénégal — régions couvertes */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1000 / 736",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--line)",
              background: "var(--surface-1)",
              overflow: "hidden",
              padding: 12,
            }}
          >
            <SenegalMap highlightAll>
              {REGION_POINTS.map((p) => {
                const { x, y } = geoToSvg(p.lng, p.lat);
                return (
                  <g key={p.id} transform={`translate(${x} ${y})`}>
                    <title>{p.name}</title>
                    <circle r={12} fill="var(--brand)" stroke="#fff" strokeWidth={3.5} />
                    <circle r={4} fill="#fff" />
                  </g>
                );
              })}
            </SenegalMap>
          </div>

          {/* Liste des régions */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignContent: "center" }}>
            {org.regions.map((r) => (
              <span
                key={r}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: "var(--r-pill)",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink-700)",
                }}
              >
                <Icon name="pin" size={15} style={{ color: "var(--brand)" }} />
                {r}
              </span>
            ))}
            <div style={{ width: "100%", marginTop: 8 }}>
              <Button href="/qui-sommes-nous/organisation" variant="outline" iconRight="arrowR">
                Organisation & réseau national
              </Button>
            </div>
          </div>
        </div>
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
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
            {org.partners.map((p) => (
              <div key={p} className="ph" data-label={p} style={{ height: 78, borderRadius: "var(--r-md)" }} />
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
