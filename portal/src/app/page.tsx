import Image from "next/image";
import Link from "next/link";
import {
  Button,
  Card,
  BloodTag,
  BloodBag,
  StatusPill,
  SectionTitle,
  IconBubble,
  CountUp,
} from "@/components/cnts/primitives";
import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { stock, org, news, type StockBarometer } from "@/components/cnts/data";
import { getArticles, getStockBarometer } from "@/lib/cms";

export const metadata = {
  title: "Accueil — CNTS Sénégal",
  description:
    "Centre National de Transfusion Sanguine du Sénégal. Donnez votre sang, sauvez des vies.",
};

// Conteneur standard (maquette v2 : 1180px + gouttière).
const W = { maxWidth: 1180, margin: "0 auto", padding: "0 var(--gutter)" } as const;

const reasons = [
  { icon: "users", t: "Un acte solidaire", d: "Un don bénévole, anonyme et gratuit qui renforce une chaîne de solidarité nationale." },
  { icon: "heart", t: "Sauver des vies", d: "Accidents, accouchements, maladies du sang… un don peut sauver jusqu'à 3 vies." },
  { icon: "clock", t: "Rapide et simple", d: "45 minutes de votre temps, de l'accueil à la collation. Un geste à l'impact immense." },
];

// Messages du bandeau défilant : informations générales et vérifiées (pas d'alerte de stock
// inventée — les besoins du jour sont communiqués par le CNTS).
const TICKER: { tag: string; msg: string }[] = [
  { tag: "Chaque don compte", msg: "Les réserves se renouvellent en permanence" },
  { tag: "O−", msg: "Donneur universel, toujours très recherché" },
  { tag: "1 don", msg: "Jusqu'à 3 vies sauvées" },
  { tag: "Horaires", msg: `Siège de Fann · ${org.hours}` },
  { tag: `${org.structures} structures`, msg: "de transfusion sur tout le territoire" },
];

const quick: [string, string, string, string, "tint" | "sun" | "red"][] = [
  ["check", "Vérifier mon éligibilité", "2 minutes · questionnaire confidentiel", "/donner-sang/qui-peut-donner", "tint"],
  ["pin", "Trouver une collecte", `${org.structures} structures de transfusion · collectes mobiles`, "/collectes", "sun"],
  ["idcard", "Espace Patient", "RDV · carte de donneur · historique", "/espace-patient", "tint"],
  ["bell", "Alertes par groupe sanguin", "Soyez prévenu en cas de pénurie", "/collectes", "red"],
];

function TickerRow({ hidden }: { hidden?: boolean }) {
  return (
    <>
      {TICKER.map((a, i) => (
        <span
          key={i}
          aria-hidden={hidden || undefined}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap" }}
        >
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: 9, background: "#fff", animation: "cntsPulse 1.6s infinite" }} />
          <b style={{ fontWeight: 800 }}>{a.tag}</b>
          <span style={{ opacity: 0.9 }}>{a.msg}</span>
        </span>
      ))}
    </>
  );
}

function Marquee() {
  return (
    <Link
      href="/collectes"
      aria-label="Où donner son sang ? Voir les centres et collectes"
      style={{ display: "block", overflow: "hidden", background: "var(--brand)", color: "#fff", padding: "14px 0", textDecoration: "none" }}
    >
      <div className="marquee" style={{ gap: 40 }}>
        <TickerRow />
        <TickerRow hidden />
        <TickerRow hidden />
        <TickerRow hidden />
      </div>
    </Link>
  );
}

