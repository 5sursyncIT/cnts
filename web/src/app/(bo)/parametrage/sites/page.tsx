"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Building2, Pencil, Plus, RefreshCw, MapPin } from "lucide-react";
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
  Select,
  Table,
  TBody,
  THead,
  Td,
  Th,
  Tr,
  type BadgeTone,
} from "@/components/ui";

const API = "/api";

interface Site {
  id: string;
  code: string;
  nom: string;
  type_site: "CENTRAL" | "REGIONAL" | "POSTE";
  adresse: string | null;
  region: string | null;
  telephone: string | null;
  email: string | null;
  responsable_nom: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SiteForm {
  code: string;
  nom: string;
  type_site: "CENTRAL" | "REGIONAL" | "POSTE";
  region: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable_nom: string;
}

const REGIONS_SENEGAL = [
  "Dakar",
  "Diourbel",
  "Fatick",
  "Kaffrine",
  "Kaolack",
  "Kedougou",
  "Kolda",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sedhiou",
  "Tambacounda",
  "Thies",
  "Ziguinchor",
];

// Valeurs stockées inchangées ; libellés affichés avec les accents.
const REGION_LABELS: Record<string, string> = {
  Kedougou: "Kédougou",
  Sedhiou: "Sédhiou",
  Thies: "Thiès",
};

const TYPE_SITE: Record<Site["type_site"], { label: string; tone: BadgeTone }> = {
  CENTRAL: { label: "Central", tone: "danger" },
  REGIONAL: { label: "Régional", tone: "info" },
  POSTE: { label: "Poste de collecte", tone: "neutral" },
};

const emptyForm: SiteForm = {
  code: "",
  nom: "",
  type_site: "POSTE",
  region: "",
  adresse: "",
  telephone: "",
  email: "",
  responsable_nom: "",
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/sites?offset=0&limit=200`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setSites(Array.isArray(data) ? data : data.items ?? []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleOpenCreate = () => {
    setEditingSite(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (site: Site) => {
    setEditingSite(site);
    setFormData({
      code: site.code,
      nom: site.nom,
      type_site: site.type_site,
      region: site.region || "",
      adresse: site.adresse || "",
      telephone: site.telephone || "",
      email: site.email || "",
      responsable_nom: site.responsable_nom || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingSite(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload: Record<string, any> = {
      code: formData.code,
      nom: formData.nom,
      type_site: formData.type_site,
      region: formData.region || undefined,
      adresse: formData.adresse || undefined,
      telephone: formData.telephone || undefined,
      email: formData.email || undefined,
      responsable_nom: formData.responsable_nom || undefined,
    };

    try {
      const url = editingSite
        ? `${API}/sites/${editingSite.id}`
        : `${API}/sites`;
      const method = editingSite ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Erreur ${res.status}`);
      }

      toast.success(editingSite ? "Site mis à jour" : "Site créé");
      await fetchSites();
      handleClose();
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const formId = "site-form";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sites et centres"
        description="Sites de transfusion sanguine du CNTS."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={fetchSites}
              disabled={loading}
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              Actualiser
            </Button>
            <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Nouveau site
            </Button>
          </>
        }
      />

      <Card>
        {loading && <LoadingState />}

        {error && !loading && <ErrorState message={error} onRetry={fetchSites} />}

        {!loading && !error && sites.length === 0 && (
          <EmptyState
            icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
            title="Aucun site enregistré"
            description="Ajoutez le centre national, les centres régionaux et les postes de collecte."
            action={
              <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Nouveau site
              </Button>
            }
          />
        )}

        {!loading && !error && sites.length > 0 && (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Code</Th>
                  <Th>Nom</Th>
                  <Th>Type</Th>
                  <Th>Région</Th>
                  <Th>Responsable</Th>
                  <Th>Statut</Th>
                  <Th align="right"><span className="sr-only">Actions</span></Th>
                </tr>
              </THead>
              <TBody>
                {sites.map((site) => (
                  <Tr key={site.id}>
                    <Td className="whitespace-nowrap font-mono text-gray-900">{site.code}</Td>
                    <Td>
                      <div className="font-medium text-gray-900">{site.nom}</div>
                      {site.adresse && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {site.adresse}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={TYPE_SITE[site.type_site]?.tone ?? "neutral"}>
                        {TYPE_SITE[site.type_site]?.label ?? site.type_site}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {site.region ? REGION_LABELS[site.region] ?? site.region : "—"}
                    </Td>
                    <Td className="whitespace-nowrap">{site.responsable_nom || "—"}</Td>
                    <Td>
                      <Badge tone={site.is_active ? "success" : "neutral"} dot>
                        {site.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(site)}
                        className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Modifier<span className="sr-only"> le site {site.nom}</span>
                      </button>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
              {sites.length} site(s) affiché(s)
            </div>
          </>
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={handleClose}
        title={editingSite ? "Modifier le site" : "Nouveau site"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" form={formId} loading={submitting}>
              Enregistrer
            </Button>
          </>
        }
      >
        {formError && (
          <Alert tone="danger" className="mb-4">
            {formError}
          </Alert>
        )}

        <form id={formId} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" required>
            <Input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="ex. CNTS-DKR"
              className="font-mono"
            />
          </Field>

          <Field label="Type de site" required>
            <Select
              value={formData.type_site}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type_site: e.target.value as "CENTRAL" | "REGIONAL" | "POSTE",
                })
              }
            >
              <option value="CENTRAL">Central</option>
              <option value="REGIONAL">Régional</option>
              <option value="POSTE">Poste de collecte</option>
            </Select>
          </Field>

          <Field label="Nom de l’établissement" required className="sm:col-span-2">
            <Input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="ex. Centre national de transfusion sanguine"
            />
          </Field>

          <Field label="Région">
            <Select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              <option value="">— Sélectionner —</option>
              {REGIONS_SENEGAL.map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r] ?? r}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Adresse">
            <Input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              placeholder="Adresse complète"
            />
          </Field>

          <Field label="Téléphone">
            <Input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="+221 33 …"
            />
          </Field>

          <Field label="E-mail">
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@site.sn"
            />
          </Field>

          <Field label="Responsable" className="sm:col-span-2">
            <Input
              type="text"
              value={formData.responsable_nom}
              onChange={(e) => setFormData({ ...formData, responsable_nom: e.target.value })}
              placeholder="Nom du responsable"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
