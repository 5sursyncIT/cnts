/* ============================================================
   CNTS — App shell, navigation & routing
   ============================================================ */
const { useState: useS } = React;

const NAV = [
  { key: "accueil", label: "Accueil" },
  { key: "cnts", label: "Le CNTS" },
  { key: "don", label: "Don de sang" },
  { key: "services", label: "Services" },
  { key: "recherche", label: "Recherche" },
  { key: "collectes", label: "Collectes" },
  { key: "actualites", label: "Actualités" },
  { key: "contact", label: "Contact" },
];

function UtilityBar({ go }) {
  const { org } = window.CNTS;
  return (
    <div style={{ background: "var(--night-900)", color: "rgba(255,255,255,.75)", fontSize: 12.5 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 var(--gutter)", height: 38,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div className="util-left" style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={13} />{org.phone}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="info" size={13} />{org.email}</span>
          <span className="util-addr" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="pin" size={13} />{org.address}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => go("actualites")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.75)", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>FAQ</button>
          <button onClick={() => go("actualites")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.75)", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>Espace Presse</button>
        </div>
      </div>
    </div>
  );
}

function TopNav({ route, go }) {
  const [open, setOpen] = useS(false);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <div className="util-bar-wrap"><UtilityBar go={go} /></div>
      <div style={{ background: "rgba(255,255,255,.92)", backdropFilter: "saturate(180%) blur(12px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 var(--gutter)", height: 66,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <button onClick={() => go("accueil")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
            <Logo size={36} />
          </button>
          <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 1 }}>
            {NAV.map((n) => (
              <button key={n.key} onClick={() => go(n.key)} style={{ background: "none", border: "none", cursor: "pointer",
                padding: "8px 11px", borderRadius: "var(--r-sm)", fontSize: 14, fontFamily: "var(--font-sans)", whiteSpace: "nowrap",
                fontWeight: route === n.key ? 700 : 600, color: route === n.key ? "var(--brand)" : "var(--ink-700)", transition: "color .15s" }}>{n.label}</button>
            ))}
          </nav>
          <div className="desktop-nav" style={{ flexShrink: 0 }}>
            <Button size="sm" variant="primary" icon="idcard" onClick={() => go("patient")}>Espace Patient</Button>
          </div>
          <button className="mobile-only" onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--ink-800)" }}>
            <Icon name={open ? "x" : "menu"} size={26} />
          </button>
        </div>
        {open && (
          <div className="mobile-only" style={{ display: "none", flexDirection: "column", padding: "8px var(--gutter) 18px", borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
            {NAV.map((n) => (
              <button key={n.key} onClick={() => { go(n.key); setOpen(false); }} style={{ background: "none", border: "none", textAlign: "left",
                padding: "12px 4px", fontSize: 16, fontWeight: 600, cursor: "pointer",
                color: route === n.key ? "var(--brand)" : "var(--ink-800)", borderBottom: "1px solid var(--line-soft)" }}>{n.label}</button>
            ))}
            <div style={{ marginTop: 14 }}><Button size="md" variant="primary" full icon="idcard" onClick={() => { go("patient"); setOpen(false); }}>Espace Patient</Button></div>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer({ go, onPro }) {
  const { org } = window.CNTS;
  const cols = [
    ["Le CNTS", [["Qui sommes-nous", "cnts"], ["Organisation & réseau", "cnts"], ["Recherche & innovation", "recherche"], ["Collectes à venir", "collectes"]]],
    ["Services & Don", [["Donner son sang", "don"], ["Qui peut donner ?", "don"], ["Parcours du donneur", "don"], ["Produits sanguins", "services"]]],
  ];
  return (
    <footer style={{ background: "var(--night-900)", color: "rgba(255,255,255,.75)", marginTop: "auto" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.1fr", gap: 32 }} className="footer-grid">
        <div>
          <Logo size={40} light />
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 16, maxWidth: 300, color: "rgba(255,255,255,.6)" }}>
            Le Centre National de Transfusion Sanguine assure la disponibilité et la sécurité des produits sanguins pour tous les patients du Sénégal depuis plus de {org.years} ans.</p>
        </div>
        {cols.map(([h, items]) => (
          <div key={h}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 14 }}>{h}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-start" }}>
              {items.map(([t, r], i) => (
                <button key={i} onClick={() => go(r)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 13.5, color: "rgba(255,255,255,.75)", fontFamily: "var(--font-sans)" }}>{t}</button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 14 }}>Contactez-nous</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13.5, color: "rgba(255,255,255,.75)" }}>
            <span>{org.address}</span>
            <span>{org.phone}</span>
            <span>{org.email}</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div style={{ padding: "16px var(--gutter)", maxWidth: 1180, margin: "0 auto", fontSize: 12.5, color: "rgba(255,255,255,.45)",
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <span>© 2026 Centre National de Transfusion Sanguine (CNTS) · Ministère de la Santé et de l'Action Sociale</span>
          <button onClick={onPro} style={{ background: "none", border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.6)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: "var(--r-pill)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="building" size={13} />Espace professionnel</button>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------- Pro shell ---------------------------- */
function ProShell({ onExit }) {
  const proNav = [
    { icon: "dash", label: "Tableau de bord", active: true },
    { icon: "drop", label: "Stocks & poches" },
    { icon: "users", label: "Donneurs" },
    { icon: "calendar", label: "Collectes" },
    { icon: "flask", label: "Analyses" },
    { icon: "chart", label: "Statistiques" },
  ];
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="pro-aside" style={{ width: 248, background: "var(--night-900)", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,.1)" }}><Logo size={34} light /></div>
        <nav style={{ padding: 14, display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {proNav.map((n) => (
            <button key={n.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)", textAlign: "left",
              background: n.active ? "var(--brand)" : "transparent", color: n.active ? "#fff" : "rgba(255,255,255,.7)" }}>
              <Icon name={n.icon} size={19} />{n.label}</button>
          ))}
        </nav>
        <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <button onClick={onExit} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", width: "100%", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)", background: "transparent", color: "rgba(255,255,255,.7)" }}>
            <Icon name="logout" size={19} />Retour au site public</button>
        </div>
      </aside>
      <div style={{ flex: 1, background: "var(--surface-1)", minWidth: 0 }}>
        <div style={{ height: 64, borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 var(--gutter)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-500)", fontSize: 13.5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: "var(--r-pill)", background: "var(--surface-3)", fontWeight: 600, color: "var(--ink-700)" }}>
              <Icon name="pin" size={14} /> Vue nationale</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-600)", position: "relative" }}>
              <Icon name="bell" size={21} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 999, background: "var(--crit)" }} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 999, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>DR</div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Dr. Ndiaye</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>Responsable collecte</div>
              </div>
            </div>
          </div>
        </div>
        <AdminScreen />
      </div>
    </div>
  );
}

/* ------------------------------ App ------------------------------ */
function App() {
  const [mode, setMode] = useS("public"); // public | pro
  const [route, setRoute] = useS("accueil");
  const go = (r) => { setRoute(r); window.scrollTo({ top: 0 }); };

  if (mode === "pro") return <ProShell onExit={() => setMode("public")} />;

  const screens = {
    accueil: HomeScreen,
    cnts: QuiSommesNousScreen,
    don: DonDeSangScreen,
    services: ServicesScreen,
    recherche: RechercheScreen,
    collectes: CentersScreen,
    actualites: ActualitesScreen,
    contact: ContactScreen,
    patient: DonorSpaceScreen,
    rdv: BookingScreen,
    eligibilite: EligibilityScreen,
    alertes: AlertsScreen,
  };
  const Screen = screens[route] || HomeScreen;
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopNav route={route} go={go} />
      <main style={{ flex: 1 }}><Screen go={go} /></main>
      <Footer go={go} onPro={() => setMode("pro")} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
