/* ============================================================
   CNTS — Pages institutionnelles
   Le CNTS · Don de sang · Services · Recherche · Actualités · Contact
   ============================================================ */

function MaxWrap({ children, w = 1180 }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

/* ----------------------------- Le CNTS ----------------------------- */
function QuiSommesNousScreen({ go }) {
  const { org } = window.CNTS;
  return (
    <div>
      <PageBanner kicker="Le CNTS" title="Bien plus qu'une banque de sang."
        sub={`Le Centre National de Transfusion Sanguine assure la disponibilité et la sécurité des produits sanguins pour tous les patients du Sénégal depuis plus de ${org.years} ans.`} />

      {/* Chiffres clés */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px var(--gutter)",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }} className="grid-4">
          {org.stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div className="font-serif" style={{ fontSize: 40, fontWeight: 600, color: "var(--brand)", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 13.5, color: "var(--ink-600)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission, two-col */}
      <MaxWrap>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }} className="two-col">
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Notre mission</div>
            <h2 className="font-serif" style={{ fontSize: "clamp(24px,3vw,33px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}>
              Un approvisionnement sûr, accessible à tous</h2>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65, marginBottom: 16 }}>
              Au-delà de la collecte et de la distribution, le CNTS est un centre d'expertise médicale et biologique de référence,
              au service du système de santé sénégalais et de ses patients.</p>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65 }}>
              Le don de sang y est bénévole, anonyme et gratuit — une chaîne de solidarité nationale qui sauve des milliers de vies chaque année.</p>
          </div>
          <div className="ph" data-label="Photo — laboratoire CNTS" style={{ height: 320, borderRadius: "var(--r-lg)" }} />
        </div>
      </MaxWrap>

      {/* 4 missions */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle kicker="Nos domaines d'expertise" title="Quatre piliers, une exigence de sécurité" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }} className="grid-4">
            {org.missions.map((m, i) => (
              <Card key={i} pad={22}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--red-50)", color: "var(--brand)",
                  display: "grid", placeItems: "center", marginBottom: 16 }}><Icon name={m.icon} size={23} /></div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 7 }}>{m.t}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5 }}>{m.d}</p>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      {/* Organisation & réseau */}
      <MaxWrap>
        <SectionTitle kicker="Organisation & réseau" title="Un maillage national"
          sub={`${org.regions.length} régions couvertes par un réseau de banques régionales et de postes de collecte, coordonnés depuis le siège de Dakar.`} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {org.regions.map((r) => (
            <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px",
              borderRadius: "var(--r-pill)", border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, fontWeight: 600, color: "var(--ink-700)" }}>
              <Icon name="pin" size={15} style={{ color: "var(--brand)" }} />{r}</span>
          ))}
        </div>
      </MaxWrap>

      {/* Partenaires */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle kicker="Partenaires" title="Ensemble pour la santé publique" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }} className="grid-3">
            {org.partners.map((p) => (
              <div key={p} className="ph" data-label={p} style={{ height: 78, borderRadius: "var(--r-md)" }} />
            ))}
          </div>
        </MaxWrap>
      </section>
    </div>
  );
}

/* ----------------------------- Don de sang ----------------------------- */
function DonDeSangScreen({ go }) {
  const { donConditions, parcours } = window.CNTS;
  return (
    <div>
      <PageBanner kicker="Don de sang" title="Donner son sang, c'est sauver des vies."
        sub="Un geste simple, encadré et sûr. Le don ne prend que 45 minutes de votre temps et peut sauver jusqu'à 3 vies." />

      {/* Qui peut donner */}
      <MaxWrap>
        <SectionTitle kicker="Qui peut donner ?" title="Les conditions du don" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="two-col">
          <Card pad={26}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ok-bg)", color: "var(--ok)", display: "grid", placeItems: "center" }}><Icon name="check" size={20} /></div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Vous pouvez donner si…</h3>
            </div>
            {donConditions.ok.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "10px 0", borderBottom: i < donConditions.ok.length - 1 ? "1px solid var(--line-soft)" : "none", fontSize: 14.5, color: "var(--ink-700)" }}>
                <Icon name="check" size={18} style={{ color: "var(--ok)", flexShrink: 0, marginTop: 1 }} />{c}</div>
            ))}
          </Card>
          <Card pad={26}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--warn-bg)", color: "var(--warn)", display: "grid", placeItems: "center" }}><Icon name="clock" size={20} /></div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Don à reporter en cas de…</h3>
            </div>
            {donConditions.wait.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "10px 0", borderBottom: i < donConditions.wait.length - 1 ? "1px solid var(--line-soft)" : "none", fontSize: 14.5, color: "var(--ink-700)" }}>
                <Icon name="info" size={18} style={{ color: "var(--warn)", flexShrink: 0, marginTop: 1 }} />{c}</div>
            ))}
          </Card>
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button variant="primary" icon="check" onClick={() => go("eligibilite")}>Vérifier mon éligibilité</Button>
          <Button variant="outline" icon="calendarCheck" onClick={() => go("rdv")}>Prendre rendez-vous</Button>
        </div>
      </MaxWrap>

      {/* Parcours du donneur */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle kicker="Le parcours du donneur" title="Comment se déroule un don ?"
            sub="Quatre étapes, environ 45 minutes. Vous êtes accompagné à chaque instant par un personnel qualifié." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }} className="grid-4">
            {parcours.map((p, i) => (
              <Card key={i} pad={22}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--red-50)", color: "var(--brand)", display: "grid", placeItems: "center" }}><Icon name={p.icon} size={22} /></div>
                  <span className="font-serif" style={{ fontSize: 30, fontWeight: 500, color: "var(--red-200)" }}>{i + 1}</span>
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 5 }}>{p.t}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5, marginBottom: 10 }}>{p.d}</p>
                <StatusPill status="info">{p.min}</StatusPill>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      <section style={{ background: "var(--red-900)", color: "#fff" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <h2 className="font-serif" style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 500, letterSpacing: "-0.02em", maxWidth: 560, lineHeight: 1.12 }}>
            Prêt à sauver des vies ? Prenez rendez-vous dès aujourd'hui.</h2>
          <Button size="lg" variant="light" icon="calendarCheck" onClick={() => go("rdv")}>Prendre rendez-vous</Button>
        </div>
      </section>
    </div>
  );
}

