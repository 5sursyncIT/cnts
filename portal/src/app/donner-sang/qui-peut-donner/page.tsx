import type { ReactNode } from "react";
import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { donConditions, periodicite } from "@/components/cnts/data";

export const metadata = {
  title: "Qui peut donner son sang ? — CNTS Sénégal",
  description:
    "Conditions pour donner son sang au CNTS : avoir entre 18 et 60 ans, peser au moins 50 kg, être en bonne santé. Situations d’inaptitude temporaire et entretien médical confidentiel.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

function ConditionList({
  title,
  items,
  icon,
  itemIcon,
  tint,
  ink,
}: {
  title: string;
  items: string[];
  icon: string;
  itemIcon: string;
  tint: string;
  ink: string;
}) {
  return (
    <Card pad={26}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: tint,
            color: ink,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name={icon} size={20} />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700 }}>{title}</h3>
      </div>
      {items.map((c, i) => (
        <div
          key={c}
          style={{
            display: "flex",
            gap: 11,
            padding: "10px 0",
            borderBottom: i < items.length - 1 ? "1px solid var(--line-soft)" : "none",
            fontSize: 14.5,
            color: "var(--ink-700)",
          }}
        >
          <Icon name={itemIcon} size={18} style={{ color: ink, flexShrink: 0, marginTop: 1 }} />
          {c}
        </div>
      ))}
    </Card>
  );
}

export default function QuiPeutDonnerPage() {
  return (
    <div>
      <PageBanner
        kicker="Don de sang"
        title="Qui peut donner son sang ?"
        sub="Donner son sang est un acte volontaire et responsable, accessible à toute personne en bonne santé souhaitant contribuer à la santé publique au Sénégal."
      />

      <MaxWrap>
        <div
          className="two-col"
          style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 36, alignItems: "center", marginBottom: 40 }}
        >
          <div>
            <SectionTitle kicker="Conditions pour donner" title="Un don sûr pour le donneur comme pour le receveur" />
            <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.65 }}>
              Avant chaque don, une équipe médicale vérifie votre éligibilité afin d’assurer la sécurité du donneur et
              du receveur. Vous pouvez donner si vous êtes âgé(e) de 18 à 60 ans, pesez au moins 50 kg et êtes en
              bonne santé générale, sans contre-indication médicale.
            </p>
          </div>
          <Image
            src="/images/prise-de-sang.webp"
            alt="Prélèvement de sang au CNTS"
            width={560}
            height={380}
            style={{ width: "100%", height: "auto", borderRadius: "var(--r-lg)", objectFit: "cover" }}
          />
        </div>

        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <ConditionList
            title="Vous pouvez donner si vous êtes…"
            items={[...donConditions.ok, "Sans contre-indication médicale"]}
            icon="check"
            itemIcon="check"
            tint="var(--ok-bg)"
            ink="var(--ok)"
          />
          <ConditionList
            title="Inaptitude temporaire en cas de…"
            items={donConditions.wait}
            icon="clock"
            itemIcon="info"
            tint="var(--warn-bg)"
            ink="var(--warn)"
          />
        </div>

        {/* Entretien médical confidentiel */}
        <Card pad={28} style={{ marginTop: 22, background: "var(--red-50)", borderColor: "var(--red-200)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                background: "var(--surface)",
                color: "var(--brand)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="shield" size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 7 }}>Un entretien confidentiel avant chaque don</h3>
              <p style={{ color: "var(--ink-700)", fontSize: 15, lineHeight: 1.6 }}>
                Chaque candidat au don bénéficie d’un entretien confidentiel avec un professionnel de santé. Cet échange
                garantit la sécurité du don et la qualité du sang prélevé. En cas de doute sur votre situation, c’est
                lors de cet entretien que votre aptitude sera évaluée.
              </p>
            </div>
          </div>
        </Card>
      </MaxWrap>

      {/* Fréquence */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Fréquence de don"
            title="À quelle fréquence peut-on donner ?"
            sub={periodicite.note}
          />
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {[
              { sexe: "Hommes", ...periodicite.hommes },
              { sexe: "Femmes", ...periodicite.femmes },
            ].map((p) => (
              <Card key={p.sexe} pad={22}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="repeat" size={21} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{p.sexe}</div>
                    <div style={{ color: "var(--ink-600)", fontSize: 14.5 }}>
                      {p.delai} · {p.parAn}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="outline" icon="clock" href="/donner-sang/periodicite">
              Périodicité du don
            </Button>
            <Button variant="outline" iconRight="arrowR" href="/donner-sang/parcours-donneur">
              Le parcours du donneur
            </Button>
          </div>
        </MaxWrap>
      </section>

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
          <h2
            className="font-serif"
            style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 500, letterSpacing: "-0.02em", maxWidth: 560, lineHeight: 1.12 }}
          >
            Vous remplissez les conditions ? Rejoignez les donneurs volontaires.
          </h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button size="lg" variant="light" icon="calendarCheck" href="/espace-patient/rendez-vous">
              Prendre rendez-vous
            </Button>
            <Button size="lg" variant="ghost" iconRight="arrowR" href="/donner-sang/devenir-donneur" style={{ color: "#fff" }}>
              Devenir donneur
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
