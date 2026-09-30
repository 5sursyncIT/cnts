"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/cnts/icon";
import { SenegalMap, KindDot, REGION_NAME, directionsUrl, EXTERNAL_BTN, type MapMarker } from "@/components/cnts/senegal-map";
import {
  STRUCTURES,
  STRUCTURE_KIND_LABEL,
  STRUCTURE_KIND_PLURAL,
  structuresByRegion,
  summarize,
  type Structure,
  type StructureKind,
} from "@/components/cnts/structures";

type Filter = "tous" | Exclude<StructureKind, "siege">;
const FILTERS: Filter[] = ["tous", "crts", "banque", "pts", "depot"];
const KIND_ORDER: StructureKind[] = ["siege", "crts", "banque", "pts", "depot"];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const haystack = (s: Structure) => norm([s.name, s.commune, s.departement, REGION_NAME[s.region], s.hote, s.adresse ?? ""].join(" "));

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Carte interactive du réseau national des structures de transfusion sanguine :
 * filtres par type, recherche, sélection par région ou par repère, fiche et itinéraire.
 * `compact` : carte + filtres seulement (encarts de présentation).
 */
export function ReseauMap({
  structures = STRUCTURES,
  compact = false,
  style,
}: {
  /** Structures à afficher (CMS côté serveur ; repli : cartographie Excel). */
  structures?: Structure[];
  compact?: boolean;
  style?: CSSProperties;
}) {
  const [filter, setFilter] = useState<Filter>("tous");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { tous: structures.length, crts: 0, banque: 0, pts: 0, depot: 0 };
    for (const s of structures) if (s.kind !== "siege") c[s.kind]++;
    return c;
  }, [structures]);

  // Le siège reste toujours affiché : c'est le point de référence du réseau.
  const byType = useMemo(
    () => structures.filter((s) => filter === "tous" || s.kind === filter || s.kind === "siege"),
    [structures, filter],
  );
  const matches = useMemo(() => {
    const q = norm(query.trim());
    return q ? byType.filter((s) => haystack(s).includes(q)) : byType;
  }, [byType, query]);
  const perRegion = useMemo(() => structuresByRegion(matches), [matches]);
  const listed = useMemo(() => {
    const base = region ? (perRegion[region] ?? []) : matches;
    return [...base].sort(
      (a, b) =>
        REGION_NAME[a.region].localeCompare(REGION_NAME[b.region], "fr") ||
        KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
        a.name.localeCompare(b.name, "fr"),
    );
  }, [matches, perRegion, region]);

  const markers: MapMarker[] = useMemo(
    () =>
      matches.map((s) => ({
        id: s.id,
        lng: s.lng,
        lat: s.lat,
        kind: s.kind,
        label: s.name,
        sub: `${STRUCTURE_KIND_LABEL[s.kind]} · ${s.commune}`,
      })),
    [matches],
  );

  const current = matches.find((s) => s.id === selected) ?? null;
  const regionsCovered = Object.keys(perRegion).length;

  const select = (id: string, fromMap = false) => {
    const s = structures.find((x) => x.id === id);
    if (!s) return;
    setSelected((cur) => (cur === id ? null : id));
    if (region && region !== s.region) setRegion(s.region);
    const el = fromMap ? itemRefs.current[id] : null;
    if (el && el.offsetParent !== null) el.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const toggleRegion = (id: string) => {
    setRegion((r) => (r === id ? null : id));
    setSelected(null);
  };

  const reset = () => {
    setFilter("tous");
    setQuery("");
    setRegion(null);
    setSelected(null);
  };

  const filtersBar = (
    <div role="group" aria-label="Filtrer par type de structure" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {FILTERS.map((f) => {
        const on = filter === f;
        if (f !== "tous" && !counts[f]) return null;
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            onClick={() => {
              setFilter(f);
              setSelected(null);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: compact ? "6px 12px" : "8px 15px",
              borderRadius: "var(--r-pill)",
              fontSize: compact ? 12.5 : 13.5,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid " + (on ? "var(--brand)" : "var(--line-strong)"),
              background: on ? "var(--red-50)" : "var(--surface)",
              color: on ? "var(--red-800)" : "var(--ink-700)",
              transition: "background .15s, border-color .15s",
            }}
          >
            {f !== "tous" && <KindDot kind={f} size={13} />}
            {f === "tous" ? "Toutes" : STRUCTURE_KIND_PLURAL[f]}
            <span style={{ color: on ? "var(--red-700)" : "var(--ink-500)", fontWeight: 700 }}>{counts[f]}</span>
          </button>
        );
      })}
    </div>
  );

  const map = (
    <SenegalMap
      ariaLabel="Carte interactive des structures de transfusion sanguine du Sénégal"
      markers={markers}
      selectedId={current?.id ?? null}
      hoveredId={hovered}
      onSelect={(id) => select(id, true)}
      onHover={setHovered}
      activeRegion={region ?? current?.region ?? null}
      hoveredRegion={hoveredRegion}
      onRegionHover={setHoveredRegion}
      onRegionSelect={toggleRegion}
      regionNote={(id) => summarize(perRegion[id] ?? [])}
      labels={!compact}
      tipOnSelect={false}
      overlay={current ? <StructurePanel s={current} onClose={() => setSelected(null)} /> : null}
    />
  );

  if (compact) {
    return (
      <div style={{ display: "grid", gap: 12, ...style }}>
        {filtersBar}
        {map}
      </div>
    );
  }

  return (
    <div style={style}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        {filtersBar}
        <label htmlFor="reseau-search" style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
          <span className="sr-only">Rechercher une structure</span>
          <Icon name="search" size={17} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-500)" }} />
          <input
            id="reseau-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="Ville, hôpital, région…"
            className="cn-input"
            style={{ width: "100%", paddingLeft: 38 }}
          />
        </label>
      </div>

      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: 22, alignItems: "start" }}>
        <div className="reseau-map-sticky">{map}</div>

        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            background: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "min(640px, 80vh)",
            minHeight: 320,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div aria-live="polite" style={{ fontSize: 13.5, color: "var(--ink-700)", flex: 1, minWidth: 0 }}>
              <strong style={{ color: "var(--ink-900)" }}>{listed.length}</strong> structure{listed.length > 1 ? "s" : ""}
              {region ? (
                <> · Région de {REGION_NAME[region]}</>
              ) : (
                <>
                  {" "}
                  · {regionsCovered} région{regionsCovered > 1 ? "s" : ""}
                </>
              )}
            </div>
            {region && (
              <button type="button" onClick={() => setRegion(null)} style={chipBtn}>
                Toutes les régions
                <Icon name="x" size={13} />
              </button>
            )}
            {!region && (filter !== "tous" || query) && (
              <button type="button" onClick={reset} style={chipBtn}>
                Réinitialiser
              </button>
            )}
          </div>

          {listed.length === 0 ? (
            <div style={{ padding: 20, fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>
              Aucune structure ne correspond à ces critères.{" "}
              <button type="button" onClick={reset} style={{ ...linkBtn }}>
                Tout afficher
              </button>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 6, overflowY: "auto", flex: 1 }}>
              {listed.map((s, i) => {
                const newRegion = !region && (i === 0 || listed[i - 1].region !== s.region);
                const on = current?.id === s.id;
                const hov = hovered === s.id;
                return (
                  <li
                    key={s.id}
                    ref={(el) => {
                      itemRefs.current[s.id] = el;
                    }}
                    style={{ scrollMarginTop: 40 }}
                  >
                    {newRegion && (
                      <button
                        type="button"
                        onClick={() => toggleRegion(s.region)}
                        onMouseEnter={() => setHoveredRegion(s.region)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          display: "block",
                          padding: "10px 10px 4px",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          color: "var(--ink-500)",
                        }}
                      >
                        {REGION_NAME[s.region]} · {perRegion[s.region]?.length}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => select(s.id)}
                      onMouseEnter={() => setHovered(s.id)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(s.id)}
                      onBlur={() => setHovered(null)}
                      style={{
                        all: "unset",
                        boxSizing: "border-box",
                        width: "100%",
                        cursor: "pointer",
                        display: "flex",
                        gap: 11,
                        alignItems: "flex-start",
                        padding: "10px 10px",
                        borderRadius: "var(--r-md)",
                        background: on ? "var(--red-50)" : hov ? "var(--surface-1)" : "transparent",
                        outline: on ? "1px solid var(--red-200)" : "none",
                        transition: "background .12s",
                      }}
                    >
                      <span style={{ marginTop: 3 }}>
                        <KindDot kind={s.kind} size={15} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 650, color: "var(--ink-900)", lineHeight: 1.3 }}>{s.name}</span>
                        <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-600)", marginTop: 2 }}>
                          {STRUCTURE_KIND_LABEL[s.kind]} · {s.commune}
                          {s.departement !== s.commune ? ` (${s.departement})` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StructurePanel({ s, onClose }: { s: Structure; onClose: () => void }) {
  const where = [s.adresse, s.repere ? `repère : ${s.repere}` : null].filter(Boolean).join(" · ");
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        padding: "12px 16px",
        borderTop: "1px solid var(--line)",
        background: "var(--surface)",
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 260px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--ink-500)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <KindDot kind={s.kind} size={11} />
          {STRUCTURE_KIND_LABEL[s.kind]} · Région de {REGION_NAME[s.region]}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.25, marginTop: 2 }}>{s.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-600)", marginTop: 2 }}>
          {s.commune}
          {s.departement !== s.commune ? `, ${s.departement}` : ""}
          {s.kind !== "siege" && s.hote && !["CRTS", "PTS"].includes(s.hote) ? ` · ${s.hote}` : ""}
        </div>
        {where && <div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>{where}</div>}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <a href={directionsUrl(s.lat, s.lng)} target="_blank" rel="noopener noreferrer" style={EXTERNAL_BTN}>
          <Icon name="pin" size={16} />
          Itinéraire
        </a>
        <button type="button" onClick={onClose} aria-label="Fermer la fiche" style={{ ...chipBtn, padding: 8 }}>
          <Icon name="x" size={15} />
        </button>
      </div>
    </div>
  );
}

const chipBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 11px",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--line-strong)",
  background: "var(--surface)",
  color: "var(--ink-700)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

const linkBtn: CSSProperties = {
  all: "unset",
  cursor: "pointer",
  color: "var(--brand)",
  fontWeight: 600,
  textDecoration: "underline",
};
