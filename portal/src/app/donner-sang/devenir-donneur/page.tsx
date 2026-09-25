import type { ReactNode } from "react";
import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { donConditions, org, parcours } from "@/components/cnts/data";

export const metadata = {
  title: "Devenir donneur volontaire — CNTS Sénégal",
  description:
    "Rejoignez les donneurs volontaires du CNTS et contribuez à garantir un sang sûr et disponible pour tous les patients du Sénégal.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

const raisons = [
  { icon: "heart", t: "Sauver des vies", d: "Chaque don aide plusieurs patients à retrouver la santé." },
  { icon: "users", t: "Un acte de solidarité", d: "Vous contribuez au bien-être collectif et à la santé publique." },
  { icon: "award", t: "Un engagement citoyen", d: "Participer au don, c’est bâtir une société plus solidaire." },
];

const etapes = [
  {
    t: "Inscrivez-vous",
    d: "Créez votre compte donneur en ligne. Les champs marqués d’un astérisque sont obligatoires.",
    icon: "idcard",
  },
  {
    t: "Nous vous recontactons",
    d: "Notre équipe vous recontacte pour planifier votre premier don.",
    icon: "phone",
  },
  {
    t: "Donnez votre sang",
    d: `Le jour J, le don se déroule en quatre étapes : ${parcours.map((p) => p.t.toLowerCase()).join(", ")}.`,
    icon: "drop",
  },
];

function ContactRow({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", fontSize: 14.5, color: "var(--ink-700)" }}>
      <Icon name={icon} size={18} style={{ color: "var(--brand)", marginTop: 2 }} />
      <div>{children}</div>
    </div>
  );
}

export default function DevenirDonneurPage() {
  return (
    <div>
      <PageBanner
        kicker="Don de sang"
        title="Devenir donneur volontaire"
        sub="Rejoignez les donneurs volontaires du CNTS et contribuez à garantir un sang sûr et disponible pour tous les patients du Sénégal. Chaque don compte : un geste simple peut sauver plusieurs vies."
      />

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <SectionTitle kicker="Pourquoi donner ?" title="Un acte citoyen, humain et indispensable" />
            <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.65, marginBottom: 22 }}>
              Au Sénégal, chaque jour, des mères, des enfants et des accidentés ont besoin d’une transfusion pour
              survivre. Un don de sang ne prend que quelques minutes et chaque poche collectée peut sauver jusqu’à trois
              vies.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {raisons.map((r) => (
                <div key={r.t} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      flexShrink: 0,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name={r.icon} size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15.5 }}>{r.t}</div>
                    <div style={{ color: "var(--ink-600)", fontSize: 14.5 }}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Image
            src="/images/frequence-don.webp"
            alt="Donneur volontaire au CNTS"
            width={560}
            height={420}
            priority
            style={{ width: "100%", height: "auto", borderRadius: "var(--r-lg)", objectFit: "cover" }}
          />
        </div>
      </MaxWrap>

      {/* Comment s'inscrire */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Inscription"
            title="Comment devenir donneur ?"
            sub="Inscrivez-vous en ligne : notre équipe vous recontactera pour planifier votre premier don."
          />
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {etapes.map((e, i) => (
              <Card key={e.t} pad={22}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name={e.icon} size={22} />
                  </div>
                  <span className="font-serif" style={{ fontSize: 30, fontWeight: 500, color: "var(--red-200)" }}>
                    {i + 1}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>{e.t}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>{e.d}</p>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="primary" icon="user" href="/espace-patient/inscription">
              S’inscrire comme donneur
            </Button>
            <Button variant="outline" iconRight="arrowR" href="/donner-sang/parcours-donneur">
              Le parcours du donneur
            </Button>
          </div>
        </MaxWrap>
      </section>

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Conditions */}
          <Card pad={26}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--ok-bg)",
                  color: "var(--ok)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="check" size={20} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Avant de vous inscrire</h3>
            </div>
            {donConditions.ok.map((c, i) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  gap: 11,
                  padding: "9px 0",
                  borderBottom: i < donConditions.ok.length - 1 ? "1px solid var(--line-soft)" : "none",
                  fontSize: 14.5,
                  color: "var(--ink-700)",
                }}
              >
                <Icon name="check" size={18} style={{ color: "var(--ok)", marginTop: 1 }} />
                {c}
              </div>
            ))}
            <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.55 }}>
              Pas d’inquiétude si vous ne connaissez pas votre groupe sanguin : il sera déterminé lors de votre don.
            </p>
            <div style={{ marginTop: 16 }}>
              <Button variant="outline" size="sm" iconRight="arrowR" href="/donner-sang/qui-peut-donner">
                Qui peut donner ?
              </Button>
            </div>
          </Card>

          {/* Contact */}
          <Card pad={26}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--red-50)",
                  color: "var(--brand)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="building" size={20} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>{org.name}</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ContactRow icon="pin">{org.address}</ContactRow>
              <ContactRow icon="phone">
                <a href={`tel:${org.phone.replace(/\s/g, "")}`} style={{ color: "inherit" }}>
                  {org.phone}
                </a>
              </ContactRow>
              <ContactRow icon="mail">
                <a href={`mailto:${org.email}`} style={{ color: "inherit" }}>
                  {org.email}
                </a>
              </ContactRow>
              <ContactRow icon="clock">{org.hours}</ContactRow>
            </div>
            <p style={{ marginTop: 16, fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.55 }}>
              Le CNTS organise également des collectes fixes et mobiles sur l’ensemble du territoire.
            </p>
            <div style={{ marginTop: 14 }}>
              <Button variant="outline" size="sm" icon="calendar" href="/collectes">
                Voir les collectes
              </Button>
            </div>
          </Card>
        </div>
      </MaxWrap>

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
            Chaque don compte. Rejoignez les donneurs volontaires.
          </h2>
          <Button size="lg" variant="light" icon="user" href="/espace-patient/inscription">
            Devenir donneur
          </Button>
        </div>
      </section>
    </div>
  );
}
