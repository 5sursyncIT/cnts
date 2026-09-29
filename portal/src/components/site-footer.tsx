import Link from "next/link";
import { Logo } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { org } from "@/components/cnts/data";

const COLS: [string, [string, string][]][] = [
  [
    "Le CNTS",
    [
      ["Qui sommes-nous", "/qui-sommes-nous"],
      ["Organisation & réseau", "/qui-sommes-nous/organisation"],
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

const HEADING = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "var(--brand)",
  marginBottom: 16,
} as const;

export function SiteFooter() {
  return (
    <footer style={{ padding: "0 var(--gutter) var(--gutter)", marginTop: "auto" }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          borderRadius: "var(--r-xl)",
          background: "var(--surface-2)",
          color: "var(--ink-700)",
          overflow: "hidden",
        }}
      >
        <div
          className="footer-grid"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "56px var(--gutter) 40px",
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1.1fr",
            gap: 32,
          }}
        >
          <div>
            <Logo size={42} />
            <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 18, maxWidth: 300 }}>
              Le Centre National de Transfusion Sanguine assure la disponibilité et la sécurité des produits sanguins pour
              tous les patients du Sénégal depuis plus de {org.years} ans.
            </p>
          </div>
          {COLS.map(([h, items]) => (
            <div key={h}>
              <div style={HEADING}>{h}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                {items.map(([t, r]) => (
                  <Link key={t} href={r} className="foot-link">
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <div style={HEADING}>Contactez-nous</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
              <span>{org.address}</span>
              <span>{org.phone}</span>
              <span>{org.email}</span>
              <span>{org.bp}</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--line)" }}>
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "16px var(--gutter)",
              fontSize: 12.5,
              color: "var(--ink-600)",
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
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/mentions-legales" className="foot-link" style={{ fontSize: 12.5 }}>
                Mentions légales
              </Link>
              <Link href="/politique-confidentialite" className="foot-link" style={{ fontSize: 12.5 }}>
                Confidentialité
              </Link>
              {/* Back Office (application séparée, servie sous /admin) */}
              <a href="/admin" className="cn-btn outline sm">
                <Icon name="building" size={14} />
                Espace professionnel
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
