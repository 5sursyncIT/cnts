import { redirect } from "next/navigation";

import { BloodTag } from "@/components/cnts/primitives";
import { LogoutButton, PatientTabs } from "@/components/patient/ui";
import { getCurrentPatient } from "@/lib/auth/current-user";
import { patientGet, type Profil } from "@/lib/backend";

export default async function PatientAppLayout(props: { children: React.ReactNode }) {
  const patient = await getCurrentPatient();
  if (!patient) redirect("/espace-patient/connexion");

  const profil = await patientGet<Profil>("/api/me");
  const prenom = profil?.prenom ?? patient.displayName.split(" ")[0];
  const initiales = profil ? `${profil.prenom[0] ?? ""}${profil.nom[0] ?? ""}`.toUpperCase() : prenom.slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px var(--gutter) 72px" }}>
      <section
        style={{
          borderRadius: "var(--r-xl)",
          background: "var(--surface-2)",
          padding: "22px clamp(18px, 3vw, 30px) 16px",
          marginBottom: 28,
          display: "grid",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div
              aria-hidden
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "var(--brand)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 17,
                flexShrink: 0,
              }}
            >
              {initiales}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="kicker" style={{ marginBottom: 2 }}>
                Espace donneur
              </div>
              <div className="font-serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Bonjour, {prenom}
              </div>
            </div>
            {profil?.groupe_sanguin && (
              <span title="Groupe sanguin" style={{ marginLeft: 4 }}>
                <BloodTag type={profil.groupe_sanguin} size="md" />
              </span>
            )}
          </div>
          <LogoutButton />
        </div>
        <PatientTabs />
      </section>
      {props.children}
    </div>
  );
}
