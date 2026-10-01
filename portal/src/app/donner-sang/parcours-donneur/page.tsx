import type { ReactNode } from "react";
import Image from "next/image";
import { Button, Card, PageBanner, SectionTitle, StatusPill } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { conseils, parcours } from "@/components/cnts/data";

export const metadata = {
  title: "Le parcours du donneur — CNTS Sénégal",
  description:
    "Découvrez en vidéo le parcours complet du don de sang, de la préparation jusqu’à la mise à disposition du sang pour les patients.",
};

function MaxWrap({ children, w = 1180 }: { children: ReactNode; w?: number }) {
  return <div style={{ maxWidth: w, margin: "0 auto", padding: "var(--gutter)" }}>{children}</div>;
}

export default function ParcoursDonneurPage() {
  return (
    <div>
      <PageBanner
        kicker="Don de sang"
        title="Le parcours du donneur"
        sub="Quatre étapes simples et sûres permettent d’offrir un peu de soi pour sauver des vies. Tout est fait pour assurer votre confort, votre sécurité et celle des receveurs."
      />

      <section aria-labelledby="video-parcours-title" style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Le parcours en vidéo"
            title="Du premier pas aux soins"
            sub="Une animation courte pour découvrir chaque étape du don de sang."
          />
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 id="video-parcours-title" className="sr-only">Vidéo animée du parcours complet du don de sang</h2>
            <video
              controls
              playsInline
              preload="metadata"
              poster="/videos/parcours-don-sang-poster.webp"
              aria-label="Animation du parcours du don de sang, de la préparation aux soins"
              style={{ display: "block", width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--r-lg)", background: "#faf5f1", boxShadow: "var(--sh-lg)" }}
            >
              <source src="/videos/parcours-don-sang.mp4" type="video/mp4" />
              <track kind="captions" src="/videos/parcours-don-sang.fr.vtt" srcLang="fr" label="Français" />
              Votre navigateur ne peut pas lire cette vidéo.
            </video>
            <p style={{ color: "var(--ink-600)", fontSize: 13.5, lineHeight: 1.6, marginTop: 12 }}>
              Animation muette avec texte à l’écran · 30 secondes. Le parcours peut varier selon le site de collecte.
            </p>
            <details style={{ color: "var(--ink-700)", fontSize: 14.5, lineHeight: 1.65, marginTop: 16 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>Lire la transcription de la vidéo</summary>
              <ol style={{ marginTop: 10, paddingLeft: 24 }}>
                <li>Je choisis un lieu de don, je m’hydrate et je viens en forme.</li>
                <li>L’équipe m’accueille et enregistre mon arrivée.</li>
                <li>Un entretien confidentiel vérifie que je peux donner aujourd’hui.</li>
                <li>Un professionnel réalise le prélèvement avec du matériel stérile.</li>
                <li>Je me repose, je bois et je prends une collation.</li>
                <li>La poche est analysée avant d’être mise à disposition.</li>
                <li>Le sang qualifié rejoint les établissements de santé pour aider les patients.</li>
              </ol>
            </details>
            <p style={{ color: "var(--ink-600)", fontSize: 13, marginTop: 12 }}>
              Parcours documenté par l’<a href="https://www.who.int/news-room/questions-and-answers/item/blood-products-why-should-i-donate-blood" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Organisation mondiale de la Santé</a>.
            </p>
          </div>
        </MaxWrap>
      </section>

      <MaxWrap>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "start" }}>
          {/* Étapes */}
          <div>
            <SectionTitle kicker="Quatre étapes" title="Comment se déroule un don ?" />
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {parcours.map((p, i) => (
                <li key={p.t}>
                  <Card pad={22}>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 13,
                          flexShrink: 0,
                          background: "var(--red-50)",
                          color: "var(--brand)",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Icon name={p.icon} size={23} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                            marginBottom: 5,
                          }}
                        >
                          <h3 style={{ fontSize: 17, fontWeight: 700 }}>
                            <span className="font-serif" style={{ color: "var(--red-300)", marginRight: 8 }}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {p.t}
                          </h3>
                          <StatusPill status="info">{p.min}</StatusPill>
                        </div>
                        <p style={{ fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.55 }}>{p.d}</p>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Image
              src="/images/prise-de-sang.webp"
              alt="Don de sang au CNTS"
              width={520}
              height={400}
              style={{ width: "100%", height: "auto", borderRadius: "var(--r-lg)", objectFit: "cover" }}
            />
            <Card pad={22} style={{ background: "var(--red-50)", borderColor: "var(--red-200)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Icon name="shield" size={22} style={{ color: "var(--brand)", marginTop: 1 }} />
                <p style={{ fontSize: 14.5, color: "var(--ink-700)", lineHeight: 1.6 }}>
                  Chaque candidat au don bénéficie d’un entretien confidentiel avec un professionnel de santé. Cet
                  échange garantit la sécurité du don et la qualité du sang prélevé.
                </p>
              </div>
            </Card>
            <Button variant="outline" icon="check" href="/donner-sang/qui-peut-donner">
              Qui peut donner ?
            </Button>
          </div>
        </div>
      </MaxWrap>

      {/* Conseils */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <MaxWrap>
          <SectionTitle
            kicker="Conseils au donneur"
            title="Vivre son don dans les meilleures conditions"
            sub="Quelques gestes simples pour assurer votre confort et celui des receveurs."
            action={
              <Button variant="ghost" iconRight="arrowR" href="/donner-sang/conseils">
                Tous les conseils
              </Button>
            }
          />
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {conseils.map((c) => (
              <Card key={c.t} pad={22}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "var(--red-50)",
                    color: "var(--brand)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Icon name={c.icon} size={21} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>{c.t}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>{c.d}</p>
              </Card>
            ))}
          </div>
        </MaxWrap>
      </section>

      <section className="cta-band">
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
            Prêt à sauver des vies ? Prenez rendez-vous dès aujourd’hui.
          </h2>
          <Button size="lg" variant="light" icon="calendarCheck" href="/espace-patient/rendez-vous">
            Prendre rendez-vous
          </Button>
        </div>
      </section>
    </div>
  );
}
