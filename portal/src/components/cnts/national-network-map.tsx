"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/cnts/icon";
import { centers } from "@/components/cnts/data";
import { SenegalMap, MapLegend, REGION_POINTS, regionOf, KIND_LABEL, type MapMarker } from "@/components/cnts/senegal-map";

// Structures connues par région (siège, CRTS) — les autres régions sont rattachées au réseau national.
const CENTER_BY_REGION = Object.fromEntries(centers.map((c) => [regionOf(c.lng, c.lat), c]));

function noteFor(id: string) {
  const c = CENTER_BY_REGION[id];
  if (!c) return "Région couverte par le réseau national";
  return c.siege ? KIND_LABEL.siege + " du CNTS" : c.name;
}

export function NationalNetworkMap({ regions, children }: { regions: string[]; children?: React.ReactNode }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const idByName = useMemo(() => Object.fromEntries(REGION_POINTS.map((p) => [p.name, p.id])), []);

  const markers: MapMarker[] = useMemo(
    () =>
      REGION_POINTS.map((p) => {
        const c = CENTER_BY_REGION[p.id];
        return c
          ? { id: p.id, lng: c.lng, lat: c.lat, kind: c.siege ? "siege" : "crts", label: p.name, sub: noteFor(p.id) }
          : { id: p.id, lng: p.lng, lat: p.lat, kind: "region", label: p.name, sub: noteFor(p.id) };
      }),
    [],
  );

  const toggle = (id: string) => setSelected((s) => (s === id ? null : id));
  const focus = hovered ?? selected;

  return (
    <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 30, alignItems: "center" }}>
      <div>
        <SenegalMap
          ariaLabel="Carte des régions couvertes par le réseau du CNTS"
          highlightAll
          markers={markers}
          selectedId={selected}
          hoveredId={hovered}
          onSelect={toggle}
          onHover={setHovered}
          activeRegion={focus}
          hoveredRegion={hovered}
          onRegionHover={setHovered}
          onRegionSelect={toggle}
          regionNote={noteFor}
        />
        <MapLegend kinds={["siege", "crts", "region"]} style={{ marginTop: 10 }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignContent: "center" }}>
        {regions.map((name) => {
          const id = idByName[name];
          const on = id === selected;
          const hov = id === hovered;
          const hasCenter = Boolean(id && CENTER_BY_REGION[id]);
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
              <Icon name={hasCenter ? "drop" : "pin"} size={15} style={{ color: on ? "#fff" : "var(--brand)" }} />
              {name}
            </button>
          );
        })}
        {children}
      </div>
    </div>
  );
}
