"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type CSSProperties, type ReactNode } from "react";
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
type ButtonVariant = "primary" | "deep" | "outline" | "ghost" | "light" | "danger";
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
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    borderRadius: "var(--r-pill)",
    whiteSpace: "nowrap",
    textDecoration: "none",
    transition: "transform .12s ease, background .15s ease, box-shadow .15s ease, color .15s",
    width: full ? "100%" : "auto",
    opacity: disabled ? 0.55 : 1,
  };
  const sizes: Record<ButtonSize, CSSProperties> = {
    sm: { padding: "8px 14px", fontSize: 13 },
    md: { padding: "11px 20px", fontSize: 14.5 },
    lg: { padding: "15px 28px", fontSize: 16 },
  };
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: "var(--brand)", color: "#fff", boxShadow: "var(--sh-sm)" },
    deep: { background: "var(--red-900)", color: "#fff" },
    outline: { background: "var(--surface)", color: "var(--ink-900)", borderColor: "var(--line-strong)" },
    ghost: { background: "transparent", color: "var(--ink-800)" },
    light: { background: "rgba(255,255,255,.14)", color: "#fff", borderColor: "rgba(255,255,255,.28)" },
    danger: { background: "var(--crit)", color: "#fff" },
  };
  const [h, setH] = useState(false);
  const hoverStyles: Record<ButtonVariant, CSSProperties> = {
    primary: { background: "var(--brand-strong)", transform: "translateY(-1px)", boxShadow: "var(--sh-md)" },
    deep: { background: "var(--red-950)" },
    outline: { borderColor: "var(--ink-400)", background: "var(--surface-1)" },
    ghost: { background: "var(--surface-3)" },
    light: { background: "rgba(255,255,255,.24)" },
    danger: { background: "var(--red-700)" },
  };
  const hov = !disabled && h ? hoverStyles[variant] : {};
  const iconSize = size === "lg" ? 20 : 18;
  const merged = { ...base, ...sizes[size], ...variants[variant], ...hov, ...style };
  const inner = (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={merged}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={merged}
    >
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
  const [h, setH] = useState(false);
  const interactive = hover || !!href || !!onClick;
  const merged: CSSProperties = {
    display: "block",
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--r-lg)",
    padding: pad,
    boxShadow: h ? "var(--sh-md)" : "var(--sh-xs)",
    transition: "box-shadow .18s ease, transform .18s ease, border-color .18s",
    transform: h ? "translateY(-2px)" : "none",
    borderColor: h ? "var(--line-strong)" : "var(--line)",
    cursor: href || onClick ? "pointer" : "default",
    textDecoration: "none",
    color: "inherit",
    ...style,
  };
  const handlers = {
    onMouseEnter: () => interactive && setH(true),
    onMouseLeave: () => interactive && setH(false),
  };
  if (href) {
    return (
      <Link href={href} style={merged} {...handlers}>
        {children}
      </Link>
    );
  }
  return (
    <div onClick={onClick} style={merged} {...handlers}>
      {children}
    </div>
  );
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
  const s = { sm: 30, md: 40, lg: 52 }[size];
  const fs = { sm: 12, md: 15, lg: 19 }[size];
  const tones: Record<string, CSSProperties> = {
    solid: { background: "var(--red-600)", color: "#fff", border: "none" },
    soft: { background: "var(--red-50)", color: "var(--red-700)", border: "1px solid var(--red-200)" },
    outline: { background: "var(--surface)", color: "var(--red-700)", border: "1.5px solid var(--red-300)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: s,
        height: s,
        borderRadius: 11,
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
          borderRadius: "10px 10px 13px 13px",
          border: "1.5px solid var(--line-strong)",
          background: "var(--surface-2)",
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,.05)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${pct}%`,
            background: `linear-gradient(180deg, ${col}, color-mix(in oklab, ${col} 78%, black))`,
            transition: "height .6s cubic-bezier(.2,.8,.2,1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -1,
            left: "50%",
            transform: "translateX(-50%)",
            width: 16,
            height: 6,
            background: "var(--line-strong)",
            borderRadius: "0 0 4px 4px",
          }}
        />
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
    <section
      style={{
        background: "linear-gradient(155deg, var(--red-950) 0%, var(--red-800) 75%, var(--red-700) 100%)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage: "radial-gradient(circle at 90% 10%, rgba(255,255,255,.1), transparent 45%)",
        }}
      />
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: tall ? "64px var(--gutter)" : "48px var(--gutter)",
          position: "relative",
        }}
      >
        {kicker && (
          <div className="kicker" style={{ color: "var(--red-200)", marginBottom: 12 }}>
            {kicker}
          </div>
        )}
        <h1
          className="font-serif"
          style={{
            fontSize: "clamp(30px, 4.4vw, 48px)",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1.08,
            maxWidth: 860,
          }}
        >
          {title}
        </h1>
        {sub && (
          <p style={{ marginTop: 16, fontSize: 17.5, lineHeight: 1.55, color: "rgba(255,255,255,.82)", maxWidth: 640 }}>
            {sub}
          </p>
        )}
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
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        {kicker && (
          <div className="kicker" style={{ marginBottom: 8 }}>
            {kicker}
          </div>
        )}
        <h2
          className="font-serif"
          style={{
            fontSize: "clamp(24px, 3vw, 33px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>
        {sub && <p style={{ marginTop: 8, color: "var(--ink-600)", fontSize: 15.5, maxWidth: 620 }}>{sub}</p>}
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
