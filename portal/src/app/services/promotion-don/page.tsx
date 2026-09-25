import Image from "next/image";
import type { ReactNode } from "react";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { promotionDon } from "@/components/cnts/data";

export const metadata = {
  title: "Promotion du don — CNTS Sénégal",
  description:
    "Le service Promotion du Don du CNTS mobilise, fidélise et forme les donneurs : sensibilisation, unités de collecte mobiles et partenariats.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

export default function PromotionDonPage() {
  return (
    <div>
      <PageBanner
        kicker="Services · Promotion du don"
        title="Le moteur de la solidarité nationale"
        sub="Mobiliser, fidéliser et former les donneurs afin d’assurer un approvisionnement constant en sang."
      />

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Notre mission
            </div>
            <h2
              className="font-serif"
              style={{ fontSize: "clamp(24px,3vw,33px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}
            >
              Faire du don de sang un réflexe de solidarité
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65 }}>{promotionDon.intro}</p>
          </div>
          <div
            style={{ height: 320, borderRadius: "var(--r-lg)", position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}
          >
            <Image src="/images/prise-de-sang.webp" alt="Don de sang au CNTS" fill style={{ objectFit: "cover" }} />
          </div>
        </div>
      </MaxWrap>

      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle kicker="Nos axes d’action" title="Sensibiliser, collecter, fédérer" />
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {promotionDon.axes.map((a) => (
              <Card key={a.t} pad={24} style={{ height: "100%" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 13,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <Icon name={a.icon} size={24} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{a.t}</h3>
                <p style={{ fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.6 }}>{a.d}</p>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card pad={28} style={{ height: "100%", background: "var(--red-50)" }}>
            <Icon name="building" size={28} style={{ color: "var(--brand)", marginBottom: 12 }} />
            <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 10 }}>
              Organisez une collecte
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.6, marginBottom: 18 }}>{promotionDon.entreprises}</p>
            <Button href="/contact" icon="mail">
              Nous contacter
            </Button>
          </Card>
          <Card pad={28} style={{ height: "100%" }}>
            <Icon name="heart" size={28} style={{ color: "var(--brand)", marginBottom: 12 }} />
            <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 10 }}>
              Devenez donneur
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.6, marginBottom: 18 }}>
              Un don de sang ne prend que quelques minutes et peut sauver jusqu’à trois vies. Inscrivez-vous : notre équipe
              vous recontactera pour planifier votre premier don.
            </p>
            <Button href="/donner-sang/devenir-donneur" variant="outline" iconRight="arrowR">
              Devenir donneur
            </Button>
          </Card>
        </div>
      </MaxWrap>
    </div>
  );
}
