import Link from "next/link";
import { Logo } from "@/components/cnts/primitives";
import { org } from "@/components/cnts/data";

const COLS: [string, [string, string][]][] = [
  [
    "Le CNTS",
    [
      ["Qui sommes-nous", "/qui-sommes-nous"],
      ["Organisation & réseau", "/qui-sommes-nous"],
      ["Recherche & innovation", "/recherche"],
      ["Collectes à venir", "/collectes"],
    ],
  ],
  [
    "Services & Don",
    [
      ["Donner son sang", "/donner-sang"],
      ["Qui peut donner ?", "/donner-sang/qui-peut-donner"],
      ["Parcours du donneur", "/donner-sang/parcours-donneur"],
      ["Produits sanguins", "/services/produits-sanguins"],
    ],
  ],
];

export function SiteFooter() {
  return (
    <footer style={{ background: "var(--night-900)", color: "rgba(255,255,255,.75)", marginTop: "auto" }}>
      <div
        className="footer-grid"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "var(--gutter)",
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1.1fr",
          gap: 32,
        }}
      >
        <div>
          <Logo size={40} light />
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 16, maxWidth: 300, color: "rgba(255,255,255,.6)" }}>
            Le Centre National de Transfusion Sanguine assure la disponibilité et la sécurité des produits sanguins pour
            tous les patients du Sénégal depuis plus de {org.years} ans.
          </p>
        </div>
        {COLS.map(([h, items]) => (
          <div key={h}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.5)",
                marginBottom: 14,
              }}
            >
              {h}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-start" }}>
              {items.map(([t, r]) => (
                <Link
                  key={t}
                  href={r}
                  style={{ fontSize: 13.5, color: "rgba(255,255,255,.75)", textDecoration: "none", fontFamily: "var(--font-sans)" }}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.5)",
              marginBottom: 14,
            }}
          >
            Contactez-nous
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13.5, color: "rgba(255,255,255,.75)" }}>
            <span>{org.address}</span>
            <span>{org.phone}</span>
            <span>{org.email}</span>
            <span>{org.bp}</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div
          style={{
            padding: "16px var(--gutter)",
            maxWidth: 1180,
            margin: "0 auto",
            fontSize: 12.5,
            color: "rgba(255,255,255,.45)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span>
            © {new Date().getFullYear()} Centre National de Transfusion Sanguine (CNTS) · {org.tutelle}
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/mentions-legales" style={{ color: "rgba(255,255,255,.45)", textDecoration: "none" }}>
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" style={{ color: "rgba(255,255,255,.45)", textDecoration: "none" }}>
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
