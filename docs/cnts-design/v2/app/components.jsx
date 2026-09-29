/* ============================================================
   CNTS — Shared UI components (exported to window)
   Icons are simple Lucide-style line glyphs (MIT).
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ----------------------------- Icons ----------------------------- */
const ICONS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
  calendar: "M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  calendarCheck: "M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM9 15l2 2 4-4",
  pin: "M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  drop: "M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z",
  user: "M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.5 21a1.8 1.8 0 0 0 3 0",
  check: "M20 6 9 17l-5-5",
  chevR: "m9 6 6 6-6 6",
  chevL: "m15 6-6 6 6 6",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  heart: "M19 14c1.5-1.5 3-3.4 3-5.5A4.5 4.5 0 0 0 12 6 4.5 4.5 0 0 0 2 8.5C2 13 12 21 12 21s3.5-2.8 7-7Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3",
  menu: "M3 6h18M3 12h18M3 18h18",
  x: "M18 6 6 18M6 6l12 12",
  shield: "M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM8.2 13.5 7 22l5-3 5 3-1.2-8.5",
  plus: "M12 5v14M5 12h14",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z",
  sparkles: "M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3ZM19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8L19 14Z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  trend: "M22 7 13.5 15.5 8.5 10.5 2 17M22 7h-6M22 7v6",
  alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
  repeat: "M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z",
  flask: "M9 3h6M10 3v6l-5.5 9a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3M7.5 14h9",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  dash: "M3 3h8v10H3zM13 3h8v6h-8zM13 13h8v8h-8zM3 17h8v4H3z",
  idcard: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM7 15a3 3 0 0 1 6 0M10 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 9h3M16 13h3",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  filter: "M3 4h18l-7 8v6l-4 2v-8L3 4Z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
  star: "M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.8 6.2 21.3l1.6-6.6L2.6 10l6.8-.5L12 3Z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14",
  building: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M3 21h18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2",
  gift: "M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  chart: "M3 3v18h18M7 14l3-3 3 3 5-6",
};

function Icon({ name, size = 20, stroke = 1.8, fill = "none", className = "", style = {} }) {
  const d = ICONS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill === "current" ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ display: "block", flexShrink: 0, ...style }} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ----------------------------- Logo ----------------------------- */
function Logo({ size = 34, light = false, showText = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <img src="assets/logo.png" alt="CNTS" width={size} height={size}
        style={{ display: "block", filter: light ? "drop-shadow(0 1px 2px rgba(0,0,0,.3))" : "none" }} />
      {showText && (
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em",
            color: light ? "#fff" : "var(--ink-900)" }}>CNTS</div>
          <div style={{ fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600,
            color: light ? "rgba(255,255,255,.7)" : "var(--ink-500)" }}>Sénégal</div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Button ----------------------------- */
function Button({ children, variant = "primary", size = "md", icon, iconRight, full, onClick, type = "button", disabled }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "var(--font-sans)", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent", borderRadius: "var(--r-pill)", whiteSpace: "nowrap",
    transition: "transform .12s ease, background .15s ease, box-shadow .15s ease, color .15s",
    width: full ? "100%" : "auto", opacity: disabled ? 0.55 : 1,
  };
  const sizes = {
    sm: { padding: "8px 14px", fontSize: 13 },
    md: { padding: "11px 20px", fontSize: 14.5 },
    lg: { padding: "15px 28px", fontSize: 16 },
  };
  const variants = {
    primary: { background: "var(--brand)", color: "#fff", boxShadow: "var(--sh-sm)" },
    deep: { background: "var(--red-900)", color: "#fff" },
    outline: { background: "var(--surface)", color: "var(--ink-900)", borderColor: "var(--line-strong)" },
    ghost: { background: "transparent", color: "var(--ink-800)" },
    light: { background: "rgba(255,255,255,.14)", color: "#fff", borderColor: "rgba(255,255,255,.28)" },
    danger: { background: "var(--crit)", color: "#fff" },
  };
  const [h, setH] = useState(false);
  const hov = !disabled && h ? {
    primary: { background: "var(--brand-strong)", transform: "translateY(-1px)", boxShadow: "var(--sh-md)" },
    deep: { background: "var(--red-950)" },
    outline: { borderColor: "var(--ink-400)", background: "var(--surface-1)" },
    ghost: { background: "var(--surface-3)" },
    light: { background: "rgba(255,255,255,.24)" },
    danger: { background: "var(--red-700)" },
  }[variant] : {};
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...hov }}>
      {icon && <Icon name={icon} size={size === "lg" ? 20 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 20 : 18} />}
    </button>
  );
}

/* ----------------------------- Card ----------------------------- */
function Card({ children, pad = 22, style = {}, hover = false, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setH(true)} onMouseLeave={() => hover && setH(false)}
      style={{
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)",
        padding: pad, boxShadow: h ? "var(--sh-md)" : "var(--sh-xs)",
        transition: "box-shadow .18s ease, transform .18s ease, border-color .18s",
        transform: h ? "translateY(-2px)" : "none", borderColor: h ? "var(--line-strong)" : "var(--line)",
        cursor: onClick ? "pointer" : "default", ...style,
      }}>
      {children}
    </div>
  );
}

