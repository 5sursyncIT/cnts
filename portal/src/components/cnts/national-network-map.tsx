"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/cnts/icon";
import { SenegalMap, MapLegend, REGION_POINTS, type MapMarker } from "@/components/cnts/senegal-map";
import { STRUCTURES, STRUCTURE_KIND_LABEL, structuresByRegion, summarize, type Structure } from "@/components/cnts/structures";

export function NationalNetworkMap({
  regions,
  structures = STRUCTURES,
  children,
}: {
  regions: string[];
  /** Structures du réseau (CMS côté serveur ; repli : cartographie Excel). */
  structures?: Structure[];
  children?: React.ReactNode;
}) {
  const BY_REGION = useMemo(() => structuresByRegion(structures), [structures]);
  const noteFor = (id: string) => {
    const list = BY_REGION[id];
    return list?.length ? summarize(list) : "Région couverte par le réseau national";
  };

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const idByName = useMemo(() => Object.fromEntries(REGION_POINTS.map((p) => [p.name, p.id])), []);

  const markers: MapMarker[] = useMemo(
    () =>
      structures.map((s) => ({
        id: s.id,
        lng: s.lng,
        lat: s.lat,
        kind: s.kind,
        label: s.name,
        sub: `${STRUCTURE_KIND_LABEL[s.kind]} · ${s.commune}`,
      })),
    [structures],
  );
  const regionOfMarker = useMemo(() => Object.fromEntries(structures.map((s) => [s.id, s.region])), [structures]);

  const toggle = (id: string) => setSelected((s) => (s === id ? null : id));
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const focus = hovered ?? (hoveredMarker ? regionOfMarker[hoveredMarker] : null) ?? selected;

  return (
    <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 30, alignItems: "center" }}>
      <div>
        <SenegalMap
          ariaLabel="Carte des régions couvertes par le réseau du CNTS"
          highlightAll
          markers={markers}
          hoveredId={hoveredMarker}
          onSelect={(id) => toggle(regionOfMarker[id])}
          onHover={setHoveredMarker}
          activeRegion={focus}
          hoveredRegion={hovered}
          onRegionHover={setHovered}
          onRegionSelect={toggle}
          regionNote={noteFor}
        />
        <MapLegend kinds={["siege", "crts", "banque", "pts", "depot"]} style={{ marginTop: 10 }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignContent: "center" }}>
        {regions.map((name) => {
          const id = idByName[name];
          const on = id === selected;
          const hov = id === hovered;
          const count = id ? (BY_REGION[id]?.length ?? 0) : 0;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => id && toggle(id)}
              onMouseEnter={() => id && setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => id && setHovered(id)}
              onBlur={() => setHovered(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: "var(--r-pill)",
                border: "1px solid " + (on ? "var(--brand)" : hov ? "var(--red-200)" : "var(--line)"),
                background: on ? "var(--brand)" : hov ? "var(--red-50)" : "var(--surface)",
                color: on ? "#fff" : "var(--ink-700)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background .15s, border-color .15s, color .15s",
              }}
            >
              <Icon name={count ? "drop" : "pin"} size={15} style={{ color: on ? "#fff" : "var(--brand)" }} />
              {name}
              {count > 0 && <span style={{ fontSize: 12, fontWeight: 700, opacity: on ? 0.85 : 0.55 }}>{count}</span>}
            </button>
          );
        })}
        {children}
      </div>
    </div>
  );
}
