/* ============================================================
   CNTS — Public screens A: Accueil (Home) + Centres
   ============================================================ */

function UrgentTicker({ alerts, onGo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 16px",
      background: "var(--red-950)", color: "#fff", borderRadius: "var(--r-pill)",
      boxShadow: "var(--sh-md)", maxWidth: "100%" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5,
        fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap",
        color: "var(--red-200)" }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#fff",
          boxShadow: "0 0 0 0 rgba(255,255,255,.6)", animation: "cntsPulse 1.6s infinite" }} />
        Besoin urgent
      </span>
      <div style={{ display: "flex", gap: 8, overflow: "hidden", flex: 1 }}>
        {alerts.slice(0, 2).map((a, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5,
            whiteSpace: "nowrap" }}>
            <BloodTag type={a.type} size="sm" />
            <span style={{ color: "rgba(255,255,255,.85)" }}>{a.region} — {a.msg}</span>
          </span>
        ))}
      </div>
      <button onClick={onGo} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer",
        fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
        Voir tout <Icon name="chevR" size={15} />
      </button>
    </div>
  );
}

function Barometer({ stock, onBook }) {
  const crit = stock.filter(s => s.status === "crit").length;
  return (
    <Card pad={26} style={{ borderColor: "var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <div className="kicker" style={{ marginBottom: 7 }}>Baromètre national</div>
          <h3 className="font-serif" style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Réserves de sang en temps réel</h3>
        </div>
        <StatusPill status={crit ? "crit" : "ok"}>
          {crit ? `${crit} groupes critiques` : "Réserves stables"}
        </StatusPill>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10 }}>
        {stock.map((s) => {
          const pct = Math.max(8, Math.min(100, (s.days / 7) * 100));
          return (
            <div key={s.type} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              <BloodBag pct={pct} status={s.status} height={96} />
              <BloodTag type={s.type} size="sm" tone="soft" />
              <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600 }}>{s.days.toFixed(1)} j</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 18, fontSize: 12.5, color: "var(--ink-600)" }}>
          <Legend c="var(--brand)" t="Suffisant" />
          <Legend c="var(--warn)" t="En baisse" />
          <Legend c="var(--crit)" t="Critique" />
        </div>
        <Button size="sm" variant="primary" icon="drop" onClick={onBook}>Je donne mon sang</Button>
      </div>
    </Card>
  );
}
function Legend({ c, t }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{t}</span>;
}

