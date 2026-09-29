import type { CSSProperties } from "react";

import { PHOSPHOR } from "./icon-paths";

/*
 * Icônes du site : Phosphor Icons (MIT), style duotone par défaut — un trait net
 * doublé d'un aplat à 20 % d'opacité dans la couleur courante.
 *  - weight="duotone" (défaut) · "regular" (trait seul) · "fill" (plein)
 *  - en dessous de 15 px, le trait seul est utilisé : l'aplat empâterait l'icône.
 *  - `fill="current"` (ancienne API) = weight="fill". `stroke` est conservé pour
 *    compatibilité mais n'a plus d'effet (tracés remplis).
 */
export type IconName = keyof typeof PHOSPHOR;
export type IconWeight = "duotone" | "regular" | "fill";

export function Icon({
  name,
  size = 20,
  weight,
  fill = "none",
  className = "",
  style = {},
}: {
  name: string;
  size?: number;
  weight?: IconWeight;
  /** @deprecated sans effet depuis le passage à Phosphor */
  stroke?: number;
  /** "current" = icône pleine (équivaut à weight="fill") */
  fill?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const glyph = PHOSPHOR[name] ?? PHOSPHOR.info;
  const w: IconWeight = weight ?? (fill === "current" ? "fill" : size < 15 ? "regular" : "duotone");
  const paths = w === "fill" ? glyph.fill : w === "regular" ? glyph.duotone.filter((p) => p.length === 1) : glyph.duotone;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths.map(([d, opacity], i) => (
        <path key={i} d={d} opacity={opacity} />
      ))}
    </svg>
  );
}
