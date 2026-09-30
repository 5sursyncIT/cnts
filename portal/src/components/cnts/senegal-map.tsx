"use client";

// Carte du Sénégal (SimpleMaps, CC — simplemaps.com) — 14 régions.
// Généré depuis web/public/images/sn.svg. viewBox 0 0 1000 736.
// La Gambie est l'échancrure du contour national (arêtes non partagées entre régions),
// refermée par la ligne de côte.
import { useCallback, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { SN_W, SN_H, SN_VIEWBOX, geoToSvg, REGION_POINTS, REGIONS, REGION_NAME, regionOf, type Region } from "./senegal-geo";

export { SN_W, SN_H, SN_VIEWBOX, geoToSvg, REGION_POINTS, REGIONS, REGION_NAME, regionOf, type Region };

// Position des étiquettes (centroïde du plus grand anneau, ajusté à l'œil).
const REGION_LABELS: Record<string, { x: number; y: number }> = {
  SNKE: { x: 810, y: 622 },
  SNTC: { x: 690, y: 456 },
  SNKD: { x: 505, y: 600 },
  SNSE: { x: 335, y: 605 },
  SNZG: { x: 222, y: 640 },
  SNSL: { x: 430, y: 118 },
  SNMT: { x: 612, y: 262 },
  SNKA: { x: 392, y: 418 },
  SNKL: { x: 282, y: 458 },
  SNFK: { x: 178, y: 412 },
  SNLG: { x: 335, y: 236 },
  SNTH: { x: 168, y: 286 },
  SNDB: { x: 258, y: 334 },
  SNDK: { x: 80, y: 296 },
};

const GAMBIA_D = "M189.3 508.3L198.6 508.3 207.7 508.3 216.9 508.4 226.1 508.4 235.3 508.5 244.4 508.5 253.6 508.5 259.6 508.5 262.8 508.5 271.9 508.6 281.1 508.6 290.3 508.7 299.4 508.7 308.6 508.7 317.8 508.8 326.9 508.8 336.1 508.8 343.3 508.9 345.7 508.1 345.9 502 346.3 500 346.5 498.9 347.6 495.6 349.2 492.4 350.8 489.8 355.4 484.8 361.7 480.2 368.5 477.6 374.9 478.7 376.3 480 379.1 483.8 380.4 484.7 383.5 484 394.6 476.8 405.4 472.9 408.6 473 417.4 476.4 432.3 477 437.7 478.9 440.4 481.1 442.9 483.1 444.7 485.7 446 488.5 448.9 498.3 449.9 499.5 456 503.2 458.1 503.9 459.9 503.4 469 498.3 474.9 496.6 481 497.1 487.4 500.1 490.2 502.4 492.2 504.9 493.6 507.8 495.6 514.4 496.5 516.4 498 518.1 499.2 518.9 509.9 526.7 513.5 528.3 516.2 528.7 518.7 528.1 527.4 525 535.6 519.8 538.4 518.6 546.9 516.7 553.7 513.2 556.7 512.4 558.3 512.4 560.9 512.6 562.4 512.3 564.2 511.6 567.2 509.8 569.1 509.5 572.2 510 576 511.3 579.5 513.1 582 515.2 582.8 516.5 583.7 519.4 584.5 520.6 584.8 520.9 585.8 521.8 589.2 523.8 590.7 525 594.2 532.2 593.6 540 589.4 546.4 582.1 549.6 571 550.6 565 552.2 559.1 552.3 552.8 554.6 550.2 554.5 548 555.5 540.9 560.9 537.7 562.5 533.4 562.7 525.4 561.1 517 561.9 513 561.6 509.1 560.5 503.8 557.7 502.2 556.6 500.8 555.3 499.7 553.8 498 552.1 496.1 551.5 491.4 551.3 489.3 550.7 487.3 549.6 485.9 548.3 481.7 544.4 480 543.8 475.3 545 469.8 545.6 464.4 545 459.5 542.9 455.3 539.2 452.4 535 450.8 534 447.8 533.4 445.1 532.6 440.1 529.5 437.9 528.9 432.2 528.4 427.3 527.1 417.6 522.1 417.5 522.1 410.2 516.7 403.6 510.5 399.5 507.8 396.1 509.2 393.1 512.4 389.7 515.9 387.7 519.2 387.1 528.6 386.2 532.8 383.2 536.8 378.9 539.6 374.1 541.4 369.3 542.3 363.8 542.3 347.7 538.9 343.1 538.7 339.7 540 336.3 541.9 331.8 543.4 329.4 543.6 319.5 542.6 317.6 542.7 311 544.8 300.7 545.8 299 546.7 298.4 548.9 298.1 559.6 298.1 562 297.8 572.8 296.8 573.5 291.3 573.5 287.3 573.4 277.9 573.4 258.6 573.2 226 572.9 203.5 572.7 179.2 572.5 172.8 572.4Z";

const NEIGHBOURS: { t: string; x: number; y: number; rot?: number }[] = [
  { t: "MAURITANIE", x: 640, y: 58 },
  { t: "MALI", x: 930, y: 250 },
  { t: "GUINÉE", x: 760, y: 726 },
  { t: "GUINÉE-BISSAU", x: 300, y: 726 },
];

// Encart « Dakar » : zone agrandie de la presqu'île, posée dans l'océan.
const DAKAR_BOX = { x: 42, y: 300, w: 66, h: 56 };
const INSET = { x: 10, y: 440, w: 148, h: 125.6 };
const INSET_K = INSET.w / DAKAR_BOX.w;

function inDakarBox(x: number, y: number) {
  const b = DAKAR_BOX;
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}
function toInset(x: number, y: number) {
  return { x: INSET.x + (x - DAKAR_BOX.x) * INSET_K, y: INSET.y + (y - DAKAR_BOX.y) * INSET_K };
}

// --- Composant ------------------------------------------------------------------------

export type MarkerKind = "siege" | "crts" | "banque" | "pts" | "depot" | "mobile" | "region";

export type MapMarker = {
  id: string;
  lng: number;
  lat: number;
  label: string;
  sub?: string;
  kind: MarkerKind;
};

const KIND_STYLE: Record<MarkerKind, { r: number; fill: string; stroke: string; core: string }> = {
  siege: { r: 13, fill: "var(--brand)", stroke: "#fff", core: "#fff" },
  crts: { r: 11, fill: "var(--red-800)", stroke: "#fff", core: "#fff" },
  banque: { r: 8.5, fill: "var(--red-500)", stroke: "#fff", core: "#fff" },
  pts: { r: 8.5, fill: "#fff", stroke: "var(--red-700)", core: "var(--red-700)" },
  depot: { r: 7, fill: "var(--ink-600)", stroke: "#fff", core: "#fff" },
  mobile: { r: 10, fill: "#fff", stroke: "var(--brand)", core: "var(--brand)" },
  region: { r: 7.5, fill: "var(--brand)", stroke: "#fff", core: "#fff" },
};

export const KIND_LABEL: Record<MarkerKind, string> = {
  siege: "Siège national",
  crts: "Centre régional (CRTS)",
  banque: "Banque de sang",
  pts: "Poste de transfusion (PTS)",
  depot: "Dépôt de sang",
  mobile: "Collecte mobile",
  region: "Chef-lieu de région",
};

/** Pastille du repère d'un type (légendes, filtres). */
export function KindDot({ kind, size = 14 }: { kind: MarkerKind; size?: number }) {
  const s = KIND_STYLE[kind];
  const light = s.stroke === "#fff";
  return (
    <svg width={size} height={size} viewBox="-15 -15 30 30" aria-hidden style={{ flexShrink: 0 }}>
      <circle r={12} fill={s.fill} stroke={light ? "var(--line-strong)" : s.stroke} strokeWidth={light ? 2 : 4} />
      <circle r={4.5} fill={s.core} />
    </svg>
  );
}

export function MapLegend({ kinds, style }: { kinds: MarkerKind[]; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px 16px",
        fontSize: 12.5,
        color: "var(--ink-600)",
        ...style,
      }}
    >
      {kinds.map((k) => {
        return (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <KindDot kind={k} />
            {KIND_LABEL[k]}
          </span>
        );
      })}
      <span style={{ marginLeft: "auto", color: "var(--ink-400)", fontSize: 11.5 }}>Fond de carte © simplemaps.com</span>
    </div>
  );
}

