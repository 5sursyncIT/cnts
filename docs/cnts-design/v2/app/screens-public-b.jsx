/* ============================================================
   CNTS — Public screens B: RDV · Éligibilité · Espace donneur
   ============================================================ */

/* ----------------------------- Stepper ----------------------------- */
function Stepper({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 30 }}>
      {steps.map((s, i) => {
        const done = i < current, on = i === current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, display: "grid", placeItems: "center",
                fontSize: 13.5, fontWeight: 700, flexShrink: 0,
                background: done ? "var(--brand)" : on ? "var(--red-50)" : "var(--surface-3)",
                color: done ? "#fff" : on ? "var(--brand)" : "var(--ink-500)",
                border: on ? "1.5px solid var(--brand)" : "1.5px solid transparent" }}>
                {done ? <Icon name="check" size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 600,
                color: on ? "var(--ink-900)" : "var(--ink-500)", whiteSpace: "nowrap" }} className="step-label">{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, margin: "0 14px",
              background: done ? "var(--brand)" : "var(--line)" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function BookingScreen({ go }) {
  const { centers } = window.CNTS;
  const [step, setStep] = useState(0);
  const [center, setCenter] = useState(centers[0].id);
  const [day, setDay] = useState(null);
  const [time, setTime] = useState(null);
  const steps = ["Lieu", "Date & heure", "Confirmation"];

  const days = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return { iso: d.toISOString().slice(0, 10),
      wd: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      dm: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      n: 4 + ((i * 3) % 9) };
  });
  const times = ["08:30", "09:00", "09:30", "10:30", "11:00", "14:00", "14:30", "15:30", "16:00"];
  const chosen = centers.find(c => c.id === center);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "var(--gutter)" }}>
      <button onClick={() => go("accueil")} style={{ background: "none", border: "none", cursor: "pointer",
        color: "var(--ink-600)", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center",
        gap: 5, marginBottom: 18 }}><Icon name="chevL" size={16} />Accueil</button>
      <SectionTitle kicker="Rendez-vous" title="Réserver un don de sang" />
      <Stepper steps={steps} current={step} />

      <Card pad={28}>
        {step === 0 && (
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Choisissez un lieu de don</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {centers.map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16,
                  borderRadius: "var(--r-md)", cursor: "pointer", transition: "all .15s",
                  border: "1.5px solid " + (center === c.id ? "var(--brand)" : "var(--line)"),
                  background: center === c.id ? "var(--red-50)" : "var(--surface)" }}>
                  <input type="radio" name="ctr" checked={center === c.id} onChange={() => setCenter(c.id)}
                    style={{ accentColor: "var(--brand)", width: 18, height: 18 }} />
                  <div style={{ width: 40, height: 40, borderRadius: 11, display: "grid", placeItems: "center",
                    background: "var(--surface-3)", color: "var(--brand)", flexShrink: 0 }}>
                    <Icon name={c.type === "mobile" ? "map" : "building"} size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-600)" }}>{c.area}, {c.city} · {c.hours}</div>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 600 }}>{c.dist} km</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Sélectionnez une date</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-600)", marginBottom: 16 }}>{chosen.name}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 26 }} className="day-grid">
              {days.map((d) => (
                <button key={d.iso} onClick={() => setDay(d.iso)} style={{ padding: "13px 4px", borderRadius: "var(--r-md)",
                  cursor: "pointer", textAlign: "center", transition: "all .15s",
                  border: "1.5px solid " + (day === d.iso ? "var(--brand)" : "var(--line)"),
                  background: day === d.iso ? "var(--brand)" : "var(--surface)",
                  color: day === d.iso ? "#fff" : "var(--ink-800)" }}>
                  <div style={{ fontSize: 11.5, textTransform: "uppercase", opacity: 0.7, fontWeight: 700 }}>{d.wd}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, margin: "3px 0" }}>{d.dm}</div>
                  <div style={{ fontSize: 11, color: day === d.iso ? "rgba(255,255,255,.85)" : "var(--ok)", fontWeight: 600 }}>{d.n} libres</div>
                </button>
              ))}
            </div>
            {day && (<>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Choisissez un créneau</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: 10 }}>
                {times.map((t) => (
                  <button key={t} onClick={() => setTime(t)} style={{ padding: "12px 6px", borderRadius: "var(--r-sm)",
                    cursor: "pointer", fontSize: 14.5, fontWeight: 700, transition: "all .15s",
                    border: "1.5px solid " + (time === t ? "var(--brand)" : "var(--line)"),
                    background: time === t ? "var(--brand)" : "var(--surface)",
                    color: time === t ? "#fff" : "var(--ink-800)" }}>{t}</button>
                ))}
              </div>
            </>)}
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 76, height: 76, borderRadius: 999, background: "var(--ok-bg)", color: "var(--ok)",
              display: "grid", placeItems: "center", margin: "0 auto 20px" }}><Icon name="check" size={40} /></div>
            <h3 className="font-serif" style={{ fontSize: 27, fontWeight: 600, marginBottom: 8 }}>Rendez-vous confirmé</h3>
            <p style={{ color: "var(--ink-600)", fontSize: 15, marginBottom: 24 }}>
              Un rappel par SMS vous sera envoyé 24h avant.</p>
            <div style={{ display: "inline-block", textAlign: "left", background: "var(--surface-1)",
              border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 22, minWidth: 320 }}>
              <ConfirmRow icon="building" label="Lieu" value={chosen.name} />
              <ConfirmRow icon="calendar" label="Date" value={day ? frDate(day) : "—"} />
              <ConfirmRow icon="clock" label="Heure" value={time || "—"} />
              <ConfirmRow icon="idcard" label="Donneur" value={window.CNTS.donor.name} last />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 26 }}>
              <Button variant="outline" icon="calendarCheck">Ajouter au calendrier</Button>
              <Button variant="primary" icon="idcard" onClick={() => go("patient")}>Espace Patient</Button>
            </div>
          </div>
        )}

        {step < 2 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28,
            paddingTop: 20, borderTop: "1px solid var(--line-soft)" }}>
            <Button variant="ghost" icon="chevL" onClick={() => step === 0 ? go("accueil") : setStep(step - 1)}>Retour</Button>
            <Button variant="primary" iconRight="arrowR" disabled={step === 1 && (!day || !time)}
              onClick={() => setStep(step + 1)}>Continuer</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
