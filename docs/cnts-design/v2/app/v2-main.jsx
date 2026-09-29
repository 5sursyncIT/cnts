/* CNTS v2 — shell, routing, tweaks */
const { useState: mS, useEffect: mE } = React;
const NAV = [
  { key: "accueil", label: "Accueil" }, { key: "cnts", label: "Le CNTS" }, { key: "don", label: "Don de sang" }, { key: "services", label: "Services" },
  { key: "recherche", label: "Recherche" }, { key: "collectes", label: "Collectes" }, { key: "actualites", label: "Actualités" }, { key: "contact", label: "Contact" },
];
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "Solaire",
  "animations": true
}/*EDITMODE-END*/;

function TopNav({ route, go, floating }) {
  const [open, setOpen] = mS(false);
  const [scrolled, setScrolled] = mS(false);
  const { org } = window.CNTS;
  mE(() => { const f = () => setScrolled(window.scrollY > 20); f(); window.addEventListener("scroll", f); return () => window.removeEventListener("scroll", f); }, []);
  return (
    <>
      <div style={{ background: "var(--surface-2)", fontSize: 12.5, color: "var(--ink-700)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 var(--gutter)", height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div className="util-left" style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={13} />{org.phone}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="info" size={13} />{org.email}</span>
            <span className="util-addr" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="pin" size={13} />{org.address}</span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {["FAQ", "Espace Presse"].map((t) => <button key={t} onClick={() => go("actualites")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--ink-700)" }}>{t}</button>)}
          </div>
        </div>
      </div>
      <header style={{ position: "sticky", top: 0, zIndex: 50, padding: floating ? "12px var(--gutter) 0" : 0, transition: "padding .3s" }}>
        <div style={{ maxWidth: floating ? 1240 : "none", margin: "0 auto", background: "color-mix(in oklab, var(--surface) 88%, transparent)", backdropFilter: "saturate(180%) blur(14px)",
          borderRadius: floating ? 999 : 0, border: floating ? "1px solid var(--line)" : "none", borderBottom: "1px solid var(--line)",
          boxShadow: scrolled ? "var(--sh-md)" : "none", transition: "box-shadow .3s" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: floating ? "0 10px 0 22px" : "0 var(--gutter)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <button onClick={() => go("accueil")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}><Logo size={36} /></button>
            <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {NAV.map((n) => <button key={n.key} onClick={() => go(n.key)} className={"nav-link" + (route === n.key ? " on" : "")}>{n.label}</button>)}
            </nav>
            <div className="desktop-nav" style={{ flexShrink: 0 }}><Button size="sm" icon="idcard" onClick={() => go("patient")}>Espace Patient</Button></div>
            <button className="mobile-only" onClick={() => setOpen(!open)} style={{ display: "none", width: 44, height: 44, borderRadius: 999, background: "var(--tint)", border: "none", cursor: "pointer", color: "var(--brand)", alignItems: "center", justifyContent: "center" }}>
              <Icon name={open ? "x" : "menu"} size={22} /></button>
          </div>
          {open && (
            <div className="mobile-only stag" style={{ display: "none", flexDirection: "column", padding: "6px 18px 18px" }}>
              {NAV.map((n) => <button key={n.key} onClick={() => { go(n.key); setOpen(false); }} style={{ background: route === n.key ? "var(--tint)" : "none", border: "none", textAlign: "left", padding: "12px 14px", borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: "pointer", color: route === n.key ? "var(--brand)" : "var(--ink-800)" }}>{n.label}</button>)}
              <div style={{ marginTop: 10 }}><Button full icon="idcard" onClick={() => { go("patient"); setOpen(false); }}>Espace Patient</Button></div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

function Footer({ go, onPro }) {
  const { org } = window.CNTS;
  const cols = [
    ["Le CNTS", [["Qui sommes-nous", "cnts"], ["Organisation & réseau", "cnts"], ["Recherche & innovation", "recherche"], ["Collectes à venir", "collectes"]]],
    ["Services & Don", [["Donner son sang", "don"], ["Qui peut donner ?", "don"], ["Parcours du donneur", "don"], ["Produits sanguins", "services"]]],
  ];
  const h = { fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 16 };
  return (
    <footer style={{ padding: "0 var(--gutter) var(--gutter)", marginTop: "auto" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", borderRadius: "var(--r-xl)", background: "var(--surface-2)", color: "var(--ink-700)", overflow: "hidden" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "56px var(--gutter) 40px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.1fr", gap: 32 }} className="footer-grid">
          <div>
            <Logo size={42} />
            <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 18, maxWidth: 300 }}>Le Centre National de Transfusion Sanguine assure la disponibilité et la sécurité des produits sanguins pour tous les patients du Sénégal depuis plus de {org.years} ans.</p>
          </div>
          {cols.map(([t, items]) => (
            <div key={t}><div style={h}>{t}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                {items.map(([l, r], i) => <button key={i} onClick={() => go(r)} className="nav-link" style={{ padding: "2px 0", background: "none", fontWeight: 500, fontSize: 14 }}>{l}</button>)}
              </div></div>
          ))}
          <div><div style={h}>Contactez-nous</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}><span>{org.address}</span><span>{org.phone}</span><span>{org.email}</span></div></div>
        </div>
        <div style={{ borderTop: "1px solid var(--line)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px var(--gutter)", fontSize: 12.5, color: "var(--ink-600)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <span>© 2026 Centre National de Transfusion Sanguine (CNTS) · Ministère de la Santé et de l'Action Sociale</span>
            <button onClick={onPro} className="cn-btn outline sm"><Icon name="building" size={14} />Espace professionnel</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ProShell({ onExit }) {
  const proNav = [["dash", "Tableau de bord", true], ["drop", "Stocks & poches"], ["users", "Donneurs"], ["calendar", "Collectes"], ["flask", "Analyses"], ["chart", "Statistiques"]];
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--surface-1)" }}>
      <aside className="pro-aside" style={{ width: 248, margin: 12, borderRadius: "var(--r-lg)", background: "var(--surface)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 12, height: "calc(100vh - 24px)" }}>
        <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--line)" }}><Logo size={34} /></div>
        <nav style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {proNav.map(([ic, l, on]) => <button key={l} className={"nav-link" + (on ? " on" : "")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", textAlign: "left" }}><Icon name={ic} size={19} />{l}</button>)}
        </nav>
        <div style={{ padding: 12, borderTop: "1px solid var(--line)" }}><button onClick={onExit} className="nav-link" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px" }}><Icon name="logout" size={19} />Retour au site public</button></div>
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 var(--gutter)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--line)", fontWeight: 600, fontSize: 13.5, color: "var(--ink-700)" }}><Icon name="pin" size={14} /> Vue nationale</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>DR</div>
            <div style={{ lineHeight: 1.15 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>Dr. Ndiaye</div><div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>Responsable collecte</div></div>
          </div>
        </div>
        <AdminScreen />
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [mode, setMode] = mS("public");
  const [route, setRoute] = mS(() => localStorage.getItem("cnts-v2-route") || "accueil");
  const theme = t.direction === "Corail" ? "corail" : "solaire";
  mE(() => { document.documentElement.dataset.theme = theme; document.documentElement.classList.toggle("no-anim", !t.animations); }, [theme, t.animations]);
  const go = (r) => { setRoute(r); localStorage.setItem("cnts-v2-route", r); window.scrollTo({ top: 0 }); };
  useReveal(route + theme + mode);
  const Home = theme === "corail" ? HomeCorail : HomeSolaire;
  const screens = { accueil: Home, cnts: QuiSommesNousScreen, don: DonDeSangScreen, services: ServicesScreen, recherche: RechercheScreen, collectes: CentersScreen, actualites: ActualitesScreen, contact: ContactScreen, patient: DonorSpaceScreen, rdv: BookingScreen, eligibilite: EligibilityScreen, alertes: AlertsScreen };
  const Screen = screens[route] || Home;
  const panel = (
    <TweaksPanel>
      <TweakSection label="Direction" />
      <TweakRadio label="Design" value={t.direction} options={["Solaire", "Corail"]} onChange={(v) => setTweak("direction", v)} />
      <TweakToggle label="Animations" value={t.animations} onChange={(v) => setTweak("animations", v)} />
    </TweaksPanel>
  );
  if (mode === "pro") return <>{panel}<ProShell onExit={() => setMode("public")} /></>;
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopNav route={route} go={go} floating={theme === "solaire"} />
      <main key={route + theme} className="page-enter" style={{ flex: 1 }}><Screen go={go} /></main>
      <Footer go={go} onPro={() => { setMode("pro"); window.scrollTo({ top: 0 }); }} />
      {panel}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
