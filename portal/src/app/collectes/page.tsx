"use client";

import { useState } from "react";
import { Card, Button, PageBanner } from "@/components/cnts/primitives";
import { centers, org } from "@/components/cnts/data";
import { SenegalMap, geoToSvg } from "@/components/cnts/senegal-map";

// Rattachement ville → région (code SimpleMaps) pour surligner la région active.
const CITY_REGION: Record<string, string> = {
  Dakar: "SNDK",
  Kaolack: "SNKL",
};

type Pin = { id: string; name: string; region: string; x: number; y: number; sx: number; sy: number };

// Projection des centres + écartement des pins trop proches (cluster de Dakar).
function buildPins(): Pin[] {
  const base = centers.map((c) => {
    const { x, y } = geoToSvg(c.lng, c.lat);
    return { id: c.id, name: c.name, region: CITY_REGION[c.city] ?? "", x, y };
  });
  const CLUSTER = 45;
  const RING = 34;
  const groups: { cx: number; cy: number; items: typeof base }[] = [];
  base.forEach((p) => {
    const g = groups.find((g) => Math.hypot(g.cx - p.x, g.cy - p.y) < CLUSTER);
    if (g) g.items.push(p);
    else groups.push({ cx: p.x, cy: p.y, items: [p] });
  });
  const out: Pin[] = [];
  groups.forEach((g) => {
    if (g.items.length === 1) {
      const p = g.items[0];
      out.push({ ...p, sx: p.x, sy: p.y });
      return;
    }
    g.items.forEach((p, i) => {
      const ang = (Math.PI * 2 * i) / g.items.length - Math.PI / 2;
      out.push({ ...p, sx: g.cx + Math.cos(ang) * RING, sy: g.cy + Math.sin(ang) * RING });
    });
  });
  return out;
}

const PINS = buildPins();

export default function CollectesPage() {
  const [filter, setFilter] = useState<"tous" | "fixe" | "mobile">("tous");
  const [active, setActive] = useState(centers[0].id);
  const list = centers.filter((c) => (filter === "tous" ? true : c.type === filter));
  const filters: [("tous" | "fixe" | "mobile"), string][] = [
    ["tous", "Tous"],
    ["fixe", "Centres fixes"],
    ["mobile", "Collectes mobiles"],
  ];
  const activeCenter = centers.find((c) => c.id === active);
  const activeRegion = activeCenter ? CITY_REGION[activeCenter.city] ?? "" : "";

  return (
    <div>
      <PageBanner
        kicker="Collectes & centres"
        title="Où donner son sang ?"
        sub={`Le siège du CNTS à Dakar-Fann et le réseau de ${org.structures} structures de transfusion accueillent les donneurs. Les collectes mobiles sont organisées dans les entreprises, administrations et universités.`}
      />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {filters.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{
                padding: "9px 18px",
                borderRadius: "var(--r-pill)",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid " + (filter === k ? "var(--brand)" : "var(--line-strong)"),
                background: filter === k ? "var(--brand)" : "var(--surface)",
                color: filter === k ? "#fff" : "var(--ink-700)",
                transition: "all .15s",
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div
          className="two-col"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 24, alignItems: "start" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {list.length === 0 && (
              <Card pad={22}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Aucune collecte mobile annoncée pour le moment</h3>
                <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55, marginBottom: 14 }}>
                  Les prochaines collectes sont annoncées dans nos actualités. Vous souhaitez en organiser une dans votre
                  entreprise, administration ou association ? Contactez-nous au {org.phone}.
                </p>
                <Button size="sm" variant="outline" iconRight="arrowR" href="/services/promotion-don">
                  Organiser une collecte
                </Button>
              </Card>
            )}
            {list.map((c) => (
              <Card
                key={c.id}
                pad={18}
                hover
                onClick={() => setActive(c.id)}
                style={{
                  borderColor: active === c.id ? "var(--brand)" : "var(--line)",
                  boxShadow: active === c.id ? "var(--ring)" : "var(--sh-xs)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, lineHeight: 1.25 }}>{c.name}</h3>
                    <div style={{ fontSize: 13, color: "var(--ink-600)", marginBottom: 2 }}>
                      {c.area}, {c.city}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-600)" }}>{c.hours}</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                  <Button size="sm" variant="primary" icon="calendarCheck" href="/espace-patient/rendez-vous">
                    Réserver
                  </Button>
                  <Button size="sm" variant="ghost" icon="phone" href={`tel:${org.phone.replace(/\s/g, "")}`}>
                    Appeler
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div style={{ position: "sticky", top: 90 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1000 / 736",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--line)",
                background: "var(--surface-1)",
                overflow: "hidden",
                padding: 12,
              }}
            >
              {activeCenter && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    zIndex: 2,
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r-md)",
                    boxShadow: "var(--sh-sm)",
                    padding: "8px 13px",
                    maxWidth: "65%",
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Sélectionné
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.2 }}>
                    {activeCenter.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>{activeCenter.city}</div>
                </div>
              )}
              <SenegalMap activeRegion={activeRegion}>
                {PINS.map((p) => {
                  const on = active === p.id;
                  return (
                    <g
                      key={p.id}
                      onClick={() => setActive(p.id)}
                      style={{ cursor: "pointer" }}
                      transform={`translate(${p.sx} ${p.sy})`}
                    >
                      <title>{p.name}</title>
                      <circle r={on ? 24 : 16} fill={on ? "var(--brand)" : "var(--red-700)"} stroke="#fff" strokeWidth={4} opacity={on ? 1 : 0.92}>
                        {on && <animate attributeName="r" values="20;26;20" dur="1.6s" repeatCount="indefinite" />}
                      </circle>
                      <circle r={on ? 7 : 5} fill="#fff" />
                    </g>
                  );
                })}
              </SenegalMap>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-500)", textAlign: "right" }}>
              Carte © simplemaps.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
