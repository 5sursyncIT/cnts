import { Icon } from "@/components/cnts/icon";
import { Card, SectionTitle, StatusPill } from "@/components/cnts/primitives";
import { AppointmentForm, CancelAppointmentButton } from "@/components/patient/forms";
import { patientGet, type EligibiliteApi, type LieuRdv, type RendezVous } from "@/lib/backend";
import { rdvAVenir, STATUT_RDV, typeRdvLabel } from "@/lib/donneur";
import { frDate } from "@/components/cnts/format";

export const metadata = { title: "Rendez-vous — Espace patient" };

const DAKAR = { timeZone: "Africa/Dakar" } as const;
const jour = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", ...DAKAR });
const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", ...DAKAR }).replace(":", "h");

function RdvRow({ r, cancellable }: { r: RendezVous; cancellable?: boolean }) {
  const st = STATUT_RDV[r.statut] ?? { label: r.statut, tone: "info" as const };
  return (
    <Card pad={18}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div
          aria-hidden
          style={{ width: 56, textAlign: "center", borderRadius: "var(--r-sm)", background: "var(--tint)", color: "var(--brand)", padding: "8px 0", flexShrink: 0 }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{new Date(r.date_prevue).toLocaleDateString("fr-FR", { day: "numeric", ...DAKAR })}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase" }}>
            {new Date(r.date_prevue).toLocaleDateString("fr-FR", { month: "short", ...DAKAR })}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{jour(r.date_prevue)}</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-600)" }}>
            {heure(r.date_prevue)} · {typeRdvLabel(r.type_rdv)}
            {r.lieu ? ` · ${r.lieu}` : ""}
          </div>
          {r.statut === "ANNULE" && r.motif && <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{r.motif}</div>}
        </div>
        <StatusPill status={st.tone}>{st.label}</StatusPill>
        {cancellable && <CancelAppointmentButton id={r.id} label={`Annuler le rendez-vous du ${jour(r.date_prevue)}`} />}
      </div>
    </Card>
  );
}

export default async function AppointmentsPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const confirme = Boolean((await props.searchParams)?.ok);
  const [rdvs, lieux, elig] = await Promise.all([
    patientGet<RendezVous[]>("/api/me/appointments"),
    patientGet<LieuRdv[]>("/api/me/rdv/lieux"),
    patientGet<EligibiliteApi>("/api/me/eligibilite"),
  ]);
  const tous = rdvs ?? [];
  const aVenir = rdvAVenir(tous);
  const historique = tous.filter((r) => !aVenir.includes(r)).slice(0, 10);
  const attente = elig && !elig.eligible && elig.eligible_le ? elig.eligible_le : null;
  const inapte = elig && !elig.eligible && !elig.eligible_le ? elig.raison : null;

  return (
    <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 28, alignItems: "start" }}>
      <div style={{ display: "grid", gap: 28 }}>
        <div>
          <SectionTitle kicker="À venir" title="Mes rendez-vous" />
          {confirme && aVenir.length > 0 && (
            <div className="cn-alert ok" role="status" style={{ marginBottom: 14 }}>
              <Icon name="check" size={18} />
              <div>
                Rendez-vous enregistré. Un email de confirmation vous a été envoyé. Présentez-vous 10 minutes avant l&apos;heure prévue avec
                votre pièce d&apos;identité.
              </div>
            </div>
          )}
          {rdvs === null && (
            <div className="cn-alert warn" role="status">
              <Icon name="alert" size={18} />
              Vos rendez-vous ne peuvent pas être chargés pour le moment.
            </div>
          )}
          <div style={{ display: "grid", gap: 12 }}>
            {aVenir.map((r) => (
              <RdvRow key={r.id} r={r} cancellable />
            ))}
            {rdvs !== null && !aVenir.length && (
              <p style={{ color: "var(--ink-600)", fontSize: 15 }}>Aucun rendez-vous à venir. Réservez un créneau avec le formulaire.</p>
            )}
          </div>
        </div>
        {historique.length > 0 && (
          <div>
            <SectionTitle kicker="Historique" title="Rendez-vous passés ou annulés" />
            <div style={{ display: "grid", gap: 12 }}>
              {historique.map((r) => (
                <RdvRow key={r.id} r={r} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Card pad={28}>
        <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Prendre rendez-vous
        </h2>
        <p style={{ color: "var(--ink-600)", fontSize: 14.5, marginBottom: 20, lineHeight: 1.55 }}>
          Don de sang total, environ 45 minutes sur place.
        </p>
        {attente && (
          <div className="cn-alert info" style={{ marginBottom: 18 }}>
            <Icon name="info" size={18} />
            <div>
              D&apos;après votre dernier don, vous pourrez donner à nouveau à partir du{" "}
              <b>{frDate(attente, { day: "numeric", month: "long", year: "numeric" })}</b>. Le calendrier commence à cette date.
            </div>
          </div>
        )}
        {inapte ? (
          <div className="cn-alert warn" role="status">
            <Icon name="alert" size={18} />
            <div>
              {inapte}. La prise de rendez-vous en ligne n&apos;est pas possible ; contactez le CNTS pour toute question.
            </div>
          </div>
        ) : aVenir.length ? (
          <p style={{ color: "var(--ink-600)", fontSize: 14.5 }}>
            Vous avez déjà un rendez-vous à venir. Annulez-le si vous souhaitez en choisir un autre.
          </p>
        ) : lieux === null ? (
          <div className="cn-alert warn" role="status">
            <Icon name="alert" size={18} />
            Les lieux de rendez-vous ne peuvent pas être chargés pour le moment.
          </div>
        ) : (
          <AppointmentForm lieux={lieux} eligibleLe={attente} />
        )}
      </Card>
    </div>
  );
}
