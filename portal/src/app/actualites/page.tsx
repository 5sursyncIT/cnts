"use client";

import Image from "next/image";
import { useState } from "react";
import { Button, Card, PageBanner } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { frDate } from "@/components/cnts/format";
import { news, communiques } from "@/components/cnts/data";

const FALLBACK_IMG = "/images/illustration-don-sang.svg";
const cats = ["Tous", ...Array.from(new Set(news.map((n) => n.cat)))];

export default function ActualitesPage() {
  const [cat, setCat] = useState("Tous");
  const list = news.filter((n) => (cat === "Tous" ? true : n.cat === cat));
  const [feat, ...rest] = list.length ? list : news;

  return (
    <div>
      <PageBanner
        kicker="Actualités & Événements"
        title="Toute l’actualité du CNTS."
        sub="Campagnes, événements, avancées scientifiques et vie du réseau national de transfusion."
      />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--r-pill)",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .15s",
                border: "1px solid " + (cat === c ? "var(--brand)" : "var(--line-strong)"),
                background: cat === c ? "var(--brand)" : "var(--surface)",
                color: cat === c ? "#fff" : "var(--ink-700)",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Featured */}
        {feat && (
          <Card pad={0} hover style={{ overflow: "hidden", marginBottom: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr" }} className="two-col">
              <div style={{ position: "relative", minHeight: 280, background: "var(--surface-3)" }}>
                <Image src={feat.img ?? FALLBACK_IMG} alt={feat.title} fill sizes="(max-width: 900px) 100vw, 620px" style={{ objectFit: "cover" }} />
              </div>
              <div style={{ padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--brand)",
                      background: "var(--red-50)",
                      padding: "4px 10px",
                      borderRadius: "var(--r-pill)",
                    }}
                  >
                    {feat.cat}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{frDate(feat.date)}</span>
                </div>
                <h2
                  className="font-serif"
                  style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}
                >
                  {feat.title}
                </h2>
                <p style={{ fontSize: 15, color: "var(--ink-600)", lineHeight: 1.6, marginBottom: 18 }}>{feat.excerpt}</p>
                <div>
                  <Button variant="outline" size="sm" iconRight="arrowR" href={`/actualites/${feat.slug}`}>
                    Lire l’article
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="grid-3">
          {rest.map((n) => (
            <Card key={n.slug} pad={0} hover href={`/actualites/${n.slug}`} style={{ overflow: "hidden" }}>
              <div style={{ position: "relative", height: 160, background: "var(--surface-3)" }}>
                <Image src={n.img ?? FALLBACK_IMG} alt={n.title} fill sizes="(max-width: 900px) 100vw, 380px" style={{ objectFit: "cover" }} />
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span
                    style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand)" }}
                  >
                    {n.cat}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
                    {frDate(n.date, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.25, marginBottom: 8 }}>{n.title}</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.5 }}>{n.excerpt}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Communiqués / publications officiels */}
        <section style={{ marginTop: 44 }}>
          <h2
            className="font-serif"
            style={{ fontSize: "clamp(22px, 2.6vw, 28px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 6 }}
          >
            Communiqués &amp; publications
          </h2>
          <p style={{ color: "var(--ink-600)", fontSize: 15, marginBottom: 18 }}>
            Documents officiels et travaux scientifiques du CNTS.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {communiques.map((c, i) => (
              <Card key={i} pad={18} hover>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="chart" size={21} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 3 }}>
                      {c.source} · {frDate(c.date, { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <Icon name="arrowR" size={18} style={{ color: "var(--ink-400)" }} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div
          style={{
            marginTop: 26,
            padding: 24,
            borderRadius: "var(--r-lg)",
            background: "var(--surface-1)",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--brand)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="calendar" size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Collectes à venir</div>
              <div style={{ fontSize: 13.5, color: "var(--ink-600)" }}>Trouvez une collecte mobile près de chez vous.</div>
            </div>
          </div>
          <Button variant="primary" iconRight="arrowR" href="/collectes">
            Voir les collectes
          </Button>
        </div>
      </div>
    </div>
  );
}
