/* CNTS v2 — Home screens (Solaire / Corail) */
const W = { maxWidth: 1180, margin: "0 auto", padding: "0 var(--gutter)" };

function AlertMarquee({ alerts, onGo, tone = "red" }) {
  const items = [...alerts, ...alerts, ...alerts, ...alerts];
  const red = tone === "red";
  return (
    <div onClick={onGo} style={{ cursor: "pointer", overflow: "hidden", background: red ? "var(--brand)" : "var(--surface)", color: red ? "#fff" : "var(--ink-800)", padding: "14px 0", borderRadius: red ? 0 : 999, boxShadow: red ? "none" : "var(--sh-sm)" }}>
      <div className="marquee" style={{ gap: 40 }}>
        {items.map((a, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap" }}>
            <span style={{ width: 8, height: 8, borderRadius: 9, background: red ? "#fff" : "var(--brand)", animation: red ? "cntsPulse 1.6s infinite" : "ring 1.6s infinite" }} />
            <b style={{ fontWeight: 800 }}>{a.type}</b><span style={{ opacity: .9 }}>{a.region} · {a.msg}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Baro({ stock, onBook, compact }) {
  const crit = stock.filter((s) => s.status === "crit").length;
  return (
    <Card pad={compact ? 22 : 28} style={{ height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <div className="kicker" style={{ marginBottom: 6 }}>Baromètre national</div>
          <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>Réserves en temps réel</h3>
        </div>
        <StatusPill status={crit ? "crit" : "ok"}>{crit ? `${crit} groupes critiques` : "Réserves stables"}</StatusPill>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0,1fr))", gap: 8 }} className="baro-grid">
        {stock.map((s, i) => (
          <div key={s.type} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: `rise .7s ${i * 0.06}s both` }}>
            <BloodBag pct={Math.max(8, Math.min(100, (s.days / 7) * 100))} status={s.status} height={compact ? 80 : 100} />
            <BloodTag type={s.type} size="sm" tone="soft" />
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600 }}>{s.days.toFixed(1)} j</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 22, paddingTop: 18, borderTop: "1px dashed var(--line-strong)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--ink-600)" }}>
          {[["var(--brand)", "Suffisant"], ["var(--warn)", "En baisse"], ["var(--crit)", "Critique"]].map(([c, t]) => <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 9, background: c }} />{t}</span>)}
        </div>
        <Button size="sm" icon="drop" onClick={onBook}>Je donne mon sang</Button>
      </div>
    </Card>
  );
}

