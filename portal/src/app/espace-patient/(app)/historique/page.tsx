import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { Button, Card, SectionTitle } from "@/components/cnts/primitives";
import { patientGet, type DonPatient } from "@/lib/backend";
import { typeDonLabel } from "@/lib/donneur";

export const metadata = { title: "Mes dons — Espace patient" };

export default async function DonationHistoryPage() {
  const dons = await patientGet<DonPatient[]>("/api/me/dons");
  const liste = dons ?? [];
  const parAnnee = liste.reduce<Record<string, DonPatient[]>>((acc, d) => {
    (acc[d.date_don.slice(0, 4)] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionTitle
        kicker="Historique"
        title="Mes dons"
        sub="Chaque don enregistré au CNTS. Les résultats d'analyses ne sont jamais affichés en ligne : ils vous sont communiqués par le centre."
      />

      {dons === null && (
        <div className="cn-alert warn" role="status">
          <Icon name="alert" size={18} />
          Votre historique ne peut pas être chargé pour le moment.
        </div>
      )}

      {dons !== null && liste.length === 0 && (
        <Card pad={28} style={{ textAlign: "center", display: "grid", gap: 12, justifyItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--tint)", color: "var(--brand)", display: "grid", placeItems: "center" }}>
            <Icon name="drop" size={26} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Aucun don enregistré pour le moment</h3>
          <p style={{ color: "var(--ink-600)", maxWidth: 420 }}>Vos dons apparaîtront ici après leur enregistrement par le centre.</p>
          <Button icon="calendarCheck" href="/espace-patient/rendez-vous">
            Prendre rendez-vous
          </Button>
        </Card>
      )}

      {Object.entries(parAnnee)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([annee, items]) => (
          <div key={annee}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 500 }}>
                {annee}
              </h3>
              <span style={{ fontSize: 13.5, color: "var(--ink-500)" }}>
                {items.length} don{items.length > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {items.map((d) => (
                <Card key={d.id} pad={16}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name="drop" size={19} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{typeDonLabel(d.type_don)}</div>
                      <div style={{ fontSize: 13.5, color: "var(--ink-600)" }}>{frDate(d.date_don, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                    <Icon name="heart" size={18} style={{ color: "var(--brand)" }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
