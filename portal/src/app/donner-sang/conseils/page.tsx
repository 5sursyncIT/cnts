import type { ReactNode } from "react";
import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { conseils } from "@/components/cnts/data";

export const metadata = {
  title: "Conseils au donneur — CNTS Sénégal",
  description:
    "Conseils avant, pendant et après le don de sang : bien dormir, s’hydrater, signaler tout malaise, se reposer et prendre une collation.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

export default function ConseilsPage() {
  return (
    <div>
      <PageBanner
        kicker="Don de sang"
        title="Conseils au donneur"
        sub="Quelques gestes simples permettent de vivre votre don de sang dans les meilleures conditions. Suivez ces recommandations pour assurer votre confort et celui des receveurs."
      />

      <MaxWrap>
        <SectionTitle kicker="Avant · Pendant · Après" title="Les bons gestes, à chaque étape" />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {conseils.map((c, i) => (
            <Card key={c.t} pad={26}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 13,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name={c.icon} size={24} />
                </div>
                <span className="font-serif" style={{ fontSize: 30, fontWeight: 500, color: "var(--red-200)" }}>
                  {i + 1}
                </span>
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{c.t}</h2>
              <p style={{ fontSize: 15, color: "var(--ink-600)", lineHeight: 1.6 }}>{c.d}</p>
            </Card>
          ))}
        </div>
      </MaxWrap>

      {/* Citation */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
            <Image
              src="/images/frequence-don.webp"
              alt="Donneur de sang au CNTS"
              width={560}
              height={400}
              style={{ width: "100%", height: "auto", borderRadius: "var(--r-lg)", objectFit: "cover" }}
            />
            <figure style={{ margin: 0 }}>
              <Icon name="heart" size={34} style={{ color: "var(--brand)", marginBottom: 16 }} />
              <blockquote
                className="font-serif"
                style={{
                  margin: 0,
                  fontSize: "clamp(28px, 3.6vw, 42px)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.12,
                  color: "var(--ink-900)",
                }}
              >
                « Donner son sang, c’est offrir la vie. »
              </blockquote>
              <figcaption style={{ marginTop: 14, color: "var(--ink-600)", fontSize: 15 }}>
                Centre National de Transfusion Sanguine
              </figcaption>
            </figure>
          </div>
        </MaxWrap>
      </section>

      <MaxWrap>
        <Card
          pad={28}
          style={{
            background: "var(--brand)",
            borderColor: "var(--brand)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>
              Prêt pour votre don ?
            </h3>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 15, marginTop: 4 }}>
              Découvrez le déroulement du don ou prenez directement rendez-vous.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="light" icon="calendarCheck" href="/espace-patient/rendez-vous">
              Prendre rendez-vous
            </Button>
            <Button variant="ghost" iconRight="arrowR" href="/donner-sang/parcours-donneur" style={{ color: "#fff" }}>
              Le parcours du donneur
            </Button>
          </div>
        </Card>
      </MaxWrap>
    </div>
  );
}
