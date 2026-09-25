import { Button, Card, PageBanner } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { periodicite } from "@/components/cnts/data";

export const metadata = {
  title: "Périodicité du don — CNTS Sénégal",
  description:
    "Fréquence des dons de sang au CNTS : intervalles à respecter entre les dons pour les hommes et les femmes, et nombre de dons par an.",
};

const profils = [
  {
    sexe: "Hommes",
    delai: periodicite.hommes.delai,
    parAn: periodicite.hommes.parAn,
    tint: "var(--info-bg)",
    ink: "var(--info)",
  },
  {
    sexe: "Femmes",
    delai: periodicite.femmes.delai,
    parAn: periodicite.femmes.parAn,
    tint: "var(--red-50)",
    ink: "var(--brand)",
  },
];

function ProfilRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "11px 14px",
        background: "var(--surface-1)",
        borderRadius: "var(--r-sm)",
      }}
    >
      <span style={{ color: "var(--ink-600)", fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: 14.5 }}>{value}</span>
    </div>
  );
}

export default function PeriodicitePage() {
  return (
    <div>
      <PageBanner
        kicker="Don de sang"
        title="Périodicité du don"
        sub="Combien de fois peut-on donner son sang par an ? Quels intervalles respecter entre chaque don ?"
      />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
        {/* Résumé Hommes / Femmes */}
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          {profils.map((p) => (
            <Card key={p.sexe} pad={26}>
              <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: p.tint,
                    color: p.ink,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name="user" size={23} />
                </div>
                <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {p.sexe}
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <ProfilRow label="Intervalle minimum" value={p.delai} />
                <ProfilRow label="Dons par an" value={p.parAn} />
              </div>
            </Card>
          ))}
        </div>

        {/* Pourquoi ces intervalles */}
        <Card pad={28} style={{ marginTop: 22, background: "var(--red-50)", borderColor: "var(--red-200)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                background: "var(--surface)",
                color: "var(--brand)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="clock" size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 7 }}>Pourquoi un délai ?</h3>
              <p style={{ color: "var(--ink-700)", fontSize: 15, lineHeight: 1.6 }}>
                {periodicite.pourquoi} {periodicite.note}
              </p>
              <div
                role="note"
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 14px",
                  background: "var(--warn-bg)",
                  color: "var(--ink-800)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14.5,
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                <Icon name="alert" size={18} style={{ color: "var(--warn)", marginTop: 1 }} />
                {periodicite.attention}
              </div>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <Card
          pad={28}
          style={{
            marginTop: 44,
            background: "var(--red-900)",
            borderColor: "var(--red-900)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>
              Prêt à planifier votre prochain don ?
            </h3>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 15, marginTop: 4 }}>
              Prenez rendez-vous ou consultez nos conseils au donneur.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="light" icon="calendarCheck" href="/espace-patient">
              Prendre rendez-vous
            </Button>
            <Button variant="ghost" iconRight="arrowR" href="/donner-sang/conseils" style={{ color: "#fff" }}>
              Conseils au donneur
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
