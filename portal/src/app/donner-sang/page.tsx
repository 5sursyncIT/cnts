import { Button, Card, PageBanner, SectionTitle, StatusPill } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { donConditions, parcours } from "@/components/cnts/data";

export const metadata = {
  title: "Don de sang — CNTS Sénégal",
  description:
    "Donner son sang, c’est sauver des vies. Conditions du don, parcours du donneur et prise de rendez-vous au CNTS Sénégal.",
};

function MaxWrap({ children, w = 1180 }: { children: React.ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

export default function DonDeSangPage() {
  return (
    <div>
      <PageBanner
        kicker="Don de sang"
        title="Donner son sang, c’est sauver des vies."
        sub="Un geste simple, encadré et sûr. Le don ne prend que 45 minutes de votre temps et peut sauver jusqu’à 3 vies."
      />

      {/* Qui peut donner */}
      <MaxWrap>
        <SectionTitle kicker="Qui peut donner ?" title="Les conditions du don" />
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card pad={26}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--ok-bg)",
                  color: "var(--ok)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="check" size={20} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Vous pouvez donner si…</h3>
            </div>
            {donConditions.ok.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 11,
                  padding: "10px 0",
                  borderBottom: i < donConditions.ok.length - 1 ? "1px solid var(--line-soft)" : "none",
                  fontSize: 14.5,
                  color: "var(--ink-700)",
                }}
              >
                <Icon name="check" size={18} style={{ color: "var(--ok)", flexShrink: 0, marginTop: 1 }} />
                {c}
              </div>
            ))}
          </Card>
          <Card pad={26}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--warn-bg)",
                  color: "var(--warn)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="clock" size={20} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Don à reporter en cas de…</h3>
            </div>
            {donConditions.wait.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 11,
                  padding: "10px 0",
                  borderBottom: i < donConditions.wait.length - 1 ? "1px solid var(--line-soft)" : "none",
                  fontSize: 14.5,
                  color: "var(--ink-700)",
                }}
              >
                <Icon name="info" size={18} style={{ color: "var(--warn)", flexShrink: 0, marginTop: 1 }} />
                {c}
              </div>
            ))}
          </Card>
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button variant="primary" icon="check" href="/donner-sang/qui-peut-donner">
            Vérifier mon éligibilité
          </Button>
          <Button variant="outline" icon="calendarCheck" href="/espace-patient/rendez-vous">
            Prendre rendez-vous
          </Button>
        </div>
      </MaxWrap>

      {/* Parcours du donneur */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Le parcours du donneur"
            title="Comment se déroule un don ?"
            sub="Quatre étapes, environ 45 minutes. Vous êtes accompagné à chaque instant par un personnel qualifié."
          />
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            {parcours.map((p, i) => (
              <Card key={i} pad={22}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name={p.icon} size={22} />
                  </div>
                  <span className="font-serif" style={{ fontSize: 30, fontWeight: 500, color: "var(--red-200)" }}>
                    {i + 1}
                  </span>
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 5 }}>{p.t}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5, marginBottom: 10 }}>{p.d}</p>
                <StatusPill status="info">{p.min}</StatusPill>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      <section className="cta-band">
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "var(--gutter)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <h2
            className="font-serif"
            style={{
              fontSize: "clamp(24px,3vw,34px)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              maxWidth: 560,
              lineHeight: 1.12,
            }}
          >
            Prêt à sauver des vies ? Prenez rendez-vous dès aujourd’hui.
          </h2>
          <Button size="lg" variant="light" icon="calendarCheck" href="/espace-patient/rendez-vous">
            Prendre rendez-vous
          </Button>
        </div>
      </section>
    </div>
  );
}
