import type { ReactNode } from "react";
import { Button, Card, PageBanner, SectionTitle, StatusPill } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { projectStatusLabel, research, type ProjectStatus } from "@/components/cnts/data";

export const metadata = {
  title: "Projets de recherche — CNTS Sénégal",
  description:
    "Projets scientifiques et techniques menés par le CNTS en partenariat avec des institutions nationales et internationales : dépistage moléculaire, anémies génétiques, traçabilité par QR code.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

const statusTone: Record<ProjectStatus, "ok" | "warn" | "info"> = {
  "en-cours": "ok",
  preparation: "warn",
  termine: "info",
};

const statusOrder: ProjectStatus[] = ["en-cours", "preparation", "termine"];

export default function ProjetsPage() {
  return (
    <div>
      <PageBanner
        kicker="Recherche & Innovation"
        title="Projets en cours & collaborations"
        sub="Le CNTS développe des projets scientifiques et techniques en partenariat avec des institutions nationales et internationales, pour renforcer la sécurité transfusionnelle, améliorer la prise en charge des patients et promouvoir la recherche en hématologie et biologie."
      />

      <MaxWrap>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 26 }}>
          {statusOrder.map((s) => (
            <StatusPill key={s} status={statusTone[s]}>
              {projectStatusLabel[s]} · {research.filter((r) => r.status === s).length}
            </StatusPill>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {research.map((r, i) => (
            <Card key={r.t} pad={26}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <span
                  className="font-serif"
                  style={{ fontSize: 30, fontWeight: 500, color: "var(--red-200)", lineHeight: 1, flexShrink: 0 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    <h2 style={{ fontSize: 19, fontWeight: 700 }}>{r.t}</h2>
                    <StatusPill status={statusTone[r.status]}>{projectStatusLabel[r.status]}</StatusPill>
                  </div>
                  <p style={{ fontSize: 15, color: "var(--ink-600)", lineHeight: 1.6 }}>{r.d}</p>
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      fontSize: 13.5,
                      color: "var(--ink-700)",
                      padding: "10px 14px",
                      background: "var(--surface-1)",
                      borderRadius: "var(--r-sm)",
                    }}
                  >
                    <Icon name="users" size={17} style={{ color: "var(--brand)" }} />
                    <span>
                      <strong style={{ fontWeight: 700 }}>Partenaires :</strong> {r.partners}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p
          className="font-serif"
          style={{
            marginTop: 40,
            textAlign: "center",
            fontSize: "clamp(22px, 2.8vw, 30px)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink-900)",
          }}
        >
          « Ensemble, faisons progresser la transfusion et la science. »
        </p>
      </MaxWrap>

      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Collaborer"
            title="Rejoindre un projet ou en proposer un"
            sub="Les demandes sont examinées par la Cellule de recherche du CNTS, qui en assure le suivi scientifique et administratif."
          />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="primary" icon="users" href="/recherche/appels">
              Appels à collaboration
            </Button>
            <Button variant="outline" icon="chevL" href="/recherche">
              Recherche & Innovation
            </Button>
          </div>
        </MaxWrap>
      </section>
    </div>
  );
}