type Tip = { x: number; y: number; title: string; sub?: string };

export function SenegalMap({
  markers = [],
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  activeRegion,
  highlightAll,
  hoveredRegion,
  onRegionHover,
  onRegionSelect,
  regionNote,
  labels = true,
  dakarInset = true,
  overlay,
  tipOnSelect = true,
  ariaLabel = "Carte du Sénégal",
  style,
}: {
  markers?: MapMarker[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** Région mise en avant (sélection). */
  activeRegion?: string | null;
  /** Teinte « couverte » pour toutes les régions. */
  highlightAll?: boolean;
  hoveredRegion?: string | null;
  onRegionHover?: (id: string | null) => void;
  onRegionSelect?: (id: string) => void;
  /** Texte secondaire de l'infobulle d'une région survolée. */
  regionNote?: (id: string) => string | undefined;
  labels?: boolean;
  dakarInset?: boolean;
  /** Contenu HTML posé sur la carte (bas du cadre). */
  overlay?: ReactNode;
  /** Afficher l'infobulle du repère sélectionné (désactiver si un panneau la remplace). */
  tipOnSelect?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  const [localHoverRegion, setLocalHoverRegion] = useState<string | null>(null);
  const hovRegion = hoveredRegion !== undefined ? hoveredRegion : localHoverRegion;
  const setHovRegion = useCallback(
    (id: string | null) => {
      setLocalHoverRegion(id);
      onRegionHover?.(id);
    },
    [onRegionHover],
  );
  const regionsInteractive = Boolean(onRegionSelect || onRegionHover);

  const placed = useMemo(
    () =>
      spreadOverlaps(
        markers.map((m) => {
          const p = geoToSvg(m.lng, m.lat);
          const inset = dakarInset && inDakarBox(p.x, p.y);
          return { ...m, raw: p, pos: inset ? toInset(p.x, p.y) : p, inset };
        }),
      ),
    [markers, dakarInset],
  );

  // Infobulle : marqueur survolé > marqueur sélectionné > région survolée.
  const tipMarker = placed.find((m) => m.id === hoveredId) ?? (tipOnSelect ? placed.find((m) => m.id === selectedId) : undefined);
  let tip: Tip | null = null;
  if (tipMarker) {
    tip = { x: tipMarker.pos.x, y: tipMarker.pos.y - KIND_STYLE[tipMarker.kind].r, title: tipMarker.label, sub: tipMarker.sub };
  } else if (hovRegion && regionsInteractive) {
    const l = REGION_LABELS[hovRegion];
    tip = { x: l.x, y: l.y - 14, title: REGION_NAME[hovRegion], sub: regionNote?.(hovRegion) };
  }

  const fillFor = (id: string) => {
    if (activeRegion === id) return "var(--red-200)";
    if (hovRegion === id && regionsInteractive) return "var(--red-100)";
    return highlightAll ? "var(--red-50)" : "var(--sn-land)";
  };

  const regionPaths = (withEvents: boolean) =>
    REGIONS.map((r) => (
      <path
        key={r.id}
        d={r.d}
        className="sn-region"
        fill={fillFor(r.id)}
        stroke="var(--surface)"
        strokeWidth={withEvents ? 1.6 : 0.8}
        strokeLinejoin="round"
        style={{ cursor: withEvents && onRegionSelect ? "pointer" : undefined }}
        onMouseEnter={withEvents && regionsInteractive ? () => setHovRegion(r.id) : undefined}
        onMouseLeave={withEvents && regionsInteractive ? () => setHovRegion(null) : undefined}
        onClick={withEvents && onRegionSelect ? () => onRegionSelect(r.id) : undefined}
      />
    ));

  const renderMarker = (m: (typeof placed)[number]) => {
    const s = KIND_STYLE[m.kind];
    const on = m.id === selectedId;
    const hov = m.id === hoveredId;
    const interactive = Boolean(onSelect);
    return (
      <g
        key={m.id}
        className="sn-marker"
        data-on={on || hov ? "" : undefined}
        transform={`translate(${m.pos.x} ${m.pos.y})`}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `${m.label}${m.sub ? " — " + m.sub : ""}` : undefined}
        aria-pressed={interactive ? on : undefined}
        onClick={interactive ? () => onSelect?.(m.id) : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(m.id);
                }
              }
            : undefined
        }
        onMouseEnter={onHover ? () => onHover(m.id) : undefined}
        onMouseLeave={onHover ? () => onHover(null) : undefined}
        onFocus={onHover ? () => onHover(m.id) : undefined}
        onBlur={onHover ? () => onHover(null) : undefined}
      >
        {/* zone de clic généreuse */}
        <circle className="sn-hit" r={Math.max(22, s.r + 10)} fill="transparent" />
        {(m.kind === "siege" || on) && <circle className="sn-pulse" r={s.r + 4} fill={s.fill === "#fff" ? s.stroke : s.fill} />}
        <circle className="sn-focus" r={s.r + 7} fill="none" stroke="var(--ink-900)" strokeWidth={2.5} />
        <g className="sn-dot">
          <circle r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={s.r < 10 ? 3 : 4} filter="url(#sn-shadow)" />
          <circle r={s.r * 0.36} fill={s.core} />
        </g>
      </g>
    );
  };

  const insetMarkers = placed.filter((m) => m.inset);

  return (
    <div
      className="sn-map"
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--line)",
        background: "var(--sn-sea)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: `${SN_W} / ${SN_H}` }}>
        <svg
          viewBox={SN_VIEWBOX}
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, display: "block" }}
          role="group"
          aria-label={ariaLabel}
        >
          <defs>
            <filter id="sn-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="oklch(0.3 0.05 25)" floodOpacity="0.28" />
            </filter>
            <filter id="sn-land-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="oklch(0.35 0.05 30)" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Pays voisins / océan */}
          <g aria-hidden className="sn-context">
            <text x={62} y={178} className="sn-sea-label">
              <tspan x={62}>Océan</tspan>
              <tspan x={62} dy={20}>Atlantique</tspan>
            </text>
            {NEIGHBOURS.map((n) => (
              <text key={n.t} x={n.x} y={n.y} className="sn-neighbour">
                {n.t}
              </text>
            ))}
          </g>

          {/* Halo du contour national puis régions */}
          <g aria-hidden filter="url(#sn-land-shadow)">
            {REGIONS.map((r) => (
              <path key={r.id} d={r.d} fill="var(--sn-edge)" stroke="var(--sn-edge)" strokeWidth={5} strokeLinejoin="round" />
            ))}
            <path d={GAMBIA_D} fill="var(--sn-foreign)" stroke="var(--sn-edge)" strokeWidth={2} strokeLinejoin="round" />
          </g>
          <g>{regionPaths(true)}</g>
          <path d={GAMBIA_D} fill="var(--sn-foreign)" aria-hidden />
          <text x={392} y={528} className="sn-gambia" aria-hidden>
            GAMBIE
          </text>

          {labels && (
            <g aria-hidden style={{ pointerEvents: "none" }}>
              {REGIONS.filter((r) => !(dakarInset && r.id === "SNDK")).map((r) => {
                const l = REGION_LABELS[r.id];
                const strong = activeRegion === r.id || hovRegion === r.id;
                return (
                  <text key={r.id} x={l.x} y={l.y} className="sn-label" data-strong={strong ? "" : undefined}>
                    {r.name}
                  </text>
                );
              })}
            </g>
          )}

          {/* Encart Dakar */}
          {dakarInset && (
            <g>
              <line
                x1={DAKAR_BOX.x + DAKAR_BOX.w / 2}
                y1={DAKAR_BOX.y + DAKAR_BOX.h}
                x2={INSET.x + INSET.w / 2}
                y2={INSET.y}
                stroke="var(--ink-400)"
                strokeWidth={1.2}
                strokeDasharray="3 4"
                aria-hidden
              />
              <rect
                x={DAKAR_BOX.x}
                y={DAKAR_BOX.y}
                width={DAKAR_BOX.w}
                height={DAKAR_BOX.h}
                rx={6}
                fill="none"
                stroke="var(--ink-400)"
                strokeWidth={1.2}
                strokeDasharray="3 4"
                aria-hidden
              />
              <rect
                x={INSET.x}
                y={INSET.y}
                width={INSET.w}
                height={INSET.h}
                rx={10}
                fill="var(--sn-sea)"
                stroke="var(--line-strong)"
                strokeWidth={1.5}
                filter="url(#sn-land-shadow)"
                aria-hidden
              />
              <svg
                x={INSET.x}
                y={INSET.y}
                width={INSET.w}
                height={INSET.h}
                viewBox={`${DAKAR_BOX.x} ${DAKAR_BOX.y} ${DAKAR_BOX.w} ${DAKAR_BOX.h}`}
                aria-hidden
              >
                {regionPaths(false)}
              </svg>
              <rect
                x={INSET.x}
                y={INSET.y}
                width={INSET.w}
                height={INSET.h}
                rx={10}
                fill="none"
                stroke="var(--line-strong)"
                strokeWidth={1.5}
                aria-hidden
              />
              <text x={INSET.x + 10} y={INSET.y + 20} className="sn-inset-title" aria-hidden>
                Dakar
              </text>
            </g>
          )}

          {/* Repères : ceux de l'encart ont un point témoin sur la carte nationale */}
          <g aria-hidden>
            {insetMarkers.map((m) => (
              <circle key={m.id} cx={m.raw.x} cy={m.raw.y} r={4} fill="var(--brand)" stroke="#fff" strokeWidth={1.5} />
            ))}
          </g>
          <g>{placed.map(renderMarker)}</g>
        </svg>

        {tip && <MapTooltip tip={tip} />}
      </div>
      {overlay}
    </div>
  );
}

