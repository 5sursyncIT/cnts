import Image from "next/image";
import type { ReactNode } from "react";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { ppcd, products, reseau } from "@/components/cnts/data";

export const metadata = {
  title: "Produits sanguins (PPCD) — CNTS Sénégal",
  description:
    "Prélèvement, production, conservation et distribution des produits sanguins labiles : la chaîne transfusionnelle du CNTS, du donneur au receveur.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

export default function ProduitsSanguinsPage() {
  return (
    <div>
      <PageBanner
        kicker="Services · PPCD"
        title="Prélèvement, Production, Conservation et Distribution du sang"
        sub="Garantir la qualité, la sécurité et la disponibilité des produits sanguins labiles sur tout le territoire."
      />

      {/* Chaîne PPCD */}
      <MaxWrap>
        <SectionTitle kicker="Le cœur technique du CNTS" title="Du donneur au receveur, une chaîne continue" sub={ppcd.intro} />
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {ppcd.etapes.map((e, i) => (
            <Card key={e.t} pad={22} style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name={e.icon} size={23} />
                </div>
                <span className="font-serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--ink-300)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 8 }}>{e.t}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>{e.d}</p>
            </Card>
          ))}
        </div>
      </MaxWrap>

      {/* Produits */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Produits sanguins labiles"
            title="Une utilisation thérapeutique ciblée"
            sub="Une fois qualifié, le sang total est séparé en ses différents composants, pour une utilisation adaptée à chaque patient et pathologie."
          />
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {products.map((p) => (
              <Card key={p.name} pad={24}>
                <div style={{ display: "flex", gap: 16 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 13,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={p.icon} size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 16.5, fontWeight: 700 }}>{p.name}</h3>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-500)", whiteSpace: "nowrap" }}>
                        Conservation · {p.life}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.5 }}>{p.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      {/* Conservation + distribution */}
      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Conservation
            </div>
            <h2
              className="font-serif"
              style={{ fontSize: "clamp(23px,2.8vw,30px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12 }}
            >
              À température contrôlée
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.6, marginBottom: 18 }}>
              Les produits sont conservés à température contrôlée pour préserver leur efficacité. Des systèmes automatisés
              garantissent la traçabilité et le respect des normes.
            </p>
            <Card pad={0} style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5 }}>
                <thead>
                  <tr style={{ background: "var(--surface-1)", textAlign: "left" }}>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--ink-700)" }}>Produit</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--ink-700)" }}>Température</th>
                  </tr>
                </thead>
                <tbody>
                  {ppcd.conservation.map((c) => (
                    <tr key={c.produit} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px 18px", color: "var(--ink-800)" }}>{c.produit}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 700, color: "var(--brand)", whiteSpace: "nowrap" }}>{c.temp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Distribution
            </div>
            <h2
              className="font-serif"
              style={{ fontSize: "clamp(23px,2.8vw,30px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12 }}
            >
              Une fourniture continue et sécurisée
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.6, marginBottom: 18 }}>
              Le CNTS assure la livraison quotidienne des produits sanguins labiles à Dakar et sur l’ensemble du territoire
              national. Les transports frigorifiques maintiennent la chaîne du froid jusqu’au patient. Destinataires :
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {ppcd.destinataires.map((d) => (
                <div key={d} style={{ display: "flex", gap: 10, fontSize: 14.5, color: "var(--ink-700)", alignItems: "flex-start" }}>
                  <Icon name="building" size={18} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>
      </MaxWrap>

      {/* Réseau */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <MaxWrap>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
            <div>
              <div className="kicker" style={{ marginBottom: 10 }}>
                Un réseau national
              </div>
              <h2
                className="font-serif"
                style={{ fontSize: "clamp(23px,2.8vw,30px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14 }}
              >
                Piloté depuis le CNTS à Dakar-Fann
              </h2>
              <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.65, marginBottom: 12 }}>
                Cette organisation en réseau garantit la traçabilité, la qualité et la disponibilité du sang à travers le pays.
              </p>
              <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.65, marginBottom: 20 }}>{reseau.expansion}</p>
              <Button href="/qui-sommes-nous/organisation" variant="outline" iconRight="arrowR">
                Découvrir le réseau
              </Button>
            </div>
            <div
              style={{ height: 340, borderRadius: "var(--r-lg)", position: "relative", overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface)" }}
            >
              <Image src={reseau.map} alt="Carte du réseau transfusionnel du CNTS" fill style={{ objectFit: "contain" }} />
            </div>
          </div>
        </MaxWrap>
      </section>
    </div>
  );
}
