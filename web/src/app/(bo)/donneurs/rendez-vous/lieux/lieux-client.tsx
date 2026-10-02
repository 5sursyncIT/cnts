"use client";

import { useLieuxRdv, useSaveLieuRdv, type LieuRdv, type LieuRdvInput } from "@cnts/api";
import { useCallback, useState } from "react";
import { MapPin, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { horairesEnTexte, JOURS_SEMAINE, texteEnFermetures, texteEnHoraires } from "@/lib/rendez-vous";

type Formulaire = Omit<LieuRdvInput, "horaires" | "fermetures"> & { horaires: Record<string, string>; fermetures: string };

const VIDE: Formulaire = {
  code: "",
  nom: "",
  adresse: "",
  actif: true,
  horaires: { "1": "08:00-17:00", "2": "08:00-17:00", "3": "08:00-17:00", "4": "08:00-17:00", "5": "08:00-17:00", "6": "08:00-13:00", "7": "" },
  fermetures: "",
  duree_creneau_min: 30,
  capacite_creneau: 3,
  delai_min_heures: 2,
  horizon_jours: 90,
};

function versFormulaire(l: LieuRdv): Formulaire {
  return { ...l, adresse: l.adresse ?? "", horaires: horairesEnTexte(l.horaires), fermetures: l.fermetures.join("\n") };
}

function resumeHoraires(l: LieuRdv): string {
  const t = horairesEnTexte(l.horaires);
  return JOURS_SEMAINE.filter(({ iso }) => t[iso]).map(({ iso, label }) => `${label.slice(0, 3)}. ${t[iso]}`).join(" · ") || "Fermé";
}

export default function LieuxClient() {
  const { data, status, error, refetch } = useLieuxRdv(apiClient);
  const save = useSaveLieuRdv(apiClient);
  const [edition, setEdition] = useState<{ id?: string; form: Formulaire } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const fermer = useCallback(() => {
    setEdition(null);
    setErreur(null);
  }, []);

  const set = <K extends keyof Formulaire>(k: K, v: Formulaire[K]) => setEdition((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edition) return;
    const h = texteEnHoraires(edition.form.horaires);
    if ("erreur" in h) return setErreur(h.erreur);
    const f = texteEnFermetures(edition.form.fermetures);
    if ("erreur" in f) return setErreur(f.erreur);
    const data: LieuRdvInput = {
      ...edition.form,
      code: edition.form.code.trim().toUpperCase(),
      nom: edition.form.nom.trim(),
      adresse: edition.form.adresse?.trim() || null,
      horaires: h.horaires,
      fermetures: f.fermetures,
    };
    try {
      await save.mutate({ id: edition.id, data });
      toast.success(edition.id ? "Lieu mis à jour." : "Lieu créé.");
      fermer();
      refetch();
    } catch (err) {
      setErreur(apiErrorMessage(err, "Enregistrement impossible."));
    }
  };

  const form = edition?.form;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lieux de rendez-vous"
        description="Lieux proposés aux donneurs sur le portail, avec leurs horaires et le nombre de donneurs reçus par créneau. Les rendez-vous déjà pris restent valables après une modification."
        back={{ href: "/donneurs/rendez-vous", label: "Rendez-vous" }}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setEdition({ form: VIDE })}>
            Nouveau lieu
          </Button>
        }
      />

      {status === "loading" && <LoadingState rows={3} />}
      {status === "error" && <ErrorState message={apiErrorMessage(error, "Impossible de charger les lieux.")} onRetry={() => refetch()} />}
      {status === "success" && (data ?? []).length === 0 && (
        <EmptyState icon={<MapPin className="h-6 w-6" aria-hidden="true" />} title="Aucun lieu" description="Créez un lieu pour ouvrir la prise de rendez-vous en ligne." />
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {(data ?? []).map((l) => (
          <Card key={l.id} className="space-y-2 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{l.nom}</h2>
                  <Badge tone={l.actif ? "success" : "neutral"}>{l.actif ? "Ouvert en ligne" : "Fermé en ligne"}</Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {l.code}
                  {l.adresse ? ` · ${l.adresse}` : ""}
                </p>
              </div>
              <Button size="sm" variant="secondary" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={() => setEdition({ id: l.id, form: versFormulaire(l) })}>
                Modifier
              </Button>
            </div>
            <p className="text-sm text-gray-700">{resumeHoraires(l)}</p>
            <p className="text-sm text-gray-600">
              Créneaux de {l.duree_creneau_min} min · {l.capacite_creneau} donneur{l.capacite_creneau > 1 ? "s" : ""} par créneau · réservation de{" "}
              {l.delai_min_heures} h à {l.horizon_jours} j à l&apos;avance
            </p>
            {l.fermetures.length > 0 && <p className="text-sm text-gray-600">Fermetures : {l.fermetures.join(", ")}</p>}
          </Card>
        ))}
      </div>

      <Modal
        open={edition !== null}
        onClose={fermer}
        size="lg"
        title={edition?.id ? "Modifier le lieu" : "Nouveau lieu"}
        footer={
          <>
            <Button variant="secondary" onClick={fermer} disabled={save.isLoading}>
              Annuler
            </Button>
            <Button type="submit" form="lieu-rdv-form" loading={save.isLoading}>
              Enregistrer
            </Button>
          </>
        }
      >
        {form && (
          <form id="lieu-rdv-form" onSubmit={enregistrer} className="space-y-4">
            {erreur && <Alert tone="danger">{erreur}</Alert>}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Code" required hint="Lettres majuscules, chiffres">
                <Input value={form.code} onChange={(e) => set("code", e.target.value)} maxLength={16} required />
              </Field>
              <Field label="Nom affiché aux donneurs" required className="sm:col-span-2">
                <Input value={form.nom} onChange={(e) => set("nom", e.target.value)} maxLength={120} required />
              </Field>
            </div>
            <Field label="Adresse">
              <Input value={form.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)} maxLength={500} />
            </Field>
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <input id="lieu-actif" type="checkbox" checked={form.actif} onChange={(e) => set("actif", e.target.checked)} />
              <label htmlFor="lieu-actif">Proposer ce lieu aux donneurs sur le portail</label>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-900">Horaires (heure de Dakar)</legend>
              <p className="text-xs text-gray-500">Une ou plusieurs plages par jour, ex. « 08:00-12:00, 14:00-17:00 ». Laisser vide = fermé.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {JOURS_SEMAINE.map(({ iso, label }) => (
                  <Field key={iso} label={label}>
                    <Input value={form.horaires[iso] ?? ""} onChange={(e) => set("horaires", { ...form.horaires, [iso]: e.target.value })} placeholder="Fermé" />
                  </Field>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Durée d'un créneau (min)">
                <Input type="number" min={10} max={240} value={form.duree_creneau_min} onChange={(e) => set("duree_creneau_min", Number(e.target.value))} />
              </Field>
              <Field label="Donneurs par créneau">
                <Input type="number" min={1} max={100} value={form.capacite_creneau} onChange={(e) => set("capacite_creneau", Number(e.target.value))} />
              </Field>
              <Field label="Délai minimum (h)">
                <Input type="number" min={0} max={168} value={form.delai_min_heures} onChange={(e) => set("delai_min_heures", Number(e.target.value))} />
              </Field>
              <Field label="Horizon (jours)">
                <Input type="number" min={1} max={365} value={form.horizon_jours} onChange={(e) => set("horizon_jours", Number(e.target.value))} />
              </Field>
            </div>

            <Field label="Jours de fermeture exceptionnelle" hint="Une date par ligne, format AAAA-MM-JJ (jours fériés, travaux…).">
              <Textarea value={form.fermetures} onChange={(e) => set("fermetures", e.target.value)} rows={3} placeholder="2026-12-25" />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  );
}
