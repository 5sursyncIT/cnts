import type { ReactNode } from "react";
import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle, StatusPill } from "@/components/cnts/primitives";
import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { celluleRecherche, communiques, projectStatusLabel, research, type ProjectStatus } from "@/components/cnts/data";

export const metadata = {
  title: "Recherche & Innovation — CNTS Sénégal",
  description:
    "Le CNTS place la recherche et l’innovation au cœur de sa mission de santé publique : Cellule de recherche, projets, publications et appels à collaboration.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

const statusTone: Record<ProjectStatus, "ok" | "warn" | "info"> = {
  "en-cours": "ok",
  preparation: "warn",
  termine: "info",
};

export default function RecherchePage() {
  return (
    <div>
      <PageBanner
        kicker="Recherche & Innovation"
        title="Innover pour mieux soigner et garantir une transfusion sûre pour tous."
        sub="À travers sa cellule de recherche, ses publications et ses partenariats scientifiques, le CNTS contribue à l’évolution des pratiques transfusionnelles et à la diffusion du savoir médical au Sénégal et à l’international."
      />

      {/* Cellule de recherche */}
      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <SectionTitle kicker="Depuis août 2025" title="La Cellule de recherche du CNTS" />
            <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.65 }}>{celluleRecherche.intro}</p>
          </div>
          <Image
            src="/images/recherche-1.jpg"
            alt="Équipe de recherche du CNTS"
            width={560}
            height={400}
            priority
            style={{ width: "100%", height: "auto", borderRadius: "var(--r-lg)", objectFit: "cover" }}
          />
        </div>

        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 36 }}>
          {celluleRecherche.axes.map((a) => (
            <Card key={a.t} pad={24}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--red-50)",
                  color: "var(--brand)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Icon name={a.icon} size={22} />
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 6 }}>{a.t}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>{a.d}</p>
            </Card>
          ))}
        </div>
      </MaxWrap>

      {/* Projets */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Projets en cours & collaborations"
            title="Nos projets de recherche"
            sub="Des projets menés en partenariat avec des institutions nationales et internationales pour renforcer la sécurité transfusionnelle."
            action={
              <Button variant="ghost" iconRight="arrowR" href="/recherche/projets">
                Tous les projets
              </Button>
            }
          />
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {research.map((r) => (
              <Card key={r.t} pad={24} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <StatusPill status={statusTone[r.status]}>{projectStatusLabel[r.status]}</StatusPill>
                </div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700 }}>{r.t}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55, flex: 1 }}>{r.d}</p>
                <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600 }}>{r.partners}</div>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      {/* Publications */}
      <MaxWrap>
        <SectionTitle
          kicker="Publications & abstracts"
          title="Les connaissances partagées au service de la santé publique"
          sub="Le CNTS valorise la production scientifique de ses équipes à travers la diffusion d’articles, de rapports et de résumés de recherche."
          action={
            <Button variant="ghost" iconRight="arrowR" href="/recherche/publications">
              Toutes les publications
            </Button>
          }
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {communiques.map((c) => (
            <Card key={c.title} pad={20}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <Icon name="flask" size={22} style={{ color: "var(--brand)", marginTop: 2 }} />
                <div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700 }}>{c.title}</h3>
                  <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 3 }}>
                    {c.source} · {frDate(c.date)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </MaxWrap>

      {/* Appel à collaboration */}
      <section style={{ background: "var(--red-900)", color: "#fff" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "var(--gutter)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <h2
              className="font-serif"
              style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.12 }}
            >
              Ensemble, construisons la transfusion de demain.
            </h2>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 15, marginTop: 8, lineHeight: 1.55 }}>
              Chercheurs, étudiants et institutions : rejoignez un projet existant ou proposez une nouvelle initiative.
            </p>
          </div>
          <Button size="lg" variant="light" icon="users" href="/recherche/appels">
            Appels à collaboration
          </Button>
        </div>
      </section>
    </div>
  );
}
