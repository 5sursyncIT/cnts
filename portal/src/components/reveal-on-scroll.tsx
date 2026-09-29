"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Fait apparaître les sections de la page (sauf la première) quand elles entrent à l'écran.
// Les classes ne sont posées qu'une fois le JS chargé : sans JS, tout reste visible.
export function RevealOnScroll() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("main section")).slice(1);
    const show = (el: Element) => el.classList.add("in");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => {
      if (el.classList.contains("in")) return;
      // Déjà à l'écran au chargement : pas d'effet, pour éviter un flash.
      if (el.getBoundingClientRect().top < window.innerHeight - 40) return;
      el.classList.add("rv");
      io.observe(el);
    });
    // Filet de sécurité : rien ne reste masqué.
    const safety = setTimeout(() => els.forEach(show), 4000);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, [pathname]);
  return null;
}
