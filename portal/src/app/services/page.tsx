import Image from "next/image";
import type { ReactNode } from "react";
import { Button, Card, PageBanner, SectionTitle } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { laboratoires, org, products } from "@/components/cnts/data";

export const metadata = {
  title: "Services — CNTS Sénégal",
  description:
    "Le CNTS prépare, qualifie et distribue l’ensemble des produits sanguins labiles et met son expertise biologique au service des établissements de santé.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

const labs = [
  "Qualification biologique de chaque don",
  "Dépistage VIH 1 et 2, hépatites B et C, syphilis",
  "Groupages sanguins et phénotypages",
  "Tests de compatibilité croisée",
  "Dosages hématologiques",
  "Recherche d’anticorps irréguliers (RAI)",
];

const serviceLinks = [
  { href: "/services/produits-sanguins", ...org.missions[0] },
  { href: "/services/laboratoires", ...org.missions[1] },
  { href: "/services/hematologie", ...org.missions[2] },
  { href: "/services/promotion-don", ...org.missions[3] },
];

const rdvSteps = [
  { icon: "search", t: "Choisissez le service", d: "Don de sang, consultation hématologique, analyses, etc." },
  { icon: "calendar", t: "Sélectionnez la date et l’heure", d: "Le créneau qui vous convient." },
  { icon: "phone", t: "Nous confirmons", d: "Un membre de notre équipe vous contacte pour confirmer le rendez-vous." },
];

export default function ServicesPage() {
  return (
    <div>
      <PageBanner
        kicker="Services"
        title="Des produits sanguins sûrs, un plateau technique de référence."
        sub="Le CNTS prépare, qualifie et distribue l’ensemble des produits sanguins labiles, et met son expertise biologique au service des établissements de santé."
      />

      <MaxWrap>
        <SectionTitle
          kicker="Nos services"
          title="Une chaîne d’opérations hautement encadrée"
          sub="Le CNTS coordonne la collecte, la préparation et la distribution du sang sur tout le territoire national, avec un seul objectif : garantir la qualité, la sécurité et la disponibilité du sang pour tous les patients."
        />
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {serviceLinks.map((s) => (
            <Card key={s.href} href={s.href} pad={22} style={{ height: "100%" }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  background: "var(--red-50)",
                  color: "var(--brand)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <Icon name={s.icon} size={23} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55, marginBottom: 12 }}>{s.d}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--brand)" }}>
                En savoir plus <Icon name="arrowR" size={15} />
              </span>
            </Card>
          ))}
        </div>
      </MaxWrap>

      <MaxWrap>
        <SectionTitle kicker="Produits sanguins" title="Une réponse adaptée à chaque besoin clinique" />
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
          {products.map((p, i) => (
            <Card key={i} pad={24}>
              <div style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 13,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={p.icon} size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                    <h3 style={{ fontSize: 16.5, fontWeight: 700 }}>{p.name}</h3>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-500)", whiteSpace: "nowrap" }}>
                      Conservation · {p.life}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </MaxWrap>

      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <MaxWrap>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
            <div style={{ height: 300, borderRadius: "var(--r-lg)", position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}>
              <Image src="/images/labo_cnts.webp" alt="Plateau technique du CNTS" fill style={{ objectFit: "cover" }} />
            </div>
            <div>
              <div className="kicker" style={{ marginBottom: 10 }}>
                Laboratoires & expertise
              </div>
              <h2
                className="font-serif"
                style={{ fontSize: "clamp(23px,2.8vw,30px)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 18 }}
              >
                La sécurité transfusionnelle, à chaque étape
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {labs.map((l) => (
                  <div key={l} style={{ display: "flex", gap: 9, fontSize: 14, color: "var(--ink-700)", alignItems: "flex-start" }}>
                    <Icon name="check" size={17} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
                    {l}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.6, margin: "18px 0" }}>{laboratoires.intro}</p>
              <Button href="/services/laboratoires" variant="outline" iconRight="arrowR">
                Nos laboratoires
              </Button>
            </div>
          </div>
        </MaxWrap>
      </section>

      <MaxWrap>
        <SectionTitle
          kicker="Prendre rendez-vous"
          title="Un rendez-vous en trois étapes"
          action={
            <Button href="/espace-patient/rendez-vous" icon="calendarCheck">
              Faire une demande
            </Button>
          }
        />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {rdvSteps.map((st, i) => (
            <Card key={st.t} pad={22} style={{ height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Icon name={st.icon} size={20} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-500)" }}>Étape {i + 1}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{st.t}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>{st.d}</p>
            </Card>
          ))}
        </div>
        <p style={{ marginTop: 16, fontSize: 13.5, color: "var(--ink-500)" }}>
          Accueil : {org.hours} · Tél. {org.phone}
        </p>
      </MaxWrap>
    </div>
  );
}
