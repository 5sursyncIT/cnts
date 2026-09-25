import { redirect } from "next/navigation";

import { getCurrentPatient } from "@/lib/auth/current-user";
import { Button, Card, StatusPill, Bar, Stat, SectionTitle, Logo } from "@/components/cnts/primitives";
import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { donor, history, badges } from "@/components/cnts/data";

export const metadata = {
  title: "Espace donneur — CNTS Sénégal",
  description:
    "Votre espace donneur CNTS : carte de donneur digitale, historique des dons, badges et prise de rendez-vous.",
};

type Donor = typeof donor;

function DigitalCard({ donor }: { donor: Donor }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        background: "linear-gradient(150deg, var(--red-900), var(--red-700))",
        color: "#fff",
        padding: 24,
        boxShadow: "var(--sh-lg)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.6,
          backgroundImage: "radial-gradient(circle at 90% 0%, rgba(255,255,255,.16), transparent 45%)",
        }}
      />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
          <div>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--red-200)",
                fontWeight: 700,
              }}
            >
              Carte de donneur
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 2 }}>CNTS Sénégal</div>
          </div>
          <Logo size={30} light showText={false} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,.16)",
              border: "1px solid rgba(255,255,255,.25)",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "var(--font-serif)",
            }}
          >
            {donor.bloodType}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="font-serif" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.15, marginBottom: 3 }}>
              {donor.name}
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.7)" }}>Donneur depuis {donor.since}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.1em", color: "rgba(255,255,255,.6)", textTransform: "uppercase" }}>
              N° donneur
            </div>
            <div className="font-mono" style={{ fontSize: 14, letterSpacing: "0.04em", marginTop: 3 }}>
              {donor.donorId}
            </div>
          </div>
          <div style={{ width: 60, height: 60, borderRadius: 10, background: "#fff", padding: 6 }}>
            <Icon name="qr" size={48} fill="current" stroke={0} style={{ color: "var(--red-900)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DonorSpaceScreen() {
  const nextIn = Math.max(
    0,
    Math.round((new Date(donor.nextEligible).getTime() - new Date("2026-06-02").getTime()) / 86400000)
  );
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
      <SectionTitle kicker={`Bonjour ${donor.name.split(" ")[0]}`} title="Mon espace donneur" />

      <div
        className="donor-grid"
        style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 26, alignItems: "start" }}
      >
        {/* LEFT: card + status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 90 }}>
          <DigitalCard donor={donor} />
          <Card pad={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: nextIn === 0 ? "var(--ok-bg)" : "var(--surface-3)",
                  color: nextIn === 0 ? "var(--ok)" : "var(--brand)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="clock" size={20} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-600)" }}>Prochain don possible</div>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                  {nextIn === 0 ? "Vous pouvez donner !" : `Dans ${nextIn} jours`}
                </div>
              </div>
            </div>
            <Button
              full
              variant={nextIn === 0 ? "primary" : "outline"}
              icon="calendarCheck"
              href="/espace-patient/rendez-vous"
            >
              Prendre rendez-vous
            </Button>
          </Card>
        </div>

        {/* RIGHT: impact + gamification + history + badges */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Impact stats */}
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <Card pad={20}>
              <Stat value={donor.totalDonations} label="Dons effectués" icon="drop" accent />
            </Card>
            <Card pad={20}>
              <Stat value={`~${donor.livesImpacted}`} label="Vies potentiellement aidées" icon="heart" accent />
            </Card>
            <Card pad={20}>
              <Stat value={donor.bloodType} label="Donneur universel" sub="Groupe O négatif" icon="globe" accent />
            </Card>
          </div>

          {/* Gamification: progress to next tier */}
          <Card
            pad={24}
            style={{ background: "linear-gradient(135deg, var(--red-50), var(--surface))", borderColor: "var(--red-200)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--brand)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name="award" size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Niveau {donor.tier}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-600)" }}>
                    Plus qu’un don pour le badge «&nbsp;Sauveteur&nbsp;»
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "var(--brand)",
                }}
              >
                <Icon name="repeat" size={16} /> Série de {donor.streak} dons réguliers
              </div>
            </div>
            <Bar pct={(donor.totalDonations / donor.nextTierAt) * 100} h={10} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12.5,
                color: "var(--ink-600)",
                marginTop: 8,
              }}
            >
              <span>{donor.totalDonations} dons</span>
              <span>Objectif : {donor.nextTierAt} dons</span>
            </div>
          </Card>

          {/* History */}
          <Card pad={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Historique des dons</h3>
              <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{history.length} dons enregistrés</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "13px 0",
                    borderBottom: i < history.length - 1 ? "1px solid var(--line-soft)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="drop" size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                      {h.type} · {h.volume}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--ink-600)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {h.center}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-700)" }}>
                      {frDate(h.date, { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <StatusPill status="ok">{h.status}</StatusPill>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Badges */}
          <Card pad={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Mes badges</h3>
              <span style={{ fontSize: 13, color: "var(--ink-500)" }}>
                {earned}/{badges.length} obtenus
              </span>
            </div>
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {badges.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--line)",
                    background: b.earned ? "var(--surface)" : "var(--surface-2)",
                    opacity: b.earned ? 1 : 0.62,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      background: b.earned ? "var(--red-50)" : "var(--surface-3)",
                      color: b.earned ? "var(--brand)" : "var(--ink-400)",
                    }}
                  >
                    <Icon name={b.icon} size={21} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", gap: 5 }}>
                      {b.name} {b.earned && <Icon name="check" size={13} style={{ color: "var(--ok)" }} />}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function PatientAreaHome() {
  // Garde d’accès préservée : un patient authentifié est redirigé vers son
  // tableau de bord ; sinon on affiche l’espace donneur (design CNTS).
  const patient = await getCurrentPatient();
  if (patient) redirect("/espace-patient/tableau-de-bord");

  return <DonorSpaceScreen />;
}
