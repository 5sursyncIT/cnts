"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  Table,
  TBody,
  THead,
  Td,
  Th,
  Textarea,
  Tr,
  type BadgeTone,
} from "@/components/ui";

const API = "/api";

type Equipement = {
  id: string;
  code_inventaire: string;
  nom: string;
  categorie: string;
  marque: string | null;
  modele: string | null;
  numero_serie: string | null;
  localisation: string | null;
  date_mise_service: string | null;
  date_prochaine_maintenance: string | null;
  date_prochaine_calibration: string | null;
  statut: string;
};

type Intervention = {
  id: string;
  type_intervention: string;
  date_intervention: string;
  technicien: string | null;
  description: string | null;
  resultat: string;
  prochaine_date: string | null;
};

const STATUTS: Record<string, [string, BadgeTone]> = {
  EN_SERVICE: ["En service", "success"],
  EN_MAINTENANCE: ["En maintenance", "warning"],
  EN_PANNE: ["En panne", "danger"],
  HORS_SERVICE: ["Hors service", "neutral"],
  REFORME: ["Réformé", "neutral"],
};

const TYPES: Record<string, string> = {
  MAINTENANCE_PREVENTIVE: "Maintenance préventive",
  MAINTENANCE_CORRECTIVE: "Maintenance corrective",
  CALIBRATION: "Calibration",
  QUALIFICATION: "Qualification",
};

const fr = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return typeof body?.detail === "string" ? body.detail : `Erreur ${res.status}`;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function EquipementDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [equipement, setEquipement] = useState<Equipement | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type_intervention: "MAINTENANCE_PREVENTIVE",
    date_intervention: today(),
    technicien: "",
    description: "",
    resultat: "CONFORME",
    prochaine_date: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [e, i] = await Promise.all([fetch(`${API}/equipements/${id}`), fetch(`${API}/equipements/${id}/interventions`)]);
      if (!e.ok) throw new Error(await readError(e));
      if (!i.ok) throw new Error(await readError(i));
      setEquipement(await e.json());
      setInterventions(await i.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const close = useCallback(() => setOpen(false), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/equipements/${id}/interventions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipement_id: id,
          type_intervention: form.type_intervention,
          date_intervention: form.date_intervention,
          technicien: form.technicien.trim() || undefined,
          description: form.description.trim() || undefined,
          resultat: form.resultat,
          prochaine_date: form.prochaine_date || undefined,
        }),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success("Intervention enregistrée");
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  const back = { href: "/qualite/equipements", label: "Équipements" };

  if (loading && !equipement) {
    return (
      <>
        <PageHeader title="Équipement" back={back} />
        <Card><LoadingState /></Card>
      </>
    );
  }
  if (error || !equipement) {
    return (
      <>
        <PageHeader title="Équipement" back={back} />
        <Card><ErrorState message={error ?? "Équipement introuvable"} onRetry={load} /></Card>
      </>
    );
  }

  const [statutLabel, statutTone] = STATUTS[equipement.statut] ?? [equipement.statut, "neutral" as BadgeTone];
  const overdue = (d: string | null) => !!d && d < today();

  return (
    <div className="space-y-6">
      <PageHeader
        title={equipement.nom}
        description={<span className="font-mono">{equipement.code_inventaire}</span>}
        back={back}
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Nouvelle intervention</Button>}
      />

      <Card>
        <CardHeader title="Fiche" actions={<Badge tone={statutTone} dot>{statutLabel}</Badge>} />
        <dl className="grid gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Catégorie", equipement.categorie.replace(/_/g, " ").toLowerCase()],
            ["Marque / modèle", [equipement.marque, equipement.modele].filter(Boolean).join(" ") || "—"],
            ["N° de série", equipement.numero_serie ?? "—"],
            ["Localisation", equipement.localisation ?? "—"],
            ["Mise en service", fr(equipement.date_mise_service)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-gray-500">{k}</dt>
              <dd className="mt-0.5 text-gray-900 first-letter:uppercase">{v}</dd>
            </div>
          ))}
          <div>
            <dt className="text-gray-500">Prochaine maintenance</dt>
            <dd className="mt-0.5 flex items-center gap-2 text-gray-900">
              {fr(equipement.date_prochaine_maintenance)}
              {overdue(equipement.date_prochaine_maintenance) ? <Badge tone="danger">En retard</Badge> : null}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Prochaine calibration</dt>
            <dd className="mt-0.5 flex items-center gap-2 text-gray-900">
              {fr(equipement.date_prochaine_calibration)}
              {overdue(equipement.date_prochaine_calibration) ? <Badge tone="danger">En retard</Badge> : null}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Historique des interventions" description={`${interventions.length} intervention(s)`} />
        {interventions.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-6 w-6" />}
            title="Aucune intervention enregistrée"
            description="Tracez ici maintenances, calibrations et qualifications."
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Technicien</Th>
                <Th>Description</Th>
                <Th>Résultat</Th>
                <Th>Prochaine échéance</Th>
              </tr>
            </THead>
            <TBody>
              {interventions.map((i) => (
                <Tr key={i.id}>
                  <Td className="whitespace-nowrap">{fr(i.date_intervention)}</Td>
                  <Td>{TYPES[i.type_intervention] ?? i.type_intervention}</Td>
                  <Td>{i.technicien ?? "—"}</Td>
                  <Td className="max-w-xs text-gray-600">{i.description ?? "—"}</Td>
                  <Td>
                    <Badge tone={i.resultat === "CONFORME" ? "success" : "danger"} dot>
                      {i.resultat === "CONFORME" ? "Conforme" : "Non conforme"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap">{fr(i.prochaine_date)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={close}
        title="Nouvelle intervention"
        description="Une prochaine échéance met à jour la date de maintenance ou de calibration de l’équipement."
        footer={
          <>
            <Button variant="secondary" onClick={close}>Annuler</Button>
            <Button type="submit" form="intervention-form" loading={saving}>Enregistrer</Button>
          </>
        }
      >
        <form id="intervention-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" required>
            <Select value={form.type_intervention} onChange={(e) => setForm({ ...form, type_intervention: e.target.value })}>
              {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.date_intervention} max={today()} onChange={(e) => setForm({ ...form, date_intervention: e.target.value })} />
          </Field>
          <Field label="Résultat" required>
            <Select value={form.resultat} onChange={(e) => setForm({ ...form, resultat: e.target.value })}>
              <option value="CONFORME">Conforme</option>
              <option value="NON_CONFORME">Non conforme</option>
            </Select>
          </Field>
          <Field label="Technicien">
            <Input value={form.technicien} onChange={(e) => setForm({ ...form, technicien: e.target.value })} />
          </Field>
          <Field label="Prochaine échéance" className="sm:col-span-2">
            <Input type="date" value={form.prochaine_date} min={form.date_intervention} onChange={(e) => setForm({ ...form, prochaine_date: e.target.value })} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