function HomeScreen({ go }) {
  const { stock, alerts, centers, org, news } = window.CNTS;
  const reasons = [
    { icon: "users", t: "Un acte solidaire", d: "Un don bénévole, anonyme et gratuit qui renforce une chaîne de solidarité nationale." },
    { icon: "heart", t: "Sauver des vies", d: "Accidents, accouchements, maladies du sang… un don peut sauver jusqu'à 3 vies." },
    { icon: "clock", t: "Rapide et simple", d: "45 minutes de votre temps, de l'accueil à la collation. Un geste à l'impact immense." },
  ];
  return (
    <div>
      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg, var(--red-950) 0%, var(--red-800) 60%, var(--red-700) 100%)",
        color: "#fff", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.5,
          backgroundImage: "radial-gradient(circle at 88% 18%, rgba(255,255,255,.12), transparent 42%)" }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)",
          display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 48, alignItems: "center", position: "relative" }} className="hero-grid">
          <div>
            <div style={{ marginBottom: 22 }}>
              <UrgentTicker alerts={alerts} onGo={() => go("alertes")} />
            </div>
            <h1 className="font-serif" style={{ fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 500,
              lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: 18 }}>
              Donner son sang,<br /><span style={{ color: "var(--red-200)" }}>c'est sauver des vies.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.55, color: "rgba(255,255,255,.82)", maxWidth: 480, marginBottom: 30 }}>
              Votre geste simple et solidaire permet de soigner chaque année des milliers de patients au Sénégal.
              Rejoignez la communauté des donneurs.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button size="lg" variant="light" icon="drop" onClick={() => go("don")}>Je veux donner</Button>
              <Button size="lg" variant="ghost" iconRight="arrowR" onClick={() => go("patient")}><span style={{ color: "#fff" }}>Espace Patient</span></Button>
            </div>
          </div>
          <div className="ph hero-photo" data-label="Photo — don de sang"
            style={{ height: 420, borderRadius: "var(--r-xl)", border: "1px solid rgba(255,255,255,.18)" }} />
        </div>
      </section>

      {/* STAT BAND */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "30px var(--gutter)",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }} className="grid-4">
          {org.stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div className="font-serif" style={{ fontSize: 38, fontWeight: 600, color: "var(--brand)", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 13.5, color: "var(--ink-600)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BAROMETER + quick actions */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)",
        display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 26, alignItems: "start" }} className="two-col">
        <Barometer stock={stock} onBook={() => go("rdv")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card pad={22} hover onClick={() => go("eligibilite")}>
            <QuickRow icon="check" title="Vérifier mon éligibilité" sub="2 minutes · questionnaire confidentiel" />
          </Card>
          <Card pad={22} hover onClick={() => go("collectes")}>
            <QuickRow icon="pin" title="Trouver une collecte" sub={`${centers.length} lieux · centres & collectes mobiles`} />
          </Card>
          <Card pad={22} hover onClick={() => go("patient")}>
            <QuickRow icon="idcard" title="Espace Patient" sub="RDV · carte de donneur · historique" />
          </Card>
          <Card pad={22} style={{ background: "var(--red-50)", borderColor: "var(--red-200)" }} hover onClick={() => go("alertes")}>
            <QuickRow icon="bell" title="Alertes par groupe sanguin" accent sub="Soyez prévenu en cas de pénurie" />
          </Card>
        </div>
      </section>

      {/* POURQUOI DONNER */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
          <SectionTitle kicker="Pourquoi donner son sang ?" title="Un engagement vital pour le Sénégal"
            sub="Les besoins en produits sanguins sont constants. Votre engagement répond aux urgences et aux maladies chroniques." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }} className="grid-3">
            {reasons.map((s, i) => (
              <Card key={i} pad={26}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--red-50)", color: "var(--brand)", display: "grid", placeItems: "center", marginBottom: 16 }}>
                  <Icon name={s.icon} size={23} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 7 }}>{s.t}</h3>
                <p style={{ color: "var(--ink-600)", fontSize: 14.5, lineHeight: 1.5 }}>{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BIEN PLUS QU'UNE BANQUE DE SANG */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }} className="two-col">
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Le CNTS</div>
            <h2 className="font-serif" style={{ fontSize: "clamp(24px,3vw,33px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}>
              Bien plus qu'une banque de sang</h2>
            <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.6, marginBottom: 20 }}>
              Outre la collecte et la distribution, le CNTS est un centre d'expertise médicale et biologique de référence.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
              {org.missions.map((m) => (
                <div key={m.t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Icon name="check" size={18} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 14, color: "var(--ink-700)", fontWeight: 600 }}>{m.t}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" iconRight="arrowR" onClick={() => go("services")}>Découvrir nos services</Button>
          </div>
          <div className="ph" data-label="Photo — laboratoire CNTS" style={{ height: 340, borderRadius: "var(--r-lg)" }} />
        </div>
      </section>

      {/* ACTUALITES */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
          <SectionTitle kicker="Actualités & événements" title="La vie du CNTS"
            action={<Button variant="outline" size="sm" iconRight="arrowR" onClick={() => go("actualites")}>Voir tout</Button>} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="grid-3">
            {news.slice(0, 3).map((n, i) => (
              <Card key={i} pad={0} hover style={{ overflow: "hidden" }} onClick={() => go("actualites")}>
                <div className="ph" data-label="Photo" style={{ height: 150 }} />
                <div style={{ padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand)" }}>{n.cat}</span>
                    <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{frDate(n.date, { day: "numeric", month: "short" })}</span>
                  </div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.25 }}>{n.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section style={{ background: "var(--red-900)", color: "#fff" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 560 }}>
            <div className="kicker" style={{ color: "var(--red-200)", marginBottom: 10 }}>Prêt à sauver des vies ?</div>
            <h2 className="font-serif" style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.12 }}>
              Prenez rendez-vous dans l'un de nos centres ou lors d'une collecte mobile.
            </h2>
          </div>
          <Button size="lg" variant="light" icon="calendarCheck" onClick={() => go("rdv")}>Prendre rendez-vous</Button>
        </div>
      </section>
    </div>
  );
}

function QuickRow({ icon, title, sub, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: accent ? "var(--brand)" : "var(--surface-3)", color: accent ? "#fff" : "var(--brand)",
        display: "grid", placeItems: "center" }}>
        <Icon name={icon} size={21} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 2 }}>{sub}</div>
      </div>
      <Icon name="chevR" size={18} style={{ color: "var(--ink-400)" }} />
    </div>
  );
}

