/* ============================================================
   CNTS — Actualités & Contact
   ============================================================ */

function ActualitesScreen({ go }) {
  const { news } = window.CNTS;
  const cats = ["Tous", "Mobilisation", "Événement", "Institution", "Recherche"];
  const [cat, setCat] = useState("Tous");
  const list = news.filter(n => cat === "Tous" ? true : n.cat === cat);
  const [feat, ...rest] = list.length ? list : news;

  return (
    <div>
      <PageBanner kicker="Actualités & Événements" title="Toute l'actualité du CNTS."
        sub="Campagnes, événements, avancées scientifiques et vie du réseau national de transfusion." />
      <MaxWrap>
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: "8px 16px", borderRadius: "var(--r-pill)",
              fontSize: 13.5, fontWeight: 600, cursor: "pointer", transition: "all .15s",
              border: "1px solid " + (cat === c ? "var(--brand)" : "var(--line-strong)"),
              background: cat === c ? "var(--brand)" : "var(--surface)", color: cat === c ? "#fff" : "var(--ink-700)" }}>{c}</button>
          ))}
        </div>

        {/* Featured */}
        {feat && (
          <Card pad={0} hover style={{ overflow: "hidden", marginBottom: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr" }} className="two-col">
              <div className="ph" data-label="Photo — actualité" style={{ minHeight: 280 }} />
              <div style={{ padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                    color: "var(--brand)", background: "var(--red-50)", padding: "4px 10px", borderRadius: "var(--r-pill)" }}>{feat.cat}</span>
                  <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{frDate(feat.date)}</span>
                </div>
                <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>{feat.title}</h2>
                <p style={{ fontSize: 15, color: "var(--ink-600)", lineHeight: 1.6, marginBottom: 18 }}>{feat.excerpt}</p>
                <div><Button variant="outline" size="sm" iconRight="arrowR">Lire l'article</Button></div>
              </div>
            </div>
          </Card>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="grid-3">
          {rest.map((n, i) => (
            <Card key={i} pad={0} hover style={{ overflow: "hidden" }}>
              <div className="ph" data-label="Photo" style={{ height: 160 }} />
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand)" }}>{n.cat}</span>
                  <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{frDate(n.date, { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.25, marginBottom: 8 }}>{n.title}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5 }}>{n.excerpt}</p>
              </div>
            </Card>
          ))}
        </div>

        <div style={{ marginTop: 26, padding: 24, borderRadius: "var(--r-lg)", background: "var(--surface-1)",
          border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center" }}><Icon name="calendar" size={22} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Collectes à venir</div>
              <div style={{ fontSize: 13.5, color: "var(--ink-600)" }}>Trouvez une collecte mobile près de chez vous.</div>
            </div>
          </div>
          <Button variant="primary" iconRight="arrowR" onClick={() => go("collectes")}>Voir les collectes</Button>
        </div>
      </MaxWrap>
    </div>
  );
}

function ContactScreen({ go }) {
  const { org } = window.CNTS;
  const [sent, setSent] = useState(false);
  const infos = [
    { icon: "pin", label: "Adresse", value: org.address },
    { icon: "phone", label: "Téléphone", value: org.phone },
    { icon: "info", label: "Email", value: org.email },
    { icon: "clock", label: "Horaires", value: "Lun–Sam · 08h00–18h00" },
  ];
  return (
    <div>
      <PageBanner kicker="Contact" title="Nous contacter"
        sub="Une question sur le don, nos services ou un partenariat ? Notre équipe vous répond." />
      <MaxWrap>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }} className="two-col">
          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {infos.map((it, i) => (
              <Card key={i} pad={18}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--red-50)", color: "var(--brand)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={it.icon} size={20} /></div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{it.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-900)", marginTop: 2 }}>{it.value}</div>
                  </div>
                </div>
              </Card>
            ))}
            <div className="ph" data-label="Carte — Avenue Cheikh Anta Diop, Dakar" style={{ height: 180, borderRadius: "var(--r-lg)" }} />
          </div>

          {/* Form */}
          <Card pad={28}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--ok-bg)", color: "var(--ok)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Icon name="check" size={32} /></div>
                <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Message envoyé</h3>
                <p style={{ color: "var(--ink-600)" }}>Nous vous répondrons dans les meilleurs délais.</p>
                <div style={{ marginTop: 20 }}><Button variant="outline" onClick={() => setSent(false)}>Envoyer un autre message</Button></div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Envoyez-nous un message</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <Field label="Nom complet" placeholder="Votre nom" />
                  <Field label="Email" placeholder="vous@exemple.sn" type="email" />
                </div>
                <div style={{ marginBottom: 14 }}><Field label="Sujet" placeholder="Objet de votre message" /></div>
                <div style={{ marginBottom: 18 }}><Field label="Message" placeholder="Votre message…" area /></div>
                <Button type="submit" variant="primary" full icon="share">Envoyer le message</Button>
              </form>
            )}
          </Card>
        </div>
      </MaxWrap>
    </div>
  );
}

function Field({ label, placeholder, type = "text", area }) {
  const base = { width: "100%", padding: "11px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--line-strong)",
    fontSize: 14.5, fontFamily: "var(--font-sans)", color: "var(--ink-900)", background: "var(--surface)", outline: "none" };
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink-700)", marginBottom: 6 }}>{label}</span>
      {area
        ? <textarea placeholder={placeholder} rows={4} style={{ ...base, resize: "vertical" }} />
        : <input type={type} placeholder={placeholder} style={base} />}
    </label>
  );
}

Object.assign(window, { ActualitesScreen, ContactScreen });