function ConfirmRow({ icon, label, value, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
      borderBottom: last ? "none" : "1px solid var(--line-soft)" }}>
      <Icon name={icon} size={17} style={{ color: "var(--ink-400)" }} />
      <span style={{ fontSize: 13, color: "var(--ink-500)", width: 64 }}>{label}</span>
      <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{value}</span>
    </div>
  );
}

/* ----------------------------- Éligibilité ----------------------------- */
function EligibilityScreen({ go }) {
  const qs = [
    { q: "Avez-vous entre 18 et 65 ans ?", ok: "oui" },
    { q: "Pesez-vous plus de 50 kg ?", ok: "oui" },
    { q: "Vous sentez-vous en bonne santé aujourd'hui ?", ok: "oui" },
    { q: "Avez-vous donné votre sang il y a moins de 3 mois ?", ok: "non" },
    { q: "Avez-vous reçu un tatouage ou piercing récemment (< 4 mois) ?", ok: "non" },
  ];
  const [ans, setAns] = useState({});
  const allDone = Object.keys(ans).length === qs.length;
  const eligible = allDone && qs.every((it, i) => ans[i] === it.ok);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "var(--gutter)" }}>
      <button onClick={() => go("accueil")} style={{ background: "none", border: "none", cursor: "pointer",
        color: "var(--ink-600)", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center",
        gap: 5, marginBottom: 18 }}><Icon name="chevL" size={16} />Accueil</button>
      <SectionTitle kicker="Auto-évaluation" title="Suis-je éligible au don ?"
        sub="Quelques questions pour une première indication. Un entretien médical confidentiel confirmera votre éligibilité sur place." />
      <Card pad={28}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {qs.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, padding: "16px 0", borderBottom: i < qs.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-800)" }}>{it.q}</span>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {["oui", "non"].map((v) => (
                  <button key={v} onClick={() => setAns({ ...ans, [i]: v })} style={{
                    padding: "8px 20px", borderRadius: "var(--r-pill)", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                    textTransform: "capitalize", transition: "all .15s",
                    border: "1.5px solid " + (ans[i] === v ? "var(--brand)" : "var(--line-strong)"),
                    background: ans[i] === v ? "var(--brand)" : "var(--surface)",
                    color: ans[i] === v ? "#fff" : "var(--ink-700)" }}>{v}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {allDone && (
          <div style={{ marginTop: 22, padding: 20, borderRadius: "var(--r-md)",
            background: eligible ? "var(--ok-bg)" : "var(--warn-bg)",
            border: "1px solid " + (eligible ? "var(--ok)" : "var(--warn)"),
            display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Icon name={eligible ? "check" : "info"} size={24} style={{ color: eligible ? "var(--ok)" : "var(--warn)", marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: eligible ? "var(--ok)" : "var(--warn)" }}>
                {eligible ? "Vous semblez éligible au don !" : "Un délai ou un avis médical est nécessaire"}</div>
              <p style={{ fontSize: 14, color: "var(--ink-700)", marginTop: 4 }}>
                {eligible ? "Réservez dès maintenant votre créneau. L'éligibilité finale est confirmée lors de l'entretien."
                  : "Certaines réponses nécessitent un délai d'attente ou l'avis d'un médecin. Contactez-nous pour en savoir plus."}</p>
              {eligible && <div style={{ marginTop: 14 }}><Button variant="primary" icon="calendarCheck"
                onClick={() => go("rdv")}>Prendre rendez-vous</Button></div>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

Object.assign(window, { BookingScreen, EligibilityScreen, Stepper });