/* ----------------------------- Services ----------------------------- */
function ServicesScreen({ go }) {
  const { products } = window.CNTS;
  const labs = ["Qualification biologique des dons", "Immuno-hématologie & groupage", "Sérologie infectieuse", "Hématologie clinique", "Hémovigilance & traçabilité", "Conseil transfusionnel aux hôpitaux"];
  return (
    <div>
      <PageBanner kicker="Services" title="Des produits sanguins sûrs, un plateau technique de référence."
        sub="Le CNTS prépare, qualifie et distribue l'ensemble des produits sanguins labiles, et met son expertise biologique au service des établissements de santé." />

      <MaxWrap>
        <SectionTitle kicker="Produits sanguins" title="Une réponse adaptée à chaque besoin clinique" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }} className="two-col">
          {products.map((p, i) => (
            <Card key={i} pad={24}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--red-50)", color: "var(--brand)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={p.icon} size={24} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                    <h3 style={{ fontSize: 16.5, fontWeight: 700 }}>{p.name}</h3>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-500)", whiteSpace: "nowrap" }}>Conservation · {p.life}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </MaxWrap>

      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <MaxWrap>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }} className="two-col">
            <div className="ph" data-label="Photo — plateau technique" style={{ height: 300, borderRadius: "var(--r-lg)" }} />
            <div>
              <div className="kicker" style={{ marginBottom: 10 }}>Laboratoires & expertise</div>
              <h2 className="font-serif" style={{ fontSize: "clamp(23px,2.8vw,30px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 18 }}>
                La sécurité transfusionnelle, à chaque étape</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {labs.map((l) => (
                  <div key={l} style={{ display: "flex", gap: 9, fontSize: 14, color: "var(--ink-700)", alignItems: "flex-start" }}>
                    <Icon name="check" size={17} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />{l}</div>
                ))}
              </div>
            </div>
          </div>
        </MaxWrap>
      </section>
    </div>
  );
}

/* ----------------------------- Recherche ----------------------------- */
function RechercheScreen({ go }) {
  const { research } = window.CNTS;
  return (
    <div>
      <PageBanner kicker="Recherche & Innovation" title="Faire progresser la médecine transfusionnelle au Sénégal."
        sub="Le CNTS conduit et accompagne des travaux de recherche et de formation pour améliorer la sécurité et l'efficacité de la transfusion." />
      <MaxWrap>
        <SectionTitle kicker="Axes de recherche" title="Nos priorités scientifiques" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }} className="two-col">
          {research.map((r, i) => (
            <Card key={i} pad={26}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span className="font-serif" style={{ fontSize: 26, fontWeight: 500, color: "var(--red-200)" }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{r.t}</h3>
                  <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>{r.d}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </MaxWrap>
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <MaxWrap>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 560 }}>
              <div className="kicker" style={{ marginBottom: 10 }}>Formation</div>
              <h2 className="font-serif" style={{ fontSize: "clamp(22px,2.6vw,28px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 10 }}>
                Un centre de formation pour les professionnels de santé</h2>
              <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.6 }}>
                Programmes de formation continue en transfusion, hémovigilance et bonnes pratiques de prélèvement, destinés au personnel médical et paramédical du réseau national.</p>
            </div>
            <Button variant="outline" icon="phone" onClick={() => go("contact")}>Nous contacter</Button>
          </div>
        </MaxWrap>
      </section>
    </div>
  );
}

Object.assign(window, { QuiSommesNousScreen, DonDeSangScreen, ServicesScreen, RechercheScreen, MaxWrap });
