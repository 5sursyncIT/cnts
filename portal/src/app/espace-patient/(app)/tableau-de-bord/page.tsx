import Link from "next/link";

import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { Button, Card, IconBubble, SectionTitle } from "@/components/cnts/primitives";
import { patientGet, type Carte, type DonPatient, type Profil, type RendezVous } from "@/lib/backend";
import { delaiMois, dernierDonConnu, eligibilite, rdvAVenir, typeDonLabel } from "@/lib/donneur";

export const metadata = { title: "Tableau de bord — Espace patient" };

const DAKAR = { timeZone: "Africa/Dakar" } as const;

export default async function PatientDashboardPage() {
  const [profil, dons, rdvs, carte] = await Promise.all([
    patientGet<Profil>("/api/me"),
    patientGet<DonPatient[]>("/api/me/dons"),
    patientGet<RendezVous[]>("/api/me/appointments"),
    patientGet<Carte>("/api/me/carte"),
  ]);

  const listeDons = dons ?? [];
  const dernier = dernierDonConnu(profil?.dernier_don, listeDons);
  const elig = eligibilite(dernier, profil?.sexe);
  const prochain = rdvAVenir(rdvs ?? [])[0];
  const indisponible = profil === null;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {indisponible && (
        <div className="cn-alert warn" role="status">
          <Icon name="alert" size={18} />
          Vos informations ne peuvent pas être chargées pour le moment. Réessayez dans quelques instants.
        </div>
      )}

      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, alignItems: "stretch" }}>
        {/* Éligibilité */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--r-xl)",
            background: elig.etat === "attente" ? "var(--surface)" : "var(--brand)",
            color: elig.etat === "attente" ? "var(--ink-900)" : "#fff",
            border: elig.etat === "attente" ? "1px solid var(--line)" : "none",
            padding: "clamp(24px, 3vw, 34px)",
            display: "grid",
            gap: 14,
            alignContent: "space-between",
          }}
        >
          {elig.etat !== "attente" && (
            <div aria-hidden className="blob" style={{ width: 220, height: 220, right: -60, top: -80, background: "var(--red-700)" }} />
          )}
          <div style={{ position: "relative" }}>
            <div className="kicker" style={{ color: elig.etat === "attente" ? "var(--brand)" : "#fff", opacity: 0.9, marginBottom: 10 }}>
              Prochain don
            </div>
            <h2 className="font-serif" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {elig.etat === "attente" ? (
                <>
                  Possible à partir du{" "}
                  <span className="serif-it" style={{ color: "var(--brand)" }}>
                    {frDate(elig.le.toISOString(), { day: "numeric", month: "long" })}
                  </span>
                </>
              ) : elig.etat === "possible" ? (
                "Vous pouvez donner à nouveau"
              ) : (
                "Prêt pour votre premier don ?"
              )}
            </h2>
            <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55, opacity: 0.85, maxWidth: 440 }}>
              {elig.etat === "attente"
                ? `Encore ${elig.joursRestants} jour${elig.joursRestants > 1 ? "s" : ""}. Un délai de ${delaiMois(profil?.sexe)} mois entre deux dons de sang total permet à votre organisme de se reconstituer.`
                : elig.etat === "possible"
                  ? `Votre dernier don date du ${frDate(dernier!, { day: "numeric", month: "long", year: "numeric" })}. Votre aptitude sera confirmée lors de l'entretien.`
                  : "Aucun don n'est encore enregistré dans votre dossier. Votre aptitude sera confirmée lors de l'entretien."}
            </p>
          </div>
          <div style={{ position: "relative" }}>
            {prochain ? (
              <Button variant={elig.etat === "attente" ? "outline" : "light"} icon="calendar" href="/espace-patient/rendez-vous">
                Voir mon rendez-vous
              </Button>
            ) : (
              <Button variant={elig.etat === "attente" ? "outline" : "light"} icon="calendarCheck" href="/espace-patient/rendez-vous">
                Prendre rendez-vous
              </Button>
            )}
          </div>
        </div>

        {/* Prochain rendez-vous */}
        <Card pad={26} style={{ display: "grid", gap: 14, alignContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconBubble icon="calendar" size={44} tone="sun" />
            <div>
              <div className="kicker">Prochain rendez-vous</div>
            </div>
          </div>
          {prochain ? (
            <div>
              <div className="font-serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.15, textTransform: "capitalize" }}>
                {new Date(prochain.date_prevue).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", ...DAKAR })}
              </div>
              <div style={{ fontSize: 15, color: "var(--ink-600)", marginTop: 4 }}>
                à {new Date(prochain.date_prevue).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", ...DAKAR }).replace(":", "h")}
                {prochain.lieu ? ` · ${prochain.lieu}` : ""}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 15, color: "var(--ink-600)", lineHeight: 1.55 }}>Aucun rendez-vous prévu.</p>
          )}
          <Link href="/espace-patient/rendez-vous" style={{ fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}>
            Gérer mes rendez-vous <Icon name="arrowR" size={16} />
          </Link>
        </Card>
      </div>

      {/* Chiffres */}
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16 }}>
        <Card pad={22} hover href="/espace-patient/historique">
          <div className="font-serif" style={{ fontSize: 40, color: "var(--brand)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            {carte?.total_dons ?? listeDons.length}
          </div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Don{(carte?.total_dons ?? listeDons.length) > 1 ? "s" : ""} enregistré{(carte?.total_dons ?? listeDons.length) > 1 ? "s" : ""}</div>
          <div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 2 }}>
            {listeDons[0] ? `Dernier : ${typeDonLabel(listeDons[0].type_don).toLowerCase()}, ${frDate(listeDons[0].date_don)}` : "Votre historique apparaîtra ici"}
          </div>
        </Card>
        <Card pad={22} hover href="/espace-patient/historique">
          <div className="font-serif" style={{ fontSize: 40, color: "var(--brand)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            {(carte?.total_dons ?? listeDons.length) * 3}
          </div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>Vies potentiellement aidées</div>
          <div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 2 }}>Un don peut aider jusqu&apos;à 3 patients</div>
        </Card>
        <Card pad={22} hover href="/espace-patient/carte-donneur">
          <div className="font-serif" style={{ fontSize: 40, color: "var(--brand)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            {carte ? carte.points : "—"}
          </div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>{carte ? `Points · niveau ${carte.niveau.toLowerCase()}` : "Carte donneur"}</div>
          <div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 2 }}>
            {carte ? `Carte n° ${carte.numero_carte}` : "Remise lors de votre prochain don"}
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle kicker="Raccourcis" title="Préparer mon don" />
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16 }}>
          {[
            ["check", "Qui peut donner ?", "Les conditions pour donner", "/donner-sang/qui-peut-donner", "tint"],
            ["heart", "Conseils avant/après", "Bien se préparer au don", "/donner-sang/conseils", "sun"],
            ["pin", "Centres & collectes", "Où donner près de chez vous", "/collectes", "tint"],
          ].map(([icon, t, d, href, tone]) => (
            <Card key={href} pad={18} hover href={href}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <IconBubble icon={icon} size={44} tone={tone as "tint" | "sun"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{t}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-600)" }}>{d}</div>
                </div>
                <Icon name="arrowR" size={18} style={{ color: "var(--brand)" }} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
