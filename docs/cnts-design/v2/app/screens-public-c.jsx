/* ============================================================
   CNTS — Public screens C: Espace donneur + Alertes
   ============================================================ */

function DigitalCard({ donor }) {
  return (
    <div style={{ position: "relative", borderRadius: "var(--r-lg)", overflow: "hidden",
      background: "linear-gradient(150deg, var(--red-900), var(--red-700))", color: "#fff",
      padding: 24, boxShadow: "var(--sh-lg)" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.6,
        backgroundImage: "radial-gradient(circle at 90% 0%, rgba(255,255,255,.16), transparent 45%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase",
              color: "var(--red-200)", fontWeight: 700 }}>Carte de donneur</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 2 }}>CNTS Sénégal</div>
          </div>
          <Logo size={30} light showText={false} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,.16)",
            border: "1px solid rgba(255,255,255,.25)", display: "grid", placeItems: "center",
            fontSize: 22, fontWeight: 800, fontFamily: "var(--font-serif)" }}>{donor.bloodType}</div>
          <div style={{ minWidth: 0 }}>
            <div className="font-serif" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.15, marginBottom: 3 }}>{donor.name}</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.7)" }}>Donneur depuis {donor.since}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.1em", color: "rgba(255,255,255,.6)", textTransform: "uppercase" }}>N° donneur</div>
            <div className="font-mono" style={{ fontSize: 14, letterSpacing: "0.04em", marginTop: 3 }}>{donor.donorId}</div>
          </div>
          <div style={{ width: 60, height: 60, borderRadius: 10, background: "#fff", padding: 6 }}>
            <Icon name="qr" size={48} fill="current" stroke={0} style={{ color: "var(--red-900)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DonorSpaceScreen({ go }) {
  const { donor, history, badges } = window.CNTS;
  const nextIn = Math.max(0, Math.round((new Date(donor.nextEligible) - new Date("2026-06-02")) / 86400000));
  const earned = badges.filter(b => b.earned).length;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
      <SectionTitle kicker={`Bonjour ${donor.name.split(" ")[0]}`} title="Mon espace donneur" />

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 26, alignItems: "start" }} className="donor-grid">
        {/* LEFT: card + status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 90 }}>
          <DigitalCard donor={donor} />
          <Card pad={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: nextIn === 0 ? "var(--ok-bg)" : "var(--surface-3)",
                color: nextIn === 0 ? "var(--ok)" : "var(--brand)", display: "grid", placeItems: "center" }}>
                <Icon name="clock" size={20} /></div>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-600)" }}>Prochain don possible</div>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                  {nextIn === 0 ? "Vous pouvez donner !" : `Dans ${nextIn} jours`}</div>
              </div>
            </div>
            <Button full variant={nextIn === 0 ? "primary" : "outline"} icon="calendarCheck"
              onClick={() => go("rdv")}>Prendre rendez-vous</Button>
          </Card>
        </div>

        {/* RIGHT: impact + gamification + history + badges */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Impact stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="grid-3">
            <Card pad={20}><Stat value={donor.totalDonations} label="Dons effectués" icon="drop" accent /></Card>
            <Card pad={20}><Stat value={`~${donor.livesImpacted}`} label="Vies potentiellement aidées" icon="heart" accent /></Card>
            <Card pad={20}><Stat value={donor.bloodType} label="Donneur universel" sub="Groupe O négatif" icon="globe" accent /></Card>
          </div>

          {/* Gamification: progress to next tier */}
          <Card pad={24} style={{ background: "linear-gradient(135deg, var(--red-50), var(--surface))", borderColor: "var(--red-200)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--brand)", color: "#fff",
                  display: "grid", placeItems: "center" }}><Icon name="award" size={22} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Niveau {donor.tier}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-600)" }}>Plus qu'un don pour le badge « Sauveteur »</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--brand)" }}>
                <Icon name="repeat" size={16} /> Série de {donor.streak} dons réguliers</div>
            </div>
            <Bar pct={(donor.totalDonations / donor.nextTierAt) * 100} h={10} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-600)", marginTop: 8 }}>
              <span>{donor.totalDonations} dons</span><span>Objectif : {donor.nextTierAt} dons</span>
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
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0",
                  borderBottom: i < history.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--red-50)", color: "var(--brand)",
                    display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="drop" size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{h.type} · {h.volume}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-600)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.center}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-700)" }}>{frDate(h.date, { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div style={{ marginTop: 4 }}><StatusPill status="ok">{h.status}</StatusPill></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Badges */}
          <Card pad={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Mes badges</h3>
              <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{earned}/{badges.length} obtenus</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="grid-3">
              {badges.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14,
                  borderRadius: "var(--r-md)", border: "1px solid var(--line)",
                  background: b.earned ? "var(--surface)" : "var(--surface-2)", opacity: b.earned ? 1 : 0.62 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, display: "grid", placeItems: "center",
                    background: b.earned ? "var(--red-50)" : "var(--surface-3)",
                    color: b.earned ? "var(--brand)" : "var(--ink-400)" }}><Icon name={b.icon} size={21} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", gap: 5 }}>
                      {b.name} {b.earned && <Icon name="check" size={13} style={{ color: "var(--ok)" }} />}</div>
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