/** Écarte en couronne les repères qui se chevauchent (ex. deux structures du même hôpital). */
function spreadOverlaps<T extends { kind: MarkerKind; pos: { x: number; y: number }; inset: boolean }>(list: T[]): T[] {
  const out = list.map((m) => ({ ...m, pos: { ...m.pos } }));
  const done = new Set<number>();
  for (let i = 0; i < out.length; i++) {
    if (done.has(i)) continue;
    const group = [i];
    for (let j = i + 1; j < out.length; j++) {
      if (done.has(j) || out[j].inset !== out[i].inset) continue;
      const minD = KIND_STYLE[out[i].kind].r + KIND_STYLE[out[j].kind].r + 2;
      if (group.some((g) => Math.hypot(out[g].pos.x - out[j].pos.x, out[g].pos.y - out[j].pos.y) < minD)) group.push(j);
    }
    if (group.length < 2) continue;
    const cx = group.reduce((a, g) => a + out[g].pos.x, 0) / group.length;
    const cy = group.reduce((a, g) => a + out[g].pos.y, 0) / group.length;
    const maxR = Math.max(...group.map((g) => KIND_STYLE[out[g].kind].r));
    const radius = (maxR + 1.5) / Math.sin(Math.PI / Math.max(group.length, 2));
    // Ordre stable : on garde l'orientation d'origine (angle autour du centre).
    group
      .sort((a, b) => Math.atan2(out[a].pos.y - cy, out[a].pos.x - cx) - Math.atan2(out[b].pos.y - cy, out[b].pos.x - cx))
      .forEach((g, k) => {
        const angle = -Math.PI / 2 + (k * 2 * Math.PI) / group.length;
        out[g].pos = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
        done.add(g);
      });
  }
  return out;
}