/* ------------------------- Blood type chip ------------------------- */
function BloodTag({ type, size = "md", tone = "solid" }) {
  const s = { sm: 30, md: 40, lg: 52 }[size];
  const fs = { sm: 12, md: 15, lg: 19 }[size];
  const tones = {
    solid: { background: "var(--red-600)", color: "#fff", border: "none" },
    soft: { background: "var(--red-50)", color: "var(--red-700)", border: "1px solid var(--red-200)" },
    outline: { background: "var(--surface)", color: "var(--red-700)", border: "1.5px solid var(--red-300)" },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: s, height: s, borderRadius: 11, fontWeight: 800, fontSize: fs,
      fontFamily: "var(--font-sans)", letterSpacing: "-0.02em", ...tones[tone],
    }}>{type}</span>
  );
}

/* --------------------------- Status pill --------------------------- */
function StatusPill({ status, children }) {
  const map = {
    ok:   { c: "var(--ok)",   bg: "var(--ok-bg)" },
    warn: { c: "var(--warn)", bg: "var(--warn-bg)" },
    crit: { c: "var(--crit)", bg: "var(--crit-bg)" },
    info: { c: "var(--info)", bg: "var(--info-bg)" },
  };
  const m = map[status] || map.info;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px",
      borderRadius: "var(--r-pill)", background: m.bg, color: m.c, fontSize: 12.5, fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: m.c }} />
      {children}
    </span>
  );
}

/* ----------------- Blood bag / pouch fill visual ----------------- */
function BloodBag({ pct, status = "ok", label, height = 86 }) {
  const col = status === "crit" ? "var(--crit)" : status === "warn" ? "var(--warn)" : "var(--brand)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
      <div style={{
        position: "relative", width: 46, height,
        borderRadius: "10px 10px 13px 13px", border: "1.5px solid var(--line-strong)",
        background: "var(--surface-2)", overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,.05)",
      }}>
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: `${pct}%`,
          background: `linear-gradient(180deg, ${col}, color-mix(in oklab, ${col} 78%, black))`,
          transition: "height .6s cubic-bezier(.2,.8,.2,1)",
        }} />
        <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
          width: 16, height: 6, background: "var(--line-strong)", borderRadius: "0 0 4px 4px" }} />
      </div>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)" }}>{label}</div>}
    </div>
  );
}

/* ------------------------- Page banner (inner) ------------------------- */
function PageBanner({ kicker, title, sub, tall }) {
  return (
    <section style={{ background: "linear-gradient(155deg, var(--red-950) 0%, var(--red-800) 75%, var(--red-700) 100%)",
      color: "#fff", position: "relative", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.5,
        backgroundImage: "radial-gradient(circle at 90% 10%, rgba(255,255,255,.1), transparent 45%)" }} />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: tall ? "64px var(--gutter)" : "48px var(--gutter)", position: "relative" }}>
        {kicker && <div className="kicker" style={{ color: "var(--red-200)", marginBottom: 12 }}>{kicker}</div>}
        <h1 className="font-serif" style={{ fontSize: "clamp(30px, 4.4vw, 48px)", fontWeight: 500,
          letterSpacing: "-0.025em", lineHeight: 1.08, maxWidth: 860 }}>{title}</h1>
        {sub && <p style={{ marginTop: 16, fontSize: 17.5, lineHeight: 1.55, color: "rgba(255,255,255,.82)", maxWidth: 640 }}>{sub}</p>}
      </div>
    </section>
  );
}

/* ------------------------- Section heading ------------------------- */
function SectionTitle({ kicker, title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        {kicker && <div className="kicker" style={{ marginBottom: 8 }}>{kicker}</div>}
        <h2 className="font-serif" style={{ fontSize: "clamp(24px, 3vw, 33px)", fontWeight: 600,
          letterSpacing: "-0.02em", color: "var(--ink-900)", lineHeight: 1.1 }}>{title}</h2>
        {sub && <p style={{ marginTop: 8, color: "var(--ink-600)", fontSize: 15.5, maxWidth: 620 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Stat ------------------------------ */
function Stat({ value, label, sub, icon, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {icon && (
        <div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center",
          background: accent ? "var(--red-50)" : "var(--surface-3)", color: accent ? "var(--brand)" : "var(--ink-600)", marginBottom: 4 }}>
          <Icon name={icon} size={19} />
        </div>
      )}
      <div className="font-serif" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em",
        color: "var(--ink-900)" }}>{value}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-700)" }}>{label}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{sub}</div>}
    </div>
  );
}

/* ------------------------- Progress (linear) ------------------------- */
function Bar({ pct, color = "var(--brand)", track = "var(--surface-3)", h = 8 }) {
  return (
    <div style={{ height: h, borderRadius: 999, background: track, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", borderRadius: 999,
        background: color, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
    </div>
  );
}

/* helper: format date FR */
function frDate(iso, opts) {
  try { return new Date(iso).toLocaleDateString("fr-FR", opts || { day: "numeric", month: "long", year: "numeric" }); }
  catch (e) { return iso; }
}

Object.assign(window, {
  Icon, Logo, Button, Card, BloodTag, StatusPill, BloodBag,
  PageBanner, SectionTitle, Stat, Bar, frDate,
});
