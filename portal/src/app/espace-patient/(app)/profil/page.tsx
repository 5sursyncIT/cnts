import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { Card, SectionTitle } from "@/components/cnts/primitives";
import { ProfileForm } from "@/components/patient/forms";
import { ConsentCard, RevokeConsentButton } from "@/components/patient/ui";
import { getCurrentPatient } from "@/lib/auth/current-user";
import { patientGet, type Profil } from "@/lib/backend";
import { getGdprConsent } from "@/lib/consent";

export const metadata = { title: "Mon profil — Espace patient" };

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-500)" }}>{label}</div>
      <div style={{ fontWeight: 600, marginTop: 3 }}>{value || "—"}</div>
    </div>
  );
}

export default async function ProfilePage() {
  const [profil, consent, session] = await Promise.all([patientGet<Profil>("/api/me"), getGdprConsent(), getCurrentPatient()]);

  return (
    <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 28, alignItems: "start" }}>
      <div style={{ display: "grid", gap: 22 }}>
        <div>
          <SectionTitle kicker="Dossier donneur" title="Mon identité" />
          <Card pad={24} style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            <Info label="Nom" value={profil?.nom} />
            <Info label="Prénom" value={profil?.prenom} />
            <Info label="Date de naissance" value={profil?.date_naissance ? frDate(profil.date_naissance) : null} />
            <Info label="Groupe sanguin" value={profil?.groupe_sanguin} />
            <Info label="Compte" value={session?.email} />
            <Info label="Dernier don" value={profil?.dernier_don ? frDate(profil.dernier_don) : null} />
          </Card>
        </div>
        <div>
          <SectionTitle kicker="Confidentialité" title="Documents de santé" />
          {consent === "accepted" ? (
            <Card pad={22} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Icon name="check" size={20} style={{ color: "var(--ok)" }} />
                <span style={{ fontWeight: 700 }}>Accès autorisé</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55 }}>
                Vos documents de santé s&apos;affichent dans votre espace. Vous pouvez retirer cet accord à tout moment.
              </p>
              <div>
                <RevokeConsentButton />
              </div>
            </Card>
          ) : (
            <ConsentCard current={consent} />
          )}
        </div>
      </div>

      <div>
        <SectionTitle kicker="Coordonnées" title="Me contacter" sub="Utilisées par le CNTS pour vos rendez-vous et en cas de besoin urgent de votre groupe sanguin." />
        <Card pad={26}>
          {profil ? (
            <ProfileForm
              initial={{
                telephone: profil.telephone ?? "",
                email: profil.email ?? "",
                adresse: profil.adresse ?? "",
                profession: profil.profession ?? "",
              }}
            />
          ) : (
            <p style={{ color: "var(--ink-600)" }}>Vos coordonnées ne peuvent pas être chargées pour le moment.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