/* ----------------------------- Alertes ----------------------------- */
function AlertsScreen({ go }) {
  const { stock, alerts, BLOOD } = window.CNTS;
  const [subs, setSubs] = useState(["O-"]);
  const toggle = (t) => setSubs(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "var(--gutter)" }}>
      <button onClick={() => go("accueil")} style={{ background: "none", border: "none", cursor: "pointer",
        color: "var(--ink-600)", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center",
        gap: 5, marginBottom: 18 }}><Icon name="chevL" size={16} />Accueil</button>
      <SectionTitle kicker="Mobilisation" title="Alertes pénurie & besoins urgents"
        sub="Activez les notifications pour vos groupes sanguins et soyez alerté par SMS dès qu'un besoin urgent survient près de vous." />

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, alignItems: "start" }} className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {alerts.map((a, i) => (
            <Card key={i} pad={20} style={{ borderLeft: `4px solid ${a.level === "crit" ? "var(--crit)" : "var(--warn)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <BloodTag type={a.type} size="lg" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 15.5 }}>{a.region}</span>
                    <StatusPill status={a.level}>{a.level === "crit" ? "Critique" : "En baisse"}</StatusPill>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--ink-600)" }}>{a.msg}</div>
                </div>
                <Button size="sm" variant="primary" icon="drop" onClick={() => go("rdv")}>Je donne</Button>
              </div>
            </Card>
          ))}
        </div>

        <Card pad={24}>
          <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 4 }}>Mes notifications</h3>
          <p style={{ fontSize: 13.5, color: "var(--ink-600)", marginBottom: 18 }}>Sélectionnez les groupes à suivre.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            {BLOOD.map((t) => {
              const on = subs.includes(t);
              const st = stock.find(s => s.type === t);
              return (
                <button key={t} onClick={() => toggle(t)} style={{ position: "relative", padding: "14px 4px",
                  borderRadius: "var(--r-md)", cursor: "pointer", transition: "all .15s",
                  border: "1.5px solid " + (on ? "var(--brand)" : "var(--line)"),
                  background: on ? "var(--brand)" : "var(--surface)", color: on ? "#fff" : "var(--ink-800)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{t}</span>
                  <span style={{ width: 7, height: 7, borderRadius: 999,
                    background: on ? "#fff" : window.CNTS.statusColor[st.status] }} />
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            background: "var(--surface-2)", borderRadius: "var(--r-md)", marginBottom: 16 }}>
            <Icon name="phone" size={18} style={{ color: "var(--ink-500)" }} />
            <span style={{ fontSize: 13.5, color: "var(--ink-700)", flex: 1 }}>+221 77 ••• •• 12</span>
            <StatusPill status="ok">Vérifié</StatusPill>
          </div>
          <Button full variant="primary" icon="bell">Activer les alertes ({subs.length})</Button>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { DonorSpaceScreen, AlertsScreen, DigitalCard });