function Barometer({ data }: { data: StockBarometer }) {
  const levels = data.levels;
  const crit = levels.filter((s) => s.status === "crit").length;
  return (
    <Card pad={28} style={{ height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div>
          <div className="kicker" style={{ marginBottom: 6 }}>
            Baromètre national
          </div>
          <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>
            Niveau des réserves par groupe
          </h3>
        </div>
        <StatusPill status={crit ? "crit" : "ok"}>{crit ? `${crit} groupe${crit > 1 ? "s" : ""} critique${crit > 1 ? "s" : ""}` : "Réserves stables"}</StatusPill>
      </div>
      <div className="baro-grid" style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0,1fr))", gap: 8 }}>
        {levels.map((s, i) => (
          <div
            key={s.type}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, animation: `rise .7s ${i * 0.06}s both` }}
          >
            <BloodBag pct={Math.max(8, Math.min(100, (s.days / 7) * 100))} status={s.status} height={100} />
            <BloodTag type={s.type} size="sm" tone="soft" />
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600 }}>{s.days.toFixed(1)} j</div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          marginTop: 22,
          paddingTop: 18,
          borderTop: "1px dashed var(--line-strong)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--ink-600)", flexWrap: "wrap" }}>
          {[
            ["var(--brand)", "Suffisant"],
            ["var(--warn)", "En baisse"],
            ["var(--crit)", "Critique"],
          ].map(([c, t]) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 9, background: c }} />
              {t}
            </span>
          ))}
        </div>
        <Button size="sm" icon="drop" href="/collectes">
          Je donne mon sang
        </Button>
      </div>
      {data.message && (
        <p
          role="status"
          style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            background: "var(--crit-bg)",
            color: "var(--red-800)",
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          {data.message}
        </p>
      )}
      <p style={{ marginTop: 14, fontSize: 12, color: "var(--ink-500)" }}>
        {data.updatedOn ? `Mis à jour le ${frDate(data.updatedOn)} · ` : "Niveaux indicatifs. "}
        Réserves exprimées en jours de consommation. Pour connaître les besoins du jour, contactez le CNTS au {org.phone}.
      </p>
    </Card>
  );
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [articles, barometer] = await Promise.all([getArticles({ limit: 3 }), getStockBarometer()]);
  const latest = (articles ?? news).slice(0, 3);
  // Baromètre : saisi chaque semaine dans le CMS ; repli sur les niveaux indicatifs.
  const stockData: StockBarometer = barometer ?? { levels: stock.map(({ type, days, status }) => ({ type, days, status })) };
  return (
    <div>
      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div aria-hidden className="blob" style={{ width: 520, height: 520, right: -140, top: -160, background: "var(--acc2-soft)" }} />
        <div
          className="hero-grid"
          style={{
            ...W,
            paddingTop: 56,
            paddingBottom: 80,
            display: "grid",
            gridTemplateColumns: "1.1fr .9fr",
            gap: 48,
            alignItems: "center",
            position: "relative",
          }}
        >
          <div className="stag" style={{ minWidth: 0 }}>
            <div>
              <Link
                href="/collectes"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 14px 7px 8px",
                  borderRadius: 999,
                  border: "1px solid var(--red-200)",
                  background: "var(--surface)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--ink-800)",
                  marginBottom: 26,
                  maxWidth: "100%",
                  textDecoration: "none",
                }}
              >
                <span
                  className="ringpulse"
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "var(--brand)",
                    color: "#fff",
                    fontSize: 11.5,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  Besoin constant
                </span>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Les réserves se renouvellent en permanence : chaque don compte.
                </span>
                <Icon name="chevR" size={15} />
              </Link>
            </div>
            <h1
              className="font-serif"
              style={{ fontSize: "clamp(40px, 6vw, 76px)", fontWeight: 500, lineHeight: 1.06, letterSpacing: "-0.035em", marginBottom: 22, textWrap: "balance" }}
            >
              Donner son sang,
              <br />
              c&apos;est{" "}
              <span className="hl serif-it" style={{ color: "var(--brand)" }}>
                sauver des vies.
              </span>
            </h1>
            <p style={{ fontSize: 18.5, lineHeight: 1.55, color: "var(--ink-700)", maxWidth: 480, marginBottom: 32 }}>
              Votre geste simple et solidaire permet de soigner chaque année des milliers de patients au Sénégal. Rejoignez
              la communauté des donneurs.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button size="lg" icon="drop" href="/donner-sang">
                Je veux donner
              </Button>
              <Button size="lg" variant="outline" iconRight="arrowR" href="/espace-patient">
                Espace Patient
              </Button>
            </div>
          </div>

          <div className="hero-photo" style={{ position: "relative", height: 520, animation: "pop 1s .2s both" }}>
            <div
              style={{
                position: "absolute",
                inset: "0 0 0 8%",
                borderRadius: "999px 999px var(--r-xl) var(--r-xl)",
                overflow: "hidden",
                background: "var(--surface-3)",
              }}
            >
              <Image
                src="/images/cnts_image3.jpg"
                alt="Don de sang au CNTS"
                fill
                priority
                sizes="(max-width: 1000px) 0px, 480px"
                style={{ objectFit: "cover", objectPosition: "center 28%" }}
              />
            </div>
            <div
              className="cn-card floaty"
              style={{ position: "absolute", left: 0, top: "18%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--sh-lg)" }}
            >
              <div className="beat" style={{ color: "var(--brand)" }}>
                <Icon name="heart" size={30} fill="current" stroke={0} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>1 don</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>jusqu&apos;à 3 vies sauvées</div>
              </div>
            </div>
            <div
              className="cn-card floaty"
              style={{
                position: "absolute",
                right: -8,
                bottom: "12%",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "var(--sh-lg)",
                animationDelay: "-2.5s",
              }}
            >
              <BloodTag type="O-" size="sm" />
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Donneur universel
                <div style={{ fontWeight: 500, color: "var(--ink-600)", fontSize: 12 }}>très recherché</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* CHIFFRES CLÉS */}
      <section style={{ ...W, paddingTop: 72, paddingBottom: 24 }}>
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16 }}>
          {org.stats.map((s, i) => (
            <div
              key={i}
              className="cn-card"
              style={{
                padding: "26px 22px",
                borderRadius: 999,
                textAlign: "center",
                background: i % 2 ? "var(--surface)" : "var(--surface-2)",
                border: "none",
              }}
            >
              <div className="font-serif" style={{ fontSize: 44, fontWeight: 500, color: "var(--brand)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                <CountUp value={s.value} />
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 600, marginTop: 8, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BAROMÈTRE + ACCÈS RAPIDES */}
      <section
        className="two-col"
        style={{ ...W, paddingTop: 48, paddingBottom: 48, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "stretch" }}
      >
        <Barometer data={stockData} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {quick.map(([ic, t, sub, href, tone]) => (
            <Card key={t} pad={18} hover href={href}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <IconBubble icon={ic} tone={tone} size={48} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{t}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 2 }}>{sub}</div>
                </div>
                <Icon name="arrowR" size={18} style={{ color: "var(--brand)" }} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* POURQUOI DONNER */}
      <section style={{ padding: "48px var(--gutter)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", borderRadius: "var(--r-xl)", background: "var(--surface-2)", padding: "clamp(36px,5vw,64px) var(--gutter)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <SectionTitle
              kicker="Pourquoi donner son sang ?"
              title="Un engagement vital pour le Sénégal"
              sub="Les besoins en produits sanguins sont constants. Votre engagement répond aux urgences et aux maladies chroniques."
            />
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 20 }}>
              {reasons.map((s, i) => (
                <Card key={i} pad={30} hover>
                  <IconBubble icon={s.icon} tone={i === 1 ? "red" : i === 2 ? "sun" : "tint"} size={58} />
                  <h3 style={{ fontSize: 19, fontWeight: 700, margin: "20px 0 8px" }}>{s.t}</h3>
                  <p style={{ color: "var(--ink-600)", fontSize: 15, lineHeight: 1.55 }}>{s.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BIEN PLUS QU'UNE BANQUE DE SANG */}
      <section style={{ ...W, paddingTop: 96, paddingBottom: 72, overflowX: "clip" }}>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div style={{ position: "relative", height: 420 }}>
            <div aria-hidden className="blob" style={{ inset: "8% 4% 0 10%", background: "var(--acc2-soft)" }} />
            <div
              style={{
                position: "absolute",
                inset: "0 12% 8% 0",
                borderRadius: "var(--r-xl) 999px var(--r-xl) var(--r-xl)",
                overflow: "hidden",
                background: "var(--surface-3)",
              }}
            >
              <Image src="/images/labo_cnts.webp" alt="Laboratoire du CNTS" fill sizes="(max-width: 1000px) 100vw, 520px" style={{ objectFit: "cover" }} />
            </div>
            <div
              className="floaty cn-card"
              style={{ position: "absolute", right: 0, bottom: 20, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--sh-md)" }}
            >
              <IconBubble icon="shield" size={40} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>Chaque don testé</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-600)" }}>Qualification biologique</div>
              </div>
            </div>
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 12 }}>
              Le CNTS
            </div>
            <h2 className="font-serif" style={{ fontSize: "clamp(28px,3.4vw,42px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.08, marginBottom: 18 }}>
              Bien plus qu&apos;une{" "}
              <span className="serif-it" style={{ color: "var(--brand)" }}>
                banque de sang
              </span>
            </h2>
            <p style={{ color: "var(--ink-600)", fontSize: 16.5, lineHeight: 1.6, marginBottom: 26 }}>
              Outre la collecte et la distribution, le CNTS est un centre d&apos;expertise médicale et biologique de référence.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
              {org.missions.map((m) => (
                <span
                  key={m.t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 16px",
                    borderRadius: 999,
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink-800)",
                  }}
                >
                  <Icon name="check" size={16} style={{ color: "var(--brand)" }} />
                  {m.t}
                </span>
              ))}
            </div>
            <Button variant="outline" iconRight="arrowR" href="/services">
              Découvrir nos services
            </Button>
          </div>
        </div>
      </section>

      {/* MOT DU DIRECTEUR */}
      <section style={{ ...W, paddingTop: 24, paddingBottom: 72, overflowX: "clip" }}>
        <div className="two-col" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 48, alignItems: "center" }}>
          <div style={{ position: "relative", aspectRatio: "4 / 5" }}>
            <div aria-hidden className="blob" style={{ inset: "6% -6% -4% 6%", background: "var(--tint)" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px 999px var(--r-xl) var(--r-xl)",
                overflow: "hidden",
                background: "var(--surface-3)",
              }}
            >
              <Image
                src={org.director.photo}
                alt={org.director.name}
                fill
                sizes="(max-width: 1000px) 100vw, 320px"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 12 }}>
              Mot du Directeur
            </div>
            <h2 className="font-serif" style={{ fontSize: "clamp(26px,3.2vw,38px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 18 }}>
              « 1 mission :{" "}
              <span className="serif-it" style={{ color: "var(--brand)" }}>
                sauver des vies
              </span>{" "}
              »
            </h2>
            {org.director.message.map((p, i) => (
              <p key={i} style={{ color: "var(--ink-600)", fontSize: 16, lineHeight: 1.65, marginBottom: 12 }}>
                {p}
              </p>
            ))}
            <div style={{ marginTop: 10, fontWeight: 700 }}>{org.director.name}</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-500)" }}>{org.director.title}</div>
          </div>
        </div>
      </section>

      {/* ACTUALITÉS */}
      <section style={{ ...W, paddingTop: 24, paddingBottom: 96 }}>
        <SectionTitle
          kicker="Actualités & événements"
          title="La vie du CNTS"
          action={
            <Button variant="outline" size="sm" iconRight="arrowR" href="/actualites">
              Voir tout
            </Button>
          }
        />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 22 }}>
          {latest.map((n) => (
            <Card key={n.slug} pad={10} hover href={`/actualites/${n.slug}`}>
              <div style={{ height: 180, position: "relative", borderRadius: "calc(var(--r-lg) - 6px)", overflow: "hidden", background: "var(--surface-3)" }}>
                <Image src={n.img ?? "/images/illustration-don-sang.svg"} alt={n.title} fill sizes="(max-width: 900px) 100vw, 380px" style={{ objectFit: "cover" }} />
              </div>
              <div style={{ padding: "16px 10px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "var(--tint)", color: "var(--brand-strong)" }}>
                    {n.cat}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{frDate(n.date, { day: "numeric", month: "short" })}</span>
                </div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.3 }}>{n.title}</h3>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* APPEL À L'ACTION */}
      <section style={{ padding: "0 var(--gutter) 72px" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            maxWidth: 1180,
            margin: "0 auto",
            borderRadius: "var(--r-xl)",
            background: "var(--brand)",
            color: "#fff",
            padding: "clamp(36px,6vw,72px)",
          }}
        >
          <div aria-hidden className="blob" style={{ width: 340, height: 340, right: -60, top: -140, background: "var(--red-700)" }} />
          <div
            aria-hidden
            className="blob"
            style={{ width: 180, height: 180, right: 200, bottom: -90, background: "var(--acc2)", opacity: 0.9, animationDelay: "-6s" }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 580 }}>
              <div className="kicker" style={{ color: "#fff", opacity: 0.9, marginBottom: 12 }}>
                Prêt à sauver des vies ?
              </div>
              <h2 className="font-serif" style={{ fontSize: "clamp(28px, 3.6vw, 42px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Prenez rendez-vous dans l&apos;un de nos centres ou lors d&apos;une collecte mobile.
              </h2>
            </div>
            <Button size="lg" variant="light" icon="calendarCheck" href="/espace-patient/rendez-vous">
              Prendre rendez-vous
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
