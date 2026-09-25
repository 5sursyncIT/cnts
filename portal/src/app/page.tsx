import Image from "next/image";
import Link from "next/link";
import {
  Button,
  Card,
  BloodTag,
  BloodBag,
  StatusPill,
  SectionTitle,
} from "@/components/cnts/primitives";
import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { stock, org, news } from "@/components/cnts/data";

export const metadata = {
  title: "Accueil — CNTS Sénégal",
  description:
    "Centre National de Transfusion Sanguine du Sénégal. Donnez votre sang, sauvez des vies.",
};

const reasons = [
  { icon: "users", t: "Un acte solidaire", d: "Un don bénévole, anonyme et gratuit qui renforce une chaîne de solidarité nationale." },
  { icon: "heart", t: "Sauver des vies", d: "Accidents, accouchements, maladies du sang… un don peut sauver jusqu'à 3 vies." },
  { icon: "clock", t: "Rapide et simple", d: "45 minutes de votre temps, de l'accueil à la collation. Un geste à l'impact immense." },
];

function UrgentTicker() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 16px",
        background: "var(--red-950)",
        color: "#fff",
        borderRadius: "var(--r-pill)",
        boxShadow: "var(--sh-md)",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          color: "var(--red-200)",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#fff", animation: "cntsPulse 1.6s infinite" }} />
        Besoin urgent
      </span>
      <span style={{ flex: 1, fontSize: 13.5, color: "rgba(255,255,255,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        Les réserves se renouvellent en permanence : chaque don compte.
      </span>
      <Link
        href="/collectes"
        style={{ color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
      >
        Voir tout <Icon name="chevR" size={15} />
      </Link>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
      {t}
    </span>
  );
}

function Barometer() {
  const crit = stock.filter((s) => s.status === "crit").length;
  return (
    <Card pad={26} style={{ borderColor: "var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <div className="kicker" style={{ marginBottom: 7 }}>
            Baromètre national
          </div>
          <h3 className="font-serif" style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Niveau des réserves par groupe
          </h3>
        </div>
        <StatusPill status={crit ? "crit" : "ok"}>{crit ? `${crit} groupes critiques` : "Réserves stables"}</StatusPill>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10 }}>
        {stock.map((s) => {
          const pct = Math.max(8, Math.min(100, (s.days / 7) * 100));
          return (
            <div key={s.type} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              <BloodBag pct={pct} status={s.status} height={96} />
              <BloodTag type={s.type} size="sm" tone="soft" />
              <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600 }}>{s.days.toFixed(1)} j</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 22,
          paddingTop: 18,
          borderTop: "1px solid var(--line-soft)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 18, fontSize: 12.5, color: "var(--ink-600)" }}>
          <Legend c="var(--brand)" t="Suffisant" />
          <Legend c="var(--warn)" t="En baisse" />
          <Legend c="var(--crit)" t="Critique" />
        </div>
        <Button size="sm" variant="primary" icon="drop" href="/collectes">
          Je donne mon sang
        </Button>
      </div>
      <p style={{ marginTop: 14, fontSize: 12, color: "var(--ink-500)" }}>
        Niveaux indicatifs. Pour connaître les besoins du jour, contactez le CNTS au {org.phone}.
      </p>
    </Card>
  );
}

function QuickRow({ icon, title, sub, accent }: { icon: string; title: string; sub: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flexShrink: 0,
          background: accent ? "var(--brand)" : "var(--surface-3)",
          color: accent ? "#fff" : "var(--brand)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name={icon} size={21} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 2 }}>{sub}</div>
      </div>
      <Icon name="chevR" size={18} style={{ color: "var(--ink-400)" }} />
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section
        style={{
          background: "linear-gradient(160deg, var(--red-950) 0%, var(--red-800) 60%, var(--red-700) 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Photo plein cadre (servie via le loader basePath) */}
        <Image
          src="/images/cnts_image3.jpg"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 28%", zIndex: 0 }}
        />
        {/* Voile rouge pour la lisibilité du texte (plus dense à gauche) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(90deg, rgba(74,8,12,.94) 0%, rgba(92,11,16,.82) 38%, rgba(110,14,19,.5) 70%, rgba(120,16,21,.28) 100%)",
          }}
        />
        <div
          className="hero-grid"
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "var(--gutter)",
            position: "relative",
            zIndex: 2,
            minHeight: 540,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <div style={{ marginBottom: 22 }}>
              <UrgentTicker />
            </div>
            <h1
              className="font-serif"
              style={{ fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: 18 }}
            >
              Donner son sang,
              <br />
              <span style={{ color: "var(--red-200)" }}>c&apos;est sauver des vies.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.55, color: "rgba(255,255,255,.9)", maxWidth: 480, marginBottom: 30 }}>
              Votre geste simple et solidaire permet de soigner chaque année des milliers de patients au Sénégal.
              Rejoignez la communauté des donneurs.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button size="lg" variant="light" icon="drop" href="/donner-sang">
                Je veux donner
              </Button>
              <Button size="lg" variant="ghost" iconRight="arrowR" href="/espace-patient" style={{ color: "#fff" }}>
                Espace Patient
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* MOT DU DIRECTEUR */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
        <div
          className="two-col"
          style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)", display: "grid", gridTemplateColumns: "320px 1fr", gap: 44, alignItems: "center" }}
        >
          <div style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface-3)" }}>
            <Image src={org.director.photo} alt={org.director.name} fill sizes="(max-width: 900px) 100vw, 320px" style={{ objectFit: "cover", objectPosition: "center top" }} />
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Mot du Directeur
            </div>
            <h2 className="font-serif" style={{ fontSize: "clamp(24px,3vw,33px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}>
              « 1 mission : sauver des vies »
            </h2>
            {org.director.message.map((p, i) => (
              <p key={i} style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.65, marginBottom: 12 }}>
                {p}
              </p>
            ))}
            <div style={{ marginTop: 8, fontWeight: 700 }}>{org.director.name}</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-500)" }}>{org.director.title}</div>
          </div>
        </div>
      </section>

      {/* STAT BAND */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
        <div
          className="grid-4"
          style={{ maxWidth: 1180, margin: "0 auto", padding: "30px var(--gutter)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
        >
          {org.stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div className="font-serif" style={{ fontSize: 38, fontWeight: 600, color: "var(--brand)", letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink-600)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BAROMETER + quick actions */}
      <section
        className="two-col"
        style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)", display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 26, alignItems: "start" }}
      >
        <Barometer />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card pad={22} hover href="/donner-sang/qui-peut-donner">
            <QuickRow icon="check" title="Vérifier mon éligibilité" sub="2 minutes · questionnaire confidentiel" />
          </Card>
          <Card pad={22} hover href="/collectes">
            <QuickRow icon="pin" title="Trouver une collecte" sub={`${org.structures} structures de transfusion · collectes mobiles`} />
          </Card>
          <Card pad={22} hover href="/espace-patient">
            <QuickRow icon="idcard" title="Espace Patient" sub="RDV · carte de donneur · historique" />
          </Card>
          <Card pad={22} hover href="/collectes" style={{ background: "var(--red-50)", borderColor: "var(--red-200)" }}>
            <QuickRow icon="bell" title="Alertes par groupe sanguin" accent sub="Soyez prévenu en cas de pénurie" />
          </Card>
        </div>
      </section>

      {/* POURQUOI DONNER */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
          <SectionTitle
            kicker="Pourquoi donner son sang ?"
            title="Un engagement vital pour le Sénégal"
            sub="Les besoins en produits sanguins sont constants. Votre engagement répond aux urgences et aux maladies chroniques."
          />
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
            {reasons.map((s, i) => (
              <Card key={i} pad={26}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--red-50)", color: "var(--brand)", display: "grid", placeItems: "center", marginBottom: 16 }}>
                  <Icon name={s.icon} size={23} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 7 }}>{s.t}</h3>
                <p style={{ color: "var(--ink-600)", fontSize: 14.5, lineHeight: 1.5 }}>{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BIEN PLUS QU'UNE BANQUE DE SANG */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, alignItems: "center" }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>
              Le CNTS
            </div>
            <h2 className="font-serif" style={{ fontSize: "clamp(24px,3vw,33px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 16 }}>
              Bien plus qu&apos;une banque de sang
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 15.5, lineHeight: 1.6, marginBottom: 20 }}>
              Outre la collecte et la distribution, le CNTS est un centre d&apos;expertise médicale et biologique de référence.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
              {org.missions.map((m) => (
                <div key={m.t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Icon name="check" size={18} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 14, color: "var(--ink-700)", fontWeight: 600 }}>{m.t}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" iconRight="arrowR" href="/services">
              Découvrir nos services
            </Button>
          </div>
          <div style={{ height: 340, borderRadius: "var(--r-lg)", position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}>
            <Image src="/images/labo_cnts.webp" alt="Laboratoire du CNTS" fill style={{ objectFit: "cover" }} />
          </div>
        </div>
      </section>

      {/* ACTUALITES */}
      <section style={{ background: "var(--surface-1)", borderTop: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
          <SectionTitle
            kicker="Actualités & événements"
            title="La vie du CNTS"
            action={
              <Button variant="outline" size="sm" iconRight="arrowR" href="/actualites">
                Voir tout
              </Button>
            }
          />
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {news.slice(0, 3).map((n) => (
              <Card key={n.slug} pad={0} hover href={`/actualites/${n.slug}`} style={{ overflow: "hidden" }}>
                <div style={{ height: 150, position: "relative", background: "var(--surface-3)" }}>
                  <Image src={n.img ?? "/images/illustration-don-sang.svg"} alt={n.title} fill sizes="(max-width: 900px) 100vw, 380px" style={{ objectFit: "cover" }} />
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand)" }}>{n.cat}</span>
                    <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{frDate(n.date, { day: "numeric", month: "short" })}</span>
                  </div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.25 }}>{n.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section style={{ background: "var(--red-900)", color: "#fff" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "var(--gutter)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 30,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <div className="kicker" style={{ color: "var(--red-200)", marginBottom: 10 }}>
              Prêt à sauver des vies ?
            </div>
            <h2 className="font-serif" style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.12 }}>
              Prenez rendez-vous dans l&apos;un de nos centres ou lors d&apos;une collecte mobile.
            </h2>
          </div>
          <Button size="lg" variant="light" icon="calendarCheck" href="/collectes">
            Prendre rendez-vous
          </Button>
        </div>
      </section>
    </div>
  );
}