function IconBubble({ icon, tone = "tint", size = 52 }) {
  const t = { tint: ["var(--tint)", "var(--brand)"], sun: ["var(--acc2-soft)", "var(--acc2-ink)"], red: ["var(--brand)", "#fff"] }[tone];
  return <div className="cn-ico" style={{ width: size, height: size, borderRadius: 999, background: t[0], color: t[1], display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={size * 0.44} /></div>;
}

const REASONS = [
  { icon: "users", t: "Un acte solidaire", d: "Un don bénévole, anonyme et gratuit qui renforce une chaîne de solidarité nationale." },
  { icon: "heart", t: "Sauver des vies", d: "Accidents, accouchements, maladies du sang… un don peut sauver jusqu'à 3 vies." },
  { icon: "clock", t: "Rapide et simple", d: "45 minutes de votre temps, de l'accueil à la collation. Un geste à l'impact immense." },
];

function Mission({ go, org, shape }) {
  return (
    <section style={{ ...W, paddingTop: 96, paddingBottom: 96 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }} className="two-col">
        <div style={{ position: "relative", height: 420 }}>
          <div className="blob" style={{ inset: "8% 4% 0 10%", background: "var(--acc2-soft)" }} />
          <div className="ph" data-label="Photo — laboratoire CNTS" style={{ position: "absolute", inset: "0 12% 8% 0", borderRadius: shape }} />
          <div className="floaty cn-card" style={{ position: "absolute", right: 0, bottom: 20, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--sh-md)" }}>
            <IconBubble icon="shield" size={40} /><div><div style={{ fontWeight: 800, fontSize: 15 }}>Chaque don testé</div><div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>Qualification biologique</div></div>
          </div>
        </div>
        <div>
          <div className="kicker" style={{ marginBottom: 12 }}>Le CNTS</div>
          <h2 className="font-serif" style={{ fontSize: "clamp(28px,3.4vw,42px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.08, marginBottom: 18 }}>Bien plus qu'une <span className="serif-it" style={{ color: "var(--brand)" }}>banque de sang</span></h2>
          <p style={{ color: "var(--ink-600)", fontSize: 16.5, lineHeight: 1.6, marginBottom: 26 }}>Outre la collecte et la distribution, le CNTS est un centre d'expertise médicale et biologique de référence.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            {org.missions.map((m) => <span key={m.t} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 14, fontWeight: 600, color: "var(--ink-800)" }}><Icon name={m.icon || "check"} size={16} style={{ color: "var(--brand)" }} />{m.t}</span>)}
          </div>
          <Button variant="outline" iconRight="arrowR" onClick={() => go("services")}>Découvrir nos services</Button>
        </div>
      </div>
    </section>
  );
}

function News({ go, news }) {
  return (
    <section style={{ ...W, paddingTop: 24, paddingBottom: 96 }}>
      <SectionTitle kicker="Actualités & événements" title="La vie du CNTS" action={<Button variant="outline" size="sm" iconRight="arrowR" onClick={() => go("actualites")}>Voir tout</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 22 }} className="grid-3">
        {news.slice(0, 3).map((n, i) => (
          <Card key={i} pad={10} hover onClick={() => go("actualites")}>
            <div className="ph" data-label="Photo" style={{ height: 180, borderRadius: "calc(var(--r-lg) - 6px)" }} />
            <div style={{ padding: "16px 10px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "var(--tint)", color: "var(--brand-strong)" }}>{n.cat}</span>
                <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{frDate(n.date, { day: "numeric", month: "short" })}</span>
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.3 }}>{n.title}</h3>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CTA({ go }) {
  return (
    <section style={{ padding: "0 var(--gutter) 72px" }}>
      <div style={{ position: "relative", overflow: "hidden", maxWidth: 1180, margin: "0 auto", borderRadius: "var(--r-xl)", background: "var(--brand)", color: "#fff", padding: "clamp(36px,6vw,72px)" }}>
        <div className="blob" style={{ width: 340, height: 340, right: -60, top: -140, background: "var(--red-700)" }} />
        <div className="blob" style={{ width: 180, height: 180, right: 200, bottom: -90, background: "var(--acc2)", opacity: .9, animationDelay: "-6s" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 580 }}>
            <div className="kicker" style={{ color: "#fff", opacity: .9, marginBottom: 12 }}>Prêt à sauver des vies ?</div>
            <h2 className="font-serif" style={{ fontSize: "clamp(28px, 3.6vw, 42px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Prenez rendez-vous dans l'un de nos centres ou lors d'une collecte mobile.</h2>
          </div>
          <Button size="lg" variant="light" icon="calendarCheck" onClick={() => go("rdv")}>Prendre rendez-vous</Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Direction A — Solaire ---------------- */
function HomeSolaire({ go }) {
  const { stock, alerts, centers, org, news } = window.CNTS;
  const quick = [
    ["check", "Vérifier mon éligibilité", "2 minutes · questionnaire confidentiel", "eligibilite", "tint"],
    ["pin", "Trouver une collecte", `${centers.length} lieux · centres & collectes mobiles`, "collectes", "sun"],
    ["idcard", "Espace Patient", "RDV · carte de donneur · historique", "patient", "tint"],
    ["bell", "Alertes par groupe sanguin", "Soyez prévenu en cas de pénurie", "alertes", "red"],
  ];
  return (
    <div>
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div className="blob" style={{ width: 520, height: 520, right: -140, top: -160, background: "var(--acc2-soft)" }} />
        <div style={{ ...W, paddingTop: 56, paddingBottom: 80, display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 48, alignItems: "center", position: "relative" }} className="hero-grid">
          <div className="stag">
            <div><button onClick={() => go("alertes")} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "7px 14px 7px 8px", borderRadius: 999, border: "1px solid var(--red-200)", background: "var(--surface)", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--ink-800)", marginBottom: 26, maxWidth: "100%", textAlign: "left" }}>
              <span className="ringpulse" style={{ padding: "3px 10px", borderRadius: 999, background: "var(--brand)", color: "#fff", fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Urgent</span>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`${alerts[0].type} · ${alerts[0].region} — ${alerts[0].msg}`}</span><Icon name="chevR" size={15} /></button></div>
            <h1 className="font-serif" style={{ fontSize: "clamp(40px, 6vw, 76px)", fontWeight: 500, lineHeight: 1.06, letterSpacing: "-0.035em", marginBottom: 22, textWrap: "balance" }}>
              Donner son sang,<br />c'est <span className="hl serif-it" style={{ color: "var(--brand)" }}>sauver des vies.</span></h1>
            <p style={{ fontSize: 18.5, lineHeight: 1.55, color: "var(--ink-700)", maxWidth: 480, marginBottom: 32 }}>Votre geste simple et solidaire permet de soigner chaque année des milliers de patients au Sénégal. Rejoignez la communauté des donneurs.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button size="lg" icon="drop" onClick={() => go("don")}>Je veux donner</Button>
              <Button size="lg" variant="outline" iconRight="arrowR" onClick={() => go("patient")}>Espace Patient</Button>
            </div>
          </div>
          <div className="hero-photo" style={{ position: "relative", height: 520, animation: "pop 1s .2s both" }}>
            <div className="ph" data-label="Photo — donneuse souriante" style={{ position: "absolute", inset: "0 0 0 8%", borderRadius: "999px 999px var(--r-xl) var(--r-xl)" }} />
            <div className="cn-card floaty" style={{ position: "absolute", left: 0, top: "18%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--sh-lg)" }}>
              <div className="beat" style={{ color: "var(--brand)" }}><Icon name="heart" size={30} fill="current" stroke={0} /></div>
              <div><div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>1 don</div><div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>jusqu'à 3 vies sauvées</div></div>
            </div>
            <div className="cn-card floaty" style={{ position: "absolute", right: -8, bottom: "12%", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--sh-lg)", animationDelay: "-2.5s" }}>
              <BloodTag type="O-" size="sm" /><div style={{ fontSize: 13, fontWeight: 700 }}>Donneur universel<div style={{ fontWeight: 500, color: "var(--ink-600)", fontSize: 12 }}>très recherché</div></div>
            </div>
          </div>
        </div>
      </section>
      <AlertMarquee alerts={alerts} onGo={() => go("alertes")} />
      <section style={{ ...W, paddingTop: 72, paddingBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16 }} className="grid-4">
          {org.stats.map((s, i) => (
            <div key={i} className="cn-card" style={{ padding: "26px 22px", borderRadius: 999, textAlign: "center", background: i % 2 ? "var(--surface)" : "var(--surface-2)", border: "none" }}>
              <div className="font-serif" style={{ fontSize: 44, fontWeight: 500, color: "var(--brand)", letterSpacing: "-0.03em", lineHeight: 1 }}><CountUp value={s.value} /></div>
              <div style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 600, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ ...W, paddingTop: 48, paddingBottom: 48, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "stretch" }} className="two-col">
        <Baro stock={stock} onBook={() => go("rdv")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {quick.map(([ic, t, s, r, tone]) => (
            <Card key={t} pad={18} hover onClick={() => go(r)}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <IconBubble icon={ic} tone={tone} size={48} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15.5 }}>{t}</div><div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 2 }}>{s}</div></div>
                <Icon name="arrowR" size={18} style={{ color: "var(--brand)" }} />
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section style={{ padding: "48px var(--gutter)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", borderRadius: "var(--r-xl)", background: "var(--surface-2)", padding: "clamp(36px,5vw,64px) var(--gutter)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <SectionTitle kicker="Pourquoi donner son sang ?" title="Un engagement vital pour le Sénégal" sub="Les besoins en produits sanguins sont constants. Votre engagement répond aux urgences et aux maladies chroniques." />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 20 }} className="grid-3">
              {REASONS.map((s, i) => (
                <Card key={i} pad={30} hover>
                  <IconBubble icon={s.icon} tone={i === 1 ? "red" : i === 2 ? "sun" : "tint"} size={58} />
                  <h3 style={{ fontSize: 19, fontWeight: 700, margin: "20px 0 8px" }}>{s.t}</h3>
                  <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.55 }}>{s.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Mission go={go} org={org} shape="var(--r-xl) 999px var(--r-xl) var(--r-xl)" />
      <News go={go} news={news} />
      <CTA go={go} />
    </div>
  );
}

/* ---------------- Direction B — Corail (bento) ---------------- */
function HomeCorail({ go }) {
  const { stock, alerts, centers, org, news } = window.CNTS;
  const tile = { borderRadius: "var(--r-xl)", position: "relative", overflow: "hidden" };
  return (
    <div>
      <section style={{ ...W, paddingTop: 64, paddingBottom: 28, textAlign: "center" }}>
        <div className="stag" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 999, background: "var(--tint)", color: "var(--brand-strong)", fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
            <span className="beat" style={{ display: "inline-flex" }}><Icon name="heart" size={15} fill="current" stroke={0} /></span>{org.stats[1].value} vies sauvées par don</div>
          <h1 className="font-serif" style={{ fontSize: "clamp(42px, 7vw, 92px)", fontWeight: 500, lineHeight: .98, letterSpacing: "-0.04em", maxWidth: 980, marginBottom: 22, textWrap: "balance" }}>
            Donner son sang, c'est <span className="serif-it" style={{ color: "var(--brand)" }}>sauver des vies.</span></h1>
          <p style={{ fontSize: 18.5, lineHeight: 1.55, color: "var(--ink-700)", maxWidth: 560, marginBottom: 30 }}>Votre geste simple et solidaire permet de soigner chaque année des milliers de patients au Sénégal. Rejoignez la communauté des donneurs.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Button size="lg" icon="drop" onClick={() => go("don")}>Je veux donner</Button>
            <Button size="lg" variant="soft" iconRight="arrowR" onClick={() => go("patient")}>Espace Patient</Button>
          </div>
        </div>
      </section>
      <section style={{ ...W, paddingTop: 36, paddingBottom: 24 }}>
        <div className="bento" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gridAutoRows: "minmax(180px, auto)", gap: 16 }}>
          <div className="ph cn-card bento-big" data-label="Photo — collecte mobile" style={{ ...tile, gridColumn: "span 2", gridRow: "span 2", minHeight: 380, border: "none" }} />
          <div className="cn-card hov" onClick={() => go("rdv")} style={{ ...tile, background: "var(--brand)", color: "#fff", border: "none", padding: 26, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div className="blob" style={{ width: 160, height: 160, right: -50, top: -50, background: "var(--red-700)" }} />
            <div className="beat" style={{ position: "relative", width: 52, height: 52, borderRadius: 999, background: "#fff", color: "var(--brand)", display: "grid", placeItems: "center" }}><Icon name="drop" size={24} fill="current" stroke={0} /></div>
            <div style={{ position: "relative" }}><div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Prendre rendez-vous</div><div style={{ fontSize: 13.5, opacity: .9 }}>En centre ou en collecte mobile</div></div>
          </div>
          <div className="cn-card hov" onClick={() => go("eligibilite")} style={{ ...tile, padding: 26, display: "flex", flexDirection: "column", justifyContent: "space-between", background: "var(--acc2-soft)", border: "none" }}>
            <IconBubble icon="check" tone="red" size={52} />
            <div><div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Puis-je donner ?</div><div style={{ fontSize: 13.5, color: "var(--ink-700)" }}>2 min · questionnaire confidentiel</div></div>
          </div>
          <div className="cn-card hov" onClick={() => go("collectes")} style={{ ...tile, padding: 26, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <IconBubble icon="pin" size={52} />
            <div><div className="font-serif" style={{ fontSize: 44, lineHeight: 1, color: "var(--brand)" }}><CountUp value={String(centers.length)} /></div><div style={{ fontWeight: 700, fontSize: 15, marginTop: 6 }}>lieux de collecte</div></div>
          </div>
          <div className="cn-card hov" onClick={() => go("alertes")} style={{ ...tile, padding: 26, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>{alerts.slice(0, 3).map((a, i) => <span key={i} className={i === 0 ? "ringpulse" : ""} style={{ borderRadius: 999 }}><BloodTag type={a.type} size="sm" /></span>)}</div>
            <div><div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Alertes par groupe</div><div style={{ fontSize: 13.5, color: "var(--ink-600)" }}>Soyez prévenu en cas de pénurie</div></div>
          </div>
        </div>
      </section>
      <section style={{ ...W, paddingTop: 12, paddingBottom: 12 }}><AlertMarquee alerts={alerts} tone="light" onGo={() => go("alertes")} /></section>
      <section style={{ ...W, paddingTop: 40, paddingBottom: 40, display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }} className="two-col">
        <Baro stock={stock} onBook={() => go("rdv")} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {org.stats.map((s, i) => (
            <div key={i} className="cn-card" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: i === 0 ? "var(--surface-2)" : "var(--surface)" }}>
              <div className="font-serif" style={{ fontSize: 40, fontWeight: 500, color: "var(--brand)", letterSpacing: "-0.03em", lineHeight: 1 }}><CountUp value={s.value} /></div>
              <div style={{ fontSize: 13, color: "var(--ink-700)", fontWeight: 600, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ ...W, paddingTop: 56, paddingBottom: 24 }}>
        <SectionTitle kicker="Pourquoi donner son sang ?" title="Un engagement vital pour le Sénégal" sub="Les besoins en produits sanguins sont constants. Votre engagement répond aux urgences et aux maladies chroniques." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16 }} className="grid-3">
          {REASONS.map((s, i) => (
            <Card key={i} pad={28} hover style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <IconBubble icon={s.icon} tone={i === 1 ? "red" : "tint"} />
                <span className="font-serif" style={{ fontSize: 44, color: "var(--line-strong)", lineHeight: 1 }}>0{i + 1}</span>
              </div>
              <div><h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3><p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.55 }}>{s.d}</p></div>
            </Card>
          ))}
        </div>
      </section>
      <Mission go={go} org={org} shape="var(--r-xl)" />
      <News go={go} news={news} />
      <CTA go={go} />
    </div>
  );
}

Object.assign(window, { HomeSolaire, HomeCorail });
