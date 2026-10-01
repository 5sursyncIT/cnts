"use client";

import React, { useState } from 'react';
import {
  useCreateExpirationRule,
  useDeleteExpirationRule,
  useExpirationRules,
  useUpdateExpirationRule,
  type ExpirationRule,
} from "@cnts/api";
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
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
} from "@/components/ui";

const PRODUCT_TYPES = [
  { value: 'CGR', label: 'Concentré de Globules Rouges' },
  { value: 'PFC', label: 'Plasma Frais Congelé' },
  { value: 'CPA', label: 'Concentré de Plaquettes d\'Aphérèse' },
  { value: 'CPS', label: 'Concentré de Plaquettes Standard' },
  { value: 'ST', label: 'Sang Total' },
];

const PRESERVATION_TYPES = [
  { value: 'REFRIGERATED', label: 'Réfrigéré (+2°C à +6°C)' },
  { value: 'FROZEN', label: 'Congelé (<-25°C)' },
  { value: 'AMBIENT', label: 'Ambiant (+20°C à +24°C)' },
];

const UNIT_LABELS: Record<string, string> = {
  HOURS: 'heure(s)',
  DAYS: 'jour(s)',
  MONTHS: 'mois',
  YEARS: 'année(s)',
};

// --- Components ---

export default function ExpirationRulesPage() {
  const { data: rules, status, error, refetch } = useExpirationRules(apiClient);
  const createRule = useCreateExpirationRule(apiClient);
  const updateRule = useUpdateExpirationRule(apiClient);
  const deleteRule = useDeleteExpirationRule(apiClient);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRule, setCurrentRule] = useState<Partial<ExpirationRule>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const resolvedRules = rules ?? [];
  const saving = createRule.isLoading || updateRule.isLoading;

  // --- Actions ---

  const handleAdd = () => {
    setCurrentRule({
      product_type: 'CGR',
      preservation_type: 'REFRIGERATED',
      shelf_life_unit: 'DAYS',
      is_active: true,
      min_temp: 2,
      max_temp: 6,
      shelf_life_value: 0
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleEdit = (rule: ExpirationRule) => {
    setCurrentRule({ ...rule });
    setErrors({});
    setIsEditing(true);
  };

  const handleDuplicate = (rule: ExpirationRule) => {
    // Copie sans identifiant : l'enregistrement créera une nouvelle règle.
    const copy: Partial<ExpirationRule> = { ...rule };
    delete copy.id;
    delete copy.version;
    delete copy.created_at;
    delete copy.updated_at;
    setCurrentRule(copy);
    setErrors({});
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      try {
        await deleteRule.mutate(id);
        toast.success('Règle supprimée');
        await refetch();
      } catch (e) {
        toast.error(apiErrorMessage(e, 'Suppression impossible'));
      }
    }
  };

  const validate = (rule: Partial<ExpirationRule>): boolean => {
    const newErrors: Record<string, string> = {};

    if (!rule.product_type) newErrors.productType = 'Le type de produit est requis';
    if (rule.min_temp !== undefined && rule.max_temp !== undefined && rule.min_temp > rule.max_temp) {
      newErrors.temp = 'La température minimale ne peut pas être supérieure à la maximale';
    }
    if (!rule.shelf_life_value || rule.shelf_life_value <= 0) {
      newErrors.shelfLife = 'La durée de conservation doit être positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate(currentRule)) return;

    try {
      if (currentRule.id) {
        await updateRule.mutate({ id: currentRule.id, data: currentRule as any });
      } else {
        await createRule.mutate(currentRule as any);
      }
      toast.success(currentRule.id ? 'Règle mise à jour' : 'Règle créée');
      await refetch();
      setIsEditing(false);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Enregistrement impossible'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Règles de péremption"
        description="Durées de vie et conditions de conservation des produits sanguins."
        actions={
          <Button onClick={handleAdd} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Nouvelle règle
          </Button>
        }
      />

      <Card>
        {status === "loading" && <LoadingState />}
        {status === "error" && (
          <ErrorState message={apiErrorMessage(error, "Erreur lors du chargement des règles.")} onRetry={() => refetch()} />
        )}
        {status !== "loading" && status !== "error" && resolvedRules.length === 0 && (
          <EmptyState
            title="Aucune règle de péremption configurée"
            description="Ajoutez une première règle pour définir la durée de vie d’un produit."
            action={
              <Button onClick={handleAdd} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Nouvelle règle
              </Button>
            }
          />
        )}
        {status !== "loading" && status !== "error" && resolvedRules.length > 0 && (
          <Table>
            <THead>
              <tr>
                <Th>Produit</Th>
                <Th>Conservation</Th>
                <Th>Température</Th>
                <Th>Durée de vie</Th>
                <Th>Statut</Th>
                <Th align="right"><span className="sr-only">Actions</span></Th>
              </tr>
            </THead>
            <TBody>
              {resolvedRules.map((rule) => (
                <Tr key={rule.id}>
                  <Td>
                    <span className="font-medium text-gray-900">{rule.product_type}</span>
                    <div className="text-xs text-gray-500">Version {rule.version}</div>
                  </Td>
                  <Td>{PRESERVATION_TYPES.find(t => t.value === rule.preservation_type)?.label ?? rule.preservation_type}</Td>
                  <Td className="whitespace-nowrap tabular-nums">
                    {rule.min_temp}°C à {rule.max_temp}°C
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums">
                    {rule.shelf_life_value} {UNIT_LABELS[rule.shelf_life_unit] ?? rule.shelf_life_unit.toLowerCase()}
                  </Td>
                  <Td>
                    <Badge tone={rule.is_active ? "success" : "neutral"} dot>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => handleEdit(rule)} aria-label={`Modifier la règle ${rule.product_type}`} title="Modifier" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => handleDuplicate(rule)} aria-label={`Dupliquer la règle ${rule.product_type}`} title="Dupliquer" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-600">
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => handleDelete(rule.id)} aria-label={`Supprimer la règle ${rule.product_type}`} title="Supprimer" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={isEditing}
        onClose={() => setIsEditing(false)}
        title={currentRule.id ? 'Modifier la règle' : 'Nouvelle règle'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          noValidate
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Type de produit" required error={errors.productType}>
            <Select
              value={currentRule.product_type}
              onChange={(e) => setCurrentRule({ ...currentRule, product_type: e.target.value })}
            >
              {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>

          <Field label="Mode de conservation">
            <Select
              value={currentRule.preservation_type}
              onChange={(e) => setCurrentRule({ ...currentRule, preservation_type: e.target.value as any })}
            >
              {PRESERVATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>

          <Field label="Température minimale (°C)">
            <Input
              type="number"
              value={currentRule.min_temp}
              onChange={(e) => setCurrentRule({ ...currentRule, min_temp: Number(e.target.value) })}
            />
          </Field>

          <Field label="Température maximale (°C)">
            <Input
              type="number"
              value={currentRule.max_temp}
              onChange={(e) => setCurrentRule({ ...currentRule, max_temp: Number(e.target.value) })}
            />
          </Field>

          {errors.temp && (
            <Alert tone="danger" className="sm:col-span-2">{errors.temp}</Alert>
          )}

          <Field label="Durée de conservation" required error={errors.shelfLife}>
            <Input
              type="number"
              min={1}
              value={currentRule.shelf_life_value}
              onChange={(e) => setCurrentRule({ ...currentRule, shelf_life_value: Number(e.target.value) })}
            />
          </Field>

          <Field label="Unité">
            <Select
              value={currentRule.shelf_life_unit}
              onChange={(e) => setCurrentRule({ ...currentRule, shelf_life_unit: e.target.value as any })}
            >
              <option value="HOURS">Heures</option>
              <option value="DAYS">Jours</option>
              <option value="MONTHS">Mois</option>
              <option value="YEARS">Années</option>
            </Select>
          </Field>

          <label htmlFor="rule-active" className="flex items-center gap-2 text-sm font-medium text-gray-800 sm:col-span-2">
            <input
              id="rule-active"
              type="checkbox"
              checked={currentRule.is_active}
              onChange={(e) => setCurrentRule({ ...currentRule, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Règle active
          </label>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>
    </div>
  );
}
