"use client";

import { useMemo, useRef, useState } from "react";
import { Card, Button, PageBanner } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { centers, org, type Center } from "@/components/cnts/data";
import {
  SenegalMap,
  MapLegend,
  regionOf,
  directionsUrl,
  EXTERNAL_BTN,
  REGION_NAME,
  type MapMarker,
  type MarkerKind,
} from "@/components/cnts/senegal-map";

type Filter = "tous" | "fixe" | "mobile";

const kindOf = (c: Center): MarkerKind => (c.siege ? "siege" : c.type === "mobile" ? "mobile" : "crts");

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string, string?][];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={className}
      style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}
    >
      {options.map(([k, l, icon]) => {
        const on = value === k;
        return (
          <button
            key={k}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(k)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: "var(--r-pill)",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid " + (on ? "var(--brand)" : "var(--line-strong)"),
              background: on ? "var(--brand)" : "var(--surface)",
              color: on ? "#fff" : "var(--ink-700)",
              transition: "all .15s",
            }}
          >
            {icon && <Icon name={icon} size={16} />}
            {l}
          </button>
        );
      })}
    </div>
  );
}

export default function CollectesPage() {
  const [filter, setFilter] = useState<Filter>("tous");
  const [view, setView] = useState<"list" | "map">("list");
  const [active, setActive] = useState<string | null>(centers[0]?.id ?? null);
  const [hovered, setHovered] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const list = useMemo(() => centers.filter((c) => (filter === "tous" ? true : c.type === filter)), [filter]);
  const counts = {
    tous: centers.length,
    fixe: centers.filter((c) => c.type === "fixe").length,
    mobile: centers.filter((c) => c.type === "mobile").length,
  };

  const markers: MapMarker[] = useMemo(
    () =>
      list.map((c) => ({
        id: c.id,
        lng: c.lng,
        lat: c.lat,
        label: c.name,
        sub: c.city,
        kind: kindOf(c),
      })),
    [list],
  );

  // La sélection suit le filtre : si le centre choisi est masqué, on prend le premier visible.
  const activeCenter = list.find((c) => c.id === active) ?? list[0] ?? null;
  const activeRegion = activeCenter ? regionOf(activeCenter.lng, activeCenter.lat) : null;

  const selectFromMap = (id: string) => {
    setActive(id);
    const el = cardRefs.current[id];
    // Ne défile que si la liste est visible (sur mobile en vue « Carte », elle est masquée).
    if (el && el.offsetParent !== null) {
      el.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  };

  return (
    <div>
      <PageBanner
        kicker="Collectes & centres"
        title="Où donner son sang ?"
        sub={`Le siège du CNTS à Dakar-Fann et le réseau de ${org.structures} structures de transfusion accueillent les donneurs. Les collectes mobiles sont organisées dans les entreprises, administrations et universités.`}
      />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 22,
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Segmented<Filter>
            ariaLabel="Filtrer les lieux de don"
            value={filter}
            onChange={setFilter}
            options={[
              ["tous", `Tous · ${counts.tous}`],
              ["fixe", `Centres fixes · ${counts.fixe}`],
              ["mobile", `Collectes mobiles · ${counts.mobile}`],
            ]}
          />
          <Segmented<"list" | "map">
            ariaLabel="Affichage"
            className="collectes-toggle"
            value={view}
            onChange={setView}
            options={[
              ["list", "Liste", "menu"],
              ["map", "Carte", "map"],
            ]}
          />
        </div>

        <div
          className="two-col collectes-layout"
          data-view={view}
          style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 24, alignItems: "start" }}
        >
          <div className="collectes-list">
            {list.length === 0 && <EmptyMobile />}
            {list.map((c) => {
              const on = activeCenter?.id === c.id;
              const hov = hovered === c.id;
              return (
                <div
                  key={c.id}
                  ref={(el) => {
                    cardRefs.current[c.id] = el;
                  }}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ scrollMarginTop: 100 }}
                >
                  <Card
                    pad={18}
                    hover
                    onClick={() => setActive(c.id)}
                    style={{
                      borderColor: on ? "var(--brand)" : hov ? "var(--line-strong)" : "var(--line)",
                      boxShadow: on ? "var(--ring)" : "var(--sh-xs)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <KindBadge kind={kindOf(c)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, lineHeight: 1.25 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActive(c.id);
                            }}
                            aria-pressed={on}
                            style={{ all: "unset", cursor: "pointer" }}
                          >
                            {c.name}
                          </button>
                        </h3>
                        <div style={{ fontSize: 13, color: "var(--ink-600)", marginBottom: 2 }}>
                          {c.area}, {c.city}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink-600)" }}>{c.hours}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button size="sm" variant="primary" icon="calendarCheck" href="/espace-patient/rendez-vous">
                        Réserver
                      </Button>
                      <Button size="sm" variant="ghost" icon="phone" href={`tel:${org.phone.replace(/\s/g, "")}`}>
                        Appeler
                      </Button>
                      <a
                        href={directionsUrl(c.lat, c.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ ...EXTERNAL_BTN, border: "1px solid transparent", background: "transparent", color: "var(--ink-800)" }}
                      >
                        <Icon name="pin" size={17} />
                        Itinéraire
                      </a>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          <div className="collectes-map" style={{ position: "sticky", top: 90 }}>
            <SenegalMap
              tipOnSelect={false}
              ariaLabel="Carte des lieux de don au Sénégal"
              markers={markers}
              selectedId={activeCenter?.id ?? null}
              hoveredId={hovered}
              onSelect={selectFromMap}
              onHover={setHovered}
              activeRegion={activeRegion}
              overlay={
                activeCenter ? (
                  <SelectedPanel c={activeCenter} region={activeRegion} />
                ) : list.length === 0 ? (
                  <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, color: "var(--ink-600)" }}>
                    Aucune collecte mobile annoncée pour le moment.
                  </div>
                ) : null
              }
            />
            <MapLegend kinds={["siege", "crts", "mobile"]} style={{ marginTop: 10 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: MarkerKind }) {
  const map: Record<MarkerKind, { icon: string; bg: string; fg: string }> = {
    siege: { icon: "building", bg: "var(--red-50)", fg: "var(--brand)" },
    crts: { icon: "drop", bg: "var(--red-50)", fg: "var(--red-800)" },
    mobile: { icon: "map", bg: "var(--surface-3)", fg: "var(--ink-700)" },
    region: { icon: "pin", bg: "var(--surface-3)", fg: "var(--ink-700)" },
  };
  const s = map[kind];
  return (
    <div
      aria-hidden
      style={{
        width: 40,
        height: 40,
        borderRadius: "var(--r-md)",
        background: s.bg,
        color: s.fg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <Icon name={s.icon} size={20} />
    </div>
  );
}

function SelectedPanel({ c, region }: { c: Center; region: string | null }) {
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
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Sélectionné{region ? ` · Région de ${REGION_NAME[region]}` : ""}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.25 }}>{c.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>{c.hours}</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={directionsUrl(c.lat, c.lng)} target="_blank" rel="noopener noreferrer" style={EXTERNAL_BTN}>
          <Icon name="pin" size={16} />
          Itinéraire
        </a>
        <Button size="sm" variant="primary" icon="calendarCheck" href="/espace-patient/rendez-vous">
          Réserver
        </Button>
      </div>
    </div>
  );
}

function EmptyMobile() {
  return (
    <Card pad={22}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Aucune collecte mobile annoncée pour le moment</h3>
      <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55, marginBottom: 14 }}>
        Les prochaines collectes sont annoncées dans nos actualités. Vous souhaitez en organiser une dans votre entreprise,
        administration ou association ? Contactez-nous au {org.phone}.
      </p>
      <Button size="sm" variant="outline" iconRight="arrowR" href="/services/promotion-don">
        Organiser une collecte
      </Button>
    </Card>
  );
}
