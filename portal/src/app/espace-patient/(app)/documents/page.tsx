import { frDate } from "@/components/cnts/format";
import { Icon } from "@/components/cnts/icon";
import { Card, SectionTitle } from "@/components/cnts/primitives";
import { ConsentCard } from "@/components/patient/ui";
import { patientGet, type DocumentMedical } from "@/lib/backend";
import { getGdprConsent } from "@/lib/consent";
import { typeDocLabel } from "@/lib/donneur";

export const metadata = { title: "Documents — Espace patient" };

export default async function DocumentsPage() {
  const consent = await getGdprConsent();

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <SectionTitle
        kicker="Documents"
        title="Mes documents"
        sub="Attestations de don et comptes-rendus mis à disposition par le CNTS. Les résultats d'analyses biologiques vous sont remis au centre."
      />
      {consent !== "accepted" ? <ConsentCard current={consent} /> : <DocumentList />}
    </div>
  );
}

async function DocumentList() {
  const docs = await patientGet<DocumentMedical[]>("/api/me/documents");
  if (docs === null) {
    return (
      <div className="cn-alert warn" role="status">
        <Icon name="alert" size={18} />
        Vos documents ne peuvent pas être chargés pour le moment.
      </div>
    );
  }
  if (!docs.length) {
    return (
      <Card pad={26} style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Icon name="flask" size={24} style={{ color: "var(--brand)" }} />
        <p style={{ color: "var(--ink-600)" }}>Aucun document n&apos;est disponible dans votre espace pour le moment.</p>
      </Card>
    );
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {docs.map((d) => {
        // Seuls les liens https explicites sont proposés : les fichiers internes ne sont pas publics.
        const lien = d.fichier_url.startsWith("https://") ? d.fichier_url : null;
        return (
          <Card key={d.id} pad={16}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--tint)", color: "var(--brand)", display: "grid", placeItems: "center" }}>
                <Icon name="flask" size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700 }}>{d.titre}</div>
                <div style={{ fontSize: 13, color: "var(--ink-600)" }}>
                  {typeDocLabel(d.type_document)} · {frDate(d.date_document)}
                  {d.description ? ` · ${d.description}` : ""}
                </div>
              </div>
              {lien ? (
                <a href={lien} target="_blank" rel="noopener noreferrer" className="cn-btn outline sm">
                  <Icon name="arrowR" size={15} />
                  Ouvrir
                </a>
              ) : (
                <span style={{ fontSize: 13, color: "var(--ink-500)" }}>À retirer au centre</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
