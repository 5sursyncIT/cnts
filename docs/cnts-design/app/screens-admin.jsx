/* ============================================================
   CNTS — Espace Pro: Tableau de bord administrateur
   ============================================================ */

function MiniBars({ data, color = "var(--brand)" }) {
  const max = Math.max(...data);
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div title={v} style={{ width: "100%", height: `${(v / max) * 100}%`, borderRadius: "5px 5px 0 0",
              background: i === data.length - 1 ? color : "color-mix(in oklab, " + color + " 35%, white)",
              transition: "height .5s ease" }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600 }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function KPI({ icon, value, label, sub, status }) {
  return (
    <Card pad={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--surface-3)", color: "var(--brand)",
          display: "grid", placeItems: "center" }}><Icon name={icon} size={20} /></div>
        {sub && <span style={{ fontSize: 12, fontWeight: 700, color: status === "up" ? "var(--ok)" : "var(--ink-500)",
          display: "inline-flex", alignItems: "center", gap: 3 }}>
          {status === "up" && <Icon name="trend" size={13} />}{sub}</span>}
      </div>
      <div className="font-serif" style={{ fontSize: 32, fontWeight: 600, marginTop: 14, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-600)", fontWeight: 600 }}>{label}</div>
    </Card>
  );
}

function AdminScreen() {
  const { admin, stock, alerts, statusLabel } = window.CNTS;
  const pct = Math.round((admin.donationsToday / admin.donationsTarget) * 100);

  return (
    <div style={{ padding: "28px var(--gutter)", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="kicker">Espace professionnel · Vue nationale</div>
          <h1 className="font-serif" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6 }}>
            Tableau de bord</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" size="sm" icon="filter">Filtrer</Button>
          <Button variant="primary" size="sm" icon="plus">Enregistrer un don</Button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }} className="grid-4">
        <KPI icon="drop" value={admin.donationsToday} label="Dons aujourd'hui" sub={`${pct}% objectif`} status="up" />
        <KPI icon="user" value={admin.newDonors} label="Nouveaux donneurs" sub="+12%" status="up" />
        <KPI icon="flask" value={admin.pendingTests} label="Analyses en attente" />
        <KPI icon="alert" value={admin.expiringSoon} label="Poches expirant (48h)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }} className="two-col">
        {/* Stock table */}
        <Card pad={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Réserves par groupe sanguin</h3>
            <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>Mise à jour il y a 4 min</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 96px", gap: 12,
              fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-500)",
              fontWeight: 700, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
              <span>Groupe</span><span>Niveau de réserve</span><span style={{ textAlign: "right" }}>Poches</span><span style={{ textAlign: "right" }}>Statut</span>
            </div>
            {stock.map((s) => (
              <div key={s.type} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 96px", gap: 12,
                alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <BloodTag type={s.type} size="sm" tone="soft" />
                <div>
                  <Bar pct={(s.days / 7) * 100} color={window.CNTS.statusColor[s.status]} h={7} />
                  <span style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 4, display: "block" }}>{s.days.toFixed(1)} jours de réserve</span>
                </div>
                <span style={{ textAlign: "right", fontWeight: 700, fontSize: 14.5 }}>{s.units}</span>
                <span style={{ textAlign: "right" }}><StatusPill status={s.status}>{statusLabel[s.status]}</StatusPill></span>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly + alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card pad={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Collectes — 7 jours</h3>
              <span className="font-serif" style={{ fontSize: 22, fontWeight: 600 }}>561</span>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 16 }}>poches collectées cette semaine</p>
            <MiniBars data={admin.weeklyCollections} />
          </Card>
          <Card pad={24} style={{ background: "var(--crit-bg)", borderColor: "var(--crit)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon name="alert" size={19} style={{ color: "var(--crit)" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--crit)" }}>Alertes actives ({alerts.length})</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)",
                  padding: "10px 12px", borderRadius: "var(--r-sm)" }}>
                  <BloodTag type={a.type} size="sm" />
                  <span style={{ fontSize: 13, color: "var(--ink-700)", flex: 1 }}>{a.region} — {a.msg}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }} className="two-col">
        {/* Region stock */}
        <Card pad={24}>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>Couverture par région</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {admin.regionStock.map((r) => {
              const st = r.pct < 40 ? "crit" : r.pct < 60 ? "warn" : "ok";
              return (
                <div key={r.region}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{r.region}</span>
                    <span style={{ fontWeight: 700, color: window.CNTS.statusColor[st] }}>{r.pct}%</span>
                  </div>
                  <Bar pct={r.pct} color={window.CNTS.statusColor[st]} h={8} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Activity feed */}
        <Card pad={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Activité récente</h3>
            <span style={{ fontSize: 12.5, color: "var(--ink-500)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--ok)" }} /> En direct</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {admin.activity.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0",
                borderBottom: i < admin.activity.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
                <span className="font-mono" style={{ fontSize: 12.5, color: "var(--ink-500)", width: 42, flexShrink: 0, paddingTop: 2 }}>{a.time}</span>
                <span style={{ width: 9, height: 9, borderRadius: 999, flexShrink: 0, marginTop: 5,
                  background: window.CNTS.statusColor[a.kind] || "var(--info)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-800)" }}>{a.text}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>{a.who}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { AdminScreen });
