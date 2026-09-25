"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Logo, Button } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { org } from "@/components/cnts/data";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/qui-sommes-nous", label: "Le CNTS" },
  { href: "/donner-sang", label: "Don de sang" },
  { href: "/services", label: "Services" },
  { href: "/recherche", label: "Recherche" },
  { href: "/collectes", label: "Collectes" },
  { href: "/actualites", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useFocusTrap(open, () => setOpen(false));

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50 }}>
      {/* Utility bar */}
      <div className="util-bar-wrap" style={{ background: "var(--night-900)", color: "rgba(255,255,255,.75)", fontSize: 12.5 }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "0 var(--gutter)",
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div className="util-left" style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="phone" size={13} />
              {org.phone}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="mail" size={13} />
              {org.email}
            </span>
            <span className="util-addr" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="pin" size={13} />
              {org.address}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/faq" style={{ color: "rgba(255,255,255,.75)", textDecoration: "none", fontSize: 12.5, fontWeight: 600 }}>
              FAQ
            </Link>
            <Link href="/presse" style={{ color: "rgba(255,255,255,.75)", textDecoration: "none", fontSize: 12.5, fontWeight: 600 }}>
              Espace Presse
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div
        style={{
          background: "rgba(255,255,255,.92)",
          backdropFilter: "saturate(180%) blur(12px)",
          WebkitBackdropFilter: "saturate(180%) blur(12px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "0 var(--gutter)",
            height: 66,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <Link href="/" style={{ flexShrink: 0, textDecoration: "none" }}>
            <Logo size={36} />
          </Link>
          <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 1 }} aria-label="Navigation principale">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                style={{
                  padding: "8px 11px",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                  fontFamily: "var(--font-sans)",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  fontWeight: isActive(n.href) ? 700 : 600,
                  color: isActive(n.href) ? "var(--brand)" : "var(--ink-700)",
                  transition: "color .15s",
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="desktop-nav" style={{ flexShrink: 0 }}>
            <Button size="sm" variant="primary" icon="idcard" href="/espace-patient">
              Espace Patient
            </Button>
          </div>
          <button
            className="mobile-only"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--ink-800)" }}
          >
            <Icon name={open ? "x" : "menu"} size={26} />
          </button>
        </div>

        {open && (
          <div
            ref={menuRef}
            id="mobile-menu"
            className="mobile-only"
            role="dialog"
            aria-modal="true"
            aria-label="Menu mobile"
            style={{
              display: "none",
              flexDirection: "column",
              padding: "8px var(--gutter) 18px",
              borderTop: "1px solid var(--line)",
              background: "var(--surface)",
            }}
          >
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(n.href) ? "page" : undefined}
                style={{
                  padding: "12px 4px",
                  fontSize: 16,
                  fontWeight: 600,
                  textDecoration: "none",
                  color: isActive(n.href) ? "var(--brand)" : "var(--ink-800)",
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                {n.label}
              </Link>
            ))}
            <div style={{ marginTop: 14 }}>
              <Button size="md" variant="primary" full icon="idcard" href="/espace-patient">
                Espace Patient
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