function MapTooltip({ tip }: { tip: Tip }) {
  const below = tip.y < 150;
  const left = (tip.x / SN_W) * 100;
  const top = (tip.y / SN_H) * 100;
  // Ancrage à gauche / à droite près des bords pour ne jamais sortir du cadre.
  const horiz: CSSProperties =
    tip.x < 250
      ? { left: `max(6px, calc(${left}% - 16px))` }
      : tip.x > 750
        ? { right: `max(6px, calc(${100 - left}% - 16px))` }
        : { left: `${left}%` };
  const tx = tip.x < 250 || tip.x > 750 ? "0" : "-50%";
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        ...horiz,
        top: `${top}%`,
        transform: `translate(${tx}, ${below ? "34px" : "calc(-100% - 10px)"})`,
        background: "var(--ink-900)",
        color: "#fff",
        borderRadius: "var(--r-sm)",
        padding: "7px 11px",
        fontSize: 13,
        lineHeight: 1.3,
        boxShadow: "var(--sh-md)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        zIndex: 3,
      }}
    >
      <div style={{ fontWeight: 700 }}>{tip.title}</div>
      {tip.sub && <div style={{ opacity: 0.75, fontSize: 12 }}>{tip.sub}</div>}
    </div>
  );
}

/** Lien d'itinéraire (Google Maps) vers un point. */
export function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export const EXTERNAL_BTN: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 14px",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--line-strong)",
  background: "var(--surface)",
  color: "var(--ink-900)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  whiteSpace: "nowrap",
};
