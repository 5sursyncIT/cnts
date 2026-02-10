"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Phone, Mail, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useFocusTrap(isMobileMenuOpen, () => setIsMobileMenuOpen(false));

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/qui-sommes-nous", label: "Le CNTS" },
    { href: "/donner-sang", label: "Don de sang" },
    { href: "/services", label: "Services" },
    { href: "/recherche", label: "Recherche" },
    { href: "/collectes", label: "Collectes" },
    { href: "/actualites", label: "Actualités" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <header className="flex flex-col w-full">
      {/* Top Bar - Informations de contact */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-xs font-medium">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              +221 33 821 82 72
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              contact@cnts.sn
            </span>
            <span className="hidden md:flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Avenue Cheikh Anta Diop, Dakar
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:underline">FAQ</Link>
            <Link href="/presse" className="hover:underline">Espace Presse</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-border bg-background sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-12 h-12">
              <Image 
                src="/images/logo.png" 
                alt="Logo CNTS" 
                width={48} 
                height={48} 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none tracking-tight text-primary">CNTS</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Centre National de Transfusion Sanguine</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-2 py-1",
                  isActive(link.href) ? "text-primary font-semibold" : "text-foreground/80"
                )}
              >
                {link.label}
              </Link>
            ))}
            
            <Link
              href="/espace-patient"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-sm"
            >
              Espace Patient
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          ref={menuRef}
          id="mobile-menu"
          className="md:hidden border-b border-border bg-background p-4 animate-in slide-in-from-top-5 fixed inset-0 z-50 overflow-y-auto top-[110px]"
          role="dialog"
          aria-modal="true"
          aria-label="Menu mobile"
        >
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "text-base font-medium transition-colors hover:text-primary p-2 rounded-md hover:bg-zinc-100",
                  isActive(link.href) ? "text-primary font-semibold" : "text-foreground/80"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/espace-patient"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground font-medium h-10 px-4 py-2 w-full mt-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Accéder à l'Espace Patient
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