function CenterCard({ c, onBook }) {
  return (
    <Card pad={20} hover>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700,
          padding: "4px 10px", borderRadius: "var(--r-pill)", textTransform: "uppercase", letterSpacing: "0.06em",
          background: c.type === "mobile" ? "var(--info-bg)" : "var(--surface-3)",
          color: c.type === "mobile" ? "var(--info)" : "var(--ink-600)" }}>
          <Icon name={c.type === "mobile" ? "map" : "building"} size={13} />
          {c.type === "mobile" ? "Collecte mobile" : "Centre fixe"}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600 }}>{c.dist} km</span>
      </div>
      <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 5 }}>{c.name}</h3>
      <div style={{ fontSize: 13.5, color: "var(--ink-600)", display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <Icon name="pin" size={14} style={{ color: "var(--ink-400)" }} />{c.area}</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-600)", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <Icon name="clock" size={14} style={{ color: "var(--ink-400)" }} />{c.hours}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
        <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 700 }}>{c.slots} créneaux libres</span>
        <Button size="sm" variant="outline" onClick={onBook}>Réserver</Button>
      </div>
    </Card>
  );
}

function CentersScreen({ go }) {
  const { centers } = window.CNTS;
  const [filter, setFilter] = useState("tous");
  const [active, setActive] = useState(centers[0].id);
  const list = centers.filter(c => filter === "tous" ? true : c.type === filter);
  const filters = [["tous", "Tous"], ["fixe", "Centres fixes"], ["mobile", "Collectes mobiles"]];
  return (
    <div>
    <PageBanner kicker="Collectes & centres" title="Où donner son sang ?"
      sub="Centres fixes et collectes mobiles à travers le Sénégal. Sélectionnez un lieu pour voir les créneaux et réserver." />
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {filters.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: "9px 18px", borderRadius: "var(--r-pill)", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            border: "1px solid " + (filter === k ? "var(--brand)" : "var(--line-strong)"),
            background: filter === k ? "var(--brand)" : "var(--surface)",
            color: filter === k ? "#fff" : "var(--ink-700)", transition: "all .15s" }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 24, alignItems: "start" }} className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {list.map((c) => (
            <Card key={c.id} pad={18} hover onClick={() => setActive(c.id)}
              style={{ borderColor: active === c.id ? "var(--brand)" : "var(--line)",
                boxShadow: active === c.id ? "var(--ring)" : "var(--sh-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, lineHeight: 1.25 }}>{c.name}</h3>
                  <div style={{ fontSize: 13, color: "var(--ink-600)", marginBottom: 2 }}>{c.area}, {c.city}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-600)" }}>{c.hours}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)" }}>{c.dist} km</div>
                  <div style={{ fontSize: 12.5, color: "var(--ok)", fontWeight: 700, marginTop: 6 }}>{c.slots} créneaux</div>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <Button size="sm" variant="primary" icon="calendarCheck" onClick={() => go("rdv")}>Réserver</Button>
                <Button size="sm" variant="ghost" icon="phone">Appeler</Button>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ position: "sticky", top: 90 }}>
          <div className="ph" data-label="Carte interactive — Sénégal"
            style={{ height: 520, borderRadius: "var(--r-lg)", border: "1px solid var(--line)" }}>
            <div style={{ position: "absolute", inset: 0 }}>
              {centers.map((c, i) => {
                const x = 18 + ((c.lng + 17.8) / 1.6) * 64;
                const y = 70 - ((c.lat - 14.3) / 2.2) * 52;
                const on = active === c.id;
                return (
                  <button key={c.id} onClick={() => setActive(c.id)} title={c.name} style={{
                    position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-100%)",
                    background: "none", border: "none", cursor: "pointer", color: on ? "var(--brand)" : "var(--red-900)" }}>
                    <Icon name="pin" size={on ? 34 : 24} fill="current" stroke={0} style={{
                      filter: "drop-shadow(0 2px 3px rgba(0,0,0,.25))", transition: "all .2s" }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, CentersScreen, CenterCard });
