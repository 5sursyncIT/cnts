"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

const UTIL_LINK = { color: "var(--ink-700)", textDecoration: "none", fontSize: 12.5, fontWeight: 600 } as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const menuRef = useFocusTrap(open, () => setOpen(false));

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

  return (
    <>
      {/* Barre utilitaire (défile avec la page) */}
      <div className="util-bar-wrap" style={{ background: "var(--surface-2)", color: "var(--ink-700)", fontSize: 12.5 }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "0 var(--gutter)",
            height: 36,
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
            <Link href="/faq" style={UTIL_LINK}>
              FAQ
            </Link>
            <Link href="/presse" style={UTIL_LINK}>
              Espace Presse
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation principale : pilule flottante */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, padding: "12px var(--gutter) 0" }}>
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            background: "color-mix(in oklab, var(--surface) 88%, transparent)",
            backdropFilter: "saturate(180%) blur(14px)",
            WebkitBackdropFilter: "saturate(180%) blur(14px)",
            borderRadius: open ? 28 : 999,
            border: "1px solid var(--line)",
            boxShadow: scrolled ? "var(--sh-md)" : "none",
            transition: "box-shadow .3s, border-radius .2s",
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "0 10px 0 22px",
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <Link href="/" style={{ flexShrink: 0, textDecoration: "none" }} aria-label="CNTS — Accueil">
              <Logo size={36} />
            </Link>
            <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 2 }} aria-label="Navigation principale">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={"nav-link" + (isActive(n.href) ? " on" : "")}
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
              style={{
                display: "none",
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "var(--tint)",
                border: "none",
                cursor: "pointer",
                color: "var(--brand)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={open ? "x" : "menu"} size={22} />
            </button>
          </div>

          {open && (
            <div
              ref={menuRef}
              id="mobile-menu"
              className="mobile-only stag"
              role="dialog"
              aria-modal="true"
              aria-label="Menu mobile"
              style={{ display: "none", flexDirection: "column", padding: "6px 18px 18px" }}
            >
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: 600,
                    textDecoration: "none",
                    background: isActive(n.href) ? "var(--tint)" : "none",
                    color: isActive(n.href) ? "var(--brand)" : "var(--ink-800)",
                  }}
                >
                  {n.label}
                </Link>
              ))}
              <div style={{ marginTop: 10 }}>
                <Button size="md" variant="primary" full icon="idcard" href="/espace-patient">
                  Espace Patient
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
