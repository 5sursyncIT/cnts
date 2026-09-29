/* CNTS v2 — component overrides (loaded after components.jsx) */
const { useState: v2S, useEffect: v2E, useRef: v2R } = React;

function Button({ children, variant = "primary", size = "md", icon, iconRight, full, onClick, type = "button", disabled }) {
  const is = size === "lg" ? 20 : 18;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`cn-btn ${variant} ${size}`} style={{ width: full ? "100%" : "auto" }}>
      {icon && <Icon name={icon} size={is} />}{children}{iconRight && <span className="ic-r"><Icon name={iconRight} size={is} /></span>}
    </button>
  );
}

function Card({ children, pad = 22, style = {}, hover = false, onClick }) {
  return <div onClick={onClick} className={"cn-card" + (hover || onClick ? " hov" : "")} style={{ padding: pad, ...style }}>{children}</div>;
}

function BloodTag({ type, size = "md", tone = "solid" }) {
  const s = { sm: 32, md: 42, lg: 56 }[size];
  const fs = { sm: 12, md: 15, lg: 19 }[size];
  const tones = {
    solid: { background: "var(--brand)", color: "#fff" },
    soft: { background: "var(--tint)", color: "var(--red-700)" },
    outline: { background: "var(--surface)", color: "var(--red-700)", boxShadow: "inset 0 0 0 1.5px var(--red-300)" },
  };
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: s, height: s, borderRadius: 999, fontWeight: 800, fontSize: fs, letterSpacing: "-0.02em", ...tones[tone] }}>{type}</span>;
}

function BloodBag({ pct, status = "ok", label, height = 86 }) {
  const col = status === "crit" ? "var(--crit)" : status === "warn" ? "var(--warn)" : "var(--brand)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
      <div style={{ position: "relative", width: 46, height, borderRadius: "16px 16px 22px 22px", background: "var(--surface-2)", overflow: "hidden", boxShadow: "inset 0 0 0 1.5px var(--line-strong)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${pct}%`, background: col, transformOrigin: "bottom", animation: "fill 1.4s cubic-bezier(.2,.8,.2,1) both" }}>
          <div style={{ position: "absolute", top: -5, left: 0, width: "200%", height: 10, animation: "wave 2.4s linear infinite",
            background: `radial-gradient(circle at 6px 10px, ${col} 6px, transparent 6.5px) 0 0/12px 10px repeat-x` }} />
        </div>
        {status === "crit" && <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", animation: "ring 1.8s infinite" }} />}
      </div>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)" }}>{label}</div>}
    </div>
  );
}

function PageBanner({ kicker, title, sub, tall }) {
  return (
    <section style={{ padding: "14px var(--gutter) 0" }}>
      <div style={{ position: "relative", overflow: "hidden", maxWidth: 1280, margin: "0 auto", borderRadius: "var(--r-xl)", background: "var(--surface-2)" }}>
        <div className="blob" style={{ width: 360, height: 360, right: -80, top: -120, background: "var(--brand)", opacity: .9 }} />
        <div className="blob" style={{ width: 200, height: 200, right: 220, bottom: -110, background: "var(--acc2)", animationDelay: "-5s" }} />
        <div className="stag" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: tall ? "72px var(--gutter)" : "56px var(--gutter)" }}>
          {kicker && <div><span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "var(--surface)", fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 18, boxShadow: "var(--sh-xs)" }}>
            <Icon name="drop" size={13} fill="current" stroke={0} />{kicker}</span></div>}
          <h1 className="font-serif" style={{ fontSize: "clamp(32px, 4.6vw, 54px)", fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.06, maxWidth: 760, color: "var(--ink-900)", textWrap: "balance" }}>{title}</h1>
          {sub && <p style={{ marginTop: 16, fontSize: 17.5, lineHeight: 1.55, color: "var(--ink-700)", maxWidth: 600, textWrap: "pretty" }}>{sub}</p>}
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ kicker, title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        {kicker && <div className="kicker" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 22, height: 3, borderRadius: 9, background: "var(--brand)" }} />{kicker}</div>}
        <h2 className="font-serif" style={{ fontSize: "clamp(26px, 3.2vw, 38px)", fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1, textWrap: "balance" }}>{title}</h2>
        {sub && <p style={{ marginTop: 10, color: "var(--ink-600)", fontSize: 16, maxWidth: 620, lineHeight: 1.55 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function CountUp({ value, dur = 1400 }) {
  const m = String(value).match(/^(\d+)(.*)$/);
  const [n, setN] = v2S(m ? 0 : null);
  const ref = v2R(null);
  v2E(() => {
    if (!m) return;
    const target = +m[1]; let raf, t0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const step = (t) => { t0 = t0 || t; const p = Math.min(1, (t - t0) / dur); setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref}>{m ? n + m[2] : value}</span>;
}

function useReveal(dep) {
  v2E(() => {
    const els = [...document.querySelectorAll("main section")].slice(1);
    const check = () => {
      let left = 0;
      els.forEach((el) => {
        if (el.classList.contains("in")) return;
        if (el.getBoundingClientRect().top < window.innerHeight - 40) el.classList.add("in"); else left++;
      });
      if (!left) window.removeEventListener("scroll", check);
    };
    els.forEach((el) => el.classList.add("rv"));
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const safety = setTimeout(() => els.forEach((el) => el.classList.add("in")), 4000);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); clearTimeout(safety); };
  }, [dep]);
}

Object.assign(window, { Button, Card, BloodTag, BloodBag, PageBanner, SectionTitle, CountUp, useReveal });
