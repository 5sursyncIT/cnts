"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "./icon";

/* ----------------------------- Logo ----------------------------- */
export function Logo({
  size = 34,
  light = false,
  showText = true,
}: {
  size?: number;
  light?: boolean;
  showText?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <Image
        src="/images/logo-cnts.png"
        alt="CNTS"
        width={size}
        height={size}
        style={{ display: "block", filter: light ? "drop-shadow(0 1px 2px rgba(0,0,0,.3))" : "none" }}
      />
      {showText && (
        <div style={{ lineHeight: 1.05 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "-0.01em",
              color: light ? "#fff" : "var(--ink-900)",
            }}
          >
            CNTS
          </div>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: light ? "rgba(255,255,255,.7)" : "var(--ink-500)",
            }}
          >
            Sénégal
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Button ----------------------------- */
// Styles : classes .cn-btn (globals.css, thème v2 « Solaire »).
type ButtonVariant = "primary" | "deep" | "outline" | "ghost" | "light" | "soft" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  onClick,
  href,
  type = "button",
  disabled,
  style = {},
}: {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconRight?: string;
  full?: boolean;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const iconSize = size === "lg" ? 20 : 18;
  const className = `cn-btn ${variant} ${size}`;
  const merged: CSSProperties = { width: full ? "100%" : undefined, ...style };
  const inner = (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && (
        <span className="ic-r">
          <Icon name={iconRight} size={iconSize} />
        </span>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className} style={merged}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={merged}>
      {inner}
    </button>
  );
}

/* ----------------------------- Card ----------------------------- */
export function Card({
  children,
  pad = 22,
  style = {},
  hover = false,
  href,
  onClick,
}: {
  children?: ReactNode;
  pad?: number;
  style?: CSSProperties;
  hover?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = "cn-card" + (hover || href || onClick ? " hov" : "");
  const merged: CSSProperties = { padding: pad, ...style };
  if (href) {
    return (
      <Link href={href} className={className} style={merged}>
        {children}
      </Link>
    );
  }
  return (
    <div onClick={onClick} className={className} style={merged}>
      {children}
    </div>
  );
}

/* ------------------------- Icon bubble ------------------------- */
export function IconBubble({
  icon,
  tone = "tint",
  size = 52,
}: {
  icon: string;
  tone?: "tint" | "sun" | "red";
  size?: number;
}) {
  const t = {
    tint: ["var(--tint)", "var(--brand)"],
    sun: ["var(--acc2-soft)", "var(--acc2-ink)"],
    red: ["var(--brand)", "#fff"],
  }[tone];
  return (
    <div
      className="cn-ico"
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: t[0],
        color: t[1],
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={Math.round(size * 0.44)} />
    </div>
  );
}

/* ------------------------- Count-up number ------------------------- */
// Anime « 33 » ou « 100% » de 0 à la valeur quand le nombre entre à l'écran.
// Les années (≥ 1000) et les valeurs non numériques restent statiques.
export function CountUp({ value, dur = 1400 }: { value: string; dur?: number }) {
  const m = String(value).match(/^(\d+)(.*)$/);
  const animate = Boolean(m && +m[1] < 1000);
  const [n, setN] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!animate || !m || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = +m[1];
    let raf = 0;
    let t0 = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const step = (t: number) => {
        t0 = t0 || t;
        const p = Math.min(1, (t - t0) / dur);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      setN(0);
      raf = requestAnimationFrame(step);
    });
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{animate && m && n !== null ? n + m[2] : value}</span>;
}

/* ------------------------- Blood type chip ------------------------- */
export function BloodTag({
  type,
  size = "md",
  tone = "solid",
}: {
  type: string;
  size?: "sm" | "md" | "lg";
  tone?: "solid" | "soft" | "outline";
}) {
  const s = { sm: 32, md: 42, lg: 56 }[size];
  const fs = { sm: 12, md: 15, lg: 19 }[size];
  const tones: Record<string, CSSProperties> = {
    solid: { background: "var(--brand)", color: "#fff" },
    soft: { background: "var(--tint)", color: "var(--red-700)" },
    outline: { background: "var(--surface)", color: "var(--red-700)", boxShadow: "inset 0 0 0 1.5px var(--red-300)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: s,
        height: s,
        borderRadius: 999,
        fontWeight: 800,
        fontSize: fs,
        fontFamily: "var(--font-sans)",
        letterSpacing: "-0.02em",
        ...tones[tone],
      }}
    >
      {type}
    </span>
  );
}

/* --------------------------- Status pill --------------------------- */
export function StatusPill({
  status,
  children,
}: {
  status: "ok" | "warn" | "crit" | "info";
  children: ReactNode;
}) {
  const map = {
    ok: { c: "var(--ok)", bg: "var(--ok-bg)" },
    warn: { c: "var(--warn)", bg: "var(--warn-bg)" },
    crit: { c: "var(--crit)", bg: "var(--crit-bg)" },
    info: { c: "var(--info)", bg: "var(--info-bg)" },
  };
  const m = map[status] || map.info;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 11px",
        borderRadius: "var(--r-pill)",
        background: m.bg,
        color: m.c,
        fontSize: 12.5,
        fontWeight: 700,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: m.c }} />
      {children}
    </span>
  );
}

