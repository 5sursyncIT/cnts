import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { Card, Logo, SectionTitle } from "@/components/cnts/primitives";
import { patientGet, type Carte, type Profil } from "@/lib/backend";

export const metadata = { title: "Carte donneur — Espace patient" };

const NIVEAUX = ["BRONZE", "ARGENT", "OR", "PLATINE"];
const OPERATION: Record<string, string> = {
  DON: "Don",
  PARRAINAGE: "Parrainage",
  BONUS_ANNIVERSAIRE: "Bonus anniversaire",
  UTILISATION: "Utilisation",
};

export default async function DonorCardPage() {
  const [profil, carte] = await Promise.all([patientGet<Profil>("/api/me"), patientGet<Carte>("/api/me/carte")]);
  const nom = profil ? `${profil.prenom} ${profil.nom}` : "";
  const niveauIdx = carte ? Math.max(0, NIVEAUX.indexOf(carte.niveau.toUpperCase())) : -1;

  return (
    <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
      <div style={{ display: "grid", gap: 18 }}>
        {/* Carte numérique */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--r-lg)",
            background: "linear-gradient(150deg, var(--red-900), var(--brand))",
            color: "#fff",
            padding: 26,
            boxShadow: "var(--sh-lg)",
            aspectRatio: "1.586 / 1",
            display: "grid",
            alignContent: "space-between",
          }}
        >
          <div aria-hidden className="blob" style={{ width: 240, height: 240, right: -70, top: -90, background: "var(--red-700)", opacity: 0.7 }} />
          <div aria-hidden className="blob" style={{ width: 120, height: 120, right: 90, bottom: -60, background: "var(--acc2)", opacity: 0.5 }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700, opacity: 0.8 }}>Carte de donneur</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>CNTS Sénégal</div>
            </div>
            <Logo size={32} light showText={false} />
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "rgba(255,255,255,.16)",
                border: "1px solid rgba(255,255,255,.3)",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                fontWeight: 800,
              }}
              title="Groupe sanguin"
            >
              {profil?.groupe_sanguin ?? "?"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="font-serif" style={{ fontSize: 22, lineHeight: 1.15 }}>
                {nom}
              </div>
              {carte?.date_premier_don && (
                <div style={{ fontSize: 13, opacity: 0.75 }}>Donneur depuis {new Date(carte.date_premier_don).getFullYear()}</div>
              )}
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.65 }}>N° de carte</div>
              <div className="font-mono" style={{ fontSize: 16, letterSpacing: ".06em" }}>
                {carte?.numero_carte ?? "En attente"}
              </div>
            </div>
            {carte && (
              <span style={{ padding: "5px 12px", borderRadius: 999, background: "#fff", color: "var(--brand)", fontSize: 12, fontWeight: 800, letterSpacing: ".06em" }}>
                {carte.niveau}
              </span>
            )}
          </div>
        </div>
        {!profil?.groupe_sanguin && (
          <p style={{ fontSize: 13.5, color: "var(--ink-500)" }}>Votre groupe sanguin sera renseigné par le centre après votre premier don.</p>
        )}
      </div>

      <div style={{ display: "grid", gap: 22 }}>
        {carte ? (
          <>
            <Card pad={24}>
              <div className="kicker" style={{ marginBottom: 8 }}>
                Fidélité
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className="font-serif" style={{ fontSize: 44, color: "var(--brand)", lineHeight: 1 }}>
                  {carte.points}
                </span>
                <span style={{ fontWeight: 700 }}>points</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 18 }} aria-label={`Niveau ${carte.niveau}`}>
                {NIVEAUX.map((n, i) => (
                  <div key={n} style={{ flex: 1 }}>
                    <div style={{ height: 8, borderRadius: 9, background: i <= niveauIdx ? "var(--brand)" : "var(--surface-3)" }} />
                    <div style={{ fontSize: 11.5, marginTop: 6, fontWeight: i === niveauIdx ? 800 : 600, color: i === niveauIdx ? "var(--brand)" : "var(--ink-500)" }}>
                      {n.charAt(0) + n.slice(1).toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 18, fontSize: 13.5, color: "var(--ink-600)", flexWrap: "wrap" }}>
                <span>
                  <b style={{ color: "var(--ink-900)" }}>{carte.total_dons}</b> dons
                </span>
                {carte.date_dernier_don && <span>Dernier don : {frDate(carte.date_dernier_don)}</span>}
              </div>
            </Card>
            <div>
              <SectionTitle kicker="Mouvements" title="Historique des points" />
              {carte.historique.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {carte.historique.map((h, i) => (
                    <Card key={i} pad={14}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{h.description ?? OPERATION[h.type_operation] ?? h.type_operation}</div>
                          <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{frDate(h.created_at)}</div>
                        </div>
                        <span style={{ fontWeight: 800, color: h.points >= 0 ? "var(--ok)" : "var(--crit)" }}>
                          {h.points >= 0 ? "+" : ""}
                          {h.points}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--ink-600)" }}>Aucun mouvement pour le moment.</p>
              )}
            </div>
          </>
        ) : (
          <Card pad={26} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="gift" size={22} style={{ color: "var(--brand)" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Votre carte n&apos;est pas encore émise</h2>
            </div>
            <p style={{ color: "var(--ink-600)", lineHeight: 1.55 }}>
              La carte de donneur et son programme de fidélité sont activés par le centre lors d&apos;un don. Elle apparaîtra ici
              automatiquement.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