/* ----------------- Blood bag / pouch fill visual ----------------- */
export function BloodBag({
  pct,
  status = "ok",
  label,
  height = 86,
}: {
  pct: number;
  status?: "ok" | "warn" | "crit";
  label?: string;
  height?: number;
}) {
  const col = status === "crit" ? "var(--crit)" : status === "warn" ? "var(--warn)" : "var(--brand)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
      <div
        style={{
          position: "relative",
          width: 46,
          height,
          borderRadius: "16px 16px 22px 22px",
          background: "var(--surface-2)",
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1.5px var(--line-strong)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${pct}%`,
            background: col,
            transformOrigin: "bottom",
            animation: "fill 1.4s cubic-bezier(.2,.8,.2,1) both",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -5,
              left: 0,
              width: "200%",
              height: 10,
              animation: "wave 2.4s linear infinite",
              background: `radial-gradient(circle at 6px 10px, ${col} 6px, transparent 6.5px) 0 0/12px 10px repeat-x`,
            }}
          />
        </div>
        {status === "crit" && (
          <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", animation: "ring 1.8s infinite" }} />
        )}
      </div>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)" }}>{label}</div>}
    </div>
  );
}

/* ------------------------- Page banner (inner) ------------------------- */
export function PageBanner({
  kicker,
  title,
  sub,
  tall,
}: {
  kicker?: string;
  title: ReactNode;
  sub?: string;
  tall?: boolean;
}) {
  return (
    <section style={{ padding: "14px var(--gutter) 0" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          maxWidth: 1280,
          margin: "0 auto",
          borderRadius: "var(--r-xl)",
          background: "var(--surface-2)",
        }}
      >
        <div aria-hidden className="blob" style={{ width: 360, height: 360, right: -80, top: -120, background: "var(--brand)", opacity: 0.9 }} />
        <div
          aria-hidden
          className="blob"
          style={{ width: 200, height: 200, right: 220, bottom: -110, background: "var(--acc2)", animationDelay: "-5s" }}
        />
        <div
          className="stag"
          style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: tall ? "72px var(--gutter)" : "56px var(--gutter)" }}
        >
          {kicker && (
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "var(--surface)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--brand)",
                  marginBottom: 18,
                  boxShadow: "var(--sh-xs)",
                }}
              >
                <Icon name="drop" size={13} fill="current" stroke={0} />
                {kicker}
              </span>
            </div>
          )}
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(32px, 4.6vw, 54px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.06,
              maxWidth: 760,
              color: "var(--ink-900)",
              textWrap: "balance",
            }}
          >
            {title}
          </h1>
          {sub && (
            <p style={{ marginTop: 16, fontSize: 17.5, lineHeight: 1.55, color: "var(--ink-700)", maxWidth: 600, textWrap: "pretty" }}>
              {sub}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Section heading ------------------------- */
export function SectionTitle({
  kicker,
  title,
  sub,
  action,
}: {
  kicker?: string;
  title: ReactNode;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 28,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        {kicker && (
          <div className="kicker" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span aria-hidden style={{ width: 22, height: 3, borderRadius: 9, background: "var(--brand)" }} />
            {kicker}
          </div>
        )}
        <h2
          className="font-serif"
          style={{
            fontSize: "clamp(26px, 3.2vw, 38px)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            lineHeight: 1.1,
            textWrap: "balance",
          }}
        >
          {title}
        </h2>
        {sub && <p style={{ marginTop: 10, color: "var(--ink-600)", fontSize: 16, maxWidth: 620, lineHeight: 1.55 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Stat ------------------------------ */
export function Stat({
  value,
  label,
  sub,
  icon,
  accent,
}: {
  value: ReactNode;
  label: string;
  sub?: string;
  icon?: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {icon && (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            display: "grid",
            placeItems: "center",
            background: accent ? "var(--red-50)" : "var(--surface-3)",
            color: accent ? "var(--brand)" : "var(--ink-600)",
            marginBottom: 4,
          }}
        >
          <Icon name={icon} size={19} />
        </div>
      )}
      <div
        className="font-serif"
        style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--ink-900)" }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-700)" }}>{label}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{sub}</div>}
    </div>
  );
}

/* ------------------------- Progress (linear) ------------------------- */
export function Bar({
  pct,
  color = "var(--brand)",
  track = "var(--surface-3)",
  h = 8,
}: {
  pct: number;
  color?: string;
  track?: string;
  h?: number;
}) {
  return (
    <div style={{ height: h, borderRadius: 999, background: track, overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.min(100, pct)}%`,
          height: "100%",
          borderRadius: 999,
          background: color,
          transition: "width .6s cubic-bezier(.2,.8,.2,1)",
        }}
      />
    </div>
  );
}

/* re-export pure date helper (safe in client + server) */
export { frDate } from "./format";
